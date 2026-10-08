'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mic, Camera, Image as ImageIcon, ListChecks } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const SERVICE_TYPE_VALUES = ['Transport', 'machine', 'Labour', 'Guidance'];

const PRICE_UNITS_BY_TYPE = {
    Transport: ['Per km', 'Per trip', 'Per day'],
    machine: ['Per day', 'Per hour', 'Per task'],
    Labour: ['Per day', 'Per hour', 'Per task'],
    Guidance: ['Per visit', 'Per hour', 'Per consultation'],
};

const emptyForm = {
    service_type: 'Transport',
    name: '',
    description: '',
    price: '',
    price_unit: 'Per km',
    contact_number: '',
    coverage_area: '',
    image: null,
    video: null,
};

function AddServicesForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editingId = searchParams.get('id');
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const [imageProcessing, setImageProcessing] = useState(false);
    const [language, setLanguage] = useState('en');
    const [initializing, setInitializing] = useState(Boolean(editingId));
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [imagePreview, setImagePreview] = useState('');
    const [videoPreview, setVideoPreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [listeningField, setListeningField] = useState(null);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [documentStatus, setDocumentStatus] = useState(null);
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const recaptchaWidgetId = useRef(null);

    useEffect(() => {
        const lang = localStorage.getItem('language') || 'en';
        setLanguage(lang);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            setSpeechSupported(true);
        }
    }, []);

    useEffect(() => {
        if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined' || editingId) return;

        window.onServicesRecaptchaSuccess = (token) => setRecaptchaToken(token);
        window.onServicesRecaptchaExpired = () => setRecaptchaToken('');

        const renderWidget = () => {
            if (window.grecaptcha?.render && recaptchaWidgetId.current === null) {
                recaptchaWidgetId.current = window.grecaptcha.render('services-recaptcha-container', {
                    sitekey: RECAPTCHA_SITE_KEY,
                    callback: window.onServicesRecaptchaSuccess,
                    'expired-callback': window.onServicesRecaptchaExpired,
                });
            }
        };

        if (window.grecaptcha?.render) {
            renderWidget();
            return;
        }

        window.onServicesRecaptchaApiLoad = renderWidget;

        if (!document.getElementById('recaptcha-script')) {
            const script = document.createElement('script');
            script.id = 'recaptcha-script';
            script.src = 'https://www.google.com/recaptcha/api.js?onload=onServicesRecaptchaApiLoad&render=explicit';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }
    }, [editingId]);

    useEffect(() => {
        const fetchUserAddress = async () => {
            try {
                const response = await api.get('/user/me');
                const user = response.data?.user || {};
                const locationParts = [user.village, user.taluka, user.district, user.state].filter(Boolean);
                const address = user.address || locationParts.join(', ');
                setUserAddress(address);
                setDocumentStatus(user.document_status || 'Pending');
                if (!editingId) {
                    setFormData((prev) => (prev.coverage_area ? prev : { ...prev, coverage_area: address }));
                }
            } catch (error) {
                try {
                    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const locationParts = [storedUser.village, storedUser.taluka, storedUser.district, storedUser.state].filter(Boolean);
                    setUserAddress(storedUser.address || locationParts.join(', '));
                    setDocumentStatus(storedUser.document_status || 'Pending');
                } catch (storageError) {
                    console.error('Error loading user address:', error);
                }
            }
        };

        fetchUserAddress();
    }, [editingId]);

    useEffect(() => {
        if (!editingId) return;
        const fetchServiceForEdit = async () => {
            try {
                setInitializing(true);
                const response = await api.get(`/services/${editingId}`);
                const service = response.data;
                setFormData({
                    service_type: service.service_type || 'Transport',
                    name: service.name || '',
                    description: service.description || '',
                    price: service.price ?? '',
                    price_unit: service.price_unit || '',
                    contact_number: service.contact_number || '',
                    coverage_area: service.coverage_area || '',
                    image: service.image_url || null,
                    video: service.video_url || null,
                });
                setImagePreview(getImagePreviewUrl(service.image_url || ''));
                setVideoPreview(getImagePreviewUrl(service.video_url || ''));
            } catch (error) {
                console.error('Error fetching service:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Load Failed',
                    text: error?.response?.data?.message || 'Could not load the service to edit.',
                    confirmButtonText: 'OK',
                }).then(() => router.push('/user/my-services'));
            } finally {
                setInitializing(false);
            }
        };
        fetchServiceForEdit();
    }, [editingId]);

    const t = translations[language];
    const sp = t?.userPanel?.servicesProvider;

    const isDocumentVerified = String(documentStatus).toLowerCase() === 'verified';

    const requireVerifiedDocument = () => {
        if (isDocumentVerified) return true;
        Swal.fire({
            icon: 'warning',
            title: t?.profileIncompleteTitle || 'Complete Your Profile',
            text: sp?.documentNotVerifiedText || 'Your document is not verified yet. Please upload/verify your document on your profile before adding a service.',
            confirmButtonText: sp?.goToProfile || 'Go to Profile',
            showCancelButton: true,
            cancelButtonText: t?.swal?.cancelButton || 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                router.push('/user/profile');
            }
        });
        return false;
    };

    const SERVICE_TYPE_LABELS = {
        machine: sp?.machineProvider || 'Machine[Tractor/harvester] Provider',
        Transport: sp?.transportProvider || 'Transport Provider',
        Labour: sp?.labourProvider || 'Labour Provider',
        Guidance: sp?.guidanceProvider || 'Crop Guidance/Advice',
    };

    const getServiceTypeLabel = (value) => SERVICE_TYPE_LABELS[value] || value;
    const getPriceUnitLabel = (value) => sp?.priceUnits?.[value] || value;

    const getSpeechLang = () => {
        if (typeof window === 'undefined') return 'en-IN';
        const lang = localStorage.getItem('language') || 'en';
        const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
        return langMap[lang] || 'en-IN';
    };

    const handleVoiceInput = (fieldName) => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
                [fieldName]: prev[fieldName] ? `${prev[fieldName]} ${transcript}` : transcript,
            }));
        };
        recognition.onerror = () => setListeningField(null);
        recognition.onend = () => setListeningField(null);

        recognition.start();
    };

    const getImagePreviewUrl = (value) => {
        if (value instanceof File) return URL.createObjectURL(value);
        if (typeof value === 'string' && value.trim()) {
            const trimmed = value.trim();
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
            return `${IMAGE_BASE_URL || ''}${normalizedPath}`;
        }
        return '';
    };

    const MAX_IMAGE_SIZE = 500 * 1024;

    const compressImageFile = (file, maxSizeBytes, maxDimension = 1600) => {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);

                const renderAtDimension = (dimension) => {
                    let { width, height } = img;
                    if (width > dimension || height > dimension) {
                        if (width >= height) {
                            height = Math.round((height * dimension) / width);
                            width = dimension;
                        } else {
                            width = Math.round((width * dimension) / height);
                            height = dimension;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const tryQuality = (quality) => {
                        canvas.toBlob((blob) => {
                            if (!blob) {
                                reject(new Error('Image compression failed'));
                                return;
                            }
                            if (blob.size <= maxSizeBytes || quality <= 0.4) {
                                if (blob.size > maxSizeBytes && dimension > 500) {
                                    renderAtDimension(Math.round(dimension * 0.75));
                                    return;
                                }
                                const compressedName = file.name.replace(/\.[^./\\]+$/, '') + '.jpg';
                                resolve(new File([blob], compressedName, { type: 'image/jpeg' }));
                            } else {
                                tryQuality(quality - 0.15);
                            }
                        }, 'image/jpeg', quality);
                    };
                    tryQuality(0.85);
                };

                renderAtDimension(maxDimension);
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image for compression'));
            };

            img.src = objectUrl;
        });
    };

    const handleInputChange = async (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file' && name === 'image') {
            let file = files?.[0] || null;

            if (file && file.size > MAX_IMAGE_SIZE) {
                setImageProcessing(true);
                try {
                    file = await compressImageFile(file, MAX_IMAGE_SIZE);
                } catch (compressionError) {
                    console.error('Image compression failed:', compressionError);
                } finally {
                    setImageProcessing(false);
                }

                if (file && file.size > MAX_IMAGE_SIZE) {
                    Swal.fire({
                        icon: 'error',
                        title: t?.swal?.imageTooLargeTitle || 'Image Too Large',
                        text: t?.swal?.imageTooLargeText || 'Image size must be 500 KB or less.',
                        confirmButtonText: t?.swal?.okButton || 'OK',
                    });
                    e.target.value = '';
                    return;
                }
            }

            setFormData((prev) => ({ ...prev, image: file }));
            setImagePreview(file ? getImagePreviewUrl(file) : '');
            return;
        }

        if (type === 'file') {
            const file = files?.[0] || null;
            setFormData((prev) => ({ ...prev, video: file }));
            setVideoPreview(file ? getImagePreviewUrl(file) : '');
            return;
        }

        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'service_type') {
                updated.price_unit = PRICE_UNITS_BY_TYPE[value]?.[0] || '';
            }
            return updated;
        });
        setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.service_type) errors.service_type = 'Service type is required.';
        if (!formData.name.trim()) errors.name = 'Service name is required.';
        if (!formData.contact_number.trim()) errors.contact_number = 'Contact number is required.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingId && !requireVerifiedDocument()) return;
        if (!validateForm()) return;

        if (!editingId && RECAPTCHA_SITE_KEY && !recaptchaToken) {
            Swal.fire({
                icon: 'error',
                title: t?.swal?.saveFailedTitle || 'Save Failed',
                text: t?.registerForm?.recaptchaRequired || 'Please verify you are not a robot',
                confirmButtonText: t?.swal?.okButton || 'OK',
            });
            return;
        }

        setSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('service_type', formData.service_type);
            payload.append('name', formData.name);
            payload.append('description', formData.description);
            payload.append('price', formData.price);
            payload.append('price_unit', formData.price_unit);
            payload.append('contact_number', formData.contact_number);
            payload.append('coverage_area', formData.coverage_area);
            if (!editingId) {
                payload.append('recaptchaToken', recaptchaToken);
            }
            if (formData.image instanceof File) {
                payload.append('image', formData.image);
            }
            if (formData.video instanceof File) {
                payload.append('video', formData.video);
            }

            if (editingId) {
                await api.put(`/services/${editingId}`, payload);
            } else {
                await api.post('/services', payload);
            }

            const wasEditing = Boolean(editingId);
            await Swal.fire({
                icon: 'success',
                title: wasEditing ? (sp?.updatedTitle || 'Updated Successfully') : (sp?.submittedTitle || 'Submitted Successfully'),
                text: wasEditing
                    ? (sp?.updatedText || 'Your service has been updated and sent for approval.')
                    : (sp?.submittedText || 'Your service has been submitted. It will be visible once approved by admin.'),
                confirmButtonText: t?.swal?.okButton || 'OK',
            });
            router.push('/user/my-services');
        } catch (err) {
            const backendMessage = err?.response?.data?.message || err.message || 'Error saving service';
            const isProfileIncomplete = err?.response?.status === 403
                && (err?.response?.data?.code === 'PROFILE_INCOMPLETE' || /complete your profile|upload your document/i.test(backendMessage));
            if (typeof window !== 'undefined' && window.grecaptcha?.reset && recaptchaWidgetId.current !== null) {
                window.grecaptcha.reset(recaptchaWidgetId.current);
            }
            setRecaptchaToken('');
            await Swal.fire({
                icon: 'error',
                title: isProfileIncomplete ? (t?.profileIncompleteTitle || 'Complete Your Profile') : (t?.swal?.saveFailedTitle || 'Save Failed'),
                text: isProfileIncomplete ? (t?.profileIncompleteMessage || backendMessage) : backendMessage,
                confirmButtonText: t?.swal?.okButton || 'OK',
            });
            if (isProfileIncomplete) router.push('/user/profile');
            console.error('Error saving service:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (initializing) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/60">
            <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-0">
                {documentStatus !== null && !isDocumentVerified && !editingId && (
                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                        <span>{sp?.documentNotVerifiedText || 'Your document is not verified yet. Please upload your document on your profile before adding a service.'}</span>
                        <button
                            type="button"
                            onClick={() => router.push('/user/profile')}
                            className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-amber-700 transition"
                        >
                            {sp?.goToProfile || 'Go to Profile'}
                        </button>
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60 sm:rounded-3xl">
                    <div className="relative overflow-hidden border-b border-emerald-500/20 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-5 py-6 text-white sm:px-8 sm:py-8">
                        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                                    {editingId ? 'Update your service' : 'Create a new service'}
                                </p>
                                <h2 className="text-xl font-bold sm:text-3xl">
                                    {editingId ? (sp?.editService || 'Edit Service') : (sp?.addService || 'Add Service')}
                                </h2>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50">
                                    {sp?.subtitle || 'Add transport, labour or crop-guidance services you offer to other farmers.'}
                                </p>
                            </div>
                            <div className="w-fit rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                                {editingId ? 'Edit service' : 'New service'}
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSubmit} className="space-y-5 bg-slate-50/70 p-2 sm:space-y-6 ">
                        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6">
                            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <ListChecks size={18} />
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">Service details</h3>
                                    <p className="mt-1 text-sm text-slate-500">Choose a service type — the price unit options change based on your choice.</p>
                                </div>
                            </div>

                            {/* Service Type */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    {sp?.serviceType || 'Service Type'} <span className="text-red-600">*</span>
                                </label>
                                <select
                                    name="service_type"
                                    value={formData.service_type}
                                    onChange={handleInputChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                >
                                    {SERVICE_TYPE_VALUES.map((value) => (
                                        <option key={value} value={value}>{getServiceTypeLabel(value)}</option>
                                    ))}
                                </select>
                                {formErrors.service_type && (
                                    <p className="mt-2 text-xs text-red-600">{formErrors.service_type}</p>
                                )}
                            </div>

                            {/* Service Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    {sp?.serviceName || 'Service Name'} <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={sp?.serviceNamePlaceholder || 'e.g. Mini Truck Transport, Field Labour Team, Crop Advisory'}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                                {formErrors.name && (
                                    <p className="mt-2 text-xs text-red-600">{formErrors.name}</p>
                                )}
                            </div>

                            {/* Price and Unit */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        {sp?.price || 'Price'} (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        {sp?.unit || 'Unit'}
                                    </label>
                                    <select
                                        name="price_unit"
                                        value={formData.price_unit}
                                        onChange={handleInputChange}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        {(PRICE_UNITS_BY_TYPE[formData.service_type] || []).map((unit) => (
                                            <option key={unit} value={unit}>{getPriceUnitLabel(unit)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Contact Number and Coverage Area */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        {sp?.contactNumber || 'Contact Number'} <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_number"
                                        value={formData.contact_number}
                                        onChange={handleInputChange}
                                        placeholder={sp?.contactNumberPlaceholder || '10-digit mobile number'}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                    {formErrors.contact_number && (
                                        <p className="mt-2 text-xs text-red-600">{formErrors.contact_number}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        {sp?.coverageArea || 'Coverage Area'}
                                    </label>
                                    <input
                                        type="text"
                                        name="coverage_area"
                                        value={formData.coverage_area}
                                        onChange={handleInputChange}
                                        placeholder={sp?.coverageAreaPlaceholder || 'e.g. Village / Taluka / District you serve'}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="relative">
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    {sp?.description || 'Description'}
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder={sp?.descriptionPlaceholder || 'Describe your service, experience, equipment, etc.'}
                                    rows="4"
                                    className={`w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 ${speechSupported ? 'pr-12' : ''} text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none`}
                                />
                                {speechSupported && (
                                    <button
                                        type="button"
                                        onClick={() => handleVoiceInput('description')}
                                        aria-label="Voice input"
                                        title="Speak to fill description"
                                        className={`absolute right-4 bottom-4 transition-colors ${listeningField === 'description' ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-emerald-600'}`}
                                    >
                                        <Mic size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Photo */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    {sp?.photo || 'Photo'}
                                </label>
                                <div className="flex items-center gap-5">
                                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-emerald-200 bg-slate-100">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Service preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-slate-400">
                                                No image selected
                                            </div>
                                        )}
                                        {imageProcessing && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        name="image"
                                        onChange={handleInputChange}
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                    />
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        name="image"
                                        onChange={handleInputChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => cameraInputRef.current?.click()}
                                            disabled={imageProcessing}
                                            title={imageProcessing ? 'Image process ho rahi hai...' : 'Camera se lein'}
                                            className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm transition hover:bg-emerald-100 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {imageProcessing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => galleryInputRef.current?.click()}
                                            disabled={imageProcessing}
                                            title={imageProcessing ? 'Image process ho rahi hai...' : 'Gallery se chunein'}
                                            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 shadow-sm transition hover:bg-slate-100 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {imageProcessing ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                                        </button>
                                    </div>
                                </div>
                                {imageProcessing && (
                                    <p className="mt-2 text-xs text-slate-500">Image compress ho rahi hai, thoda ruko...</p>
                                )}
                                {formData.image instanceof File && (
                                    <p className="mt-2 text-sm text-emerald-600">📁 {formData.image.name}</p>
                                )}
                            </div>

                            {/* Video */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">Video</label>
                                <div className="space-y-3">
                                    {videoPreview && (
                                        <video
                                            src={videoPreview}
                                            controls
                                            className="max-h-56 w-full rounded-2xl border border-slate-200 bg-black object-contain"
                                        />
                                    )}
                                    <input
                                        type="file"
                                        name="video"
                                        onChange={handleInputChange}
                                        accept="video/*"
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200"
                                    />
                                </div>
                                {formData.video instanceof File && (
                                    <p className="mt-2 text-sm text-emerald-600">{formData.video.name}</p>
                                )}
                            </div>

                            {/* reCAPTCHA */}
                            {!editingId && RECAPTCHA_SITE_KEY && (
                                <div id="services-recaptcha-container" className="flex justify-center sm:justify-start" />
                            )}
                        </section>

                        {/* Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4 justify-end">
                            <button
                                type="button"
                                onClick={() => router.push('/user/my-services')}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm sm:text-base"
                            >
                                {sp?.cancel || 'Cancel'}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-lg transition text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <span className="inline-flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {editingId ? 'Updating...' : 'Creating...'}
                                    </span>
                                ) : (
                                    editingId ? (sp?.updateService || 'Update Service') : (sp?.addService || 'Add Service')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function AddServices() {
    return (
        <Suspense fallback={(
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
            </div>
        )}>
            <AddServicesForm />
        </Suspense>
    );
}
