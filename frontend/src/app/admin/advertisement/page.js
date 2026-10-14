"use client";
import { useState, useEffect } from 'react';
import api from '../../utils/api.js';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '';

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

// Builds a 'YYYY-MM-DD' string from the date's LOCAL components — never use toISOString()
// here, since it converts to UTC first and silently shifts the date back a day in
// positive-offset timezones (e.g. IST).
const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Computes Start Date + duration (interpreted per unit label), with the start day itself
// counted as day 1 — e.g. a 1-month ad starting 13-Oct runs through 12-Nov, not 13-Nov.
// Returns '' when the duration is 'Lifetime' (no fixed end) or the inputs aren't ready yet.
const calculateEndDate = (startDate, duration, label) => {
    if (!startDate || !duration || !label || label === 'Lifetime') return '';

    const start = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return '';

    const end = new Date(start);
    const amount = Number(duration);
    if (!Number.isFinite(amount)) return '';

    if (label === 'Days') end.setDate(end.getDate() + amount);
    else if (label === 'Months') end.setMonth(end.getMonth() + amount);
    else if (label === 'Years') end.setFullYear(end.getFullYear() + amount);
    else return '';

    end.setDate(end.getDate() - 1);

    return toDateInputValue(end);
};


export default function Advertisement() {
    const [advertisements, setAdvertisements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imageError, setImageError] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [allSizes, setAllSizes] = useState([]);
    const [allPrices, setAllPrices] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        ad_size_id: '',
        ad_duration_id: '',
        status: 'Active',
        startdate: '',
        enddate: '',
        keywords: '',
        image: null,
        type: 'image',
        tags: ''
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            ad_size_id: '',
            ad_duration_id: '',
            status: 'Active',
            startdate: '',
            enddate: '',
            keywords: '',
            image: null,
            type: 'image',
            tags: ''
        });
    };

    const fetchSizesAndPrices = async () => {
        try {
            const [sizeResponse, priceResponse] = await Promise.all([
                api.get('/advertisement-sizes'),
                api.get('/advertisement-prices'),
            ]);
            setAllSizes(Array.isArray(sizeResponse.data) ? sizeResponse.data : []);
            setAllPrices(Array.isArray(priceResponse.data) ? priceResponse.data : []);
        } catch (err) {
            console.error('Error fetching sizes/prices:', err);
        }
    };

    const sizes = allSizes.filter((s) => s.status === 'Active');
    const prices = allPrices.filter(
        (p) => p.status === 'Active' && p.size_status !== 'Inactive' && p.duration_status !== 'Inactive'
    );

    const selectedSize = allSizes.find((s) => String(s.id) === String(formData.ad_size_id));
    const isSelectedSizeInactive = Boolean(formData.ad_size_id) && !sizes.some((s) => String(s.id) === String(formData.ad_size_id));
    const availableDurationsForSize = prices.filter((p) => String(p.ad_size_id) === String(formData.ad_size_id));
    const selectedPrice = allPrices.find(
        (p) => String(p.ad_size_id) === String(formData.ad_size_id) && String(p.ad_duration_id) === String(formData.ad_duration_id)
    );
    const isSelectedDurationInactive = Boolean(formData.ad_duration_id) && !availableDurationsForSize.some((p) => String(p.ad_duration_id) === String(formData.ad_duration_id));

    // Keep End Date in sync whenever Start Date or the selected duration changes.
    useEffect(() => {
        if (!selectedPrice) return;
        const nextEndDate = calculateEndDate(formData.startdate, selectedPrice.duration, selectedPrice.label);
        setFormData((prev) => (prev.enddate === nextEndDate ? prev : { ...prev, enddate: nextEndDate }));
    }, [formData.startdate, selectedPrice?.duration, selectedPrice?.label]);

    const openCreateModal = () => {
        resetForm();
        setEditingId(null);
        setFormErrors({});
        setShowModal(true);
    };

    const openEditModal = (advertisement) => {
        setFormErrors({});
        setFormData({
            title: advertisement.title || '',
            description: advertisement.description || '',
            ad_size_id: advertisement.ad_size_id || '',
            ad_duration_id: advertisement.ad_duration_id || '',
            status: advertisement.status || 'Active',
            startdate: advertisement.startdate || '',
            enddate: advertisement.enddate || '',
            keywords: advertisement.keywords || '',
            image: null,
            type: advertisement.type === 'video' ? 'video' : 'image',
            tags: advertisement.tags || ''
        });
        setEditingId(advertisement.id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        resetForm();
        setError('');
        setImageError('');
        setFormErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setFormErrors((prev) => ({ ...prev, [name]: undefined }));

        if (name === 'image') {
            setFormData((prev) => ({ ...prev, image: files?.[0] || null }));
            setImageError('');
            return;
        }

        if (name === 'type') {
            setImageError('');
            setFormData((prev) => ({ ...prev, type: value, image: null }));
            return;
        }

        if (name === 'ad_size_id') {
            setImageError('');
            setFormData((prev) => ({ ...prev, ad_size_id: value, ad_duration_id: '' }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const IMAGE_SIZE_TOLERANCE_PX = 5;

    const getImageDimensions = (file) =>
        new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Could not read image file'));
            };
            img.src = objectUrl;
        });

    const fetchAdvertisements = async () => {
        try {
            setLoading(true);
            const response = await api.get('/advertisements');
            setAdvertisements(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching advertisements:', err);
            setError('Failed to fetch advertisements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvertisements();
        fetchSizesAndPrices();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredErrors = {};
        if (!formData.title.trim()) requiredErrors.title = 'Title is required';
        if (!formData.ad_size_id) requiredErrors.ad_size_id = 'Size is required';
        if (!formData.ad_duration_id) requiredErrors.ad_duration_id = 'Duration is required';
        if (!formData.startdate) requiredErrors.startdate = 'Start date is required';
        if (!formData.enddate && selectedPrice?.label !== 'Lifetime') requiredErrors.enddate = 'End date is required';
        if (!editingId && !(formData.image instanceof File)) requiredErrors.image = formData.type === 'video' ? 'Video is required' : 'Image is required';

        if (Object.keys(requiredErrors).length > 0) {
            setFormErrors(requiredErrors);
            return;
        }
        setFormErrors({});

        if (formData.image instanceof File && formData.type !== 'video') {
            if (!selectedSize) {
                setImageError('Please select a size before uploading an image');
                return;
            }

            const expected = { width: selectedSize.width, height: selectedSize.height };
            try {
                const actual = await getImageDimensions(formData.image);
                if (
                    Math.abs(actual.width - expected.width) > IMAGE_SIZE_TOLERANCE_PX ||
                    Math.abs(actual.height - expected.height) > IMAGE_SIZE_TOLERANCE_PX
                ) {
                    setImageError(
                        `Selected size is ${expected.width}x${expected.height}px, but the uploaded image is ${actual.width}x${actual.height}px. Please upload an image matching the selected size.`
                    );
                    return;
                }
            } catch (err) {
                setImageError('Could not read the selected image. Please try a different file.');
                return;
            }
        }

        setSubmitting(true);
        setError('');
        setImageError('');

        try {
            const form = new FormData();
            form.append('title', formData.title);
            form.append('description', formData.description);
            form.append('keywords', formData.keywords);
            form.append('startdate', formData.startdate);
            form.append('enddate', formData.enddate);
            form.append('ad_size_id', formData.ad_size_id);
            form.append('ad_duration_id', formData.ad_duration_id);
            form.append('status', formData.status);
            form.append('tags', formData.tags);
            form.append('type', formData.type);
            if (formData.image instanceof File) {
                form.append('image', formData.image);
            }

            if (editingId) {
                await api.put(`/advertisements/${editingId}`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.post('/advertisements', form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            await fetchAdvertisements();
            closeModal();
        } catch (err) {
            console.error('Error submitting advertisement:', err);
            const message = err?.response?.data?.message || 'Failed to submit advertisement';
            if (/image/i.test(message)) {
                setImageError(message);
            } else {
                setError(message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        
        if (!window.confirm('Are you sure you want to delete this advertisement?')) return;

        try {
            await api.delete(`/advertisements/${id}`);
            await fetchAdvertisements();
        } catch (err) {
            console.error('Error deleting advertisement:', err);
            setError(err?.response?.data?.message || 'Failed to delete advertisement');
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">Advertisement</h1>
                    <p className="mt-2 text-sm text-slate-600">Create, update, and remove advertisements from the platform.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl"
                >
                    + Add Advertisement
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                {loading ? (
                    <p className="text-sm text-slate-500">Loading advertisements...</p>
                ) : advertisements.length === 0 ? (
                    <p className="text-sm text-slate-500">No advertisements found.</p>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {advertisements.map((ad) => (
                            <div key={ad.id} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">{ad.title}</h3>
                                        <span
                                            className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ad.status === 'Inactive'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                        >
                                            {ad.status || 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(ad)}
                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ad.id)}
                                            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {ad.image ? (
                                    ad.type === 'video' ? (
                                        <video
                                            src={resolveMediaUrl(ad.image)}
                                            className="mt-4 h-40 w-full rounded-xl object-cover"
                                            controls
                                            muted
                                        />
                                    ) : (
                                        <img
                                            src={resolveMediaUrl(ad.image)}
                                            alt={ad.title}
                                            className="mt-4 h-40 w-full rounded-xl object-cover"
                                        />
                                    )
                                ) : (
                                    <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                                        No media
                                    </div>
                                )}

                                <p className="mt-4 text-sm text-slate-700">{ad.description || 'No description provided.'}</p>
                                <p className="mt-2 text-sm text-slate-500">Keywords: {ad.keywords || '—'}</p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Size: {ad.size_width && ad.size_height ? `${ad.size_width} x ${ad.size_height} (${ad.size_type || 'Horizontal'})` : '—'}
                                </p>
                                <p className="mt-2 text-sm text-slate-500">Duration: {ad.duration || '—'}</p>
                                <p className="mt-2 text-sm text-slate-500">Price: {ad.price ? `₹${Number(ad.price).toLocaleString('en-IN')}` : '—'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-auto max-h-[90vh]">

                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-4 text-white sm:px-6 md:px-8 md:py-6">
                            <div className="text-lg font-semibold">
                                {editingId ? 'Update Advertisement' : 'Create Advertisement'}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/20"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Title</label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                    placeholder="Enter title"

                                />
                                {formErrors.title && (
                                    <p className="mt-2 text-sm text-red-600">{formErrors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                    placeholder="Enter description"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Keywords</label>
                                <input
                                    name="keywords"
                                    value={formData.keywords}
                                    onChange={handleInputChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                    placeholder="e.g. sale, offer"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-900">Size</label>

                                    <select
                                        name="ad_size_id"
                                        value={formData.ad_size_id}
                                        onChange={handleInputChange}

                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                    >
                                        <option value="">Select Size</option>
                                        {sizes.map((size) => (
                                            <option key={size.id} value={size.id}>
                                                {size.width} x {size.height} ({size.type || 'Horizontal'})
                                            </option>
                                        ))}
                                        {isSelectedSizeInactive && selectedSize && (
                                            <option value={selectedSize.id}>
                                                {selectedSize.width} x {selectedSize.height} (Inactive - currently assigned)
                                            </option>
                                        )}
                                    </select>
                                    {formErrors.ad_size_id && (
                                        <p className="mt-2 text-sm text-red-600">{formErrors.ad_size_id}</p>
                                    )}
                                    {isSelectedSizeInactive && (
                                        <p className="mt-2 text-sm text-amber-600">This size was deactivated. Please pick a different active size to save changes.</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-900">Duration</label>

                                    <select
                                        name="ad_duration_id"
                                        value={formData.ad_duration_id}
                                        onChange={handleInputChange}
                                        disabled={!formData.ad_size_id}

                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none disabled:opacity-60"
                                    >
                                        <option value="">
                                            {formData.ad_size_id ? 'Select Duration' : 'Select a size first'}
                                        </option>
                                        {availableDurationsForSize.map((p) => (
                                            <option key={p.ad_duration_id} value={p.ad_duration_id}>
                                                {p.duration ? `${p.duration} ${p.label}` : p.label}
                                            </option>
                                        ))}
                                        {isSelectedDurationInactive && selectedPrice && (
                                            <option value={selectedPrice.ad_duration_id}>
                                                {selectedPrice.duration ? `${selectedPrice.duration} ${selectedPrice.label}` : selectedPrice.label} (Inactive - currently assigned)
                                            </option>
                                        )}
                                    </select>
                                    {formErrors.ad_duration_id && (
                                        <p className="mt-2 text-sm text-red-600">{formErrors.ad_duration_id}</p>
                                    )}
                                    {formData.ad_size_id && !isSelectedSizeInactive && availableDurationsForSize.length === 0 && (
                                        <p className="mt-2 text-sm text-amber-600">No pricing configured for this size yet.</p>
                                    )}
                                    {isSelectedDurationInactive && (
                                        <p className="mt-2 text-sm text-amber-600">This duration/price was deactivated. Please pick a different active duration to save changes.</p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-900">Start Date</label>
                                    <input
                                        type="date"
                                        name="startdate"
                                        value={formData.startdate}
                                        onChange={handleInputChange}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                    />
                                    {formErrors.startdate && (
                                        <p className="mt-2 text-sm text-red-600">{formErrors.startdate}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-900">End Date</label>
                                    <input
                                        type="date"
                                        name="enddate"
                                        value={formData.enddate}
                                        readOnly
                                        disabled
                                        placeholder={selectedPrice?.label === 'Lifetime' ? 'No end date (Lifetime)' : 'Set start date & duration first'}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-600 outline-none"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">
                                        {selectedPrice?.label === 'Lifetime'
                                            ? 'Lifetime duration has no fixed end date.'
                                            : 'Auto-calculated from start date + duration.'}
                                    </p>
                                    {formErrors.enddate && (
                                        <p className="mt-2 text-sm text-red-600">{formErrors.enddate}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Price</label>
                                <input
                                    type="text"
                                    readOnly
                                    disabled
                                    value={selectedPrice ? `₹${Number(selectedPrice.price).toLocaleString('en-IN')}` : ''}
                                    placeholder="Select size and duration to see price"
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Status</label>

                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">
                                    {formData.type === 'video' ? 'Video' : 'Image'}
                                </label>
                                <input
                                    type="file"
                                    name="image"
                                    accept={formData.type === 'video' ? 'video/*' : 'image/*'}
                                    onChange={handleInputChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                />
                                {formData.image instanceof File && formData.type === 'video' && (
                                    <video
                                        src={URL.createObjectURL(formData.image)}
                                        className="mt-3 h-40 w-full rounded-xl object-cover"
                                        controls
                                        muted
                                    />
                                )}
                                {formErrors.image && (
                                    <p className="mt-2 text-sm text-red-600">{formErrors.image}</p>
                                )}
                                {imageError && (
                                    <p className="mt-2 text-sm text-red-600">{imageError}</p>
                                )}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Tags </label>
                                <input
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none"
                                    placeholder="e.g., organic, pesticide-free, seasonal, certified"
                                />
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-60"
                                >
                                    {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}