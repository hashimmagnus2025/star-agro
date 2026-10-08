'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRedirectResult, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../utils/firebase";
import { translations } from '../utils/translations.js';
import Image from 'next/image';
import {
    FaEnvelope,
    FaLock,
    FaSeedling,
    FaArrowRight,
    FaMobileAlt,
    FaEye,
    FaEyeSlash
} from 'react-icons/fa';
import api, { setAuthToken } from '../utils/api.js'
export default function Login() {
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isFacebookLoading, setIsFacebookLoading] = useState(false);
    const [language, setLanguage] = useState('en'); // Default language
    useEffect(() => {
        const lang = localStorage.getItem('language');
        if (lang) {
            setLanguage(lang);
        }
    }, []);

    const t = translations[language]; // Fallback to English if translation not found
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [otpData, setOtpData] = useState({
        phone: '',
        otp: '',
        otpSent: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleOtpChange = (e) => {
        const { name, value } = e.target;
        setOtpData({
            ...otpData,
            [name]: value
        });
    };

    const handleSendOtp = (e) => {
        e.preventDefault();
        (async () => {
            try {
                if (!otpData.phone) return alert('Please enter mobile number');
                const res = await api.post('/user/send-otp', { phone: otpData.phone });
                if (res.data && res.data.success) {
                    setOtpData({ ...otpData, otpSent: true });
                } else {
                    alert(res.data?.message || 'Failed to send OTP');
                }
            } catch (err) {
                const data = err.response?.data;
                console.error('Send OTP error', data || err.message);

                if (data?.debugOtp) {
                    alert(`${data.message || 'Failed to send OTP via WhatsApp. Using local debug OTP.'}\n\nDebug OTP: ${data.debugOtp}`);
                    setOtpData({ ...otpData, otpSent: true });
                    return;
                }

                alert(data?.message || 'Failed to send OTP');
            }
        })();
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        (async () => {
            try {
                const res = await api.post('/user/verify-otp', { phone: otpData.phone, otp: otpData.otp });
                const payload = res.data || {};
                const token = payload.token || payload.accessToken || payload?.data?.token || payload?.data?.accessToken;
                const userCandidate = payload.user || payload.userInfo || (payload.data && (payload.data.user || payload.data.userInfo)) || payload.data || null;

                if (token) {
                    localStorage.setItem('token', token);
                    setAuthToken(token);
                }

                // Only store a real user object (avoid storing token-only payloads as `user`)
                const hasUserIdentity = userCandidate && (userCandidate.id || userCandidate.email || userCandidate.name || userCandidate.first_name || userCandidate.firstName);
                if (hasUserIdentity) {
                    try { localStorage.setItem('user', JSON.stringify(userCandidate)); } catch (e) { }
                }

                // redirect
                const parsedUser = (() => { try { if (userCandidate) return typeof userCandidate === 'string' ? JSON.parse(userCandidate) : userCandidate; const stored = localStorage.getItem('user'); return stored ? JSON.parse(stored) : null; } catch (e) { return null; } })();
                if (parsedUser && (parsedUser.role === 'super_admin' || parsedUser.role === 'admin')) window.location.href = '/admin';
                else window.location.href = '/';
            } catch (err) {
                console.error('Verify OTP error', err.response?.data || err.message);
                alert(err.response?.data?.message || 'OTP verification failed');
            }
        })();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        (async () => {
            try {
                const res = await api.post('/user/login', { email: formData.email, password: formData.password });
                const payload = res.data || {};
                console.log('[Login] response payload:', payload);
                const token = payload.token || payload.accessToken || payload?.data?.token || payload?.data?.accessToken;
                const userCandidate = payload.user || payload.userInfo || (payload.data && (payload.data.user || payload.data.userInfo)) || payload.data || null;

                if (!token) {
                    alert('Login succeeded but no token was returned. Check backend auth response.');
                }

                if (token) {
                    localStorage.setItem('token', token);
                    setAuthToken(token);
                }

                const hasUserIdentity = userCandidate && (userCandidate.id || userCandidate.email || userCandidate.name || userCandidate.first_name || userCandidate.firstName);
                if (hasUserIdentity) {
                    try { localStorage.setItem('user', JSON.stringify(userCandidate)); } catch (e) { }
                }

                // redirect based on role if available
                const parsedUser = (() => { try { if (userCandidate) return typeof userCandidate === 'string' ? JSON.parse(userCandidate) : userCandidate; const stored = localStorage.getItem('user'); return stored ? JSON.parse(stored) : null; } catch (e) { return null; } })();
                if (parsedUser && (parsedUser.role === 'super_admin' || parsedUser.role === 'admin')) window.location.href = '/admin';
                else window.location.href = '/';
            } catch (err) {
                console.error('Login error', err.response?.data || err.message);
                alert(err.response?.data?.message || 'Login failed');
            }
        })();
    };
    const completeGoogleLogin = async (firebaseUser) => {
        if (!firebaseUser) {
            throw new Error("Firebase login failed - no user returned");
        }

        const res = await api.post("/user/google-login", {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            profile_image: firebaseUser.photoURL,
        });

        if (!res.data?.token || !res.data?.user) {
            throw new Error(res.data?.message || "Backend did not return token/user");
        }

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setAuthToken(res.data.token);

        window.location.href = "/";
    };

    const completeFacebookLogin = async (firebaseUser) => {
        if (!firebaseUser) {
            throw new Error("Firebase login failed - no user returned");
        }

        const res = await api.post("/user/facebook-login", {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            profile_image: firebaseUser.photoURL,
        });

        if (!res.data?.token || !res.data?.user) {
            throw new Error(res.data?.message || "Backend did not return token/user");
        }

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setAuthToken(res.data.token);

        window.location.href = "/";
    };

    useEffect(() => {
        (async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    setIsGoogleLoading(true);
                    await completeGoogleLogin(result.user);
                }
            } catch (error) {
                console.error('Google redirect login failed:', error.code || error.message, error.message);
                alert("Google login failed: " + (error.message || "Unknown error"));
            } finally {
                setIsGoogleLoading(false);
            }
        })();
    }, []);

    const loginWithFacebook = async () => {
        setIsFacebookLoading(true);
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            await completeFacebookLogin(result.user);
        } catch (error) {
            const code = error.code || error.message;
            const message = error.message;
            console.error('Facebook login failed:', code, message);
            alert("Facebook login failed: " + (message || "Unknown error"));
        } finally {
            setIsFacebookLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setIsGoogleLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await completeGoogleLogin(result.user);
        } catch (error) {
            const code = error.code || error.message;
            const message = error.message;

            console.error('Google login failed:', code, message);

            if (code === 'auth/popup-closed-by-user' || code === 'auth/popup-blocked') {
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            alert("Google login failed: " + (message || "Unknown error"));
        } finally {
            setIsGoogleLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-[#f4fff4] flex items-center justify-center px-4 py-8 sm:py-10">
            <div className="w-full max-w-7xl bg-white rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden border border-green-100">

                <div className="grid lg:grid-cols-2">

                    {/* LEFT SIDE - FORM */}
                    <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-center">

                        {/* Mobile Logo (Visible only on small screens) */}
                        <div className="lg:hidden text-center mb-6 sm:mb-8">

                            <div className="w-full h-34 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-gray-600 flex items-center justify-center shadow-xl">
                                <Image
                                    src="/media/logo-cropped.svg"
                                    alt="Star Agro Logo"
                                    width={40}
                                    height={40}
                                    className="object-contain w-26 h-26"
                                />

                                {/* <FaSeedling className="text-white text-2xl sm:text-3xl" /> */}
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mt-4 sm:mt-5">
                                Star Agro
                            </h1>

                            <h3>Fruits and Vegetables processing</h3>
                        </div>

                        {/* Heading */}
                        <div className="mb-8 sm:mb-10 text-center lg:text-left">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800">
                                {t?.loginPage.WelcomeBack}
                            </h2>
                            <p className="text-gray-500 mt-2 text-sm sm:text-base">
                                Please login to your account to continue
                            </p>
                        </div>

                        {/* LOGIN METHOD TOGGLE */}
                        <div className="mb-8 flex bg-gray-100 rounded-lg sm:rounded-xl p-1 sm:p-1.5">
                            <button
                                type="button"
                                onClick={() => setLoginMethod('password')}
                                className={`flex-1 py-2.5 sm:py-3 rounded-md sm:rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 ${loginMethod === 'password'
                                    ? 'bg-white text-green-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-700'
                                    }`}
                            >
                                <FaEnvelope className="text-xs sm:text-sm" />
                                <span>{t?.loginPage?.emailAndPassword}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoginMethod('otp')}
                                className={`flex-1 py-2.5 sm:py-3 rounded-md sm:rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 ${loginMethod === 'otp'
                                    ? 'bg-white text-green-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-700'
                                    }`}
                            >
                                <FaMobileAlt className="text-xs sm:text-sm" />
                                <span>{t?.loginPage?.OptLogin}</span>
                            </button>
                        </div>

                        {/* FORM */}
                        {loginMethod === 'password' ? (
                            // EMAIL & PASSWORD LOGIN FORM
                            <form onSubmit={handleSubmit} className="space-y-5">

                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t?.loginPage.email} {t?.loginPage.orMobileNumber} <span className='text-red-500'>*</span>
                                </label>
                                <InputField
                                    icon={<FaEnvelope />}
                                    type="text"
                                    name="email"
                                    placeholder={`${t?.loginPage.email} ${t?.loginPage.orMobileNumber}`}
                                    value={formData.email}
                                    onChange={handleChange}
                                />

                                {/* Password */}
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t?.loginPage.password} <span className='text-red-500'>*</span>
                                </label>
                                <InputField
                                    icon={<FaLock />}
                                    type="password"
                                    name="password"
                                    placeholder={t?.loginPage.password}
                                    value={formData.password}
                                    onChange={handleChange}
                                    showPasswordToggle
                                />

                                {/* Options (Remember Me & Forgot Password) */}
                                <div className="flex items-center justify-end pt-1">

                                    <Link href="/forgot-password" className="text-sm text-green-600 font-semibold hover:underline">
                                        {t?.loginPage.forgotPassword}
                                    </Link>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-300 shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2 sm:gap-3"
                                >
                                    {t?.loginPage.logintoAccount}
                                    <FaArrowRight />
                                </button>

                                {/* Register Link */}
                                <div className="text-center pt-6">
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {t?.loginPage.dontHaveAccount} {' '}
                                        <Link
                                            href="/register"
                                            className="text-green-600 font-bold hover:underline"
                                        >
                                            {t?.loginPage.createAccount}
                                        </Link>
                                    </p>
                                </div>
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={loginWithGoogle}
                                        disabled={isGoogleLoading}
                                        className="flex items-center justify-center gap-3 rounded-xl border border-blue-600 border-2 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 48 48"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                fill="#FFC107"
                                                d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.5-.4-3.5z"
                                            />
                                            <path
                                                fill="#FF3D00"
                                                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
                                            />
                                            <path
                                                fill="#4CAF50"
                                                d="M24 44c5.2 0 10-2 13.5-5.3l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
                                            />
                                            <path
                                                fill="#1976D2"
                                                d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.6-6.2 7.3l6.2 5.2C39.8 36.6 44 31 44 24c0-1.3-.1-2.5-.4-3.5z"
                                            />
                                        </svg>

                                        {isGoogleLoading ? "Connecting..." : `${t?.loginPage.Google}`}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={loginWithFacebook}
                                        disabled={isFacebookLoading}
                                        className="flex items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-5 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#166FE5] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="h-5 w-5"
                                        >
                                            <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06z" />
                                        </svg>

                                        {isFacebookLoading ? "Connecting..." : `${t?.loginPage.Facebook}`}
                                    </button>
                                </div>

                            </form>
                        ) : (
                            // OTP LOGIN FORM
                            <form onSubmit={otpData.otpSent ? handleOtpSubmit : handleSendOtp} className="space-y-5">

                                {/* Phone Number */}
                                {!otpData.otpSent && (
                                    <>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t?.loginPage?.mobileNumber} <span className='text-red-500'>*</span>
                                        </label>
                                        <InputField
                                            icon={<FaMobileAlt />}
                                            type="tel"
                                            name="phone"
                                            placeholder={t?.loginPage?.mobileNumber}
                                            value={otpData.phone}
                                            onChange={handleOtpChange}
                                        />

                                        {/* Info Text */}
                                        <p className="text-xs sm:text-sm text-gray-500 text-center">
                                            {t?.loginPage?.WellSendTo}
                                        </p>

                                        {/* Send OTP Button */}
                                        <button
                                            type="submit"
                                            className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-300 shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2 sm:gap-3"
                                        >
                                            {t?.loginPage?.OtpSent}
                                            <FaArrowRight />
                                        </button>
                                    </>
                                )}

                                {/* OTP Verification */}
                                {otpData.otpSent && (
                                    <>
                                        <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                            <p className="text-sm text-green-800">
                                                <span className="font-semibold">{t?.loginPage?.OtpSentToWhatsApp}:</span> +91 {otpData.phone}
                                            </p>
                                        </div>

                                        <InputField
                                            icon={<FaLock />}
                                            type="text"
                                            name="otp"
                                            placeholder={t?.loginPage?.EnterOTP}
                                            value={otpData.otp}
                                            onChange={handleOtpChange}
                                        />

                                        {/* Resend Link */}
                                        <div className="flex items-center justify-between pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setOtpData({ ...otpData, otpSent: false, otp: '' })}
                                                className="text-sm text-green-600 font-semibold hover:underline"
                                            >
                                                {t?.loginPage?.ChangeNumber}
                                            </button>
                                            <button
                                                type="button"
                                                className="text-sm text-green-600 font-semibold hover:underline"
                                            >
                                                {t?.loginPage?.ResendOTP}
                                            </button>
                                        </div>

                                        {/* Verify Button */}
                                        <button
                                            type="submit"
                                            className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-300 shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2 sm:gap-3"
                                        >
                                            {t?.loginPage?.VerifyOTP}
                                            <FaArrowRight />
                                        </button>
                                    </>
                                )}

                                {/* Register Link */}
                                <div className="text-center pt-6">
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        {t?.loginPage?.dontHaveAccount}{' '}
                                        <Link
                                            href="/register"
                                            className="text-green-600 font-bold hover:underline"
                                        >
                                            {t?.loginPage?.createAccount}
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* RIGHT SIDE - IMAGE (Hidden on mobile) */}
                    <div className="relative hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-to-br from-green-800 via-emerald-700 to-green-900 overflow-hidden">

                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <Image
                                src="/media/register-from-page.png"
                                alt="Agriculture Background"
                                fill
                                priority
                                className="object-cover opacity-60"
                            />
                        </div>

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 via-green-800/60 to-green-900/80" />

                        {/* Badge */}
                        <div className="absolute top-8 right-8 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full shadow-lg">
                            <FaSeedling className="text-green-300 text-lg" />
                            <span className="text-white text-sm font-semibold tracking-wide">
                                Star Agro Portal
                            </span>
                        </div>

                        {/* Content */}
                        <div className="relative z-10 max-w-xl text-center">

                            <Image
                                src="/media/logo-cropped.svg"
                                alt="Star Agro Logo"
                                width={120}
                                height={120}
                                className="mx-auto mb-8 drop-shadow-2xl"
                            />

                            <span className="inline-block mb-3 px-4 py-1 rounded-full bg-green-500/20 border border-green-300/20 text-green-200 text-sm tracking-widest uppercase">
                                Welcome to
                            </span>

                            <h1 className="text-5xl font-extrabold text-white leading-tight">
                                Star Agro
                            </h1>

                            <h2 className="mt-1 text-2xl font-semibold text-green-200">
                                Fruits & Vegetables Processing
                            </h2>

                            <p className="mt-8 text-lg leading-8 text-green-100 max-w-md mx-auto">
                                Manage your products, monitor crop activities, and stay connected
                                with modern agricultural solutions through one powerful platform.
                            </p>

                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}

/* Reusable Input Component (Consistent with Register Page) */
function InputField({
    icon,
    type = 'text',
    name,
    placeholder,
    value,
    onChange,
    showPasswordToggle = false
}) {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {icon}
            </div>

            <input
                type={inputType}
                name={name}
                value={value}
                onChange={onChange}
                required
                placeholder={placeholder}
                className={`w-full h-11 sm:h-12 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 pl-10 ${showPasswordToggle ? 'pr-10' : 'pr-4'} text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all duration-300`}
            />

            {showPasswordToggle && (
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    tabIndex={-1}
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            )}
        </div>
    );
}
