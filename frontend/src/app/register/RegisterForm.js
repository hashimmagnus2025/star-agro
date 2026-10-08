'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import {
    FaUser,
    FaEnvelope,
    FaPhone,
    FaLock,
    FaKey,
    FaSeedling,
    FaArrowRight,
    FaMicrophone,
    FaEye,
    FaEyeSlash
} from 'react-icons/fa';
import api, { setAuthToken } from '../utils/api';
import { translations } from '../utils/translations.js';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function RegisterForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        password: '',
        referralCode: '',
        agreedToTerms: false,
        userType: 'farmer'
    });
    const [listeningField, setListeningField] = useState(null);
    const [language, setLanguage] = useState('en');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const recaptchaWidgetId = useRef(null); 

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const langFromUrl = params.get('lang');
        const lang = (langFromUrl && translations[langFromUrl]) ? langFromUrl : (localStorage.getItem('language') || 'en');
        setLanguage(lang);
    }, []);

    const t = translations[language];

    useEffect(() => {
        if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined') return;

        window.onRecaptchaSuccess = (token) => setRecaptchaToken(token);
        window.onRecaptchaExpired = () => setRecaptchaToken('');

        const renderWidget = () => {
            if (window.grecaptcha?.render && recaptchaWidgetId.current === null) {
                recaptchaWidgetId.current = window.grecaptcha.render('recaptcha-container', {
                    sitekey: RECAPTCHA_SITE_KEY,
                    callback: window.onRecaptchaSuccess,
                    'expired-callback': window.onRecaptchaExpired,
                });
            }
        };

        if (window.grecaptcha?.render) {
            renderWidget();
            return;
        }

        window.onRecaptchaApiLoad = renderWidget;

        if (!document.getElementById('recaptcha-script')) {
            const script = document.createElement('script');
            script.id = 'recaptcha-script';
            script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaApiLoad&render=explicit';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }
    }, []);

    const getSpeechLang = () => {
        if (typeof window === 'undefined') return 'en-IN';
        const lang = localStorage.getItem('language') || 'en';
        const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
        return langMap[lang] || 'en-IN';
    };

    const handleVoiceInput = (fieldName) => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition = window['SpeechRecognition'] || window['webkitSpeechRecognition'];
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = getSpeechLang();
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setListeningField(fieldName);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setFormData((prev) => ({ ...prev, [fieldName]: transcript }));
        };
        recognition.onerror = () => setListeningField(null);
        recognition.onend = () => setListeningField(null);

        recognition.start();
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const referralCodeFromUrl = params.get('ref');
        if (referralCodeFromUrl) {
            setFormData((prev) => ({
                ...prev,
                referralCode: referralCodeFromUrl,
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "phone") {
            const phone = value.replace(/\D/g, "").slice(0, 10);

            setFormData((prev) => ({
                ...prev,
                phone,
            }));
            return;
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const capitalizeName = (name) => {
        if (typeof name !== 'string' || !name.trim()) return name;
        const trimmed = name.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.phone.length !== 10) {
            setError(t?.registerForm?.phoneLengthError || "Phone number must be exactly 10 digits");
            return;
        }

        if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
            setError(t?.registerForm?.recaptchaRequired || 'Please verify you are not a robot');
            return;
        }

        const first_name = capitalizeName(formData.first_name);
        const last_name = capitalizeName(formData.last_name);
        const { phone, email, password, referralCode } = formData;

        setSubmitting(true);

        try {
            const response = await api.post('/user/register', {
                first_name,
                last_name,
                phone,
                email,
                password,
                referralCode,
                recaptchaToken
            });
            console.log('Registration successful:', response.data);

            // attempt to persist token + user (support common response shapes)
            const payload = response.data || {};
            const token = payload.token || payload.accessToken || payload?.data?.token || payload?.data?.accessToken;
            const user = payload.user || payload.userInfo || payload.data || payload;

            if (token) {
                localStorage.setItem('token', token);
                setAuthToken(token);
            }

            if (user) {
                try { localStorage.setItem('user', JSON.stringify(user)); } catch (e) { /* ignore */ }
            }

            await Swal.fire({
                icon: 'success',
                title: t?.swal?.registrationSuccessTitle || 'Registration Successful',
                text: t?.swal?.registrationSuccessText || 'Your account has been created. You will be redirected to login.',
                confirmButtonText: t?.swal?.registrationSuccessButton || 'Go to Login',
                timer: 2500,
                timerProgressBar: true,
                showCloseButton: true
            });

            // If we obtained a user and role, redirect accordingly (auto-login). Otherwise go to login.
            const parsedUser = (() => { try { return typeof user === 'string' ? JSON.parse(user) : user; } catch (e) { return user; } })();
            if (parsedUser && (parsedUser.role === 'super_admin' || parsedUser.role === 'admin')) router.push('/admin');
            else if (token) router.push('/login');
            else router.push('/login');
        } catch (submitError) {
            console.error('Registration error:', submitError.response?.data || submitError.message);

            if (typeof window !== 'undefined' && window.grecaptcha?.reset && recaptchaWidgetId.current !== null) {
                window.grecaptcha.reset(recaptchaWidgetId.current);
            }
            setRecaptchaToken('');

            Swal.fire({
                icon: 'error',
                title: t?.swal?.registrationFailedTitle || 'Registration Failed',
                text: submitError.response?.data?.message || t?.swal?.registrationFailedText || 'Please check your information and try again.',
                confirmButtonText: t?.swal?.okButton || 'OK'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4fff4] flex items-center justify-center px-4 py-8 sm:py-10">
            <div className="w-full max-w-7xl bg-white rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden border border-green-100">

                <div className="grid lg:grid-cols-2">

                    {/* LEFT SIDE */}
                    <div className="relative hidden lg:flex flex-col justify-between p-8 lg:p-12 bg-gradient-to-br from-green-700 via-emerald-700 to-green-900 overflow-hidden">

                        {/* Background Overlay */}
                        <div className="absolute inset-0 opacity-40">
                            <Image
                                src="/media/register-from-page.png"
                                alt="Agriculture"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>

                        {/* Top Logo */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <FaSeedling className="text-white text-xl lg:text-2xl" />
                                </div>

                                <div>
                                    <h2 className="text-2xl lg:text-3xl font-extrabold text-white">
                                        Star Agro
                                    </h2>

                                    <p className="text-green-100 text-xs lg:text-sm">
                                        {t?.registerForm?.brandTagline || 'Smart Farming Platform'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Center Content */}
                        <div className="relative z-10 max-w-md">
                            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4 lg:mb-6">
                                {t?.registerForm?.heroTitle1 || 'Grow Better'} <br />
                                {t?.registerForm?.heroTitle2 || 'With Modern'} <br />
                                {t?.registerForm?.heroTitle3 || 'Agriculture'}
                            </h1>

                            <p className="text-green-50 text-base lg:text-lg leading-relaxed">
                                {t?.registerForm?.heroDescription || 'Connect with farmers, buyers, and agriculture experts. Manage your farming business digitally with Star Agro.'}
                            </p>


                        </div>

                        {/* Bottom */}
                        <div className="relative z-10 flex items-center gap-3 text-white">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/20 flex items-center justify-center text-sm lg:text-base">
                                🌱
                            </div>

                            <p className="text-xs lg:text-sm text-green-100">
                                {t?.registerForm?.trustedText || 'Trusted by modern farmers across India'}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="p-6 sm:p-10 lg:p-14">

                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-6 sm:mb-8">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center shadow-xl">
                                <FaSeedling className="text-white text-2xl sm:text-3xl" />
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mt-4 sm:mt-5">
                                Star Agro
                            </h1>

                            <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
                                {t?.registerForm?.mobileSubtitle || 'Create your agriculture account'}
                            </p>
                        </div>

                        {/* Heading */}
                        <div className="mb-6 sm:mb-8 text-center lg:text-left">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800">
                                {t?.registerForm?.heading || 'Registration Form'}
                            </h2>

                            <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
                                {t?.registerForm?.subheading || 'Join the future of smart agriculture'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}



                        {/* FORM */}
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                            {/* Name */}
                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                                <InputField
                                    icon={<FaUser />}
                                    name="first_name"
                                    placeholder={t?.registerForm?.firstName || 'First Name'}
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    voiceEnabled
                                    listening={listeningField === 'first_name'}
                                    onVoiceClick={() => handleVoiceInput('first_name')}
                                />

                                <InputField
                                    icon={<FaUser />}
                                    name="last_name"
                                    placeholder={t?.registerForm?.lastName || 'Last Name'}
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    voiceEnabled
                                    listening={listeningField === 'last_name'}
                                    onVoiceClick={() => handleVoiceInput('last_name')}
                                />
                            </div>

                            {/* Phone */}
                            <InputField
                                icon={<FaPhone />}
                                type="tel"
                                name="phone"
                                placeholder={t?.registerForm?.phoneNumber || 'Phone Number'}
                                value={formData.phone}
                                onChange={handleChange}
                                maxLength={10}
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                            />

                            {/* Email */}
                            <InputField
                                icon={<FaEnvelope />}
                                type="email"
                                name="email"
                                placeholder={t?.registerForm?.emailAddress || 'Email Address'}
                                value={formData.email}
                                onChange={handleChange}
                            />


                            <InputField
                                icon={<FaLock />}
                                type="password"
                                name="password"
                                placeholder={t?.registerForm?.password || 'Password'}
                                value={formData.password}
                                onChange={handleChange}
                            />




                            {/* Referral */}
                            <InputField
                                icon={<FaKey />}
                                name="referralCode"
                                placeholder={t?.registerForm?.referralCode || 'Referral Code (Optional)'}
                                value={formData.referralCode}
                                onChange={handleChange}
                            />

                            {/* Terms */}
                            <div className="flex items-start gap-2 sm:gap-3 pt-1 sm:pt-2">
                                <input
                                    type="checkbox"
                                    name="agreedToTerms"
                                    checked={formData.agreedToTerms}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 w-4 h-4 sm:w-5 sm:h-5 accent-green-600 shrink-0"
                                />

                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    {t?.registerForm?.agreeText || 'I agree to the'}{' '}
                                    <Link
                                        href="/terms-and-conditions"
                                        className="text-green-600 font-semibold hover:underline"
                                    >
                                        {t?.registerForm?.termsConditions || 'Terms & Conditions'}
                                    </Link>{' '}
                                    {t?.registerForm?.and || 'and'}{' '}
                                    <Link
                                        href="/privacy-policy"
                                        className="text-green-600 font-semibold hover:underline"
                                    >
                                        {t?.registerForm?.privacyPolicy || 'Privacy Policy'}
                                    </Link>
                                </p>
                            </div>

                            {/* reCAPTCHA */}
                            {RECAPTCHA_SITE_KEY && (
                                <div id="recaptcha-container" className="flex justify-center sm:justify-start" />
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-2 sm:mt-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-300 shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {t?.registerForm?.createAccount || 'Create Account'}
                                <FaArrowRight />
                            </button>

                            {/* Login */}
                            <div className="text-center pt-3 sm:pt-5">
                                <p className="text-xs sm:text-sm text-gray-600">
                                    {t?.registerForm?.alreadyHaveAccount || 'Already have an account?'}{' '}
                                    <Link
                                        href="/login"
                                        className="text-green-600 font-bold hover:underline"
                                    >
                                        {t?.registerForm?.login || 'Login'}
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Reusable Input Component */
function InputField({
    icon,
    type = 'text',
    name,
    placeholder,
    value,
    onChange,
    voiceEnabled = false,
    listening = false,
    onVoiceClick
}) {
    const [speechSupported, setSpeechSupported] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window['SpeechRecognition'] || window['webkitSpeechRecognition'])) {
            setSpeechSupported(true);
        }
    }, []);

    const showMic = voiceEnabled && speechSupported;
    const isPassword = type === 'password';
    const showRightIcon = showMic || isPassword;

    return (
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {icon}
            </div>

            <input
                type={isPassword && showPassword ? 'text' : type}
                name={name}
                value={value}
                onChange={onChange}
                required={name !== 'referralCode'}
                placeholder={placeholder}
                className={`w-full h-11 sm:h-12 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 pl-10 ${showRightIcon ? 'pr-10' : 'pr-4'} text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all duration-300`}
            />

            {isPassword && (
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-green-600 transition-colors"
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
            )}

            {showMic && (
                <button
                    type="button"
                    onClick={onVoiceClick}
                    aria-label="Voice input"
                    title="Speak to fill this field"
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm transition-colors ${listening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-green-600'}`}
                >
                    <FaMicrophone />
                </button>
            )}
        </div>
    );
}