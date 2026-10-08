



'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, MessageSquare, X } from 'lucide-react';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

function MyInquiriesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const productIdParam = searchParams.get('productId');
    const [products, setProducts] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedType, setSelectedType] = useState('all');
    const [loading, setLoading] = useState(true);
    const [inquiryCounts, setInquiryCounts] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductInquiries, setSelectedProductInquiries] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [inquiriesLoading, setInquiriesLoading] = useState(false);

    const [language, setLanguage] = useState('en');
    useEffect(() => {
        const lang = localStorage.getItem('language');
        if (lang) {
            setLanguage(lang);
        }
    }, []);

    const t = translations[language];
    const inquiryText = t?.userPanel?.MyInquiries;

    const getProductType = (product) => {
        const type = String(product.type || '').toLowerCase();
        return ['crop', 'animal', 'nursery'].includes(type) ? type : 'product';
    };

    const inquiryItems = useMemo(() => [
        ...products.map((product) => ({
            ...product,
            inquiryKind: getProductType(product),
            inquiryKey: `product-${product.id}`,
        })),
        ...services.map((service) => ({
            ...service,
            inquiryKind: 'service',
            inquiryKey: `service-${service.id}`,
        })),
    ], [products, services]);

    const filteredItems = selectedType === 'all'
        ? inquiryItems
        : inquiryItems.filter((item) => item.inquiryKind === selectedType);

    const getItemName = (item) => item.inquiryKind === 'service'
        ? item.name
        : language === 'hi'
            ? item.name_hindi || item.name
            : language === 'mr'
                ? item.name_marathi || item.name
                : item.name;

    const getTypeLabel = (type) => inquiryText?.types?.[type] || type;

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (!productIdParam || inquiryItems.length === 0) return;

        const selected = inquiryItems.find((product) => String(product.id) === String(productIdParam));
        if (selected) {
            handleViewInquiries(selected);
        }
    }, [productIdParam, inquiryItems]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const [productsResult, servicesResult] = await Promise.allSettled([
                api.get('/products/my-products'),
                api.get('/services/my-services'),
            ]);
            const productsResponse = productsResult.status === 'fulfilled' ? productsResult.value : { data: [] };
            const servicesResponse = servicesResult.status === 'fulfilled' ? servicesResult.value : { data: [] };
            const normalizedProducts = Array.isArray(productsResponse.data) ? productsResponse.data : [];
            const normalizedServices = Array.isArray(servicesResponse.data) ? servicesResponse.data : [];
            setProducts(normalizedProducts);
            setServices(normalizedServices);

            const counts = await Promise.all([
                ...normalizedProducts.map(async (product) => {
                    try {
                        const inquiryResponse = await api.get(`/product-inquiries/product/${product.id}`);
                        const inquiries = Array.isArray(inquiryResponse.data) ? inquiryResponse.data : [];
                        return [`product-${product.id}`, inquiries.length];
                    } catch (error) {
                        console.error('Error fetching inquiry count:', error);
                        return [`product-${product.id}`, 0];
                    }
                }),
                ...normalizedServices.map(async (service) => {
                    try {
                        const inquiryResponse = await api.get(`/service-inquiries/service/${service.id}`);
                        const inquiries = Array.isArray(inquiryResponse.data) ? inquiryResponse.data : [];
                        return [`service-${service.id}`, inquiries.length];
                    } catch (error) {
                        console.error('Error fetching service inquiry count:', error);
                        return [`service-${service.id}`, 0];
                    }
                }),
            ]);

            setInquiryCounts(Object.fromEntries(counts));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewInquiries = async (product) => {
        setSelectedProduct(product);
        setShowModal(true);
        setInquiriesLoading(true);
        setSelectedProductInquiries([]);

        try {
            const endpoint = product.inquiryKind === 'service'
                ? `/service-inquiries/service/${product.id}`
                : `/product-inquiries/product/${product.id}`;
            const response = await api.get(endpoint);
            setSelectedProductInquiries(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching inquiries:', error);
        } finally {
            setInquiriesLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setSelectedProductInquiries([]);
        router.replace('/user/my-inquiries');
    };

    return (
        <div className="min-h-screen w-full bg-slate-50">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>

                        <h1 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900"> {t?.userPanel.MyInquiries?.myInquiries}</h1>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                    {['all', 'product', 'crop', 'animal', 'nursery', 'service'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedType(type)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selectedType === type
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 bg-white text-slate-600 hover:bg-emerald-50'
                                }`}
                        >
                            {getTypeLabel(type)}
                        </button>
                    ))}
                </div>

                {/* Desktop: Table View */}
                <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading products...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">{inquiryText?.noItems || 'No listings found.'}</div>
                    ) : (
                        <table className="w-full">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{inquiryText?.listing || t.product}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.price}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{inquiryText?.type || t.type}</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">{t.inquiry}</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">{t.action}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((product, index) => (
                                    <tr key={product.inquiryKey} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {product.image_url ? (
                                                    <img src={resolveMediaUrl(product.image_url)} alt={product.name} className="h-12 w-12 rounded-xl object-cover border border-slate-200" />
                                                ) : (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500">
                                                        <MessageSquare size={18} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {getItemName(product)}
                                                    </p>

                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{product.price ? `₹${Number(product.price).toFixed(2)}` : inquiryText?.onRequest || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{getTypeLabel(product.inquiryKind)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <span className="rounded-full bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">
                                                {inquiryCounts[product.inquiryKey] ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleViewInquiries(product)}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                            >
                                                <Eye size={16} />
                                                {t?.view}
                                            </button>
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
                        <div className="col-span-1 sm:col-span-2 text-center py-8 text-slate-500">Loading products...</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="col-span-1 sm:col-span-2 text-center py-8 text-slate-500">{inquiryText?.noItems || 'No listings found.'}</div>
                    ) : (
                        filteredItems.map((product) => (
                            <div key={product.inquiryKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                                {/* Image and Name */}
                                <div className="flex items-center gap-3 mb-4">
                                    {product.image_url ? (
                                        <img src={resolveMediaUrl(product.image_url)} alt={product.name} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover border border-slate-200" />
                                    ) : (
                                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500">
                                            <MessageSquare size={18} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 text-sm line-clamp-2">
                                            {getItemName(product)}
                                        </p>
                                    </div>
                                </div>

                                {/* Price and Inquiries */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-500">{t.price}</p>
                                        <p className="text-emerald-600 font-bold text-sm">{product.price ? `₹${Number(product.price).toFixed(2)}` : inquiryText?.onRequest || '-'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">{t.inquiry}</p>
                                        <span className="inline-block rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                                            {inquiryCounts[product.inquiryKey] ?? 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => handleViewInquiries(product)}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                                >
                                    <Eye size={16} />
                                    {t?.view}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
                    <div className="w-full max-w-3xl overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 sm:px-6 py-4 sm:py-5 text-white">
                            <div className="min-w-0">
                                <h2 className="text-lg sm:text-2xl font-bold line-clamp-2">{inquiryText?.inquiriesFor || 'Inquiries for'}&nbsp;
                                    {getItemName(selectedProduct)}
                                </h2>
                                <p className="mt-1 text-xs sm:text-sm text-emerald-50">{inquiryText?.customerRequests || 'Customer questions and requests'}</p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
                            >
                                <X size={20} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        <div className="max-h-[80vh] overflow-y-auto p-4 sm:p-6">
                            {inquiriesLoading ? (
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6 text-center text-sm sm:text-base text-slate-500">Loading inquiries...</div>
                            ) : selectedProductInquiries.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8 text-center text-sm sm:text-base text-slate-500">{inquiryText?.noInquiries || 'No inquiries found for this listing.'}</div>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    {selectedProductInquiries.map((inquiry) => (
                                        <div key={inquiry.id} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{inquiry.name || 'Anonymous'}</h3>
                                                <span className="text-xs text-slate-500 text-right sm:text-left">{inquiry.created_at ? new Date(inquiry.created_at).toLocaleString() : ''}</span>
                                            </div>
                                            <p className="mt-2 text-xs sm:text-sm text-slate-600">{inquiry.message || t?.userPanel.MyInquiries.Nomessageprovided}</p>
                                            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500">
                                                {inquiry.phone && <span>{t?.userPanel.myProfile.phone} Phone: {inquiry.phone}</span>}
                                                {inquiry.email && <span>{t?.userPanel.myProfile.email}: {inquiry.email}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MyInquiriesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full bg-slate-50 p-8 text-center text-slate-500">Loading inquiries...</div>}>
            <MyInquiriesContent />
        </Suspense>
    );
}