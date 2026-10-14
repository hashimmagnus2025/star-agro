
'use client';

import { useState, useEffect, useRef } from 'react';

import api from '../../utils/api.js';
import Swal from 'sweetalert2';

import { X, Eye, Plus, Trash2, Edit2, MessageSquare, Check, Ban, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import Pagination from '../components/Pagination.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '';
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};
const formatDateOnly = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');
const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

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

export default function ProductsPage() {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [user, setUser] = useState({ role: 'user' });
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaWidgetId = useRef(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [statusFilter, setStatusFilter] = useState('all');
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    name_hindi: '',
    name_marathi: '',
    description: '',
    price: '',
    category_id: '',
    sub_category_id: '',
    sub_sub_category_id: '',
    user_id: '',
    new_category_name: '',
    new_sub_category_name: '',
    new_sub_sub_category_name: '',
    stock_quantity: '',
    image_url: '',
    is_dehydrated: 'No',
    product_type: '',
    min_quantity: '',
    max_quantity: '',
    quantity_unit: 'kg',
    is_processed: 'No',
    product_video: '',
    status: 'Pending',
    tags: '',
    planting_crops_date: '',
    harvesting_start_date: '',
    harvesting_end_date: '',
    type_of_crop: '',
    type: '',
  });

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const response = await api.get('/product-types');
        const filteredTypes = (response.data || [])
          .filter((item) => item?.type === 'Product Type')
          .map((item) => item?.name);
        setSelectedProductType(filteredTypes);
      } catch (err) {
        console.error('Error fetching product types:', err);
      }
    };
    fetchProductTypes();
  }, []);


  const resetForm = () => {
    setFormData({
      name: '',
      name_hindi: '',
      name_marathi: '',
      description: '',
      price: '',
      category_id: '',
      sub_category_id: '',
      sub_sub_category_id: '',
      user_id: '',
      new_category_name: '',
      new_sub_category_name: '',
      new_sub_sub_category_name: '',
      stock_quantity: '',
      image_url: '',
      is_dehydrated: 'No',
      product_type: '',
      min_quantity: '',
      max_quantity: '',
      quantity_unit: 'kg',
      is_processed: 'No',
      product_video: '',
      status: 'Pending',
      tags: '',
      planting_crops_date: '',
      harvesting_start_date: '',
      harvesting_end_date: '',
      type_of_crop: '',
      type: '',
    });
    setImagePreview('');
    setFormErrors({});
    setUserSearchTerm('');
    setUserDropdownOpen(false);
  };

  // Load user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser({ role: userData.role || 'user' });
      }
    }
  }, []);

  useEffect(() => {
    if (!showModal || editingId || !RECAPTCHA_SITE_KEY || typeof window === 'undefined') {
      if (!showModal || editingId) {
        recaptchaWidgetId.current = null;
        setRecaptchaToken('');
      }
      return;
    }

    window.onAdminProductsRecaptchaSuccess = (token) => {
      setRecaptchaToken(token);
      setFormErrors((prev) => ({ ...prev, recaptcha: undefined }));
    };
    window.onAdminProductsRecaptchaExpired = () => setRecaptchaToken('');

    const renderWidget = () => {
      if (document.getElementById('admin-products-recaptcha-container')
        && window.grecaptcha?.render
        && recaptchaWidgetId.current === null) {
        recaptchaWidgetId.current = window.grecaptcha.render('admin-products-recaptcha-container', {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: window.onAdminProductsRecaptchaSuccess,
          'expired-callback': window.onAdminProductsRecaptchaExpired,
        });
      }
    };

    if (window.grecaptcha?.render) {
      renderWidget();
      return;
    }

    window.onAdminProductsRecaptchaApiLoad = renderWidget;
    const script = document.getElementById('recaptcha-script');

    if (!script) {
      const recaptchaScript = document.createElement('script');
      recaptchaScript.id = 'recaptcha-script';
      recaptchaScript.src = 'https://www.google.com/recaptcha/api.js?onload=onAdminProductsRecaptchaApiLoad&render=explicit';
      recaptchaScript.async = true;
      recaptchaScript.defer = true;
      recaptchaScript.onerror = () => {
        setFormErrors((prev) => ({ ...prev, recaptcha: 'Unable to load reCAPTCHA. Please refresh and try again.' }));
      };
      document.body.appendChild(recaptchaScript);
      return;
    }

    script.addEventListener('load', renderWidget);
    if (window.grecaptcha?.render) renderWidget();
    return () => script.removeEventListener('load', renderWidget);
  }, [showModal, editingId]);

  // Fetch products, categories and sub-categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubCategories();
    fetchSubSubCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      const data = response.data;
      setProducts(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
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

  const selectedCategoryId = formData.category_id && formData.category_id !== 'new'
    ? Number(formData.category_id)
    : null;
  const selectedSubCategoryId = formData.sub_category_id && formData.sub_category_id !== 'new'
    ? Number(formData.sub_category_id)
    : null;

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const filteredUsers = users.filter((listedUser) => {
    const query = userSearchTerm.trim().toLowerCase();
    const fullName = listedUser.name || `${listedUser.first_name || ''} ${listedUser.last_name || ''}`.trim();
    return !query || [fullName, listedUser.email, listedUser.phone]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError('');
        const response = await api.get('/user');
        setUsers(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch (err) {
        setUsersError(err?.response?.data?.message || 'Unable to load users.');
        console.error('Error fetching users for product form:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const isCropItem = (product) => {
    const typeValue = product?.type ? String(product.type).toLowerCase() : '';
    return typeValue.includes('crop');
  };

  const isNurseryItem = (product) => {
    const typeValue = product?.type ? String(product.type).toLowerCase() : '';
    return typeValue.includes('nursery');
  };

  const isAnimalItem = (product) => {
    const typeValue = product?.type ? String(product.type).toLowerCase() : '';
    return typeValue.includes('animal');
  };

  const fillAutoNameFields = (selectedItem, previousItemNames = []) => {
    if (!selectedItem) return {};

    const autoFilledValues = {
      name: selectedItem.name || '',
      name_hindi: selectedItem.name_hindi || '',
      name_marathi: selectedItem.name_marathi || '',
    };

    return Object.fromEntries(
      Object.entries(autoFilledValues).filter(([, value]) => Boolean(value)).map(([field, value]) => [field, value])
    );
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

  const handleInputChange = async (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file' && name === 'image_url') {
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
            title: 'Image Too Large',
            text: 'Image size must be 500 KB or less.',
            confirmButtonText: 'OK',
          });
          e.target.value = '';
          return;
        }
      }

      setFormData((prev) => ({ ...prev, image_url: file }));
      setImagePreviewFromValue(file);
      setFormErrors((prev) => ({ ...prev, image_url: undefined }));
      return;
    }

    if (type === 'file' && name === 'product_video') {
      const file = files?.[0] || null;
      if (file && file.size > MAX_VIDEO_SIZE) {
        Swal.fire({
          icon: 'error',
          title: 'Video Too Large',
          text: 'Video size must be 100 MB or less.',
          confirmButtonText: 'OK',
        });
        e.target.value = '';
        return;
      }
      setFormData((prev) => ({ ...prev, product_video: file }));
      setFormErrors((prev) => ({ ...prev, product_video: undefined }));
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev };
      updated[name] = value;

      if (name === 'category_id') {
        updated.sub_category_id = '';
        updated.sub_sub_category_id = '';

        const selectedCategory = categories.find((cat) => String(cat.id) === String(value));
        const previousCategoryName = categories.find((cat) => String(cat.id) === String(prev.category_id))?.name || '';
        const previousSubCategoryName = subCategories.find((subCat) => String(subCat.id) === String(prev.sub_category_id))?.name || '';
        const previousNames = [previousCategoryName, previousSubCategoryName].filter(Boolean);
        const autoFilledValues = fillAutoNameFields(selectedCategory, previousNames);

        Object.entries(autoFilledValues).forEach(([field, fieldValue]) => {
          const currentValue = String(prev[field] || '').trim();
          const shouldAutoFill = !currentValue || previousNames.includes(currentValue) || currentValue === fieldValue;
          if (shouldAutoFill) {
            updated[field] = fieldValue;
          }
        });
      }

      if (name === 'sub_category_id') {
        updated.sub_sub_category_id = '';

        if (value && value !== 'new') {
          const selectedSubCategory = subCategories.find((subCat) => String(subCat.id) === String(value));
          const previousCategoryName = categories.find((cat) => String(cat.id) === String(prev.category_id))?.name || '';
          const previousSubCategoryName = subCategories.find((subCat) => String(subCat.id) === String(prev.sub_category_id))?.name || '';
          const previousNames = [previousCategoryName, previousSubCategoryName].filter(Boolean);
          const autoFilledValues = fillAutoNameFields(selectedSubCategory, previousNames);

          Object.entries(autoFilledValues).forEach(([field, fieldValue]) => {
            const currentValue = String(prev[field] || '').trim();
            const shouldAutoFill = !currentValue || previousNames.includes(currentValue) || currentValue === fieldValue;
            if (shouldAutoFill) {
              updated[field] = fieldValue;
            }
          });
        }
      }

      return updated;
    });

    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const setImagePreviewFromValue = (value) => {
    if (value instanceof File) {
      setImagePreview(URL.createObjectURL(value));
      return;
    }

    setImagePreview(typeof value === 'string' ? value : '');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.type) {
      errors.type = 'Type is required.';
    }

    if (!formData.name.trim()) {
      errors.name = 'Product name is required.';
    }

    if (!formData.category_id) {
      errors.category_id = 'Category is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!editingId && RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setFormErrors((prev) => ({ ...prev, recaptcha: 'Please verify you are not a robot.' }));
      return;
    }

    try {
      let resolvedCategoryId = selectedCategoryId;
      let resolvedSubCategoryId = selectedSubCategoryId;
      let resolvedSubSubCategoryId = formData.sub_sub_category_id ? Number(formData.sub_sub_category_id) : null;

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
      if (!editingId && isAdmin && formData.user_id) {
        productPayload.append('user_id', formData.user_id);
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

      if (formData.product_video instanceof File) {
        productPayload.append('product_video', formData.product_video);
      } else if (editingId && typeof formData.product_video === 'string' && formData.product_video) {
        productPayload.append('product_video', formData.product_video);
      }

      productPayload.append('status', formData.status);
      productPayload.append('tags', formData.tags ? formData.tags.split(',')?.map(tag => tag.trim()).join(',') : '');
      if (!editingId && RECAPTCHA_SITE_KEY) {
        productPayload.append('recaptchaToken', recaptchaToken);
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingId) {
        await api.put(`/products/${editingId}`, productPayload, config);
      } else {
        await api.post('/products', productPayload, config);
      }

      await Promise.all([fetchCategories(), fetchSubCategories(), fetchSubSubCategories(), fetchProducts()]);
      const wasEditing = Boolean(editingId);
      resetForm();
      setEditingId(null);
      setShowModal(false);
      Swal.fire({
        icon: 'success',
        title: wasEditing ? 'Updated Successfully' : 'Added Successfully',
        text: wasEditing
          ? 'The item has been updated.'
          : isAdmin
            ? 'The item has been added.'
            : 'Aapka item successfully submit ho gaya hai. Super admin approve karega uske baad hi yeh Crops/Products page par dikhega.',
        timer: isAdmin ? 2000 : 3500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error saving product');
      console.error('Error saving product:', err);
      if (typeof window !== 'undefined' && window.grecaptcha?.reset && recaptchaWidgetId.current !== null) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
      }
      setRecaptchaToken('');
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err?.response?.data?.message || err.message || 'Error saving product',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleEditProduct = (product) => {
    const cropMode = product?.type ? String(product.type).toLowerCase().includes('crop') : false;
    const nurseryMode = product?.type ? String(product.type).toLowerCase().includes('nursery') : false;
    const animalMode = product?.type ? String(product.type).toLowerCase().includes('animal') : false;
    setEditingId(product.id);
    setFormData({
      name: product.name,
      name_hindi: product.name_hindi || '',
      name_marathi: product.name_marathi || '',
      description: product.description || '',
      price: product.price,
      category_id: product.category_id || '',
      sub_category_id: product.sub_category_id || '',
      sub_sub_category_id: product.sub_sub_category_id || '',
      user_id: '',
      new_category_name: '',
      new_sub_category_name: '',
      new_sub_sub_category_name: '',
      stock_quantity: product.stock_quantity || '',
      image_url: product.image_url || '',
      is_dehydrated: product.is_dehydrated ? 'Yes' : 'No',
      product_type: product.product_type || '',
      min_quantity: product.min_quantity || '',
      max_quantity: product.max_quantity || '',
      quantity_unit: product.quantity_unit || 'kg',
      is_processed: product.is_processed ? 'Yes' : 'No',
      product_video: product.product_video || '',
      status: product.status || 'Active',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ''),
      planting_crops_date: toDateInputValue(product.planting_crops_date),
      harvesting_start_date: toDateInputValue(product.harvesting_start_date),
      harvesting_end_date: toDateInputValue(product.harvesting_end_date),
      type_of_crop: product.type_of_crop || '',
      type: product.type || (cropMode ? 'Crop' : nurseryMode ? 'Nursery' : animalMode ? 'Animal' : 'Product'),
    });
    setImagePreview(product.image_url ? resolveMediaUrl(product.image_url) : '');
    setShowModal(true);
  };

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'This item will be permanently deleted.',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      Swal.fire({
        icon: 'success',
        title: 'Deleted',
        text: 'The item has been deleted.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err.message);
      console.error('Error deleting product:', err);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Error deleting product',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/products/${id}/status`, { status });
      setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, status } : product)));
      Swal.fire({
        icon: 'success',
        title: status === 'Approved' ? 'Approved' : 'Rejected',
        text: status === 'Approved' ? 'The item is now visible to buyers.' : 'The item has been rejected.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Action Failed',
        text: err?.response?.data?.message || err.message || 'Error updating status',
        confirmButtonText: 'OK',
      });
    }
  };

  const isProductActive = (product) =>
    product.is_active === undefined || product.is_active === null ? true : Number(product.is_active) === 1;

  const handleToggleActive = async (product) => {
    const nextActive = !isProductActive(product);
    try {
      await api.put(`/products/${product.id}/active`, { is_active: nextActive });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_active: nextActive ? 1 : 0 } : p)));
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: err?.response?.data?.message || 'Could not update active status',
        confirmButtonText: 'OK',
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    resetForm();
    setError('');
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedProduct(null);
  };

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat ? cat.name : 'N/A';
  };

  const getSubCategoryName = (id) => {
    const subCat = subCategories.find(s => s.id === id);
    return subCat ? subCat.name : 'N/A';
  };

  const getSubSubCategoryName = (id) => {
    const subSubCat = subSubCategories.find((ssc) => ssc.id === id);
    return subSubCat ? subSubCat.name : 'N/A';
  };

  const filteredSubCategories = selectedCategoryId
    ? subCategories.filter((subCat) => subCat.category_id === selectedCategoryId)
    : [];

  const filteredSubSubCategories = selectedSubCategoryId
    ? subSubCategories.filter((ssc) => ssc.sub_category_id === selectedSubCategoryId)
    : [];

  const displayedProducts = products.filter((product) => {
    return statusFilter === 'all' || String(product.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();
  });

  const filteredProducts = displayedProducts.filter((product) => {
    const term = searchTerm.toLowerCase();
    return [
      product.name,
      product.description,
      getCategoryName(product.category_id),
      getSubCategoryName(product.sub_category_id),
      getSubSubCategoryName(product.sub_sub_category_id),
      product.stock_quantity,
      product.price,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 ">
      {/* Header with Create Button */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {user.role === 'admin' || user.role === 'super_admin' ? 'Products Management' : 'My Products'}
            </h1>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-3">
            {['all', 'Pending', 'Approved', 'Rejected'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => { setStatusFilter(option); setCurrentPage(1); }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusFilter === option ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {option === 'all' ? 'All Status' : option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-6 py-4 text-red-700">
          {error}
        </div>
      )}

      {/* Products List */}
      <div className="rounded-3xl bg-white p-8 shadow-sm overflow-x-auto">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">Showing {filteredProducts.length} result{filteredProducts.length === 1 ? '' : 's'}</div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search products..."
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs"
          />
        </div>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              {searchTerm
                ? `No products found for "${searchTerm}".`
                : user.role === 'admin' || user.role === 'super_admin'
                  ? 'No products available. Create your first product!'
                  : 'You have not created any products yet. Add your first product!'}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b-2 border-slate-300 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Product Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Farmer</th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Category</th>
                


                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Approved By</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Active</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, index) => (
                <tr
                  key={product.id}
                  className={`block sm:table-row border-b border-slate-200 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <td className="block sm:table-cell px-6 py-4 align-top">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Product Name</span>
                    <span className="font-semibold text-slate-900">{product.name}</span>
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Type</span>
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {product.type}
                    </span>
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Farmer</span>
                    {product.farmer_name || 'N/A'}
                  </td>

                  <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Category</span>
                    {getCategoryName(product.category_id)}
                  </td>
                  


                  <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Status</span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${String(product.status).toLowerCase() === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : String(product.status).toLowerCase() === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                      {product.status || 'Pending'}
                    </span>
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Approved By</span>
                    {product.approved_by_name ? (
                      <>
                        <span className="block font-medium text-slate-900">{product.approved_by_name}</span>
                        <span className="block text-xs text-slate-500">
                          {product.approved_by_role === 'admin' || product.approved_by_role === 'super_admin'
                            ? 'Admin'
                            : product.approved_by_jurisdiction_role || ''}
                        </span>
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-center">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Active</span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(product)}
                      title={isProductActive(product) ? 'Set inactive' : 'Set active'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isProductActive(product) ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isProductActive(product) ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </td>
                  <td className="block sm:table-cell px-6 py-4 align-top text-center">
                    <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Actions</span>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {isAdmin && String(product.status).toLowerCase() !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(product.id, 'Approved')}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {isAdmin && String(product.status).toLowerCase() !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(product.id, 'Rejected')}
                          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                          title="Reject"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-100">
                  {isCropItem(selectedProduct) ? 'Crop Details' : isNurseryItem(selectedProduct) ? 'Nursery Details' : isAnimalItem(selectedProduct) ? 'Animal Details' : 'Product Details'}
                </p>
                <h2 className="mt-2 text-2xl font-bold">{selectedProduct.name}</h2>
              </div>
              <button
                onClick={closeViewModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/20 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 p-8">
              {selectedProduct.image_url && (
                <img
                  src={resolveMediaUrl(selectedProduct.image_url)}
                  alt={selectedProduct.name}
                  className="h-56 w-full rounded-2xl object-cover"
                />
              )}

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {selectedProduct.type || 'Product'}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${selectedProduct.status === 'Approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : selectedProduct.status === 'Rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                  {selectedProduct.status || 'Pending'}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${(selectedProduct.is_active === undefined || selectedProduct.is_active === null || Number(selectedProduct.is_active) === 1)
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-600'
                  }`}>
                  {(selectedProduct.is_active === undefined || selectedProduct.is_active === null || Number(selectedProduct.is_active) === 1) ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Price</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">₹{parseFloat(selectedProduct.price || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">Stock</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{selectedProduct.stock_quantity || 0} units</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-500">Uploaded By (Farmer)</p>
                <p className="mt-2 text-slate-900">
                  {selectedProduct.farmer_name || 'N/A'}
                  {selectedProduct.farmer_phone ? ` — ${selectedProduct.farmer_phone}` : ''}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-500">Min Quantity</p>
                  <p className="mt-2 text-slate-900">{selectedProduct.min_quantity ?? 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-500">Max Quantity</p>
                  <p className="mt-2 text-slate-900">{selectedProduct.max_quantity ?? 'N/A'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-500">Unit</p>
                  <p className="mt-2 text-slate-900">{selectedProduct.quantity_unit || 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-500">Category</p>
                <p className="mt-2 text-slate-900">{getCategoryName(selectedProduct.category_id)}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-500">Sub Category</p>
                <p className="mt-2 text-slate-900">{getSubCategoryName(selectedProduct.sub_category_id)}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-500">Sub-Sub Category</p>
                <p className="mt-2 text-slate-900">{getSubSubCategoryName(selectedProduct.sub_sub_category_id)}</p>
              </div>

              {isCropItem(selectedProduct) && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-emerald-700">Crop Timeline</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type of Crop</p>
                      <p className="mt-1 text-slate-900">{selectedProduct.type_of_crop || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Planting Date</p>
                      <p className="mt-1 text-slate-900">{formatDateOnly(selectedProduct.planting_crops_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Harvest Start Date</p>
                      <p className="mt-1 text-slate-900">{formatDateOnly(selectedProduct.harvesting_start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Harvest End Date</p>
                      <p className="mt-1 text-slate-900">{formatDateOnly(selectedProduct.harvesting_end_date)}</p>
                    </div>
                  </div>
                </div>
              )}

              {isCropItem(selectedProduct) && selectedProduct.destroy_status && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-amber-700">
                    Destroy / Give-Away Status: <span className="capitalize">{selectedProduct.destroy_status}</span>
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listed On</p>
                      <p className="mt-1 text-slate-900">{formatDateTime(selectedProduct.destroy_requested_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Listing Expires</p>
                      <p className="mt-1 text-slate-900">{formatDateTime(selectedProduct.destroy_expires_at)}</p>
                    </div>
                    {selectedProduct.destroy_status === 'claimed' && (
                      <>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claimed By</p>
                          <p className="mt-1 text-slate-900">
                            {selectedProduct.destroy_claimed_by_name || 'N/A'}
                            {selectedProduct.destroy_claimed_by_phone ? ` (${selectedProduct.destroy_claimed_by_phone})` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claimed On</p>
                          <p className="mt-1 text-slate-900">{formatDateTime(selectedProduct.destroy_claimed_at)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-500">Dehydrated</p>
                  <p className="mt-2 text-slate-900">{selectedProduct.is_dehydrated ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-500">Processed</p>
                  <p className="mt-2 text-slate-900">{selectedProduct.is_processed ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selectedProduct.tags && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-500">Tags</p>
                  <p className="mt-2 text-slate-900">
                    {Array.isArray(selectedProduct.tags) ? selectedProduct.tags.join(', ') : selectedProduct.tags}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-500">Description</p>
                <p className="mt-2 leading-7 text-slate-700">{selectedProduct.description || 'No description provided.'}</p>
              </div>

              {selectedProduct.product_video && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-500">Product Video</p>
                  <video
                    src={resolveMediaUrl(selectedProduct.product_video)}
                    controls
                    className="mt-2 w-full rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-3xl bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit Product' : user.role === 'super_admin' ? 'Create New Product' : 'Add Product'}
              </h2>
              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/20 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateProduct} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select Type</option>
                  <option value="Crop">Crop</option>
                  <option value="Product">Product</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Animal">Animal</option>
                </select>
                {formErrors.type && (
                  <p className="mt-2 text-xs text-red-600">{formErrors.type}</p>
                )}
              </div>

              {isAdmin && !editingId && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Upload for user
                  </label>
                  <div className="relative">
                    <input
                      type="search"
                      role="combobox"
                      aria-expanded={userDropdownOpen}
                      aria-controls="product-owner-options"
                      aria-autocomplete="list"
                      value={userSearchTerm}
                      onFocus={(event) => {
                        setUserDropdownOpen(true);
                        event.currentTarget.select();
                      }}
                      onBlur={() => setUserDropdownOpen(false)}
                      onChange={(event) => {
                        setUserSearchTerm(event.target.value);
                        setUserDropdownOpen(true);
                        setFormData((prev) => ({ ...prev, user_id: '' }));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setUserDropdownOpen(false);
                      }}
                      disabled={usersLoading}
                      placeholder={usersLoading ? 'Loading users...' : 'Search by name, email, or phone'}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    {userDropdownOpen && (
                      <div
                        id="product-owner-options"
                        role="listbox"
                        className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={!formData.user_id}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, user_id: '' }));
                            setUserSearchTerm('');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-slate-500 hover:bg-slate-50"
                        >
                          No user (use admin account)
                        </button>
                        {filteredUsers.map((listedUser) => {
                          const name = listedUser.name || `${listedUser.first_name || ''} ${listedUser.last_name || ''}`.trim();
                          return (
                            <button
                              key={listedUser.id}
                              type="button"
                              role="option"
                              aria-selected={String(formData.user_id) === String(listedUser.id)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, user_id: String(listedUser.id) }));
                                setUserSearchTerm(name || listedUser.email || `User #${listedUser.id}`);
                                setUserDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-emerald-50"
                            >
                              <span className="block font-medium">{name || `User #${listedUser.id}`}</span>
                              {(listedUser.email || listedUser.phone) && (
                                <span className="mt-0.5 block text-xs text-slate-500">
                                  {[listedUser.email, listedUser.phone].filter(Boolean).join(' — ')}
                                </span>
                              )}
                            </button>
                          );
                        })}
                        {!usersLoading && filteredUsers.length === 0 && (
                          <p className="px-4 py-3 text-sm text-slate-500">No users match your search.</p>
                        )}
                      </div>
                    )}
                  </div>
                  {usersError ? (
                    <p className="mt-2 text-xs text-red-600">{usersError}</p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      If no user is selected, this listing will belong to your admin account.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Category <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category_id && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.category_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Sub-Category {selectedCategoryId && filteredSubCategories.length > 0 ? <span className="text-red-600">*</span> : null}
                  </label>
                  <select
                    name="sub_category_id"
                    value={formData.sub_category_id}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    disabled={!selectedCategoryId}
                  >
                    <option value="">Select Sub-Category</option>
                    {filteredSubCategories.map((subCat) => (
                      <option key={subCat.id} value={subCat.id}>
                        {subCat.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.sub_category_id && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.sub_category_id}</p>
                  )}
                </div>
              </div>

              {formData.type !== 'Animal' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Sub-Sub-Category
                  </label>
                  <select
                    name="sub_sub_category_id"
                    value={formData.sub_sub_category_id}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    disabled={!selectedSubCategoryId}
                  >
                    <option value="">Select Sub-Sub-Category</option>
                    {filteredSubSubCategories.map((subSubCat) => (
                      <option key={subSubCat.id} value={subSubCat.id}>
                        {subSubCat.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.sub_sub_category_id && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.sub_sub_category_id}</p>
                  )}
                </div>
              )}

              {formData.type === 'Product' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Is this product dehydrated?
                    </label>
                    <select
                      name="is_dehydrated"
                      value={formData.is_dehydrated}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Product Type
                    </label>
                    <select
                      name="product_type"
                      value={formData.product_type}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >

                      <option value="">Select Product Type</option>
                      {selectedProductType.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>

                  </div>
                </div>
              )}

              {formData.type !== 'Animal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Min Quantity per order
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        name="min_quantity"
                        value={formData.min_quantity}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        className="w-full rounded-l-2xl border border-r-0 border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                      <select
                        name="quantity_unit"
                        value={formData.quantity_unit}
                        onChange={handleInputChange}
                        className="rounded-r-2xl border border-slate-300 bg-slate-100 px-3 py-3 text-slate-900 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="kg">Kg</option>
                        <option value="liter">Liter</option>
                        <option value="grams">Grams</option>
                        <option value="boxes">Boxes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Max Quantity per order
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        name="max_quantity"
                        value={formData.max_quantity}
                        onChange={handleInputChange}
                        placeholder="0 (No limit)"
                        min="0"
                        className="w-full rounded-l-2xl border border-r-0 border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                      <select
                        name="quantity_unit"
                        value={formData.quantity_unit}
                        onChange={handleInputChange}
                        className="rounded-r-2xl border border-slate-300 bg-slate-100 px-3 py-3 text-slate-900 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="kg">Kg</option>
                        <option value="liter">Liter</option>
                        <option value="grams">Grams</option>
                        <option value="boxes">Boxes</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Product Name <span className="text-red-600">*</span>
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

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Product Name (Hindi)
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
                  Product Name (Marathi)
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

              {formData.type !== 'Animal' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />

                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Stock Quantity
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

              {formData.type === 'Crop' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Planting Crops Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="planting_crops_date"
                      value={formData.planting_crops_date}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    {formErrors.planting_crops_date && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.planting_crops_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Type of Crop
                    </label>
                    <select
                      name="type_of_crop"
                      value={formData.type_of_crop}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select Type of Crop</option>
                      <option value="Organic">Organic</option>
                      <option value="Inorganic">Inorganic</option>
                    </select>

                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Harvest Start Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="harvesting_start_date"
                      value={formData.harvesting_start_date}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    {formErrors.harvesting_start_date && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.harvesting_start_date}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Harvest End Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="harvesting_end_date"
                      value={formData.harvesting_end_date}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    {formErrors.harvesting_end_date && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.harvesting_end_date}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Is Processed <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="is_processed"
                    value={formData.is_processed}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                {isAdmin ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Status <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                ) : (
                  !editingId && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                      Yeh {formData.type === 'Crop' ? 'crop' : formData.type === 'Nursery' ? 'nursery item' : formData.type === 'Animal' ? 'animal listing' : 'product'} submit hone ke baad "Pending" status me rahega. Super admin approve karega tabhi yeh Crops/Products page par sabko dikhega.
                    </div>
                  )
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product... (quality, origin, benefits, etc.)"
                  rows="4"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Product Image
                </label>
                <div className="flex items-center gap-5">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-emerald-200 bg-slate-100">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Product preview"
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
                {formErrors.image_url && (
                  <p className="mt-2 text-xs text-red-600">{formErrors.image_url}</p>
                )}
                {formData.image_url instanceof File && (
                  <p className="mt-2 text-sm text-emerald-600">📁 {formData.image_url.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Product Video (MP4, WebM, etc.)
                </label>
                <input
                  type="file"
                  name="product_video"
                  onChange={handleInputChange}
                  accept="video/*"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                />
                {formData.product_video instanceof File && (
                  <p className="mt-2 text-sm text-emerald-600">🎥 {formData.product_video.name}</p>
                )}
                {editingId && typeof formData.product_video === 'string' && formData.product_video && (
                  <p className="mt-2 text-sm text-slate-500">Current video: {formData.product_video}</p>
                )}
                <p className="mt-2 text-xs text-slate-400">Bade videos submit karne ke baad automatically ~3-4MB tak compress ho jayenge.</p>
              </div>



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
              {!editingId && RECAPTCHA_SITE_KEY && (
                <div>
                  <div id="admin-products-recaptcha-container" className="flex justify-center sm:justify-start" />
                  {formErrors.recaptcha && (
                    <p className="mt-2 text-xs text-red-600">{formErrors.recaptcha}</p>
                  )}
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4 justify-end pt-4 sm:pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:shadow-lg transition text-sm sm:text-base"
                >
                  {(() => {
                    const label = formData.type === 'Product' ? 'Product' : formData.type === 'Nursery' ? 'Nursery' : formData.type === 'Animal' ? 'Animal' : 'Crop';
                    return editingId ? `Update ${label}` : `Create ${label}`;
                  })()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
