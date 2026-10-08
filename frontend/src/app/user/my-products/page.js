
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Eye, Plus, Trash2, Edit2, MessageSquare, TriangleAlert } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

export default function MyProductListPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inquiryCounts, setInquiryCounts] = useState({});

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);
  }, []);

  const t = translations[language];

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubCategories();
    fetchSubSubCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/my-products');
      const data = response.data;
      const normalizedProducts = Array.isArray(data) ? data : [];
      setProducts(normalizedProducts);

      const counts = await Promise.all(
        normalizedProducts?.map(async (product) => {
          try {
            const inquiryResponse = await api.get(`/product-inquiries/product/${product.id}`);
            const inquiries = Array.isArray(inquiryResponse.data) ? inquiryResponse.data : [];
            return [product.id, inquiries.length];
          } catch (inquiryError) {
            console.error('Error fetching inquiry count:', inquiryError);
            return [product.id, 0];
          }
        })
      );

      setInquiryCounts((prev) => ({ ...prev, ...Object.fromEntries(counts) }));
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

  const isCropItem = (p) => {
    const type = p?.type ? String(p.type).toLowerCase() : '';
    return type.includes('crop');
  };

  const isNurseryItem = (p) => {
    const type = p?.type ? String(p.type).toLowerCase() : '';
    return type.includes('nursery');
  };

  const isAnimalItem = (p) => {
    const type = p?.type ? String(p.type).toLowerCase() : '';
    return type.includes('animal');
  };

  const getDisplayName = (item, fallback = '') => {
    if (!item) return fallback;

    if (language === 'hi' && item.name_hindi) return item.name_hindi;
    if (language === 'mr' && item.name_marathi) return item.name_marathi;

    return item.name || item.name_hindi || item.name_marathi || fallback;
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return getDisplayName(cat, 'N/A');
  };

  const getSubCategoryName = (id) => {
    const subCat = subCategories.find((s) => s.id === id);
    return getDisplayName(subCat, 'N/A');
  };

  const getSubSubCategoryName = (id) => {
    const subSubCat = subSubCategories.find((ssc) => ssc.id === id);
    return getDisplayName(subSubCat, 'N/A');
  };

  // Same fallback order as the public crops listing: product's own image first,
  // then its sub-category image, then its category image.
  const getProductDisplayImageUrl = (product) => {
    const resolve = (value) => {
      if (!value || typeof value !== 'string' || !value.trim()) return '';
      const trimmed = value.trim();
      if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
      const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `${IMAGE_BASE_URL || ''}${normalizedPath}`;
    };

    const productImage = resolve(product?.image_url);
    if (productImage) return productImage;

    const subCategory = subCategories.find((sub) => Number(sub.id) === Number(product?.sub_category_id));
    const subCategoryImage = resolve(subCategory?.image);
    if (subCategoryImage) return subCategoryImage;

    const category = categories.find((cat) => Number(cat.id) === Number(product?.category_id));
    return resolve(category?.image_url);
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
        title: t?.swal?.updateFailedTitle || 'Failed',
        text: err.response?.data?.message || 'Could not update active status',
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
    }
  };

  const handleDeleteProduct = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t?.swal?.deleteConfirmTitle || 'Are you sure?',
      text: t?.swal?.deleteConfirmText || 'This item will be permanently deleted.',
      showCancelButton: true,
      confirmButtonText: t?.swal?.deleteConfirmButton || 'Yes, delete it',
      cancelButtonText: t?.swal?.cancelButton || 'Cancel',
      confirmButtonColor: '#d33',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((product) => product.id !== id));
      Swal.fire({
        icon: 'success',
        title: t?.swal?.deletedTitle || 'Deleted',
        text: t?.swal?.deletedText || 'The item has been deleted.',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err.message);
      console.error('Error deleting product:', err);
      Swal.fire({
        icon: 'error',
        title: t?.swal?.deleteFailedTitle || 'Delete Failed',
        text: err.message || t?.swal?.deleteFailedText || 'Error deleting product',
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
    }
  };

  const handleMarkDestroy = async (product) => {
    const confirmText = (t?.swal?.markDestroyConfirmText || 'Traders will be notified that "{name}" is available to take. If nobody claims it within 3 days, it will become inactive.').replace('{name}', product.name);
    const result = await Swal.fire({
      icon: 'warning',
      title: t?.swal?.markDestroyConfirmTitle || 'Give this crop away?',
      text: confirmText,
      showCancelButton: true,
      confirmButtonText: t?.swal?.markDestroyConfirmButton || 'Yes, notify traders',
      cancelButtonText: t?.swal?.cancelButton || 'Cancel',
      confirmButtonColor: '#d97706',
    });
    if (!result.isConfirmed) return;
    try {
      await api.post(`/products/${product.id}/mark-destroy`);
      await fetchProducts();
      Swal.fire({
        icon: 'success',
        title: t?.swal?.tradersNotifiedTitle || 'Traders notified',
        text: t?.swal?.tradersNotifiedText || 'This crop is now listed for pickup for the next 3 days.',
        timer: 2500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t?.swal?.markDestroyFailedTitle || 'Failed',
        text: err.response?.data?.message || t?.swal?.markDestroyFailedText || 'Could not list this crop for pickup',
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
    }
  };

  const getDestroyBadge = (product) => {
    if (product.destroy_status === 'claimed') {
      return { label: 'Claimed', className: 'bg-emerald-100 text-emerald-700' };
    }
    if (product.destroy_status === 'expired') {
      return { label: 'Expired', className: 'bg-slate-200 text-slate-500' };
    }
    if (product.destroy_status === 'pending' && product.destroy_expires_at) {
      const msLeft = new Date(product.destroy_expires_at).getTime() - Date.now();
      const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      return { label: `${daysLeft}d left`, className: 'bg-amber-100 text-amber-700' };
    }
    return null;
  };

  const formatDateOnly = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');
  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

  const getAddLabel = () => t.userPanel?.myProduct.addProduct;

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product) => {
    router.push(`/user/add-product?id=${product.id}`);
  };

  const handleViewInquiries = (product) => {
    router.push(`/user/my-inquiries?productId=${product.id}`);
  };

  const displayedItems = products;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6 lg:p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {t.userPanel?.myProduct.myCropsOrProducts || 'My Crops or Products'}
          </h1>

          <button
            onClick={() => router.push('/user/add-product')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold hover:shadow-lg transition text-sm sm:text-base"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="truncate">{getAddLabel()}</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-red-700">
            {error}
          </div>
        )}

        {/* Desktop: Products Table */}
        <div className="hidden md:block rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : displayedItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 mb-4">No items yet</p>
              <button
                onClick={() => router.push('/user/add-product')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
              >
                <Plus size={20} />
                {getAddLabel()}
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700"> {translations[language].userPanel?.myProduct.productName}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700"> {translations[language].userPanel?.myProduct.category}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700"> {translations[language].userPanel?.myProduct.subCategory}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700"> {translations[language].userPanel?.myProduct.subsubCategory}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700"> {translations[language]?.inquiry}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700"> {translations[language]?.Status}</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">Active</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700"> {translations[language]?.action}</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((product, index) => (
                  <tr
                    key={product.id}
                    className={`border-b border-slate-200 hover:bg-slate-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{getDisplayName(product, product.name)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{product.type}</td>

                    <td className="px-6 py-4 text-sm text-slate-600">{getCategoryName(product.category_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getSubCategoryName(product.sub_category_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{getSubSubCategoryName(product.sub_sub_category_id)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <button
                        onClick={() => handleViewInquiries(product)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2 py-2 text-slate-600 hover:bg-slate-100 transition"
                        title="View Inquiries"
                      >

                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {inquiryCounts[product.id] ?? 0}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${String(product.status).toLowerCase() === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : String(product.status).toLowerCase() === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {product.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
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

                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">

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
                        {isCropItem(product) && (
                          <button
                            onClick={() => handleMarkDestroy(product)}
                            disabled={product.destroy_status === 'pending' || product.destroy_status === 'claimed'}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border text-slate-600 bg-yellow-300 hover:bg-yellow-200 transition disabled:cursor-not-allowed disabled:opacity-60"
                            title={product.destroy_status === 'pending' ? 'Waiting for a trader to claim' : product.destroy_status === 'claimed' ? 'Already claimed' : 'Give this crop away'}
                          >
                            <TriangleAlert size={16} />
                          </button>
                        )}

                      </div>
                      {isCropItem(product) && getDestroyBadge(product) && (
                        <div className="mt-2 flex justify-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${getDestroyBadge(product).className}`}>
                            {getDestroyBadge(product).label}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile: Card View */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-1 sm:col-span-2 text-center py-8 text-slate-500">{t?.loading}</div>
          ) : displayedItems.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 text-center py-8">
              <p className="text-slate-500 mb-4">{t?.noItemsYet}</p>
              <button
                onClick={() => router.push('/user/add-product')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 sm:px-6 py-2 sm:py-3 text-white font-semibold hover:bg-emerald-700 transition text-sm sm:text-base"
              >
                <Plus size={18} />
                {getAddLabel()}
              </button>
            </div>
          ) : (
            displayedItems.map((product) => (
              <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                {/* Image */}
                <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-slate-100">
                  {getProductDisplayImageUrl(product) ? (
                    <img
                      src={getProductDisplayImageUrl(product)}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      {t?.noImage}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">{getDisplayName(product, product.name)}</h3>
                <p className="text-emerald-600 font-bold text-base mb-3">₹{parseFloat(product.price).toFixed(2)}</p>

                {/* Details Grid */}
                <div className="space-y-2 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t?.userPanel.myProduct.type || 'Type'}:</span>
                    <span className="font-medium text-slate-900 text-right flex-1 ml-2">{product.type || 'Product'}</span>
                  </div>
                  {!isNurseryItem(product) && !isAnimalItem(product) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t?.userPanel.myProduct.category}:</span>
                        <span className="font-medium text-slate-900 text-right flex-1 ml-2">{getCategoryName(product.category_id)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t?.userPanel.myProduct.subCategory}:</span>
                        <span className="font-medium text-slate-900 text-right flex-1 ml-2">{getSubCategoryName(product.sub_category_id)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{t?.userPanel.myProduct.subsubCategory}:</span>
                        <span className="font-medium text-slate-900 text-right flex-1 ml-2">{getSubSubCategoryName(product.sub_sub_category_id)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t?.StockQuantity}:</span>
                    <span className="font-medium">{product.stock_quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t?.Status}:</span>
                    <span className={`font-medium ${String(product.status).toLowerCase() === 'approved'
                      ? 'text-emerald-600'
                      : String(product.status).toLowerCase() === 'rejected'
                        ? 'text-red-600'
                        : 'text-amber-600'
                      }`}>
                      {product.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Active:</span>
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
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleViewProduct(product)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition py-2 text-xs font-medium"
                    title={t?.view}
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">{t?.view}</span>
                  </button>
                  <button
                    onClick={() => handleViewInquiries(product)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition py-2 text-xs font-medium"
                    title={t?.inquiry}
                  >
                    <MessageSquare size={14} />
                    <span className="inline-block rounded-full bg-emerald-600 px-1.5 text-xs font-bold text-white">
                      {inquiryCounts[product.id] ?? 0}
                    </span>
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition py-2 text-xs font-medium"
                    title={t?.edit}
                  >
                    <Edit2 size={14} />
                    <span className="hidden sm:inline">{t?.edit}</span>
                  </button>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="w-full mt-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition py-2 text-xs font-medium flex items-center justify-center gap-1"
                  title={t?.delete}
                >
                  <Trash2 size={14} />
                  {t?.delete}
                </button>
                {isCropItem(product) && (
                  <div className="mt-2">
                    <button
                      onClick={() => handleMarkDestroy(product)}
                      disabled={product.destroy_status === 'pending' || product.destroy_status === 'claimed'}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-yellow-300 text-black bg-yellow-300 hover:bg-yellow-200 transition py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
                      title={product.destroy_status === 'pending' ? 'Waiting for a trader to claim' : product.destroy_status === 'claimed' ? 'Already claimed' : 'Give this crop away'}
                    >
                      <TriangleAlert size={16} />
                      {getDestroyBadge(product) ? getDestroyBadge(product).label : `${t?.userPanel.myProduct.distroyCrop}`}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
              <h2 className="text-lg sm:text-2xl font-bold text-white">
                Product Details
              </h2>

              <button
                onClick={() => setShowViewModal(false)}
                className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">

              {/* Top Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

                {/* Image */}
                <div className="flex justify-center">
                  {getProductDisplayImageUrl(selectedProduct) ? (
                    <img
                      src={getProductDisplayImageUrl(selectedProduct)}
                      alt={selectedProduct.name}
                      className="h-48 w-48 sm:h-64 sm:w-64 rounded-2xl sm:rounded-3xl object-cover border shadow"
                    />
                  ) : (
                    <div className="h-48 w-48 sm:h-64 sm:w-64 rounded-2xl sm:rounded-3xl border bg-slate-100 flex items-center justify-center text-slate-500">
                      No Image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="md:col-span-2 space-y-3 sm:space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Product Name</p>
                      <p className="font-semibold text-slate-900 text-sm sm:text-base line-clamp-2">
                        {selectedProduct.name}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Price</p>
                      <p className="font-semibold text-emerald-600 text-base sm:text-lg">
                        ₹{selectedProduct.price}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Hindi Name</p>
                      <p className="font-semibold text-sm sm:text-base line-clamp-1">
                        {selectedProduct.name_hindi || "N/A"}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Marathi Name</p>
                      <p className="font-semibold text-sm sm:text-base line-clamp-1">
                        {selectedProduct.name_marathi || "N/A"}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Category</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {getCategoryName(selectedProduct.category_id)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Sub Category</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {getSubCategoryName(
                          selectedProduct.sub_category_id
                        )}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">
                        Sub Sub Category
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {getSubSubCategoryName(
                          selectedProduct.sub_sub_category_id
                        )}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">
                        Stock Quantity
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedProduct.stock_quantity}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">
                        Status
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedProduct.status === "Active"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                          }`}
                      >
                        {selectedProduct.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">
                        Is Processed
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedProduct.is_processed ? "Yes" : "No"}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">
                        Is Dehydrated
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedProduct.is_dehydrated ? "Yes" : "No"}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedProduct.type || "Product"}
                      </p>
                    </div>

                    {selectedProduct.product_type && (
                      <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                        <p className="text-xs text-slate-500">Product Type</p>
                        <p className="font-semibold text-sm sm:text-base">
                          {selectedProduct.product_type}
                        </p>
                      </div>
                    )}

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Min / Max Quantity</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedProduct.min_quantity || 0} - {selectedProduct.max_quantity || 0} {selectedProduct.quantity_unit || "kg"}
                      </p>
                    </div>

                    {selectedProduct.tags && (
                      <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                        <p className="text-xs text-slate-500">Tags</p>
                        <p className="font-semibold text-sm sm:text-base">
                          {Array.isArray(selectedProduct.tags) ? selectedProduct.tags.join(', ') : selectedProduct.tags}
                        </p>
                      </div>
                    )}

                    {String(selectedProduct.type).toLowerCase() === 'crop' && (
                      <>
                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                          <p className="text-xs text-slate-500">Type of Crop</p>
                          <p className="font-semibold text-sm sm:text-base">
                            {selectedProduct.type_of_crop || "N/A"}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                          <p className="text-xs text-slate-500">Planting Date</p>
                          <p className="font-semibold text-sm sm:text-base">
                            {formatDateOnly(selectedProduct.planting_crops_date)}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                          <p className="text-xs text-slate-500">Harvesting Start</p>
                          <p className="font-semibold text-sm sm:text-base">
                            {formatDateOnly(selectedProduct.harvesting_start_date)}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                          <p className="text-xs text-slate-500">Harvesting End</p>
                          <p className="font-semibold text-sm sm:text-base">
                            {formatDateOnly(selectedProduct.harvesting_end_date)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Destroy / Give-away Details */}
              {String(selectedProduct.type).toLowerCase() === 'crop' && selectedProduct.destroy_status && (
                <div className="mt-6 sm:mt-8">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                    Destroy / Give-away Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Status</p>
                      {(() => {
                        const badge = getDestroyBadge(selectedProduct);
                        return (
                          <span
                            className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium capitalize ${badge?.className || 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            {badge?.label || selectedProduct.destroy_status}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Requested On</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatDateTime(selectedProduct.destroy_requested_at)}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <p className="text-xs text-slate-500">Available Until</p>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatDateTime(selectedProduct.destroy_expires_at)}
                      </p>
                    </div>

                    {selectedProduct.destroy_status === 'claimed' && (
                      <>
                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                          <p className="text-xs text-slate-500">Claimed On</p>
                          <p className="font-semibold text-sm sm:text-base">
                            {formatDateTime(selectedProduct.destroy_claimed_at)}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                          <p className="text-xs text-slate-500">Claimed By</p>
                          <p className="font-semibold text-sm sm:text-base">
                            {selectedProduct.destroy_claimed_by_name || 'N/A'}
                            {selectedProduct.destroy_claimed_by_phone ? ` (${selectedProduct.destroy_claimed_by_phone})` : ''}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-6 sm:mt-8">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                  Description
                </h3>

                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-slate-700">
                  {selectedProduct.description ||
                    "No description available."}
                </div>
              </div>

              {/* Video */}
              {selectedProduct.product_video && (
                <div className="mt-6 sm:mt-8">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                    Product Video
                  </h3>

                  <video
                    controls
                    className="w-full rounded-xl sm:rounded-2xl border"
                  >
                    <source
                      src={selectedProduct.product_video}
                    />
                  </video>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 sm:mt-8 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
