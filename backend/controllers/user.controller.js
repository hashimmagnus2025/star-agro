import { insertUser, getUserByEmail, getUserById, getUserByPhone, updateUser, getAllUsers as getAllUsersModel, generateUniqueReferralCode, getUserByReferralCode, addUserPoints, getDefaultUserPoints, softDeleteUser, updateUserDocumentStatus } from "../models/user.model.js";
import { insertReferral } from "../models/referral.model.js";
import bcrypt from "bcryptjs";
import axios from 'axios';
import { createToken, verifyToken } from '../utils/jwt.js';
import { sendResetPasswordEmail } from '../utils/email.js';
import { getRoleByName } from '../models/role.model.js';
import { getAllPermissions } from '../models/permissions.model.js';
import { getJurisdictionByUserId, getAllJurisdictions, resolveScopeNames } from '../models/jurisdiction.model.js';
import { createNotification } from '../models/notification.model.js';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';
import { resolveNotificationLang, documentVerifiedMessage, documentRejectedMessage } from '../utils/notificationMessages.js';
import { resolveUploadedFileUrl } from '../utils/bunny.js';

export const getUserByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await getUserById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, remember_token, ...safeUser } = user;
        return res.status(200).json(safeUser);
    } catch (error) {
        console.error('Error fetching user by id:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Simple in-memory OTP store: { '<phone>': { otp: '123456', expiresAt: 12345 } }
const otpStore = new Map();

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://whatsappnew.bestsms.co.in/wapp/v2/api/send';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || 'fa6dfd2e20c240a29752e9ccc124e6ff';

export const registerUser = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password, referralCode, deviceId, recaptchaToken } = req.body

        if (process.env.RECAPTCHA_SECRET_KEY) {
            if (!recaptchaToken) {
                return res.status(400).json({ message: 'Please verify you are not a robot.' });
            }

            const verifyResponse = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
                params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: recaptchaToken },
            });

            if (!verifyResponse.data.success) {
                return res.status(400).json({ message: 'reCAPTCHA verification failed. Please try again.' });
            }
        }

        // Check if this phone number is already registered
        const existingUser = await getUserByPhone(phone);

        if (existingUser) {
            return res.status(400).json({ message: "This phone number is already registered" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)
        const defaultPoints = getDefaultUserPoints();
        const usedReferralCode = (referralCode && String(referralCode).trim())
            ? String(referralCode).trim()
            : null;
        // Every user gets their own fresh unique referral code to share, regardless of the code they signed up with
        const ownReferralCode = await generateUniqueReferralCode();

        // Insert the user into the database
        const result = await insertUser({
            name: `${first_name} ${last_name}`,
            first_name,
            last_name,
            email,
            phone,
            password: hashedPassword,
            referral_code: ownReferralCode,
            points: defaultPoints,
        });

        // result is array from pool.query, first element is the query result
        const [queryResult] = result;
        const insertId = queryResult.insertId;

        if (!insertId) {
            throw new Error('Failed to get insert ID from database');
        }

        if (usedReferralCode) {
            const referrer = await getUserByReferralCode(usedReferralCode);
            if (referrer && referrer.id !== insertId) {
                await addUserPoints(referrer.id, defaultPoints);
                await insertReferral({
                    referrerId: referrer.id,
                    referredUserId: insertId,
                    referralCode: usedReferralCode,
                    pointsAwarded: defaultPoints,
                });
            }
        }

        // Generate a JWT token using the insertId
        const token = createToken({ id: insertId });

        res.status(201).json({ token, message: "Registration successful", referral_code: ownReferralCode, points: defaultPoints });

    } catch (error) {
        console.error('Registration error:', error.message || error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;
        // Allow login with either email or phone number in the same field
        const identifier = String(email || '').trim();
        let user;
        if (identifier.includes('@')) {
            user = await getUserByEmail(identifier);
        } else {
            // Phone numbers may be stored with or without the country code, so try both
            const phoneKey = identifier.replace(/\D/g, '');
            user = await getUserByPhone(phoneKey);
            if (!user && phoneKey.length === 10) {
                user = await getUserByPhone('91' + phoneKey);
            }
            if (!user && phoneKey.startsWith('91') && phoneKey.length === 12) {
                user = await getUserByPhone(phoneKey.slice(2));
            }
        }

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate a JWT token
        const token = createToken({ id: user.id });
        const { password: userPassword, remember_token, ...safeUser } = user;
        res.status(200).json({ token, user: safeUser });


    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await getUserByEmail(email);
        const frontendUrl = (process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

        if (!user) {
            return res.status(200).json({
                message: 'If your email is registered, a password reset link has been sent to your email address.'
            });
        }

        const resetToken = createToken({ id: user.id, action: 'reset_password' }, '15m');
        const resetUrl = `${frontendUrl}/reset-password/${encodeURIComponent(resetToken)}`;

        let emailSent = false;
        let emailError = null;
        try {
            await sendResetPasswordEmail({ email, resetUrl });
            emailSent = true;
        } catch (err) {
            emailError = err.message || err;
            console.error('Password reset email send failed:', emailError);
        }

        return res.status(200).json({
            message: emailSent
                ? 'If your email is registered, a password reset link has been sent to your email address.'
                : 'Password reset request processed, but the email could not be sent. Please contact support or try again later.',
            resetUrl: process.env.DEBUG_RESET_PASSWORD === 'true' || !emailSent ? resetUrl : undefined,
            emailError: process.env.DEBUG_RESET_PASSWORD === 'true' || !emailSent ? String(emailError) : undefined,
        });
    } catch (error) {
        console.error('forgotPassword error', error.message || error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Reset token and new password are required' });
        }

        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (decoded.action !== 'reset_password') {
            return res.status(400).json({ message: 'Invalid reset token' });
        }

        const user = await getUserById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await updateUser(user.id, {
            name: user.name,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            profile_image: user.profile_image,
            password: hashedPassword,
        });

        return res.status(200).json({ message: 'Your password has been reset successfully.' });
    } catch (error) {
        console.error('resetPassword error', error.message || error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const sendOtp = async (req, res) => {
    try {
        let { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone number is required' });

        // Normalize phone number: remove all non-digits, keep as-is for OTP storage
        const phoneKey = phone.replace(/\D/g, ''); // Store key: digits only (will be 10 or 12 digits)
        console.log('Original phone:', phone, '→ Store key:', phoneKey);

        // generate 6-digit otp
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        // store otp in otpStore using digits-only key
        otpStore.set(phoneKey, { otp, expiresAt });
        console.log('OTP stored for key:', phoneKey);

        // prepare message
        const message = `Your Star Agro OTP is ${otp}. It will expire in 5 minutes.`;

        // send via WhatsApp API (best-effort) using GET with query params
        // Format for API: use digits-only international mobile number, e.g. 919123456789
        let phoneForAPI = phoneKey;
        if (phoneForAPI.startsWith('+')) {
            phoneForAPI = phoneForAPI.slice(1);
        }
        if (phoneForAPI.length === 10) {
            phoneForAPI = '91' + phoneForAPI; // Add India country code
        }

        try {
            const params = new URLSearchParams({
                apikey: WHATSAPP_API_KEY,
                mobile: phoneForAPI,
                msg: message,
            });
            const url = `${WHATSAPP_API_URL}?${params.toString()}`;
            console.log('Sending OTP to:', phoneForAPI, '| API URL:', url.replace(WHATSAPP_API_KEY, '***'));

            const response = await axios.get(url);
            console.log('WhatsApp API success:', response && response.data ? response.data : response.status);
        } catch (err) {
            const errorDetails = err.response && err.response.data ? err.response.data : err.message || err;
            console.warn('WhatsApp API send failed:', errorDetails);

            if (process.env.DEBUG_OTP === 'true') {
                return res.status(200).json({
                    success: true,
                    message: 'WhatsApp send failed in debug mode; OTP stored locally for testing',
                    debugOtp: otp,
                    debugPhoneKey: phoneKey,
                    whatsappError: typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails),
                });
            }

            const errorPayload = {
                success: false,
                message: 'Failed to send OTP via WhatsApp',
                error: typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails),
            };
            return res.status(502).json(errorPayload);
        }

        // Return debug OTP in response only when DEBUG_OTP=true (safe for local debugging)
        const responsePayload = { success: true, message: 'OTP sent' };
        if (process.env.DEBUG_OTP === 'true') {
            responsePayload.debugOtp = otp;
            responsePayload.debugPhoneKey = phoneKey;
        }

        return res.status(200).json(responsePayload);
    } catch (error) {
        console.error('sendOtp error', error.message || error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        let { phone, otp } = req.body;
        if (!phone || !otp) return res.status(400).json({ message: 'Phone and otp are required' });

        // Normalize phone number to match the key used in sendOtp (digits only)
        const phoneKey = phone.replace(/\D/g, '');
        console.log('Verifying OTP for phone key:', phoneKey);

        const entry = otpStore.get(phoneKey);
        if (!entry) {
            console.warn('No OTP found for key:', phoneKey, 'Available keys:', Array.from(otpStore.keys()));
            return res.status(400).json({ message: 'No OTP requested for this number' });
        }

        if (Date.now() > entry.expiresAt) {
            otpStore.delete(phoneKey);
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (entry.otp !== otp.toString()) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP valid - remove it
        otpStore.delete(phoneKey);
        console.log('OTP verified successfully for key:', phoneKey);

        // Find user by phone - try both exact match and with country code prepended
        let user = await getUserByPhone(phoneKey);

        // If not found with digits-only, try with country code (in case DB has 91xxxxx format)
        if (!user && phoneKey.length === 10) {
            const phoneWith91 = '91' + phoneKey;
            user = await getUserByPhone(phoneWith91);
            console.log('User lookup with +91: found =', !!user);
        }

        if (!user) {
            console.warn('User not found for phone:', phoneKey);
            return res.status(404).json({ message: 'User not found' });
        }

        const token = createToken({ id: user.id });
        return res.status(200).json({ token, user });
    } catch (error) {
        console.error('verifyOtp error', error.message || error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Mirrors hasPermission's own lookup (role.permissions is a CSV of permission IDs) so the
// frontend can know ahead of time what a user can do (e.g. to hide sidebar links) instead of
// only finding out after a 403 on the actual action.
const resolveUserPermissionNames = async (role, jurisdictionRoleName) => {
    const allPermissions = await getAllPermissions();
    if (['admin', 'super_admin'].includes(role)) {
        return allPermissions.map((permission) => permission.name);
    }

    const roleNames = [role, jurisdictionRoleName].filter(Boolean);
    const roleRows = await Promise.all(roleNames.map((name) => getRoleByName(name)));
    const assignedIds = roleRows.flatMap((roleRow) =>
        roleRow?.permissions ? roleRow.permissions.split(',').map((id) => id.trim()) : []
    );
    if (!assignedIds.length) return [];

    const idToName = new Map(allPermissions.map((permission) => [String(permission.id), permission.name]));
    return [...new Set(assignedIds.map((id) => idToName.get(id)).filter(Boolean))];
};

export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

        const currentUser = await getUserById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!currentUser.referral_code || !String(currentUser.referral_code).trim()) {
            const referralCode = await generateUniqueReferralCode();
            await updateUser(currentUser.id, {
                name: currentUser.name,
                first_name: currentUser.first_name,
                last_name: currentUser.last_name,
                email: currentUser.email,
                phone: currentUser.phone,
                profile_image: currentUser.profile_image,
                gender: currentUser.gender,
                date_of_birth: currentUser.date_of_birth,
                state: currentUser.state,
                district: currentUser.district,
                taluka: currentUser.taluka,
                village: currentUser.village,
                address: currentUser.address,
                document_file: currentUser.document_file,
                password: currentUser.password,
                referral_code: referralCode,
            });
        }

        const refreshedUser = await getUserById(req.user.id);
        const { password: _, ...safeUser } = refreshedUser;
        const jurisdiction = await getJurisdictionByUserId(refreshedUser.id);
        let jurisdictionInfo = null;
        if (jurisdiction) {
            const scopeNames = await resolveScopeNames(jurisdiction);
            const scope_label = scopeNames.village_name || scopeNames.taluka_name || scopeNames.district_name;
            jurisdictionInfo = { role_name: jurisdiction.role_name, scope_type: jurisdiction.scope_type, scope_label };
        }
        const permissions = await resolveUserPermissionNames(refreshedUser.role, jurisdiction?.role_name);
        return res.status(200).json({ user: safeUser, permissions, jurisdiction: jurisdictionInfo });
    } catch (error) {
        console.error('getCurrentUser error', error.message || error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}



export const updateProfile = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

        const userId = req.user.id;
        const {
            first_name,
            last_name,
            profile_image,
            email,
            phone,
            currentPassword,
            newPassword,
            gender,
            date_of_birth,
            state,
            district,
            taluka,
            village,
            address,
            latitude,
            longitude,
            document_file,
            role,
            has_solar_dryer,
            interested_in_solar_dryer,
            how_know_about_us,
            language,
        } = req.body;

        const dbUser = await getUserById(userId);
        if (!dbUser) return res.status(404).json({ message: 'User not found' });

        // Check if email is already taken by another user
        if (email && email !== dbUser.email) {
            const existingUser = await getUserByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // If password change requested, verify current password
        let password = undefined;
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password required to change password' });
            }
            const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            password = await bcrypt.hash(newPassword, 10);
        }

        const uploadedFile = req.file;
        const resolvedProfileImage = uploadedFile
            ? await resolveUploadedFileUrl(uploadedFile, 'profile')
            : (profile_image !== undefined ? profile_image : dbUser.profile_image);

        if (role !== undefined && role !== dbUser.role) {
            // Block escalation to admin-tier roles regardless of exact naming ("admin", "super_admin", "super admin", ...)
            if (/^\s*super[ _]?admin\s*$|^\s*admin\s*$/i.test(role)) {
                return res.status(403).json({ message: 'You are not allowed to set this role' });
            }
            const targetRole = await getRoleByName(role);
            if (!targetRole) {
                return res.status(400).json({ message: 'Invalid role selected' });
            }
        }

        const updateData = {
            first_name: first_name !== undefined ? first_name : dbUser.first_name,
            last_name: last_name !== undefined ? last_name : dbUser.last_name,
            profile_image: resolvedProfileImage,
            email: email !== undefined ? email : dbUser.email,
            phone: phone !== undefined ? phone : dbUser.phone,
            gender: gender !== undefined ? gender : dbUser.gender,
            date_of_birth: date_of_birth !== undefined ? (date_of_birth || null) : dbUser.date_of_birth,
            state: state !== undefined ? state : dbUser.state,
            district: district !== undefined ? district : dbUser.district,
            taluka: taluka !== undefined ? taluka : dbUser.taluka,
            village: village !== undefined ? village : dbUser.village,
            address: address !== undefined ? address : dbUser.address,
            latitude: latitude !== undefined && latitude !== '' ? Number(latitude) : dbUser.latitude,
            longitude: longitude !== undefined && longitude !== '' ? Number(longitude) : dbUser.longitude,
            document_file: document_file !== undefined ? document_file : dbUser.document_file,
            role: role !== undefined ? role : dbUser.role,
            has_solar_dryer: has_solar_dryer !== undefined ? has_solar_dryer : dbUser.has_solar_dryer,
            interested_in_solar_dryer: interested_in_solar_dryer !== undefined ? interested_in_solar_dryer : dbUser.interested_in_solar_dryer,
            how_know_about_us: how_know_about_us !== undefined ? how_know_about_us : dbUser.how_know_about_us,
            language: language !== undefined ? language : dbUser.language,
            name: `${first_name !== undefined ? first_name : dbUser.first_name} ${last_name !== undefined ? last_name : dbUser.last_name}`,
            password: password || dbUser.password,
        };

        // Update in database
        await updateUser(userId, updateData);

        // Fetch updated user
        const updatedUser = await getUserById(userId);
        const { password: _, ...safeUser } = updatedUser;

        res.status(200).json({ message: 'Profile updated successfully', user: safeUser });

    } catch (error) {
        console.error('updateProfile error', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const uploadDocument = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

        const userId = req.user.id;
        const uploadedFile = req.file;

        if (!uploadedFile) {
            return res.status(400).json({ message: 'Document file is required' });
        }

        const dbUser = await getUserById(userId);
        if (!dbUser) return res.status(404).json({ message: 'User not found' });

        const updateData = {
            name: dbUser.name,
            first_name: dbUser.first_name,
            last_name: dbUser.last_name,
            profile_image: dbUser.profile_image,
            email: dbUser.email,
            phone: dbUser.phone,
            gender: dbUser.gender,
            date_of_birth: dbUser.date_of_birth,
            state: dbUser.state,
            district: dbUser.district,
            taluka: dbUser.taluka,
            village: dbUser.village,
            address: dbUser.address,
            document_file: await resolveUploadedFileUrl(uploadedFile, 'profile'),
            document_status: 'Pending',
            password: dbUser.password,
        };

        await updateUser(userId, updateData);

        const updatedUser = await getUserById(userId);
        const { password: _, ...safeUser } = updatedUser;

        res.status(200).json({ message: 'Document uploaded successfully', user: safeUser });
    } catch (error) {
        console.error('uploadDocument error', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createUserByAdmin = async (req, res) => {
    try {
        let {
            first_name, last_name, email, phone, password, role,
            gender, date_of_birth, state, district, taluka, village, address,
            latitude, longitude, has_solar_dryer, interested_in_solar_dryer, how_know_about_us,
        } = req.body;

        // A Village Representative reaches this route via hasPermission('user.create'), not
        // the admin/super_admin bypass. They may only create plain users inside their own
        // village - location fields and role are forced from their jurisdiction, ignoring
        // whatever the client sent.
        const isRepresentativeCreator = req.user.role !== 'admin' && req.user.role !== 'super_admin';
        if (isRepresentativeCreator) {
            const jurisdiction = req.userJurisdiction;
            if (!jurisdiction || jurisdiction.scope_type !== 'village') {
                return res.status(403).json({ message: 'You do not have a village assigned to add users.' });
            }
            const scopeNames = await resolveScopeNames(jurisdiction);
            role = 'user';
            village = scopeNames.village_name;
            taluka = scopeNames.taluka_name;
            district = scopeNames.district_name;
        }

        if (!first_name || !email || !password) {
            return res.status(400).json({ message: 'First name, email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const existingEmailUser = await getUserByEmail(email);
        if (existingEmailUser) {
            return res.status(400).json({ message: 'This email is already registered' });
        }

        if (phone) {
            const existingPhoneUser = await getUserByPhone(phone);
            if (existingPhoneUser) {
                return res.status(400).json({ message: 'This phone number is already registered' });
            }
        }

        if (role && !isRepresentativeCreator) {
            const targetRole = await getRoleByName(role);
            if (!targetRole && !['admin', 'super_admin', 'user'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role selected' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultPoints = getDefaultUserPoints();
        const ownReferralCode = await generateUniqueReferralCode();

        const result = await insertUser({
            name: `${first_name} ${last_name || ''}`.trim(),
            first_name,
            last_name: last_name || '',
            email,
            phone: phone || null,
            password: hashedPassword,
            referral_code: ownReferralCode,
            points: defaultPoints,
            gender,
            date_of_birth,
            state,
            district,
            taluka,
            village,
            address,
            latitude,
            longitude,
            has_solar_dryer,
            interested_in_solar_dryer,
            how_know_about_us,
        });

        const [queryResult] = result;
        const insertId = queryResult.insertId;

        if (!insertId) {
            throw new Error('Failed to get insert ID from database');
        }

        if (role) {
            await updateUser(insertId, { ...(await getUserById(insertId)), role });
        }

        const createdUser = await getUserById(insertId);
        const { password: _, remember_token, ...safeUser } = createdUser;

        res.status(201).json({ success: true, data: safeUser, message: 'User created successfully' });
    } catch (error) {
        console.error('createUserByAdmin error', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const [users, jurisdictions] = await Promise.all([getAllUsersModel(), getAllJurisdictions()]);
        const jurisdictionByUserId = new Map(jurisdictions.map((j) => [j.user_id, j]));

        const enrichedUsers = await Promise.all(users.map(async (user) => {
            const jurisdiction = jurisdictionByUserId.get(user.id);
            if (!jurisdiction) return user;
            const scopeNames = await resolveScopeNames(jurisdiction);
            const scopeLabel = scopeNames.village_name || scopeNames.taluka_name || scopeNames.district_name;
            return {
                ...user,
                jurisdiction_role_name: jurisdiction.role_name,
                jurisdiction_label: scopeLabel ? `${jurisdiction.role_name} — ${scopeLabel}` : jurisdiction.role_name,
            };
        }));

        res.status(200).json({ success: true, data: enrichedUsers });
    } catch (error) {
        console.error('getAllUsers error', error.message || error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyFarmerDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['Pending', 'Verified', 'Rejected'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: `Status must be one of: ${allowedStatuses.join(', ')}` });
        }

        const existingUser = await getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!existingUser.document_file) {
            return res.status(400).json({ message: 'This user has not uploaded a document' });
        }

        await updateUserDocumentStatus(id, status);

        if (status === 'Verified' || status === 'Rejected') {
            const lang = resolveNotificationLang(existingUser.language);
            const message = status === 'Verified'
                ? documentVerifiedMessage(lang)
                : documentRejectedMessage(lang);

            try {
                await createNotification({
                    userId: existingUser.id,
                    type: status === 'Verified' ? 'document_verified' : 'document_rejected',
                    title: status === 'Verified' ? 'Document Verified' : 'Document Rejected',
                    message,
                });
            } catch (notificationError) {
                console.error('Failed to save document status notification:', notificationError.message || notificationError);
            }

            if (existingUser.phone) {
                try {
                    await sendWhatsAppMessage(existingUser.phone, `Star Agro: ${message}`);
                } catch (whatsappError) {
                    console.error('Failed to send document status WhatsApp notification:', whatsappError?.message || whatsappError);
                }
            }
        }

        return res.status(200).json({ message: `Document ${status.toLowerCase()} successfully`, document_status: status });
    } catch (error) {
        console.error('verifyFarmerDocument error', error.message || error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const existingUser = await getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const {
            first_name,
            last_name,
            profile_image,
            email,
            phone,
            gender,
            date_of_birth,
            state,
            district,
            taluka,
            village,
            address,
            role,
            points,
        } = req.body;

        // Prevent duplicate email conflict
        if (email && email !== existingUser.email) {
            const userWithEmail = await getUserByEmail(email);
            if (userWithEmail && userWithEmail.id !== existingUser.id) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        const updateData = {
            name: `${first_name !== undefined ? first_name : existingUser.first_name} ${last_name !== undefined ? last_name : existingUser.last_name}`,
            first_name: first_name !== undefined ? first_name : existingUser.first_name,
            last_name: last_name !== undefined ? last_name : existingUser.last_name,
            profile_image: profile_image !== undefined ? profile_image : existingUser.profile_image,
            email: email !== undefined ? email : existingUser.email,
            phone: phone !== undefined ? phone : existingUser.phone,
            gender: gender !== undefined ? gender : existingUser.gender,
            date_of_birth: date_of_birth !== undefined ? date_of_birth : existingUser.date_of_birth,
            state: state !== undefined ? state : existingUser.state,
            district: district !== undefined ? district : existingUser.district,
            taluka: taluka !== undefined ? taluka : existingUser.taluka,
            village: village !== undefined ? village : existingUser.village,
            address: address !== undefined ? address : existingUser.address,
            document_file: existingUser.document_file,
            password: existingUser.password,
            referral_code: existingUser.referral_code,
            points: points !== undefined ? Number(points) : existingUser.points,
            // Only admin/super_admin may change a user's role - a Village Representative
            // editing a user in their own village (via restrictToOwnVillage) cannot escalate it.
            role: (role !== undefined && ['admin', 'super_admin'].includes(req.user.role))
                ? role
                : existingUser.role,
        };

        await updateUser(id, updateData);
        const updatedUser = await getUserById(id);
        const { password, remember_token, ...safeUser } = updatedUser;
        res.status(200).json({ success: true, data: safeUser, message: 'User updated successfully' });
    } catch (error) {
        console.error('updateUserById error', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const existingUser = await getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await softDeleteUser(id);
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('deleteUserById error', error.message || error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const googleLogin = async (req, res) => {
    try {
        const { name, email, profile_image } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        let user = await getUserByEmail(email);

        // User nahi hai to create karo
        if (!user) {
            const names = (name || "").split(" ");

            const result = await insertUser({
                name,
                first_name: names[0] || "",
                last_name: names.slice(1).join(" ") || "",
                email,
                phone: null,
                password: null,
                profile_image,
            });

            const [queryResult] = result;
            user = await getUserById(queryResult.insertId);
        }

        const token = createToken({
            id: user.id,
        });

        const { password, ...safeUser } = user;

        return res.status(200).json({
            token,
            user: safeUser,
        });

    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const facebookLogin = async (req, res) => {
    try {
        const { name, email, profile_image } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        let user = await getUserByEmail(email);

        // User nahi hai to create karo
        if (!user) {
            const names = (name || "").split(" ");

            const result = await insertUser({
                name,
                first_name: names[0] || "",
                last_name: names.slice(1).join(" ") || "",
                email,
                phone: null,
                password: null,
                profile_image,
            });

            const [queryResult] = result;
            user = await getUserById(queryResult.insertId);
        }

        const token = createToken({
            id: user.id,
        });

        const { password, ...safeUser } = user;

        return res.status(200).json({
            token,
            user: safeUser,
        });

    } catch (error) {
        console.error("Facebook login error:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};