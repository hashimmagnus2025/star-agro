
'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, Loader2, Camera, Image as ImageIcon, ListChecks, FileText, UploadCloud } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';


const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Backend sends DATE columns as UTC ISO strings (e.g. "2026-09-29T18:30:00.000Z" for a date
// stored as 2026-09-30 IST). Slicing the raw string takes the UTC date and is off by a day
// in positive-offset timezones — build the date-input value from LOCAL components instead.
const toDateInputValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const QUANTITY_UNIT_LABELS = {
  kg: 'Kg/किलो',
  Crates: 'Crates',
  Bags: 'Bags/बॅग्स',
  boxes: 'Boxes/बॉक्स',
  Qunital: 'Qunital/क्विंटल',
  Ton: 'Ton/टन',
  bandles: 'bandles/बंडल्स',
  Dozen: 'Dozen/डझन',
  grams: 'Grams/ग्रॅम',
  liter: 'Liter/लिटर',
  'Mili Liter': 'Mili Liter/मिली लिटर',
  Nos: 'Nos/नग',
};

function AddProductsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [initializing, setInitializing] = useState(Boolean(editingId));
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');
  const [language, setLanguage] = useState('en');
  const [listeningField, setListeningField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaWidgetId = useRef(null);

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
      setFormData((prev) => ({
        ...prev,
        [fieldName]: prev[fieldName] ? `${prev[fieldName]} ${transcript}` : transcript,
      }));
    };
    recognition.onerror = () => setListeningField(null);
    recognition.onend = () => setListeningField(null);

    recognition.start();
  };


  const [formData, setFormData] = useState({
    name: '',
    name_hindi: '',
    name_marathi: '',
    description: '',
    price: '',
    category_id: '',
    sub_category_id: '',
    sub_sub_category_id: '',
    stock_quantity: '',
    image_url: '',
    is_dehydrated: 'No',
    product_type: '',
    min_quantity: '',
    max_quantity: '',
    quantity_unit: 'kg',
    is_processed: 'No',
    product_video: '',
    active: "active",
    status: 'Pending',
    tags: '',
    planting_crops_date: '',
    harvesting_start_date: '',
    harvesting_end_date: '',
    type_of_crop: '',
    type: '',
  });

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);
  }, []);

  const t = translations[language];

  // Fetch reference data, the profile-completeness check, and (when editing) the
  // existing product on mount.
  useEffect(() => {
    fetchTypes();
    fetchCategories();
    fetchSubCategories();
    fetchSubSubCategories();
    checkProfileComplete();
    if (editingId) {
      fetchProductForEdit(editingId);
    }
  }, []);

  // Mirrors the backend's requireCompleteProfile check, so the warning shows before
  // the user fills the whole form instead of only after a failed submit.
  const REQUIRED_PROFILE_FIELDS = [
    'first_name', 'last_name', 'email', 'phone', 'gender',
    'state', 'district', 'taluka', 'village', 'address',
    'has_solar_dryer', 'how_know_about_us',
  ];

  const checkProfileComplete = async () => {
    try {
      const res = await api.get('/user/me');
      const profile = res.data?.user || res.data || {};
      const isComplete = REQUIRED_PROFILE_FIELDS.every(
        (field) => profile[field] !== undefined && profile[field] !== null && String(profile[field]).trim() !== ''
      );
      setProfileIncomplete(!isComplete);
    } catch (err) {
      console.error('Error checking profile completeness:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // The recaptcha container only exists in the DOM while adding (not editing), so
  // the widget has to be rendered once that's known rather than unconditionally on mount.
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined' || editingId) return;

    window.onMyProductsRecaptchaSuccess = (token) => setRecaptchaToken(token);
    window.onMyProductsRecaptchaExpired = () => setRecaptchaToken('');

    const renderWidget = () => {
      if (window.grecaptcha?.render && recaptchaWidgetId.current === null) {
        recaptchaWidgetId.current = window.grecaptcha.render('my-products-recaptcha-container', {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: window.onMyProductsRecaptchaSuccess,
          'expired-callback': window.onMyProductsRecaptchaExpired,
        });
      }
    };

    if (window.grecaptcha?.render) {
      renderWidget();
      return;
    }

    window.onMyProductsRecaptchaApiLoad = renderWidget;

    if (!document.getElementById('recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onMyProductsRecaptchaApiLoad&render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [editingId]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await api.get('/types');
      const activeTypes = Array.isArray(response.data)
        ? response.data.filter((item) => String(item.status).toLowerCase() === 'active')
        : [];
      setTypes(activeTypes);
    } catch (err) {
      console.error('Error fetching types:', err);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await api.get('/sub-categories');
      setSubCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching sub-categories:', err);
    }
  };

  const fetchSubSubCategories = async () => {
    try {
      const response = await api.get('/sub-sub-categories');
      setSubSubCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching sub-sub-categories:', err);
    }
  };

  const fetchProductForEdit = async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      const product = response.data;
      const type = product.type
        ? product.type
        : String(product.type).toLowerCase().includes('crop') ? 'Crop' : 'Product';
      setFormData({
        name: product.name || '',
        name_hindi: product.name_hindi || '',
        name_marathi: product.name_marathi || '',
        description: product.description || '',
        price: product.price || '',
        category_id: product.category_id || '',
        sub_category_id: product.sub_category_id || '',
        sub_sub_category_id: product.sub_sub_category_id || '',
        stock_quantity: product.stock_quantity || '',
        image_url: product.image_url || '',
        is_dehydrated: product.is_dehydrated ? 'Yes' : 'No',
        product_type: product.product_type || '',
        min_quantity: product.min_quantity || '',
        max_quantity: product.max_quantity || '',
        quantity_unit: product.quantity_unit || 'kg',
        is_processed: product.is_processed ? 'Yes' : 'No',
        product_video: product.product_video || '',
        active: 'active',
        status: product.status || 'Pending',
        tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
        planting_crops_date: toDateInputValue(product.planting_crops_date),
        harvesting_start_date: toDateInputValue(product.harvesting_start_date),
        harvesting_end_date: toDateInputValue(product.harvesting_end_date),
        type_of_crop: product.type_of_crop || '',
        type,
      });
      setImagePreviewFromValue(product.image_url || '');
    } catch (err) {
      console.error('Error fetching product for edit:', err);
      setError('Could not load this item for editing.');
    } finally {
      setInitializing(false);
    }
  };

  const selectedCategoryId = formData.category_id && formData.category_id !== 'new'
    ? Number(formData.category_id)
    : null;
  const selectedSubCategoryId = formData.sub_category_id && formData.sub_category_id !== 'new'
    ? Number(formData.sub_category_id)
    : null;

  const normalizeProductType = (value) => String(value ?? '').trim().toLowerCase();
  const isCropType = () => ['crop', 'crops'].includes(normalizeProductType(formData.type));

  const shouldShowCategoryFields = () => {
    const type = normalizeProductType(formData.type);
    return type !== 'nursery' && type !== 'animal';
  };

  const shouldRequireProductName = () => {
    const type = normalizeProductType(formData.type);
    return type !== 'nursery' && type !== 'animal';
  };

  const getImagePreviewUrl = (value) => {
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }

    if (typeof value === 'string' && value.trim()) {
      const trimmedValue = value.trim();
      if (/^https?:\/\//i.test(trimmedValue) || trimmedValue.startsWith('data:')) {
        return trimmedValue;
      }

      const normalizedPath = trimmedValue.startsWith('/') ? trimmedValue : `/${trimmedValue}`;
      return `${IMAGE_BASE_URL || ''}${normalizedPath}`;
    }
    return '';
  };

  const setImagePreviewFromValue = (value) => {
    setImagePreview(getImagePreviewUrl(value));
  };

  const fillAutoNameFields = (selectedItem) => {
    if (!selectedItem) return {};

    return {
      name: selectedItem.name || '',
      name_hindi: selectedItem.name_hindi || '',
      name_marathi: selectedItem.name_marathi || '',
    };
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.type) {
      errors.type = 'Type is required.';
    }

    if (shouldRequireProductName() && !formData.name.trim()) {
      errors.name = 'Product name is required.';
    }

    if (shouldShowCategoryFields() && !formData.category_id) {
      errors.category_id = 'Category is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const MAX_IMAGE_SIZE = 500 * 1024;
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

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

  const getCurrentPositionAsync = () => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  };

  const reverseGeocode = async (lat, lng) => {
    if (!GOOGLE_MAPS_API_KEY) return null;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        return data.results[0].formatted_address;
      }
    } catch (geocodeError) {
      console.error('Reverse geocoding failed:', geocodeError);
    }
    return null;
  };

  const wrapCanvasText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Burns a GPS Map Camera-style overlay (address, coordinates, date-time) onto the
  // bottom of a camera-captured photo, so the location is visible on the image itself
  // and not just stored as hidden upload_latitude/upload_longitude fields.
  const stampImageWithLocation = (file) => {
    return new Promise((resolve) => {
      (async () => {
        let latitude = null;
        let longitude = null;
        let address = null;

        try {
          const position = await getCurrentPositionAsync();
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          address = await reverseGeocode(latitude, longitude);
        } catch (locationError) {
          console.error('Could not get location for image stamp:', locationError);
        }

        if (latitude === null || longitude === null) {
          resolve(file);
          return;
        }

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const padding = Math.max(12, Math.round(canvas.width * 0.02));
          const fontSize = Math.max(14, Math.round(canvas.width * 0.028));
          ctx.font = `${fontSize}px sans-serif`;

          const dateStr = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          const coordsStr = `Lat ${latitude.toFixed(6)}, Long ${longitude.toFixed(6)}`;
          const maxTextWidth = canvas.width - padding * 2;
          const addressLines = address ? wrapCanvasText(ctx, address, maxTextWidth).slice(0, 2) : [];
          const textLines = [...addressLines, coordsStr, dateStr];

          const lineHeight = fontSize * 1.4;
          const barHeight = textLines.length * lineHeight + padding * 1.5;

          const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.65)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

          ctx.fillStyle = '#ffffff';
          ctx.textBaseline = 'bottom';
          let y = canvas.height - padding;
          for (let i = textLines.length - 1; i >= 0; i--) {
            ctx.fillText(textLines[i], padding, y);
            y -= lineHeight;
          }

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const stampedName = file.name.replace(/\.[^./\\]+$/, '') + '.jpg';
            resolve(new File([blob], stampedName, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.92);
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
        };

        img.src = objectUrl;
      })();
    });
  };

  const handleInputChange = async (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file' && name === 'image_url') {
      let file = files?.[0] || null;
      const isCameraCapture = e.target === cameraInputRef.current;

      if (file && isCameraCapture) {
        setImageProcessing(true);
        try {
          file = await stampImageWithLocation(file);
        } catch (stampError) {
          console.error('Location stamping failed:', stampError);
        } finally {
          setImageProcessing(false);
        }
      }

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
            text: t?.swal?.imageTooLargeText || 'Image size must be 2 MB or less.',
            confirmButtonText: t?.swal?.okButton || 'OK',
          });
          e.target.value = '';
          return;
        }
      }

      setFormData((prev) => ({ ...prev, image_url: file }));
      setImagePreviewFromValue(file);
      return;
    }

    if (type === 'file' && name === 'product_video') {
      const file = files?.[0] || null;
      if (file && file.size > MAX_VIDEO_SIZE) {
        Swal.fire({
          icon: 'error',
          title: t?.swal?.videoTooLargeTitle || 'Video Too Large',
          text: t?.swal?.videoTooLargeText || 'Video size must be 10 MB or less.',
          confirmButtonText: t?.swal?.okButton || 'OK',
        });
        e.target.value = '';
        return;
      }
      setFormData((prev) => ({ ...prev, product_video: file }));
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev };
      updated[name] = value;

      if (name === 'category_id') {
        updated.sub_category_id = '';
        updated.sub_sub_category_id = '';

        const selectedCategory = categories.find((cat) => String(cat.id) === String(value));
        const autoFilledValues = fillAutoNameFields(selectedCategory);
        Object.entries(autoFilledValues).forEach(([field, fieldValue]) => {
          if (fieldValue) {
            updated[field] = fieldValue;
          }
        });
      }

      if (name === 'sub_category_id') {
        updated.sub_sub_category_id = '';

        if (value && value !== 'new') {
          const selectedSubCategory = subCategories.find((subCat) => String(subCat.id) === String(value));
          const autoFilledValues = fillAutoNameFields(selectedSubCategory);
          Object.entries(autoFilledValues).forEach(([field, fieldValue]) => {
            if (fieldValue) {
              updated[field] = fieldValue;
            }
          });
        }
      }

      if (name === 'type' && normalizeProductType(value) !== 'product') {
        updated.sub_sub_category_id = '';
      }

      if (name === 'type' && ['nursery', 'animal'].includes(normalizeProductType(value))) {
        updated.category_id = '';
        updated.sub_category_id = '';
        updated.sub_sub_category_id = '';
      }

      return updated;
    });

    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Captures where the user physically is at the moment they create/update a product or crop
  // (hidden fields, not shown in the UI). Resolves to nulls if permission is denied/unavailable
  // rather than blocking the submit.
  const captureUploadLocation = () => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve({ upload_latitude: null, upload_longitude: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            upload_latitude: position.coords.latitude,
            upload_longitude: position.coords.longitude,
          });
        },
        () => resolve({ upload_latitude: null, upload_longitude: null }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!editingId && RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setError(t?.registerForm?.recaptchaRequired || 'Please verify you are not a robot');
      return;
    }

    setSubmitting(true);

    try {
      const { upload_latitude, upload_longitude } = await captureUploadLocation();

      let resolvedCategoryId = shouldShowCategoryFields() ? selectedCategoryId : null;
      let resolvedSubCategoryId = shouldShowCategoryFields() ? selectedSubCategoryId : null;
      let resolvedSubSubCategoryId = normalizeProductType(formData.type) === 'product' && formData.sub_sub_category_id
        ? Number(formData.sub_sub_category_id)
        : null;

      const productPayload = new FormData();
      productPayload.append('name', formData.name);
      productPayload.append('name_hindi', formData.name_hindi);
      productPayload.append('name_marathi', formData.name_marathi);
      productPayload.append('description', formData.description);
      productPayload.append('price', formData.price ? parseFloat(formData.price) : 0);

      if (resolvedCategoryId !== null) {
        productPayload.append('category_id', resolvedCategoryId);
      }
      if (resolvedSubCategoryId !== null) {
        productPayload.append('sub_category_id', resolvedSubCategoryId);
      }
      if (resolvedSubSubCategoryId !== null) {
        productPayload.append('sub_sub_category_id', resolvedSubSubCategoryId);
      }

      productPayload.append('stock_quantity', formData.stock_quantity ? parseInt(formData.stock_quantity, 10) : 0);

      if (formData.image_url instanceof File) {
        productPayload.append('image', formData.image_url);
      } else if (editingId && typeof formData.image_url === 'string' && formData.image_url) {
        productPayload.append('image_url', formData.image_url);
      }

      productPayload.append('is_dehydrated', formData.is_dehydrated === 'Yes');
      productPayload.append('product_type', formData.product_type);
      productPayload.append('min_quantity', formData.min_quantity ? parseInt(formData.min_quantity, 10) : 0);
      productPayload.append('max_quantity', formData.max_quantity ? parseInt(formData.max_quantity, 10) : 0);
      productPayload.append('quantity_unit', formData.quantity_unit || 'kg');
      productPayload.append('is_processed', formData.is_processed === 'Yes');
      productPayload.append('type', formData.type);
      productPayload.append('planting_crops_date', formData.planting_crops_date || '');
      productPayload.append('harvesting_start_date', formData.harvesting_start_date || '');
      productPayload.append('harvesting_end_date', formData.harvesting_end_date || '');
      productPayload.append('type_of_crop', formData.type_of_crop || '');
      productPayload.append('upload_latitude', upload_latitude ?? '');
      productPayload.append('upload_longitude', upload_longitude ?? '');

      if (formData.product_video instanceof File) {
        productPayload.append('product_video', formData.product_video);
      } else if (editingId && typeof formData.product_video === 'string' && formData.product_video) {
        productPayload.append('product_video', formData.product_video);
      }

      productPayload.append('status', formData.status);
      productPayload.append('tags', formData.tags ? formData.tags.split(',')?.map(tag => tag.trim()).join(',') : '');
      if (!editingId) {
        productPayload.append('recaptchaToken', recaptchaToken);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingId) {
        await api.put(`/products/${editingId}`, productPayload, config);
      } else {
        await api.post('/products', productPayload, config);
      }

      const wasEditing = Boolean(editingId);
      setError('');
      recaptchaWidgetId.current = null;
      setRecaptchaToken('');
      await Swal.fire({
        icon: 'success',
        title: wasEditing ? (t?.swal?.productUpdatedTitle || 'Updated Successfully') : (t?.swal?.productAddedTitle || 'Added Successfully'),
        text: wasEditing
          ? (t?.swal?.productUpdatedText || 'Your item has been updated.')
          : (t?.swal?.productAddedText || 'Your item has been submitted successfully. It will appear on the Crops/Products page once the super admin approves it.'),
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
      router.push('/user/my-products');
    } catch (err) {
      const backendMessage = err?.response?.data?.message || err.message || 'Error saving product';
      const isProfileIncomplete = err?.response?.status === 403
        && (err?.response?.data?.code === 'PROFILE_INCOMPLETE'
          || /complete your profile|upload your document|don't have permission/i.test(backendMessage));
      const displayMessage = isProfileIncomplete ? t?.profileIncompleteMessage : backendMessage;

      setError(displayMessage);
      console.error('Error saving product:', err);
      if (typeof window !== 'undefined' && window.grecaptcha?.reset && recaptchaWidgetId.current !== null) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
      }
      setRecaptchaToken('');
      await Swal.fire({
        icon: 'error',
        title: isProfileIncomplete ? t?.profileIncompleteTitle : (t?.swal?.saveFailedTitle || 'Save Failed'),
        text: displayMessage,
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
      if (isProfileIncomplete) router.push('/user/profile');
    } finally {
      setSubmitting(false);
    }
  };

  const getAddLabel = () => t.userPanel?.myProduct.addProduct;

  const filteredSubCategories = selectedCategoryId
    ? subCategories.filter((subCat) => subCat.category_id === selectedCategoryId)
    : [];

  const filteredSubSubCategories = selectedSubCategoryId
    ? subSubCategories.filter((ssc) => ssc.sub_category_id === selectedSubCategoryId)
    : [];

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 ">
      <div className="mx-auto max-w-6xl">
        {profileIncomplete && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span>{t?.profileIncompleteMessage}</span>
            <button
              type="button"
              onClick={() => router.push('/user/profile')}
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-amber-700 transition"
            >
              {t?.profileIncompleteTitle}
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60 sm:rounded-3xl">
          <div className="relative overflow-hidden border-b border-emerald-500/20 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-5 py-6 text-white sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  {editingId ? 'Update your listing' : 'Create a new listing'}
                </p>
                <h2 className="text-xl font-bold sm:text-3xl">
                  {editingId ? t.userPanel?.myProduct.editProduct : getAddLabel()}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50">
                  Add the details below to share your crop or product with buyers.
                </p>
              </div>
              <div className="w-fit rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                {editingId ? 'Edit listing' : 'New listing'}
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleCreateProduct} className="space-y-5 bg-slate-50/70 p-4 sm:space-y-6 sm:p-8 lg:p-2">
            <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6">
              <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ListChecks size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">Listing details</h3>
                  <p className="mt-1 text-sm text-slate-500">Choose a type and enter the key information for your listing.</p>
                </div>
              </div>
              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t?.userPanel.myProduct.type || 'Type'} <span className="text-red-600">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value=""> {t?.type} {t?.Select}</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.name}>
                      {language === 'hi'
                        ? type.name_hindi || type.name
                        : language === 'mr'
                          ? type.name_marathi || type.name
                          : type.name}
                    </option>
                  ))}
                </select>
                {formErrors.type && (
                  <p className="mt-2 text-xs text-red-600">{formErrors.type}</p>
                )}
              </div>


              {/* Category and Sub-Category */}
              {shouldShowCategoryFields() && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    {t?.userPanel.myProduct.category} <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">{t?.Select} {t?.userPanel.myProduct.category} </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {language === 'hi'
                          ? cat.name_hindi
                          : language === 'mr'
                            ? cat.name_marathi
                            : cat.name}

                      </option>
                    ))}
                  </select>
                  {formErrors.category_id && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.category_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    {t?.userPanel.myProduct.subCategory}
                  </label>
                  <select
                    name="sub_category_id"
                    value={formData.sub_category_id}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    disabled={!selectedCategoryId}
                  >
                    <option value="">{t?.Select} {t?.userPanel.myProduct.subCategory}</option>
                    {filteredSubCategories.map((subCat) => (
                      <option key={subCat.id} value={subCat.id}>
                        {language === 'hi'
                          ? subCat.name_hindi
                          : language === 'mr'
                            ? subCat.name_marathi
                            : subCat.name}

                      </option>
                    ))}
                  </select>
                  {formErrors.sub_category_id && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.sub_category_id}</p>
                  )}
                </div>
              </div>}

              {formData.type === 'Product' && (

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    {t?.userPanel.myProduct.subsubCategory}
                  </label>
                  <select
                    name="sub_sub_category_id"
                    value={formData.sub_sub_category_id}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    disabled={!selectedSubCategoryId}
                  >
                    <option value="">{t?.Select} {t?.userPanel.myProduct.subsubCategory}</option>
                    {filteredSubSubCategories.map((subSubCat) => (
                      <option key={subSubCat.id} value={subSubCat.id}>
                        {language === 'hi'
                          ? subSubCat.name_hindi
                          : language === 'mr'
                            ? subSubCat.name_marathi
                            : subSubCat.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.sub_sub_category_id && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.sub_sub_category_id}</p>
                  )}
                </div>
              )}

              {formData.type === 'Product' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      {t?.userPanel.myProduct.Isthisproductdehydrated}
                    </label>
                    <select
                      name="is_dehydrated"
                      value={formData.is_dehydrated}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"

                    >
                      <option value="No"> {t?.No}</option>
                      <option value="Yes"> {t?.Yes}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      {t?.userPanel.myProduct.ProductType}
                    </label>
                    <select
                      name="product_type"
                      value={formData.product_type}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">{t?.Select} {t?.userPanel.myProduct.ProductType}</option>
                      <option value="Powder">{t?.Powder}</option>
                      <option value="Tablet">{t?.Tablet}</option>
                      <option value="Juice">{t?.Juice}</option>
                      <option value="Flakes">{t?.Flakes}</option>
                      <option value="Oil">{t?.Oil}</option>
                      <option value="Other">{t?.Other}</option>
                    </select>
                    {formErrors.product_type && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.product_type}</p>
                    )}

                  </div>
                </div>
              )}

              {shouldShowCategoryFields() && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      {t?.userPanel.myProduct.MinQuantityperorder}
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        name="min_quantity"
                        value={formData.min_quantity}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        className="min-w-0 flex-1 rounded-l-2xl border border-r-0 border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                      <select
                        name="quantity_unit"
                        value={formData.quantity_unit}
                        onChange={handleInputChange}
                        className="max-w-26 shrink-0 truncate rounded-r-2xl border border-slate-300 bg-slate-100 px-2 py-3 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-36 sm:px-3 sm:text-sm"
                      >
                        <option value="kg">Kg/किलो</option>
                        <option value="Crates">Crates/कॅरेट्स</option>
                        <option value="Bags">Bags/बॅग्स </option>
                        <option value="boxes">Boxes/बॉक्स </option>
                        <option value="Qunital">Qunital/क्विंटल</option>
                        <option value="Ton">Ton/टन</option>
                        <option value="bandles">bandles/जुडी  </option>
                        <option value="Dozen">Dozen/डझन</option>
                        <option value="grams">Grams/ग्रॅम </option>
                        <option value="liter">Liter/लिटर</option>
                        <option value="Mili Liter">Mili Liter/मिली लिटर</option>
                        <option value="Nos">Nos/नग </option>

                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      {t?.userPanel.myProduct.MaxQuantityperorder}
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        name="max_quantity"
                        value={formData.max_quantity}
                        onChange={handleInputChange}
                        placeholder="0 (No limit)"
                        min="0"
                        className="min-w-0 flex-1 rounded-l-2xl border border-r-0 border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                      <select
                        name="quantity_unit"
                        value={formData.quantity_unit}
                        onChange={handleInputChange}
                        className="max-w-26 shrink-0 truncate rounded-r-2xl border border-slate-300 bg-slate-100 px-2 py-3 text-xs text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-36 sm:px-3 sm:text-sm"
                      >
                        <option value="kg">Kg/किलो</option>
                        <option value="Crates">Crates/कॅरेट्स </option>
                        <option value="Bags">Bags/बॅग्स </option>
                        <option value="boxes">Boxes/बॉक्स </option>
                        <option value="Qunital">Qunital/क्विंटल</option>
                        <option value="Ton">Ton/टन</option>
                        <option value="bandles">bandles/जुडी</option>
                        <option value="Dozen">Dozen/डझन</option>
                        <option value="grams">Grams/ग्रॅम </option>
                        <option value="liter">Liter/लिटर</option>
                        <option value="Mili Liter">Mili Liter/मिली लिटर</option>
                        <option value="Nos">Nos/नग </option>
                      </select>
                    </div>
                  </div>
                </div>
              )}



              {shouldShowCategoryFields() && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    {t?.price} (₹)
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`min-w-0 flex-1 border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${formData.quantity_unit ? 'rounded-l-2xl border-r-0' : 'rounded-2xl'}`}
                    />
                    {formData.quantity_unit && (
                      <span className="inline-flex max-w-32 shrink-0 items-center truncate rounded-r-2xl border border-slate-300 bg-slate-100 px-2 py-3 text-xs text-slate-700 sm:max-w-none sm:px-3 sm:text-sm">
                        ₹ / {QUANTITY_UNIT_LABELS[formData.quantity_unit] || formData.quantity_unit}
                      </span>
                    )}
                  </div>
                  {formErrors.price && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.price}</p>
                  )}
                </div>

              )
              }



              {/* Stock Quantity */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t?.StockQuantity}
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {isCropType() && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2"> {t?.userPanel?.myCrops?.PlantingCropsDate}</label>
                      <input
                        type="date"
                        name="planting_crops_date"
                        value={formData.planting_crops_date}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />

                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2"> {t?.userPanel?.myCrops?.HarvestStartDate}</label>
                      <input
                        type="date"
                        name="harvesting_start_date"
                        value={formData.harvesting_start_date}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />

                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2"> {t?.userPanel?.myCrops?.HarvestEndDate}  </label>
                      <input
                        type="date"
                        name="harvesting_end_date"
                        value={formData.harvesting_end_date}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                      {editingId && isCropType() && (
                        <p className="mt-2 text-xs text-amber-600">
                          Tip: To make an inactive crop live again, set this to a future date.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2"> {t?.userPanel?.myCrops?.TypeofCrop}</label>
                      <select
                        name="type_of_crop"
                        value={formData.type_of_crop}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                        <option value=""> {t?.Select} {t?.userPanel?.myCrops?.TypeofCrop}</option>
                        <option value="Organic"> {t?.userPanel?.myCrops?.Organic}</option>
                        <option value="Inorganic"> {t?.userPanel?.myCrops?.Inorganic}</option>

                      </select>

                    </div>
                  </div>
                </>
              )}

            </section>

            {/* Is Processed */}
            <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6">
              <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileText size={18} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 sm:text-lg">More details</h3>
                  <p className="mt-1 text-sm text-slate-500">Add a description, photos, and other useful information.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {formData.type === 'Product' ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      {t?.IsProcessed}
                    </label>
                    <select
                      name="is_processed"
                      value={formData.is_processed}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"

                    >
                      <option value="No"> {t?.No}</option>
                      <option value="Yes"> {t?.Yes}</option>
                    </select>
                  </div>
                ) : (
                  <div />
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    {t?.Status}
                  </label>
                  <div className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold ${String(formData.status).toLowerCase() === 'approved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : String(formData.status).toLowerCase() === 'rejected'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>
                    {formData.status || 'Pending'}
                  </div>

                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t?.Description}
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your product... (quality, origin, benefits, etc.)"
                    rows="4"
                    className={`w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 ${speechSupported ? 'pr-12' : ''} text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none`}
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('description')}
                      aria-label="Voice input"
                      title="Speak to fill this field"
                      className={`absolute right-3 top-3 transition-colors ${listeningField === 'description' ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-emerald-600'}`}
                    >
                      <Mic size={18} />
                    </button>
                  )}
                </div>
              </div>
              {/* Product Image */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t?.ProductImage}
                </label>
                <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:gap-5">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-emerald-200 bg-slate-100 shadow-sm mx-auto sm:mx-0">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-xs text-slate-400">
                        <UploadCloud size={20} />
                        <span>No image selected</span>
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
                    name="image_url"
                    onChange={handleInputChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    name="image_url"
                    onChange={handleInputChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={imageProcessing}
                      title={imageProcessing ? 'Image process ho rahi hai...' : 'Camera se lein'}
                      aria-label="Take a photo"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {imageProcessing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                      <span>Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={imageProcessing}
                      title={imageProcessing ? 'Image process ho rahi hai...' : 'Gallery se chunein'}
                      aria-label="Choose an image from your gallery"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {imageProcessing ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                      <span>Gallery</span>
                    </button>
                  </div>
                </div>
                {imageProcessing && (
                  <p className="mt-2 text-xs text-slate-500">Image compress ho rahi hai, thoda ruko...</p>
                )}
                {formErrors.image_url && (
                  <p className="mt-2 text-xs text-red-600">{formErrors.image_url}</p>
                )}

                {formData.image_url instanceof File && (
                  <p className="mt-2 text-sm text-emerald-600 break-all">📁 {formData.image_url.name}</p>
                )}
              </div>

              {/* Product Video */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t?.ProductVideo}  (MP4, WebM, etc.)
                </label>
                <input
                  type="file"
                  name="product_video"
                  onChange={handleInputChange}
                  accept="video/*"
                  className="w-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-200"
                />
                {formData.product_video instanceof File && (
                  <p className="mt-2 text-sm text-emerald-600 break-all">🎥 {formData.product_video.name}</p>
                )}
                {editingId && typeof formData.product_video === 'string' && formData.product_video && (
                  <p className="mt-2 text-sm text-slate-500 break-all">Current video: {formData.product_video}</p>
                )}
                <p className="mt-2 text-xs text-slate-400">Bade videos submit karne ke baad automatically ~3-4MB tak compress ho jayenge.</p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., organic, pesticide-free, seasonal, certified"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Product Name */}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  {t?.userPanel.myProduct.productName} (English)
                  {shouldRequireProductName() && <span className="text-red-600">*</span>}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Organic Tomatoes, Rice, Fresh Milk"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"

                />
                {formErrors.name && (
                  <p className="mt-2 text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              {shouldShowCategoryFields() && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      {t?.userPanel.myProduct.productName} (Hindi)
                    </label>
                    <input
                      type="text"
                      name="name_hindi"
                      value={formData.name_hindi}
                      onChange={handleInputChange}
                      placeholder="उदाहरण: जैविक टमाटर, चावल, ताजा दूध"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      {t?.userPanel.myProduct.productName} (Marathi)
                    </label>
                    <input
                      type="text"
                      name="name_marathi"
                      value={formData.name_marathi}
                      onChange={handleInputChange}
                      placeholder="उदाहरण: सेंद्रिय टोमॅटो, तांदूळ, ताजे दूध"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </>

              )}

            </section>

            {/* reCAPTCHA */}
            {!editingId && RECAPTCHA_SITE_KEY && (
              <div id="my-products-recaptcha-container" className="flex justify-center sm:justify-start" />
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-red-700">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4 justify-end rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-6">
              <button
                type="button"
                onClick={() => router.push('/user/my-products')}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold shadow-md shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:shadow-lg text-sm sm:text-base disabled:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    {t?.Submitting || 'Submitting...'}
                  </span>
                ) : t.Submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddProducts() {
  return (
    <Suspense fallback={(
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    )}>
      <AddProductsForm />
    </Suspense>
  );
}
