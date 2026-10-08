'use client';
import Link from "next/link";
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    Leaf,
    User,
    AtSign,
    MessageSquare,
    Mic,
} from 'lucide-react';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../utils/api.js';
import { translations } from '../utils/translations.js';

export default function Contact() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.2 });
    const [language, setLanguage] = useState('en');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [listeningField, setListeningField] = useState(null);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [contactInfo, setContactInfo] = useState({
        email: 'staragrofvp@gmail.com',
        phone: '+91 75175 13960',
        address: 'Shop No 1, LA Park, Plot No. 10, Valley of flowers,Sinnar,Tal-Sinnar, Dist.Nashik 422103, Maharashtra.',
        companyAddress: '',
    });

    useEffect(() => {
        const storedLanguage = localStorage.getItem('language') || 'en';
        setLanguage(storedLanguage);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window['SpeechRecognition'] || window['webkitSpeechRecognition'])) {
            setSpeechSupported(true);
        }
    }, []);

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const res = await api.get('/general-settings');
                const data = res.data;
                setContactInfo((prev) => ({
                    email: data?.company_email || prev.email,
                    phone: data?.company_phone || prev.phone,
                    address: data?.address || data?.location || prev.address,
                    companyAddress: data?.company_address || '',
                }));
            } catch (error) {
                console.error('Error fetching general settings:', error);
            }
        };

        fetchContactInfo();
    }, []);

    const t = translations[language] || translations.en;
    const contactT = t.contactPage || translations.en.contactPage;

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
            setFormData((prev) => ({
                ...prev,
                [fieldName]: fieldName === 'message' && prev.message
                    ? `${prev.message} ${transcript}`
                    : transcript,
            }));
        };
        recognition.onerror = () => setListeningField(null);
        recognition.onend = () => setListeningField(null);

        recognition.start();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post('/contact', formData);
            console.log('Message sent successfully:', response.data);
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
            });
            Swal.fire({
                icon: 'success',
                title: contactT.messageSentTitle || 'Message Sent',
                text: contactT.messageSentText || 'Thank you for reaching out. We will get back to you soon.',
                confirmButtonText: 'OK',
            });
        } catch (error) {
            console.error('Error sending message:', error);
            Swal.fire({
                icon: 'error',
                title: contactT.messageFailedTitle || 'Message Failed',
                text: error?.response?.data?.message || contactT.messageFailedText || 'Something went wrong while sending your message. Please try again.',
                confirmButtonText: 'OK',
            });
        }
    }

    return (
        <>

            <section className="relative w-full h-56 overflow-hidden ">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/media/about-hero.jpg')" }}
                ></div>
                <div className="absolute inset-0 bg-black/45"></div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5">
                    <div className="flex items-center gap-2 text-white/80 uppercase tracking-[2px] text-[11px] font-semibold">
                        <Link href="/" className="hover:underline">
                            {t.home}
                        </Link>
                        <span>/</span>
                        <span>{t.contact}</span>
                    </div>
                    <h1 className="text-white text-4xl md:text-5xl font-bold mt-3">{t.contact}</h1>
                </div>
            </section>
            <section ref={ref} className="relative min-h-screen bg-gradient-to-br from-[#f5fff3] via-white to-[#ecfff0] overflow-hidden py-16 px-4">

                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-green-200 rounded-full blur-3xl opacity-40"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-200 rounded-full blur-3xl opacity-40"></div>

                <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">

                    {/* LEFT SIDE */}
                    <motion.div
                        className="space-y-8"
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                        transition={{ duration: 0.6 }}
                    >

                        {/* Badge */}
                        <motion.div
                            className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Leaf size={16} />
                            {contactT.badge}
                        </motion.div>

                        {/* Heading */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                                {contactT.headingLine1} <br />
                                {contactT.headingLine2}
                            </h1>

                            <p className="mt-5 text-gray-600 text-lg leading-relaxed max-w-xl">
                                {contactT.description}
                            </p>
                        </motion.div>

                        {/* Contact Cards */}
                        <div className="grid sm:grid-cols-2 gap-5">

                            <motion.div
                                className="bg-white shadow-xl rounded-3xl p-5 border border-green-100 hover:-translate-y-1 transition-all"
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <motion.div
                                    className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4"
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
                                    transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
                                >
                                    <Mail className="text-green-600" size={22} />
                                </motion.div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {contactT.emailUs}
                                </h3>
                                <p className="text-gray-600 mt-1 text-sm">
                                    {contactInfo.email}
                                </p>
                            </motion.div>

                            <motion.div
                                className="bg-white shadow-xl rounded-3xl p-5 border border-green-100 hover:-translate-y-1 transition-all"
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <motion.div
                                    className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4"
                                    initial={{ scale: 0, rotate: 90 }}
                                    animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 90 }}
                                    transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 200 }}
                                >
                                    <Phone className="text-green-600" size={22} />
                                </motion.div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {contactT.callUs}
                                </h3>
                                <p className="text-gray-600 mt-1 text-sm">
                                    {contactInfo.phone}
                                </p>
                            </motion.div>

                            <motion.div
                                className="bg-white shadow-xl rounded-3xl p-5 border border-green-100 hover:-translate-y-1 transition-all"
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <motion.div
                                    className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4"
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
                                    transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
                                >
                                    <MapPin className="text-green-600" size={22} />
                                </motion.div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {contactT.location}
                                </h3>
                                <p className="text-gray-600 mt-1 text-sm">
                                    {contactInfo.address}
                                </p>
                                {contactInfo.companyAddress && (
                                    <>
                                        <h4 className="font-semibold text-sm text-gray-900 mt-3">
                                            {contactT.companyAddress}
                                        </h4>
                                        <p className="text-gray-600 mt-1 text-sm">
                                            {contactInfo.companyAddress}
                                        </p>
                                    </>
                                )}
                            </motion.div>

                            <motion.div
                                className="bg-white shadow-xl rounded-3xl p-5 border border-green-100 hover:-translate-y-1 transition-all"
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                transition={{ duration: 0.5, delay: 0.6 }}
                            >
                                <motion.div
                                    className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4"
                                    initial={{ scale: 0, rotate: 90 }}
                                    animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 90 }}
                                    transition={{ duration: 0.5, delay: 0.7, type: "spring", stiffness: 200 }}
                                >
                                    <Clock className="text-green-600" size={22} />
                                </motion.div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {contactT.workingHours}
                                </h3>
                                <p className="text-gray-600 mt-1 text-sm">
                                    {contactT.workingHoursText}
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* RIGHT SIDE FORM */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >

                        <motion.div
                            className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white rounded-[35px] p-8 md:p-10"
                            initial={{ scale: 0.95 }}
                            animate={isInView ? { scale: 1 } : { scale: 0.95 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >

                            {/* Form Heading */}
                            <motion.div
                                className="mb-8"
                                initial={{ opacity: 0, y: 15 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <motion.div
                                        className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center"
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                                        transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
                                    >
                                        <MessageSquare className="text-white" size={22} />
                                    </motion.div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {contactT.sendMessage}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {contactT.messageSubtitle}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* FORM */}
                            <form className="space-y-5" onSubmit={handleSubmit}>

                                {/* Name */}
                                <motion.div
                                    className="relative"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                >
                                    <User
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder={contactT.fullName}
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="w-full h-14 rounded-2xl border text-black border-gray-200 bg-gray-50 pl-12 pr-4 outline-none focus:border-green-500 focus:bg-white transition-all"
                                    />
                                </motion.div>

                                {/* Email */}
                                <motion.div
                                    className="relative"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                                    transition={{ duration: 0.5, delay: 0.55 }}
                                >
                                    <AtSign
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="email"
                                        placeholder={contactT.emailAddress}
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value,
                                            })
                                        }
                                        className="w-full h-14 rounded-2xl border text-black border-gray-200 bg-gray-50 pl-12 pr-4 outline-none focus:border-green-500 focus:bg-white transition-all"
                                    />
                                </motion.div>

                                {/* Phone */}
                                <motion.div
                                    className="relative"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                                    transition={{ duration: 0.5, delay: 0.6 }}
                                >
                                    <Phone
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="tel"
                                        placeholder={contactT.phoneNumber}
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value,
                                            })
                                        }
                                        className="w-full h-14 rounded-2xl border text-black border-gray-200 bg-gray-50 pl-12 pr-4 outline-none focus:border-green-500 focus:bg-white transition-all"
                                    />
                                </motion.div>

                                {/* Subject */}
                                <motion.div
                                    className="relative"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                                    transition={{ duration: 0.5, delay: 0.65 }}
                                >
                                    <MessageSquare
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="text"
                                        placeholder={contactT.subject}
                                        value={formData.subject}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                subject: e.target.value,
                                            })
                                        }
                                        className={`w-full h-14 rounded-2xl border text-black border-gray-200 bg-gray-50 pl-12 ${speechSupported ? 'pr-12' : 'pr-4'} outline-none focus:border-green-500 focus:bg-white transition-all`}
                                    />

                                    {speechSupported && (
                                        <button
                                            type="button"
                                            onClick={() => handleVoiceInput('subject')}
                                            aria-label="Voice input"
                                            title="Speak to fill this field"
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${listeningField === 'subject' ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-green-600'}`}
                                        >
                                            <Mic size={18} />
                                        </button>
                                    )}
                                </motion.div>

                                {/* Message */}
                                <motion.div
                                    className="relative"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                                    transition={{ duration: 0.5, delay: 0.7 }}
                                >
                                    <MessageSquare
                                        size={18}
                                        className="absolute left-4 top-5 text-gray-400"
                                    />

                                    <textarea
                                        rows="5"
                                        placeholder={contactT.messagePlaceholder}
                                        value={formData.message}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                message: e.target.value,
                                            })
                                        }
                                        className={`w-full rounded-2xl border text-black border-gray-200 bg-gray-50 pt-4 pl-12 ${speechSupported ? 'pr-12' : 'pr-4'} outline-none focus:border-green-500 focus:bg-white transition-all resize-none`}
                                    ></textarea>

                                    {speechSupported && (
                                        <button
                                            type="button"
                                            onClick={() => handleVoiceInput('message')}
                                            aria-label="Voice input"
                                            title="Speak to fill this field"
                                            className={`absolute right-4 top-5 transition-colors ${listeningField === 'message' ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-green-600'}`}
                                        >
                                            <Mic size={18} />
                                        </button>
                                    )}
                                </motion.div>

                                {/* Button */}
                                <motion.button
                                    type="submit"
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-lg hover:shadow-green-200"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                    transition={{ duration: 0.5, delay: 0.75 }}
                                >
                                    {contactT.sendMessage}
                                    <Send size={18} />
                                </motion.button>

                            </form>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

        </>
    );
}