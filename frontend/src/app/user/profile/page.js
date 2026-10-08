'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Camera, Eye, EyeOff, CheckCircle2, AlertTriangle, Copy, Share2, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import api, { setAuthToken } from '../../utils/api';
import Cropper from "react-easy-crop";
import { translations } from '../../utils/translations.js';
import { useJsApiLoader, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES = ['places'];
const DEFAULT_MAP_CENTER = { lat: 20.5937, lng: 78.9629 }; // India, used until a location is picked

export default function UserProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [jurisdiction, setJurisdiction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageSrc, setImageSrc] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [language, setLanguage] = useState('en'); // Default language is English
    const [activeTab, setActiveTab] = useState('edit'); // 'edit', 'more-info', 'documents'
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        profile_image: '',
        role: 'user',
    });
    const [moreInfoData, setMoreInfoData] = useState({
        gender: '',
        date_of_birth: '',
        state: '',
        district: '',
        taluka: '',
        village: '',
        address: '',
        latitude: '',
        longitude: '',
        has_solar_dryer: '',
        interested_in_solar_dryer: '',
        how_know_about_us: '',

    });
    const [documentData, setDocumentData] = useState({
        document_file: null,
    });
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);
    const [villages, setVillages] = useState([]);
    const [locationIds, setLocationIds] = useState({ state_id: '', district_id: '', taluka_id: '' });

    const [roles, setRoles] = useState([]);

    const { isLoaded: isMapsLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });
    const [addressAutocomplete, setAddressAutocomplete] = useState(null);

    const handleAddressPlaceChanged = () => {
        const place = addressAutocomplete?.getPlace();
        const lat = place?.geometry?.location?.lat();
        const lng = place?.geometry?.location?.lng();
        setMoreInfoData((prev) => ({
            ...prev,
            address: place?.formatted_address || place?.name || prev.address,
            latitude: lat !== undefined ? lat : prev.latitude,
            longitude: lng !== undefined ? lng : prev.longitude,
        }));
    };

    const handleMapMarkerDragEnd = (e) => {
        setMoreInfoData((prev) => ({
            ...prev,
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng(),
        }));
    };

    const addressMapCenter = moreInfoData.latitude && moreInfoData.longitude
        ? { lat: Number(moreInfoData.latitude), lng: Number(moreInfoData.longitude) }
        : DEFAULT_MAP_CENTER;

    useEffect(() => {
        const lang = localStorage.getItem('language');
        if (lang) {
            setLanguage(lang);
        }
    }, []);

    const t = translations[language]; // Fallback to English if the selected language is not available

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [moreInfoErrors, setMoreInfoErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [referralBusy, setReferralBusy] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token) setAuthToken(token);
        else {
            setError('Login token not found. Please login again.');
            setLoading(false);
            return;
        }

        const loadUser = async () => {
            try {
                const res = await api.get('/user/me');
                const fetchedUser = res.data.user;
                if (fetchedUser.role === 'admin' || fetchedUser.role === 'super_admin') {
                    localStorage.setItem('user', JSON.stringify(fetchedUser));
                    router.push('/admin/profile');
                    return;
                }
                setUser(fetchedUser);
                setJurisdiction(res.data.jurisdiction || null);
                localStorage.setItem('user', JSON.stringify(fetchedUser));
                setFormData({
                    first_name: fetchedUser.first_name || '',
                    last_name: fetchedUser.last_name || '',
                    email: fetchedUser.email || '',
                    phone: fetchedUser.phone || '',
                    profile_image: fetchedUser.profile_image || '',
                    role: fetchedUser.role || 'user',
                });
                setMoreInfoData({
                    gender: fetchedUser.gender || '',
                    date_of_birth: fetchedUser.date_of_birth ? fetchedUser.date_of_birth.slice(0, 10) : '',
                    state: fetchedUser.state || '',
                    district: fetchedUser.district || '',
                    taluka: fetchedUser.taluka || '',
                    village: fetchedUser.village || '',
                    address: fetchedUser.address || '',
                    latitude: fetchedUser.latitude ?? '',
                    longitude: fetchedUser.longitude ?? '',
                    has_solar_dryer: fetchedUser.has_solar_dryer || '',
                    interested_in_solar_dryer: fetchedUser.interested_in_solar_dryer || '',
                    how_know_about_us: fetchedUser.how_know_about_us || '',
                });
            } catch (err) {
                console.error('Failed to load current user', err);
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        if (parsedUser.role === 'admin' || parsedUser.role === 'super_admin') {
                            router.push('/admin/profile');
                            return;
                        }
                        setUser(parsedUser);
                        setFormData({
                            first_name: parsedUser.first_name || '',
                            last_name: parsedUser.last_name || '',
                            email: parsedUser.email || '',
                            phone: parsedUser.phone || '',
                            profile_image: parsedUser.profile_image || '',
                            role: parsedUser.role || 'user',
                        });
                        setMoreInfoData({
                            gender: parsedUser.gender || '',
                            date_of_birth: parsedUser.date_of_birth ? parsedUser.date_of_birth.slice(0, 10) : '',
                            state: parsedUser.state || '',
                            district: parsedUser.district || '',
                            taluka: parsedUser.taluka || '',
                            village: parsedUser.village || '',
                            address: parsedUser.address || '',
                            latitude: parsedUser.latitude ?? '',
                            longitude: parsedUser.longitude ?? '',
                            has_solar_dryer: parsedUser.has_solar_dryer || '',
                            interested_in_solar_dryer: parsedUser.interested_in_solar_dryer || '',
                            how_know_about_us: parsedUser.how_know_about_us || '',
                        });
                    } catch (parseErr) {
                        console.error('Unable to parse stored user', parseErr);
                        setError('Unable to load profile. Please login again.');
                    }
                } else {
                    setError('Unable to load profile. Please login again.');
                }
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await api.get('/role');
                const roleOptions = Array.isArray(res.data) ? res.data : [];
                const allowedRoleNames = ['user', 'farmer', 'enterprenure/treder'];
                setRoles(
                    roleOptions.filter(
                        (roleItem) => allowedRoleNames.includes(String(roleItem.name).trim().toLowerCase())
                    )
                );
            } catch (err) {
                console.error('Failed to load roles', err);
            }
        };

        fetchRoles();

        const fetchIndiaStates = async () => {
            try {
                const countriesRes = await api.get('/countries');
                const india = countriesRes.data.find((c) => c.iso2 === 'IN' || c.name === 'India');
                if (!india) return;
                const statesRes = await api.get(`/states?country_id=${india.id}`);
                setStates(statesRes.data);
            } catch (err) {
                console.error('Failed to load states', err);
            }
        };
        fetchIndiaStates();
    }, []);

    useEffect(() => {
        if (!states.length) return;

        const defaultStateName = 'Maharashtra';
        const existingState = moreInfoData.state?.trim();

        if (existingState) {
            const match = states.find((s) => s.name?.toLowerCase() === existingState.toLowerCase());
            if (match) {
                setLocationIds((prev) => ({ ...prev, state_id: String(match.id) }));
            }
            return;
        }

        const defaultState = states.find((s) => s.name?.toLowerCase() === defaultStateName.toLowerCase());
        if (!defaultState) return;

        setLocationIds((prev) => ({ ...prev, state_id: String(defaultState.id) }));
        setMoreInfoData((prev) => ({ ...prev, state: defaultState.name }));
    }, [states, moreInfoData.state]);

    useEffect(() => {
        if (!locationIds.state_id) {
            setDistricts([]);
            return;
        }
        const fetchDistricts = async () => {
            try {
                const res = await api.get(`/districts?state_id=${locationIds.state_id}`);
                setDistricts(res.data);
            } catch (err) {
                console.error('Failed to load districts', err);
                setDistricts([]);
            }
        };
        fetchDistricts();
    }, [locationIds.state_id]);

    // Hydrate district_id once districts are loaded and the user already has a saved district name
    useEffect(() => {
        if (moreInfoData.district && districts.length) {
            const match = districts.find((d) => d.district_name === moreInfoData.district);
            if (match) {
                setLocationIds((prev) => ({ ...prev, district_id: match.id }));
            }
        }
    }, [districts, moreInfoData.district]);

    useEffect(() => {
        if (!locationIds.district_id) {
            setTalukas([]);
            return;
        }
        const fetchTalukas = async () => {
            try {
                const res = await api.get(`/talukas?district_id=${locationIds.district_id}`);
                setTalukas(res.data);
            } catch (err) {
                console.error('Failed to load talukas', err);
                setTalukas([]);
            }
        };
        fetchTalukas();
    }, [locationIds.district_id]);

    // Hydrate taluka_id once talukas are loaded and the user already has a saved taluka name
    useEffect(() => {
        if (moreInfoData.taluka && talukas.length) {
            const match = talukas.find((t) => t.taluka_name === moreInfoData.taluka);
            if (match) {
                setLocationIds((prev) => ({ ...prev, taluka_id: match.id }));
            }
        }
    }, [talukas, moreInfoData.taluka]);

    useEffect(() => {
        if (!locationIds.taluka_id) {
            setVillages([]);
            return;
        }
        const fetchVillages = async () => {
            try {
                const res = await api.get(`/villages?taluka_id=${locationIds.taluka_id}`);
                setVillages(res.data);
            } catch (err) {
                console.error('Failed to load villages', err);
                setVillages([]);
            }
        };
        fetchVillages();
    }, [locationIds.taluka_id]);

    const handleStateSelect = (e) => {
        const stateId = e.target.value;
        const match = states.find((s) => String(s.id) === stateId);
        setLocationIds({ state_id: stateId, district_id: '', taluka_id: '' });
        setMoreInfoData((prev) => ({ ...prev, state: match ? match.name : '', district: '', taluka: '', village: '' }));
        setMoreInfoErrors((prev) => ({ ...prev, state: undefined }));
    };

    const handleDistrictSelect = (e) => {
        const districtId = e.target.value;
        const match = districts.find((d) => String(d.id) === districtId);
        setLocationIds((prev) => ({ ...prev, district_id: districtId, taluka_id: '' }));
        setMoreInfoData((prev) => ({ ...prev, district: match ? match.district_name : '', taluka: '', village: '' }));
        setMoreInfoErrors((prev) => ({ ...prev, district: undefined }));
    };

    const handleTalukaSelect = (e) => {
        const talukaId = e.target.value;
        const match = talukas.find((t) => String(t.id) === talukaId);
        setLocationIds((prev) => ({ ...prev, taluka_id: talukaId }));
        setMoreInfoData((prev) => ({ ...prev, taluka: match ? match.taluka_name : '', village: '' }));
        setMoreInfoErrors((prev) => ({ ...prev, taluka: undefined }));
    };

    const handleVillageSelect = (e) => {
        setMoreInfoData((prev) => ({ ...prev, village: e.target.value }));
        setMoreInfoErrors((prev) => ({ ...prev, village: undefined }));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            const phone = value.replace(/\D/g, "").slice(0, 10);

            setFormData((prev) => ({
                ...prev,
                phone,
            }));
            return;
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMoreInfoChange = (e) => {
        const { name, value } = e.target;
        setMoreInfoData((prev) => ({ ...prev, [name]: value }));
        setMoreInfoErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleHasSolarDryerChange = (e) => {
        const { value } = e.target;
        setMoreInfoData((prev) => ({
            ...prev,
            has_solar_dryer: value,
            interested_in_solar_dryer: value === 'yes' ? '' : prev.interested_in_solar_dryer,
        }));
        setMoreInfoErrors((prev) => ({ ...prev, has_solar_dryer: undefined }));
    };

    const validateMoreInfo = () => {
        const errors = {};

        if (!moreInfoData.gender) errors.gender = 'Gender is required.';
        if (!locationIds.state_id) errors.state = 'State is required.';
        if (!locationIds.district_id) errors.district = 'District is required.';
        if (!locationIds.taluka_id) errors.taluka = 'Taluka is required.';
        if (!moreInfoData.village) errors.village = 'Village is required.';
        if (!moreInfoData.address.trim()) errors.address = 'Address is required.';
        if (!moreInfoData.has_solar_dryer) errors.has_solar_dryer = 'This field is required.';
        if (moreInfoData.has_solar_dryer === 'no' && !moreInfoData.interested_in_solar_dryer) {
            errors.interested_in_solar_dryer = 'This field is required.';
        }
        if (!moreInfoData.how_know_about_us) errors.how_know_about_us = 'This field is required.';

        setMoreInfoErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleDocumentChange = (e) => {
        const { files } = e.target;
        setDocumentData((prev) => ({ ...prev, document_file: files[0] }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            const res = await api.put('/user/me', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                profile_image: formData.profile_image,
                role: formData.role,
            });
            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            Swal.fire({
                icon: 'success',
                title: 'Updated',
                text: 'Profile updated successfully',
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update profile';
            setError(msg);
            Swal.fire({ icon: 'error', title: 'Update failed', text: msg });
            console.error('Profile update error', err);
        } finally {
            setSubmitting(false);
        }
        // Dispatch event to update AdminLayout in real-time
        window.dispatchEvent(new Event('userUpdated'));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (formData.phone.length !== 10) {
            setError("Phone number must be exactly 10 digits");
            setSubmitting(false);
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        try {
            await api.put('/user/me', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setMessage('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
            console.error('Password change error', err);
        } finally {
            setSubmitting(false);
        }
        // Dispatch event to update AdminLayout in real-time
        window.dispatchEvent(new Event('userUpdated'));
    };

    const handleMoreInfoSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!validateMoreInfo()) {
            return;
        }

        setSubmitting(true);

        try {
            const res = await api.put('/user/me', {
                gender: moreInfoData.gender,
                date_of_birth: moreInfoData.date_of_birth,
                state: moreInfoData.state,
                district: moreInfoData.district,
                taluka: moreInfoData.taluka,
                village: moreInfoData.village,
                address: moreInfoData.address,
                latitude: moreInfoData.latitude,
                longitude: moreInfoData.longitude,
                has_solar_dryer: moreInfoData.has_solar_dryer,
                interested_in_solar_dryer: moreInfoData.has_solar_dryer === 'yes' ? '' : moreInfoData.interested_in_solar_dryer,
                how_know_about_us: moreInfoData.how_know_about_us,

            });
            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setMoreInfoData({
                gender: updatedUser.gender || '',
                date_of_birth: updatedUser.date_of_birth ? updatedUser.date_of_birth.slice(0, 10) : '',
                state: updatedUser.state || '',
                district: updatedUser.district || '',
                taluka: updatedUser.taluka || '',
                village: updatedUser.village || '',
                address: updatedUser.address || '',
                has_solar_dryer: updatedUser.has_solar_dryer || '',
                interested_in_solar_dryer: updatedUser.interested_in_solar_dryer || '',
                how_know_about_us: updatedUser.how_know_about_us || '',
            });
            Swal.fire({
                icon: 'success',
                title: 'Updated',
                text: 'More information updated successfully',
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update more information';
            setError(msg);
            Swal.fire({ icon: 'error', title: 'Update failed', text: msg });
            console.error('More info update error', err);
        } finally {
            setSubmitting(false);
        }
        window.dispatchEvent(new Event('userUpdated'));
    };

    const handleDocumentSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!documentData.document_file) {
            setError('Please select a file');
            return;
        }

        setSubmitting(true);

        try {
            const formDataObj = new FormData();
            formDataObj.append('document', documentData.document_file);

            const res = await api.post('/user/upload-document', formDataObj, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.data?.user) {
                setUser(res.data.user);
            }
            setDocumentData({ document_file: null });
            Swal.fire({
                icon: 'success',
                title: 'Uploaded',
                text: 'Document uploaded successfully',
                timer: 1800,
                showConfirmButton: false,
            });
            window.dispatchEvent(new Event('userUpdated'));
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to upload document';
            setError(msg);
            Swal.fire({ icon: 'error', title: 'Upload failed', text: msg });
            console.error('Document upload error', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReferralCopy = async () => {
        if (!user?.referral_code) {
            setError('Referral code is not available yet.');
            return;
        }

        setReferralBusy(true);
        try {
            await navigator.clipboard.writeText(user.referral_code);
            setMessage(t?.userPanel?.Referral?.copied || 'Referral code copied successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('Unable to copy referral code');
        } finally {
            setReferralBusy(false);
        }
    };

    const handleReferralShare = async () => {
        if (!user?.referral_code) {
            setError('Referral code is not available yet.');
            return;
        }

        setReferralBusy(true);
        const referralLink = `${window.location.origin}/register?ref=${encodeURIComponent(user.referral_code)}&lang=${language}`;
        const shareText = `${t?.userPanel?.Referral?.shareText || 'Join Star Agro with my referral code:'} ${user.referral_code}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: t?.userPanel?.Referral?.shareTitle || 'Star Agro referral',
                    text: `${shareText}\n${referralLink}`,
                    url: referralLink,
                });
                setMessage('Referral invite shared');
                setTimeout(() => setMessage(''), 3000);
            } else {
                await navigator.clipboard.writeText(referralLink);
                setMessage(t?.userPanel?.Referral?.linkCopied || 'Referral invite link copied');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            if (err?.name !== 'AbortError') {
                setError('Unable to share referral invite');
            }
        } finally {
            setReferralBusy(false);
        }
    };

    const handleProfileImageClick = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';

        fileInput.onchange = (event) => {
            const file = event.target.files[0];

            if (file) {
                const reader = new FileReader();

                reader.onload = () => {
                    setImageSrc(reader.result);
                    setShowCropModal(true);
                };

                reader.readAsDataURL(file);
            }
        };

        fileInput.click();
    };
    const getCroppedImage = async () => {
        const image = new Image();
        image.src = imageSrc;

        await new Promise((resolve) => {
            image.onload = resolve;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const handleCropSave = async () => {
        try {
            const croppedBlob = await getCroppedImage();

            const formData = new FormData();
            formData.append('profile', croppedBlob, 'profile.jpg');

            const res = await api.put('/user/me', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setShowCropModal(false);
            setMessage('Profile image updated successfully');
            setTimeout(() => setMessage(''), 4000);

            window.dispatchEvent(new Event('userUpdated'));
        } catch (err) {
            setError('Failed to update profile image');
        }
    };
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
                    <p className="text-slate-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    <p className="text-slate-700 font-semibold">No profile found. Please log in again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 sm:p-4 md:p-8">
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-4 sm:p-8 text-white shadow-xl mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="relative">
                        {user?.profile_image ? (
                            <img
                                src={resolveMediaUrl(user.profile_image)}
                                alt="profile"
                                className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
                                {((user?.first_name || user?.name || user?.last_name || '') + '').trim().charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button onClick={handleProfileImageClick} className="absolute right-0 bottom-0 rounded-full bg-white p-3 text-green-600 shadow-lg">
                            <Camera size={18} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-4xl font-bold">{user?.name || 'Admin Profile'}</h1>
                        <p className="text-green-100 max-w-2xl">
                            Update your profile, contact details, and security settings from one place.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-3xl bg-white/10 p-4">
                                <p className="text-xs uppercase tracking-[0.3em] text-green-100/80"> {t?.userPanel.myProfile.email}</p>
                                <p className="mt-2 text-sm font-semibold text-white">{user.email || 'Not set'}</p>
                            </div>
                            <div className="rounded-3xl bg-white/10 p-4">
                                <p className="text-xs uppercase tracking-[0.3em] text-green-100/80"> {t?.userPanel.myProfile.phone}</p>
                                <p className="mt-2 text-sm font-semibold text-white">{user.phone || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className="mb-6 rounded-3xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700 shadow-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{message}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-3xl bg-rose-50 border border-rose-200 p-4 text-rose-700 shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
                {/*Account Overview   */}
                <div className="rounded-3xl bg-white p-4 shadow-lg">
                    <h3 className="text-xl font-bold mb-6">Account Overview</h3>
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-green-100 p-3 text-green-600">
                                <User />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">{t?.userPanel.myProfile.fullName}</p>
                                <p className="font-semibold text-slate-900">{user?.name || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-blue-100 p-3 text-blue-600">
                                <Mail />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">{t?.userPanel.myProfile.email}</p>
                                <p className="font-semibold text-slate-900">{user.email || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-orange-100 p-3 text-orange-600">
                                <Phone />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">{t?.userPanel.myProfile.phone}</p>
                                <p className="font-semibold text-slate-900">{user.phone || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-purple-100 p-3 text-purple-600">
                                <User />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Current Role</p>
                                <p className="font-semibold text-slate-900 capitalize">{(user?.role || 'user').replace('_', ' ')}</p>
                            </div>
                        </div>

                        {jurisdiction && (
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 rounded-2xl bg-teal-100 p-3 text-teal-600">
                                    <Users />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Representative Role</p>
                                    <p className="font-semibold text-slate-900">
                                        {jurisdiction.role_name}
                                        {jurisdiction.scope_label ? ` — ${jurisdiction.scope_label}` : ''}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm text-slate-500">Total Points</p>
                                    <p className="font-semibold text-slate-900">{user?.points ?? 0}</p>
                                </div>
                                <div className="rounded-2xl bg-white p-2 text-amber-600 shadow-sm">
                                    ⭐
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                                Your referral rewards are shown here separately from wallet balance.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm text-slate-500">Referral Code</p>
                                    <p className="font-semibold text-slate-900">{user?.referral_code || 'Generating...'}</p>
                                </div>
                                <div
                                    onClick={handleReferralShare}
                                    disabled={referralBusy}
                                    className="rounded-2xl bg-white p-2 text-emerald-600 shadow-sm">
                                    <Share2 size={18} />
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">
                                Share this code with friends so they can use it during signup.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleReferralCopy}
                                    disabled={referralBusy}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Copy size={16} />
                                    Copy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReferralShare}
                                    disabled={referralBusy}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Share2 size={16} />
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {/* TAB NAVIGATION */}
                    <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-lg">
                        <div className="flex gap-2 border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('edit')}
                                className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition ${activeTab === 'edit'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                {t?.userPanel?.myProfile?.editProfile}
                            </button>
                            <button
                                onClick={() => setActiveTab('more-info')}
                                className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition ${activeTab === 'more-info'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                {t?.userPanel?.myProfile?.moreInfoTab}
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`px-4 sm:px-6 py-3 font-semibold text-sm border-b-2 transition ${activeTab === 'documents'
                                    ? 'border-emerald-500 text-emerald-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                {t?.userPanel?.myProfile?.documentsTab}
                            </button>
                        </div>
                    </div>

                    {/* TAB CONTENT - EDIT PROFILE */}
                    {activeTab === 'edit' && (
                        <div className="space-y-8">
                            <div className="rounded-3xl bg-white p-8 shadow-lg">
                                <h2 className="text-xl sm:text-2xl font-bold mb-6">{t.userPanel?.myProfile.editProfile}</h2>
                                <form onSubmit={handleProfileSubmit} className="grid gap-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.firstName}  <span className='text-red-500'>*</span></span>
                                            <input
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleFormChange}
                                                type="text"
                                                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                placeholder={t?.userPanel.myProfile.firstName}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.lastName} <span className='text-red-500'>*</span></span>
                                            <input
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleFormChange} 
                                                type="text"
                                                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                placeholder={t?.userPanel.myProfile.lastName}
                                            />
                                        </label>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.email}  <span className='text-red-500'>*</span></span>
                                            <input
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleFormChange}
                                                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                placeholder={t?.userPanel.myProfile.email}
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.phone}  <span className='text-red-500'>*</span></span>
                                            <input
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleFormChange}
                                                maxLength={10}
                                                inputMode="numeric"
                                                pattern="[0-9]{10}"
                                                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                placeholder={t?.userPanel.myProfile.phone}
                                            />
                                        </label>
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        <label className="block">
                                            <span className="text-sm font-medium text-slate-700">Role</span>
                                            <select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleFormChange}
                                                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            >
                                                {roles.length > 0 ? (
                                                    roles.map((roleItem) => (
                                                        <option key={roleItem.id} value={roleItem.name}>
                                                            {roleItem.name.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="user">User</option>
                                                        <option value="farmer">Farmer</option>
                                                        <option value="buyer">Buyer</option>
                                                        <option value="supplier">Supplier</option>
                                                        <option value="admin">Admin</option>
                                                    </>
                                                )}
                                            </select>
                                        </label>
                                        <div className="hidden md:block" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-8 py-3 text-white font-semibold shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                                    >
                                        {submitting ? t?.userPanel?.myProfile?.saving : t?.userPanel?.myProfile?.saveChanges}
                                    </button>
                                </form>
                            </div>

                            <div className="rounded-3xl bg-slate-900 p-4 sm:p-8 shadow-lg text-white">
                                <div className="flex items-center gap-3 mb-8">
                                    <Lock className="h-6 w-6" />
                                    <h2 className="text-2xl font-bold">{t?.userPanel.myProfile.ChangePassword}</h2>
                                </div>
                                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                    <label className="block relative">
                                        <span className="text-sm font-medium text-slate-200"> {t?.userPanel.myProfile.CurrentPassword}</span>
                                        <input
                                            name="currentPassword"
                                            type={showPassword.currentPassword ? 'text' : 'password'}
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="mt-2 w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
                                            placeholder="Current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('currentPassword')}
                                            className="absolute right-3 top-[40px] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                                        >
                                            {showPassword.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </label>
                                    <label className="block relative">
                                        <span className="text-sm font-medium text-slate-200"> {t?.userPanel.myProfile.NewPassword}</span>
                                        <input
                                            name="newPassword"
                                            type={showPassword.newPassword ? 'text' : 'password'}
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="mt-2 w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
                                            placeholder="New password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('newPassword')}
                                            className="absolute right-3 top-[40px] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                                        >
                                            {showPassword.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </label>
                                    <label className="block relative">
                                        <span className="text-sm font-medium text-slate-200"> {t?.userPanel.myProfile.ConfirmPassword}</span>
                                        <input
                                            name="confirmPassword"
                                            type={showPassword.confirmPassword ? 'text' : 'password'}
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="mt-2 w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
                                            placeholder="Confirm new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility('confirmPassword')}
                                            className="absolute right-3 top-[40px] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                                        >
                                            {showPassword.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </label>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="inline-flex items-center justify-center rounded-3xl bg-white px-4 sm:px-8 py-3 text-slate-900 font-semibold shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                                    >
                                        {submitting ? t?.userPanel?.myProfile?.updating : t?.userPanel?.myProfile?.updatePassword}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT - MORE INFORMATION */}
                    {activeTab === 'more-info' && (
                        <div className="rounded-3xl bg-white p-4 sm:p-8 shadow-lg">
                            <h2 className="text-2xl font-bold mb-8">More Information</h2>
                            <form onSubmit={handleMoreInfoSubmit} noValidate className="grid gap-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.gender}  <span className='text-red-500'>*</span></span>
                                        <select
                                            name="gender"
                                            value={moreInfoData.gender}
                                            onChange={handleMoreInfoChange}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {moreInfoErrors.gender && (
                                            <p className="mt-2 text-xs text-red-600">{moreInfoErrors.gender}</p>
                                        )}
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.DateofBirth} </span>
                                        <input
                                            name="date_of_birth"
                                            type="date"
                                            value={moreInfoData.date_of_birth}
                                            onChange={handleMoreInfoChange}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        />
                                    </label>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.state}  <span className='text-red-500'>*</span></span>
                                        <select
                                            name="state"
                                            value={locationIds.state_id}
                                            onChange={handleStateSelect}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        >
                                            <option value="">Select State</option>
                                            {states.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        {moreInfoErrors.state && (
                                            <p className="mt-2 text-xs text-red-600">{moreInfoErrors.state}</p>
                                        )}
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.district}  <span className='text-red-500'>*</span></span>
                                        <select
                                            name="district"
                                            value={locationIds.district_id}
                                            onChange={handleDistrictSelect}
                                            disabled={!locationIds.state_id || districts.length === 0}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <option value="">
                                                {locationIds.state_id && districts.length === 0 ? 'No districts available' : 'Select District'}
                                            </option>
                                            {districts.map((d) => (
                                                <option key={d.id} value={d.id}>{d.district_name}</option>
                                            ))}
                                        </select>
                                        {moreInfoErrors.district && (
                                            <p className="mt-2 text-xs text-red-600">{moreInfoErrors.district}</p>
                                        )}
                                    </label>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.taluka} <span className='text-red-500'>*</span></span>
                                        <select
                                            name="taluka"
                                            value={locationIds.taluka_id}
                                            onChange={handleTalukaSelect}
                                            disabled={!locationIds.district_id || talukas.length === 0}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <option value="">
                                                {locationIds.district_id && talukas.length === 0 ? 'No talukas available' : 'Select Taluka'}
                                            </option>
                                            {talukas.map((t) => (
                                                <option key={t.id} value={t.id}>{t.taluka_name}</option>
                                            ))}
                                        </select>
                                        {moreInfoErrors.taluka && (
                                            <p className="mt-2 text-xs text-red-600">{moreInfoErrors.taluka}</p>
                                        )}
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.village}  <span className='text-red-500'>*</span></span>
                                        <select
                                            name="village"
                                            value={moreInfoData.village}
                                            onChange={handleVillageSelect}
                                            disabled={!locationIds.taluka_id || villages.length === 0}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <option value="">
                                                {locationIds.taluka_id && villages.length === 0 ? 'No villages available' : 'Select Village'}
                                            </option>
                                            {villages.map((v) => (
                                                <option key={v.id} value={v.village_name}>{v.village_name}</option>
                                            ))}
                                        </select>
                                        {moreInfoErrors.village && (
                                            <p className="mt-2 text-xs text-red-600">{moreInfoErrors.village}</p>
                                        )}
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.address}  <span className='text-red-500'>*</span></span>
                                    {isMapsLoaded ? (
                                        <Autocomplete
                                            onLoad={setAddressAutocomplete}
                                            onPlaceChanged={handleAddressPlaceChanged}
                                        >
                                            <input
                                                type="text"
                                                name="address"
                                                value={moreInfoData.address}
                                                onChange={handleMoreInfoChange}
                                                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                placeholder="Enter full address"
                                            />
                                        </Autocomplete>
                                    ) : (
                                        <textarea
                                            name="address"
                                            value={moreInfoData.address}
                                            onChange={handleMoreInfoChange}
                                            rows="3"
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                                            placeholder="Enter full address"
                                        />
                                    )}
                                    {moreInfoErrors.address && (
                                        <p className="mt-2 text-xs text-red-600">{moreInfoErrors.address}</p>
                                    )}

                                    {isMapsLoaded && (
                                        <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200">
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '280px' }}
                                                center={addressMapCenter}
                                                zoom={moreInfoData.latitude && moreInfoData.longitude ? 15 : 5}
                                            >
                                                {moreInfoData.latitude && moreInfoData.longitude && (
                                                    <Marker
                                                        position={addressMapCenter}
                                                        draggable
                                                        onDragEnd={handleMapMarkerDragEnd}
                                                    />
                                                )}
                                            </GoogleMap>
                                        </div>
                                    )}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.Doyouhavesolardryer}  <span className='text-red-500'>*</span></span>
                                    <select
                                        name="has_solar_dryer"
                                        value={moreInfoData.has_solar_dryer}
                                        onChange={handleHasSolarDryerChange}
                                        className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        <option value="">{t?.userPanel.myProfile.moreInfo.selectOption}</option>
                                        <option value="yes">{t?.userPanel.myProfile.moreInfo.yes}</option>
                                        <option value="no">{t?.userPanel.myProfile.moreInfo.no}</option>
                                    </select>
                                    {moreInfoErrors.has_solar_dryer && (
                                        <p className="mt-2 text-xs text-red-600">{moreInfoErrors.has_solar_dryer}</p>
                                    )}
                                </label>

                                {moreInfoData.has_solar_dryer === 'no' && (
                                    <div className="block">
                                        <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.interestedInSolarDryer}  <span className='text-red-500'>*</span></span>
                                        <div className="mt-2 flex items-center gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={moreInfoData.interested_in_solar_dryer === 'yes'}
                                                    onChange={() => {
                                                        setMoreInfoData((prev) => ({ ...prev, interested_in_solar_dryer: 'yes' }));
                                                        setMoreInfoErrors((prev) => ({ ...prev, interested_in_solar_dryer: undefined }));
                                                    }}
                                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                                />
                                                <span className="text-sm text-slate-700">Yes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={moreInfoData.interested_in_solar_dryer === 'no'}
                                                    onChange={() => {
                                                        setMoreInfoData((prev) => ({ ...prev, interested_in_solar_dryer: 'no' }));
                                                        setMoreInfoErrors((prev) => ({ ...prev, interested_in_solar_dryer: undefined }));
                                                    }}
                                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                                                />
                                                <span className="text-sm text-slate-700">No</span>
                                            </label>
                                        </div>
                                        {moreInfoErrors.interested_in_solar_dryer && (
                                            <p className="mt-2 text-xs text-red-600">{moreInfoErrors.interested_in_solar_dryer}</p>
                                        )}
                                    </div>
                                )}

                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">{t?.userPanel.myProfile.moreInfo.howKnowAboutUs}  <span className='text-red-500'>*</span></span>
                                    <select
                                        name="how_know_about_us"
                                        value={moreInfoData.how_know_about_us}
                                        onChange={handleMoreInfoChange}
                                        className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        <option value="">{t?.userPanel.myProfile.moreInfo.selectOption}</option>
                                        <option value="social_media">{t?.userPanel.myProfile.moreInfo.SocialMedia}</option>
                                        <option value="newspaper">{t?.userPanel.myProfile.moreInfo.newsPaper}</option>
                                        <option value="friends">{t?.userPanel.myProfile.moreInfo.friends}</option>
                                        <option value="seminar">{t?.userPanel.myProfile.moreInfo.seminar}</option>
                                    </select>
                                    {moreInfoErrors.how_know_about_us && (
                                        <p className="mt-2 text-xs text-red-600">{moreInfoErrors.how_know_about_us}</p>
                                    )}
                                </label>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-8 py-3 text-white font-semibold shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                                >
                                    {submitting ? t?.userPanel?.myProfile?.saving : t?.userPanel?.myProfile?.saveInformation}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* TAB CONTENT - UPLOAD DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div className="rounded-3xl bg-white p-4 sm:p-8 shadow-lg">
                            <h2 className="text-2xl font-bold mb-8">{t?.userPanel.myProfile.moreInfo.FarmerCertificate}  <span className='text-red-500'>*</span></h2>

                            {user?.document_file && (
                                <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <span className="text-sm text-slate-600">Current document:</span>
                                    <a
                                        href={resolveMediaUrl(user.document_file)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-emerald-600 underline hover:text-emerald-700"
                                    >
                                        View uploaded document
                                    </a>
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${String(user.document_status).toLowerCase() === 'verified'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : String(user.document_status).toLowerCase() === 'rejected'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {user.document_status || 'Pending'}
                                    </span>
                                </div>
                            )}

                            <form onSubmit={handleDocumentSubmit} className="grid gap-6">
                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">Upload File</span>
                                    <input
                                        name="document_file"
                                        type="file"
                                        onChange={handleDocumentChange}
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX (Max 10MB)
                                    </p>
                                </label>

                                {documentData.document_file && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                                        <p className="text-sm text-blue-700">
                                            <span className="font-semibold">Selected file:</span> {documentData.document_file.name}
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-8 py-3 text-white font-semibold shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                                >
                                    {submitting ? t?.userPanel?.myProfile?.uploading : t?.userPanel?.myProfile?.uploadDocument}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {
                showCropModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-4 w-full max-w-md sm:max-w-lg">
                            <div className="relative h-[350px]">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={(croppedArea, croppedAreaPixels) =>
                                        setCroppedAreaPixels(croppedAreaPixels)
                                    }
                                />
                            </div>

                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(e.target.value)}
                                className="w-full mt-5"
                            />

                            <div className="flex gap-3 mt-5">
                                <button
                                    onClick={() => setShowCropModal(false)}
                                    className="px-5 py-2 rounded-lg border"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleCropSave}
                                    className="px-5 py-2 rounded-lg bg-green-600 text-white"
                                >
                                    Crop & Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>


    );
}
