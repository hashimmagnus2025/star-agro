'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    BriefcaseBusiness,
    MapPin,
    Tag,
    User,
    Play,
    HelpCircle,
    X,
    Mail,
    Phone,
    Mic,
    Send,
    ChevronRight,
    Star,
} from 'lucide-react';
import api from '../../utils/api.js';
import Swal from 'sweetalert2';
import { translations } from '../../utils/translations.js';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '';

const getMediaUrl = (value) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `${IMAGE_BASE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
};

const typeStyles = {
    Transport: 'bg-sky-50 text-sky-700 border-sky-200',
    machine: 'bg-violet-50 text-violet-700 border-violet-200',
    Labour: 'bg-amber-50 text-amber-700 border-amber-200',
    Guidance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function ServiceDetailsPage() {
    const { serviceId } = useParams();
    const router = useRouter();
    const [service, setService] = useState(null);
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [ownerInfo, setOwnerInfo] = useState(null);
    const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [listeningField, setListeningField] = useState(null);
    const [speechSupported, setSpeechSupported] = useState(false);
    const modalRef = useRef(null);
    const t = translations[language]?.serviceDetails || translations.en.serviceDetails;
    const [advertisements, setAdvertisements] = useState([]);
    const [verticalAdvertisements, setVerticalAdvertisements] = useState([]);

    useEffect(() => {
        setLanguage(localStorage.getItem('language') || 'en');
    }, []);

    useEffect(() => {
        const fetchAdvertisements = async () => {
            try {
                const response = await api.get('/advertisements/active');
                const ads = Array.isArray(response.data) ? response.data : [];
                setAdvertisements(ads.filter((ad) => ad.image_size === '940x235'));
                setVerticalAdvertisements(ads.filter((ad) => ad.image_size === '235x470'));
            } catch (err) {
                console.error('Error fetching advertisements:', err);
            }
        };
        fetchAdvertisements();
    }, []);

    const getTypeLabel = (value) => t.types?.[value] || value || t.serviceType;

    useEffect(() => {
        if (typeof window !== 'undefined' && (window['SpeechRecognition'] || window['webkitSpeechRecognition'])) {
            setSpeechSupported(true);
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
            setInquiryForm((prev) => ({
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

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        try {
            const parsedUser = JSON.parse(storedUser);
            const fullName =
                [parsedUser?.first_name, parsedUser?.last_name]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || parsedUser?.name || '';

            setCurrentUserId(parsedUser?.id ?? null);

            setInquiryForm((prev) => ({
                ...prev,
                name: prev.name || fullName,
                email: prev.email || parsedUser?.email || '',
                phone:
                    prev.phone ||
                    parsedUser?.phone ||
                    parsedUser?.phone_number ||
                    parsedUser?.mobile ||
                    '',
            }));
        } catch (error) {
            console.error('Error parsing stored user:', error);
        }
    }, []);

    useEffect(() => {
        if (!serviceId) return;

        const fetchService = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await api.get(`/services/${serviceId}`);
                const serviceData = response.data || null;
                setService(serviceData);

                const ownerUserId = serviceData?.user_id;
                if (ownerUserId) {
                    try {
                        const ownerRes = await api.get(`/user/${ownerUserId}`);
                        setOwnerInfo(ownerRes.data || null);
                    } catch (ownerError) {
                        console.error('Error fetching owner details:', ownerError);
                        setOwnerInfo(null);
                    }
                } else {
                    setOwnerInfo(null);
                }
            } catch (fetchError) {
                console.error('Error fetching service:', fetchError);
                setError(fetchError?.response?.data?.message || 'Unable to load this service right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [serviceId]);

    const isOwnListing =
        currentUserId !== null &&
        service?.user_id !== undefined &&
        service?.user_id !== null &&
        String(currentUserId) === String(service.user_id);

    const handleInquiry = () => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        if (isOwnListing) {
            Swal.fire({
                icon: 'info',
                title: t.ownListingTitle,
                text: t.ownListingText,
                confirmButtonText: translations[language]?.swal?.okButton || 'OK',
            });
            return;
        }

        setShowInquiryModal(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseModal = () => {
        setShowInquiryModal(false);
        document.body.style.overflow = 'auto';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInquiryForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const handleInquirySubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/service-inquiries', {
                service_id: serviceId,
                name: inquiryForm.name,
                email: inquiryForm.email,
                phone: inquiryForm.phone,
                message: inquiryForm.message,
            });
            handleCloseModal();
            Swal.fire({
                icon: 'success',
                title: t.inquirySentTitle,
                text: t.inquirySentMessage,
                confirmButtonText: translations[language]?.swal?.okButton || 'OK',
            });
        } catch (submitError) {
            console.error('Error submitting inquiry:', submitError);
            Swal.fire({
                icon: 'error',
                title: t.inquiryFailedTitle,
                text: submitError?.response?.data?.message || t.inquiryFailedMessage,
                confirmButtonText: translations[language]?.swal?.okButton || 'OK',
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                handleCloseModal();
            }
        };

        if (showInquiryModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showInquiryModal]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="text-sm font-medium text-green-700">{t.loading}</div>
            </main>
        );
    }

    if (error || !service) {
        return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-amber-50 to-orange-50 px-6 text-center">
                <BriefcaseBusiness className="text-emerald-500" size={48} />
                <h1 className="text-xl font-bold text-slate-900">{error || t.notFound}</h1>
                <Link
                    href="/service-hub"
                    className="rounded-full bg-[#3B5C43] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2C4232]"
                >
                    {t.back} {t.serviceHub}
                </Link>
            </main>
        );
    }

    const imageUrl = getMediaUrl(service.image_url);
    const videoUrl = getMediaUrl(service.video_url);
    const badgeClass = typeStyles[service.service_type] || 'bg-slate-50 text-slate-700 border-slate-200';
    const ownerDisplayName = ownerInfo
        ? ownerInfo.name || `${ownerInfo.first_name || ''} ${ownerInfo.last_name || ''}`.trim() || 'N/A'
        : service.provider_name || 'Not available';

    return (
        <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-amber-50/50 font-sans">
            <div className="sticky top-0 z-40 border-b border-amber-100/50 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <button type="button" onClick={() => router.back()} className="group flex items-center gap-2 text-gray-600 transition hover:text-amber-600">
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        <span className="font-medium">{t.back}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleInquiry}
                        disabled={isOwnListing}
                        title={isOwnListing ? 'This is your own listing' : undefined}
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${isOwnListing
                            ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                            : 'bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-500'
                            }`}
                    >
                        {t.inquiry}
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    <div className="space-y-4 lg:col-span-4">
                        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-amber-100/50">
                            <div className="relative aspect-[4/3] w-full">
                                {imageUrl ? <img src={imageUrl} alt={service.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-600"><BriefcaseBusiness size={56} /></div>}
                                <span className={`absolute left-4 top-4 rounded-full border px-3 py-1.5 text-xs font-bold ${badgeClass}`}>{getTypeLabel(service.service_type)}</span>
                            </div>
                            {videoUrl && <div className="border-t border-gray-100 p-4"><p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700"><Play size={14} className="text-emerald-600" /> {t.serviceVideo}</p><video src={videoUrl} controls className="w-full rounded-2xl bg-black" /></div>}
                        </div>
                    </div>

                    <div className="space-y-6 lg:col-span-5">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Link href="/" className="hover:text-amber-600">{t.home}</Link><span>›</span><Link href="/service-hub" className="hover:text-amber-600">{t.serviceHub}</Link><span>›</span><span className="max-w-[180px] truncate text-gray-600">{service.name}</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold leading-tight text-gray-800 sm:text-4xl">{service.name}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5"><MapPin size={15} /> {service.coverage_area || t.areaNotSpecified}</span>
                                <span className="h-5 w-px bg-gray-200" />
                                <span className="flex items-center gap-1.5"><User size={15} /> {service.provider_name || t.providerDefault}</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-3"><span className="text-4xl font-bold text-green-600">{service.price ? `Rs. ${service.price}` : t.onRequest}</span>{service.price && <span className="mb-1 text-sm text-gray-400">{service.price_unit || t.serviceType}</span>}</div>
                        <div className="border-b border-gray-200"><div className="flex gap-6">
                            {[{ key: 'description', label: t.description }, { key: 'details', label: t.details }, { key: 'provider', label: t.provider }].map((tab) => <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`relative py-3 text-sm font-medium ${activeTab === tab.key ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>{tab.label}{activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />}</button>)}
                        </div></div>
                        <div className="min-h-[150px]">
                            {activeTab === 'description' && <p className="leading-relaxed text-gray-600">{service.description || t.noDescription}</p>}
                            {activeTab === 'details' && <div className="grid grid-cols-2 gap-4 text-sm"><div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-400">{t.serviceType}</p><p className="font-semibold text-gray-800">{getTypeLabel(service.service_type)}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-400">{t.coverageArea}</p><p className="font-semibold text-gray-800">{service.coverage_area || t.areaNotSpecified}</p></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-gray-400">{t.priceUnit}</p><p className="font-semibold text-gray-800">{service.price_unit || t.onRequest}</p></div></div>}
                            {activeTab === 'provider' && (
                                service?.user_id ? (
                                    <Link
                                        href={`/seller/${service.user_id}`}
                                        className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-md transition-all hover:border-green-300 hover:shadow-lg"
                                    >
                                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-xl font-bold text-white shadow-lg shadow-green-300">
                                            {ownerDisplayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-bold text-gray-800 transition-colors group-hover:text-green-600">
                                                {ownerDisplayName}
                                            </h3>
                                            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-400">
                                                <Star size={13} />
                                                {t.viewProfileHint || 'View profile, listings & reviews'}
                                            </p>
                                        </div>
                                        <ChevronRight
                                            size={20}
                                            className="flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-green-500"
                                        />
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
                                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-xl font-bold text-white shadow-lg shadow-green-300">
                                            {ownerDisplayName.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="font-bold text-gray-800">{ownerDisplayName}</p>
                                    </div>
                                )
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleInquiry}
                            disabled={isOwnListing}
                            title={isOwnListing ? 'This is your own listing' : undefined}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-bold shadow-xl transition ${isOwnListing
                                ? 'cursor-not-allowed bg-gray-200 text-gray-400 shadow-none'
                                : 'bg-green-600 text-white shadow-green-200 hover:scale-[1.02] hover:bg-green-500'
                                }`}
                        >
                            <HelpCircle size={20} />
                            {t.inquiry}
                        </button>
                    </div>

                    {verticalAdvertisements.length > 0 && (
                        <div className="hidden lg:block lg:col-span-3">
                            <div className="sticky top-24 flex justify-center">
                                <div className="w-[235px] overflow-hidden rounded-[26px] shadow-xl shadow-amber-100/60 ring-1 ring-gray-100">
                                    <Swiper
                                        modules={[Autoplay, Pagination]}
                                        direction="vertical"
                                        slidesPerView={1}
                                        spaceBetween={8}
                                        autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                                        pagination={{ clickable: true }}
                                        loop={verticalAdvertisements.length > 1}
                                        className="h-[470px] w-[235px]"
                                    >
                                        {verticalAdvertisements.map((ad) => (
                                            <SwiperSlide key={ad.id} className="overflow-hidden rounded-[26px]">
                                                <img
                                                    src={getMediaUrl(ad.image)}
                                                    alt={ad.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {advertisements.length > 0 && (
                <section className="mx-auto my-10 aspect-[940/235] w-full max-w-[940px] overflow-hidden rounded-3xl shadow-lg shadow-gray-200">
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        pagination={{ clickable: true }}
                        loop={advertisements.length > 1}
                        className="h-full w-full"
                    >
                        {advertisements.map((ad) => (
                            <SwiperSlide key={ad.id}>
                                <img
                                    src={getMediaUrl(ad.image)}
                                    alt={ad.title}
                                    className="h-full w-full object-cover"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}

            {showInquiryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div
                        ref={modalRef}
                        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
                    >
                        <div className="relative bg-gradient-to-r from-green-600 to-green-500 px-6 py-5">
                            <button
                                onClick={handleCloseModal}
                                className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
                            >
                                <X size={18} />
                            </button>
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                                    <HelpCircle size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{t.inquiryModalTitle}</h2>
                                    <p className="text-sm text-white/80">
                                        {t.forLabel} <span className="font-semibold">{service.name}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleInquirySubmit} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                            {t.fullName} <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder={t.yourName}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-black outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                                name="name"
                                                value={inquiryForm.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                            {t.phone} <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                placeholder={t.yourPhone}
                                                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-black outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                                name="phone"
                                                value={inquiryForm.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                        {t.emailAddress} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder={t.yourEmail}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-black outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                            name="email"
                                            value={inquiryForm.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">{t.message}</label>
                                    <div className="relative">
                                        <textarea
                                            rows={4}
                                            placeholder={t.messagePlaceholder.replace('{name}', service.name)}
                                            className={`w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-black outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200 ${speechSupported ? 'pr-12' : ''}`}
                                            name="message"
                                            value={inquiryForm.message}
                                            onChange={handleInputChange}
                                        />
                                        {speechSupported && (
                                            <button
                                                type="button"
                                                onClick={() => handleVoiceInput('message')}
                                                aria-label="Voice input"
                                                title="Speak to fill this field"
                                                className={`absolute right-3.5 top-4 transition-colors ${listeningField === 'message' ? 'animate-pulse text-red-500' : 'text-gray-400 hover:text-amber-600'}`}
                                            >
                                                <Mic size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 rounded-xl border border-gray-200 py-3.5 font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-semibold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-500"
                                    >
                                        <Send size={17} />
                                        {t.sendInquiry}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
