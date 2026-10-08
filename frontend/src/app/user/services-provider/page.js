'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, X, Loader2, Mic, Camera, Image as ImageIcon, ShieldAlert } from 'lucide-react';
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

export default function ServicesProviderPage() {
  const router = useRouter();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  // The recaptcha container only exists in the DOM while the add/edit modal is open,
  // so the widget has to be (re-)rendered whenever the modal opens rather than once on mount.
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined' || !showModal || editingId) return;

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
  }, [showModal, editingId]);

  useEffect(() => {
    const fetchUserAddress = async () => {
      try {
        const response = await api.get('/user/me');
        const user = response.data?.user || {};
        const locationParts = [user.village, user.taluka, user.district, user.state].filter(Boolean);
        setUserAddress(user.address || locationParts.join(', '));
        setDocumentStatus(user.document_status || 'Pending');
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
  }, []);

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

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (showModal && !editingId && userAddress && !formData.coverage_area) {
      setFormData((previous) => ({ ...previous, coverage_area: userAddress }));
    }
  }, [showModal, editingId, userAddress, formData.coverage_area]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services/my-services');
      setServices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ ...emptyForm, coverage_area: userAddress });
    setFormErrors({});
    setImagePreview('');
    setVideoPreview('');
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

  // Resizes/re-encodes an oversized image in the browser (canvas) so camera photos
  // (often 5-15MB straight off the sensor) fit under MAX_IMAGE_SIZE without the user
  // having to manually shrink them. Steps dimension down too, since quality alone
  // often can't reach a small target like 500KB on a detailed high-res photo.
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

      await fetchServices();
      const wasEditing = Boolean(editingId);
      resetForm();
      setEditingId(null);
      setShowModal(false);
      recaptchaWidgetId.current = null;
      setRecaptchaToken('');
      Swal.fire({
        icon: 'success',
        title: wasEditing ? (sp?.updatedTitle || 'Updated Successfully') : (sp?.submittedTitle || 'Submitted Successfully'),
        text: wasEditing
          ? (sp?.updatedText || 'Your service has been updated and sent for approval.')
          : (sp?.submittedText || 'Your service has been submitted. It will be visible once approved by admin.'),
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
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

  const handleEdit = (service) => {
    setEditingId(service.id);
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
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t?.swal?.deleteConfirmTitle || 'Are you sure?',
      text: t?.swal?.deleteConfirmText || 'This service will be permanently deleted.',
      showCancelButton: true,
      confirmButtonText: t?.swal?.deleteConfirmButton || 'Yes, delete it',
      cancelButtonText: t?.swal?.cancelButton || 'Cancel',
      confirmButtonColor: '#d33',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((service) => service.id !== id));
      Swal.fire({ icon: 'success', title: t?.swal?.deletedTitle || 'Deleted', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t?.swal?.deleteFailedTitle || 'Delete Failed',
        text: err?.response?.data?.message || 'Error deleting service',
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    resetForm();
    recaptchaWidgetId.current = null;
    setRecaptchaToken('');
  };

  const statusBadgeClass = (status) =>
    String(status).toLowerCase() === 'approved'
      ? 'bg-emerald-100 text-emerald-700'
      : String(status).toLowerCase() === 'rejected'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700';

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6 lg:p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{sp?.title || 'Services Provider'}</h2>
            <p className="text-sm text-slate-500">{sp?.subtitle || 'Add transport, labour or crop-guidance services you offer to other farmers.'}</p>
          </div>
          <button
            onClick={() => { if (!requireVerifiedDocument()) return; resetForm(); setEditingId(null); setShowModal(true); }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold hover:shadow-lg transition text-sm sm:text-base"
          >
            <Plus size={18} />
            <span>{sp?.addService || 'Add Service'}</span>
          </button>
        </div>

        {documentStatus !== null && !isDocumentVerified && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 sm:px-6 py-3 sm:py-4 text-amber-800">
            <ShieldAlert size={20} className="shrink-0" />
            <p className="text-sm flex-1">
              {sp?.documentNotVerifiedText || 'Your document is not verified yet. Please upload your  document [RC Book/Degree/Certificate] on your profile before adding a service.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/user/profile')}
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-amber-700 transition"
            >
              {sp?.goToProfile || 'Go to Profile'}
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">{t?.loading || 'Loading...'}</div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-4">{sp?.noServicesYet || 'No services added yet'}</p>
              <button
                onClick={() => { if (!requireVerifiedDocument()) return; resetForm(); setEditingId(null); setShowModal(true); }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
              >
                <Plus size={20} />
                {sp?.addService || 'Add Service'}
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.name || 'Name'}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.type || 'Type'}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.price || 'Price'}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.contact || 'Contact'}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.area || 'Area'}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.status || 'Status'}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{sp?.action || 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service, index) => (
                  <tr key={service.id} className={`border-b border-slate-200 hover:bg-slate-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{service.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getServiceTypeLabel(service.service_type)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.price ? `₹${service.price} ${getPriceUnitLabel(service.price_unit || '')}` : '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.contact_number || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{service.coverage_area || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(service.status)}`}>
                        {service.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEdit(service)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition" title={sp?.edit || 'Edit'}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(service.id)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition" title={sp?.delete || 'Delete'}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-1 sm:col-span-2 text-center py-8 text-slate-500">{t?.loading || 'Loading...'}</div>
          ) : services.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 text-center py-8">
              <p className="text-slate-500 mb-4">{sp?.noServicesYet || 'No services added yet'}</p>
              <button
                onClick={() => { if (!requireVerifiedDocument()) return; resetForm(); setEditingId(null); setShowModal(true); }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold hover:bg-emerald-700 transition text-sm sm:text-base"
              >
                <Plus size={18} />
                {sp?.addService || 'Add Service'}
              </button>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{service.name}</h3>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(service.status)}`}>
                    {service.status || 'Pending'}
                  </span>
                </div>
                <p className="text-emerald-600 font-medium text-sm mb-2">{getServiceTypeLabel(service.service_type)}</p>
                <div className="space-y-1 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex justify-between"><span className="text-slate-500">{sp?.price || 'Price'}:</span><span>{service.price ? `₹${service.price} ${getPriceUnitLabel(service.price_unit || '')}` : '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{sp?.contact || 'Contact'}:</span><span>{service.contact_number || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{sp?.area || 'Area'}:</span><span>{service.coverage_area || '-'}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleEdit(service)} className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition py-2 text-xs font-medium">
                    <Edit2 size={14} /> {sp?.edit || 'Edit'}
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="flex items-center justify-center gap-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition py-2 text-xs font-medium">
                    <Trash2 size={14} /> {sp?.delete || 'Delete'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="rounded-2xl sm:rounded-3xl bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-8 py-4 sm:py-6 text-white">
              <h2 className="text-lg sm:text-2xl font-bold">
                {editingId ? (sp?.editService || 'Edit Service') : (sp?.addService || 'Add Service')}
              </h2>
              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/20 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-6">
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

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4 justify-end pt-4 sm:pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
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
      )}
    </div>
  );
}
