"use client"


import Link from "next/link";
import { BadgeCheck, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { translations } from '../utils/translations.js';

import api from '../utils/api.js';

// Pool of pre-designed accent styles; a new size (from admin) gets one automatically via hashing, no manual edits needed
const BOX_ACCENTS = [
    'border-rose-300 bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600',
    'border-violet-300 bg-gradient-to-br from-violet-50 to-violet-100 text-violet-700',
    'border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600',
    'border-fuchsia-300 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 text-fuchsia-600',
    'border-sky-300 bg-gradient-to-br from-sky-50 to-sky-100 text-sky-600',
    'border-[#4CAF50]/50 bg-gradient-to-br from-[#eaf6ea] to-[#dcf1dc] text-[#2f7a2f]',
    'border-cyan-300 bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600',
    'border-orange-300 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600',
    'border-indigo-300 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600',
    'border-pink-300 bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600',
    'border-lime-300 bg-gradient-to-br from-lime-50 to-lime-100 text-lime-700',
    'border-teal-300 bg-gradient-to-br from-teal-50 to-teal-100 text-teal-600',
];

// Deterministic hash so the same size always gets the same color across renders/reloads
const getAccentForSize = (key) => {
    const str = String(key ?? '');
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return BOX_ACCENTS[hash % BOX_ACCENTS.length];
};

// Renders each sample box at its real advertised pixel dimensions so users see the actual size, not an abstracted shape
const parseSizeDimensions = (label) => {
    const numbers = String(label || '').match(/\d+/g);
    if (!numbers || numbers.length < 2) return null;
    const [width, height] = numbers.map(Number);
    return { width, height };
};

const getSizeType = (label, sampleSizes) => {
    const dims = parseSizeDimensions(label);
    if (!dims) return '';
    const match = sampleSizes?.find((item) => item.width === dims.width && item.height === dims.height);
    if (match?.type) return match.type;
    if (dims.width === dims.height) return 'Square';
    return dims.width > dims.height ? 'Horizontal' : 'Vertical';
};

export default function AdvertisementPage() {

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
        selectedSize: "",
    })
    const [showModel, setShowModel] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [language, setLanguage] = useState('en');
    const [advertisementPrices, setAdvertisementPrices] = useState([]);
    const [advertisementSizes, setAdvertisementSizes] = useState([]);
    const [pricingLoading, setPricingLoading] = useState(true);

    useEffect(() => {
        const lang = localStorage.getItem('language');
        if (lang) {
            setLanguage(lang);
        }
    }, []);

    useEffect(() => {
        const fetchAdvertisementData = async () => {
            try {
                setPricingLoading(true);
                const [priceResponse, sizeResponse] = await Promise.all([
                    api.get('/advertisement-prices'),
                    api.get('/advertisement-sizes'),
                ]);
                setAdvertisementPrices(Array.isArray(priceResponse.data) ? priceResponse.data : []);
                setAdvertisementSizes(Array.isArray(sizeResponse.data) ? sizeResponse.data : []);
            } catch (error) {
                console.error('Error loading advertisement pricing:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Pricing unavailable',
                    text: 'Advertisement pricing could not be loaded right now.',
                });
            } finally {
                setPricingLoading(false);
            }
        };

        fetchAdvertisementData();
    }, []);

    const activePrices = advertisementPrices.filter((item) =>
        item.status === 'Active' && item.size_status !== 'Inactive' && item.duration_status !== 'Inactive'
    );
    const pricingSizes = [...new Map(activePrices.map((item) => [item.ad_size_id, item])).values()];
    const pricingDurations = [...new Map(activePrices.map((item) => [item.ad_duration_id, item])).values()];
    const activeSizes = advertisementSizes.filter((item) => item.status !== 'Inactive');
    const sampleSizes = activeSizes.length > 0 ? activeSizes : pricingSizes;
    const sizeLabel = (item) => `${item.width}px × ${item.height}px`;
    const durationLabel = (item) => item.duration ? `${item.duration} ${item.label}` : item.label;
    const getPrice = (sizeId, durationId) => activePrices.find(
        (item) => item.ad_size_id === sizeId && item.ad_duration_id === durationId
    )?.price;
    const t = translations[language];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })

    }

    const openInquiryModal = (size) => {
        setFormData((prev) => ({ ...prev, selectedSize: size }));
        setSubmitError('');
        setShowModel(true);
    }

    const closeInquiryModal = () => {
        setShowModel(false);
    }

    const handleSubmit = async (e) => {

        e.preventDefault();
        setSubmitError('');

        if (!formData.name || !formData.email || !formData.selectedSize) {
            setSubmitError('Name, email and selected size are required');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/advertisement-inquiries', formData);
            setFormData({ name: "", email: "", phone: "", message: "", selectedSize: "" });
            setShowModel(false);
            Swal.fire({
                icon: 'success',
                title: t?.swal?.adSubmittedTitle || 'Inquiry Submitted',
                text: t?.swal?.adSubmittedText || 'Your advertisement inquiry has been submitted successfully. Our team will get in touch with you soon.',
                confirmButtonText: t?.swal?.okButton || 'OK'
            });
        } catch (error) {
            console.error("Error submitting form:", error);
            const message = error?.response?.data?.message || 'Something went wrong. Please try again.';
            setSubmitError(message);
            Swal.fire({
                icon: 'error',
                title: t?.swal?.adFailedTitle || 'Submission Failed',
                text: message,
                confirmButtonText: t?.swal?.okButton || 'OK'
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (

        <>
            <section className="relative w-full h-56 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/media/about-hero.jpg')" }}
                ></div>
                <div className="absolute inset-0 bg-black/45"></div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5">
                    <div className="flex items-center gap-2 text-white/80 uppercase tracking-[2px] text-[11px] font-semibold">
                        <Link href="/" className="hover:underline">
                            Home
                        </Link>
                        <span>/</span>
                        <span>{t?.PlaceAdvertisement.PlaceAdvertisement}</span>
                    </div>
                    <h1 className="text-white text-4xl md:text-5xl font-bold mt-3">{t?.PlaceAdvertisement.PlaceAdvertisement}</h1>
                </div>
            </section>

            {/* section 2 */}
            <section className="bg-[#f4fff4] px-4 py-12 sm:px-6 lg:px-8">
                <div className=" space-y-10">

                    {/* Intro */}
                    <div className="text-center">
                        <p className="inline-flex items-center gap-2 rounded-full bg-[#e2f5e2] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#2f7a2f]">
                            <Sparkles size={14} />
                            Grow with Star Agro
                        </p>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                            {t?.PlaceAdvertisement.Advertiseyourbrandtothousandsoffarmers}
                        </h2>

                    </div>

                    {/* Pricing table */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-linear-to-r from-[#4CAF50] to-[#3d8f40] px-5 py-4 sm:px-8">
                            <h3 className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
                                <BadgeCheck size={20} />
                                {t?.PlaceAdvertisement.AdvertisementDetails}
                            </h3>

                        </div>

                        <div className="overflow-x-auto p-4 sm:p-6">
                            <table className="w-full min-w-140 border-separate border-spacing-0 text-center text-sm">
                                <thead>
                                    <tr>
                                        <th rowSpan={2} className="rounded-tl-xl border-b border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-700">
                                            {t?.PlaceAdvertisement.SrNo}
                                        </th>
                                        <th rowSpan={2} className="border-b border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-700">
                                            {t?.PlaceAdvertisement.AdvertisementSize}
                                        </th>
                                        <th colSpan={pricingDurations.length || 1} className="rounded-tr-xl border-b border-slate-200 bg-slate-50 px-3 py-3 font-semibold text-slate-700">
                                            {t?.PlaceAdvertisement.Duration}
                                        </th>
                                    </tr>
                                    <tr>
                                        {pricingDurations.map((item) => (
                                            <th key={item.ad_duration_id} className="border-b border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-500">
                                                {durationLabel(item)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pricingLoading ? (
                                        <tr><td colSpan={pricingDurations.length + 2} className="px-3 py-8 text-slate-500">Loading advertisement prices...</td></tr>
                                    ) : pricingSizes.length === 0 ? (
                                        <tr><td colSpan={pricingDurations.length + 2} className="px-3 py-8 text-slate-500">No advertisement prices available.</td></tr>
                                    ) : pricingSizes.map((item, idx) => (
                                        <tr key={item.ad_size_id} className={idx % 2 === 1 ? 'bg-[#f7fbf6]' : 'bg-white'}>
                                            <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-500">{idx + 1}</td>
                                            <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-800">{item.width} x {item.height}</td>
                                            {pricingDurations.map((duration) => {
                                                const price = getPrice(item.ad_size_id, duration.ad_duration_id);
                                                return <td key={duration.ad_duration_id} className="border-b border-slate-100 px-3 py-3 text-slate-600">{price === undefined ? '—' : `₹${Number(price).toLocaleString('en-IN')}`}</td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sample sizes */}
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="px-5 pt-6 text-center sm:px-8">
                            <h3 className="flex items-center justify-center gap-2 text-base font-bold text-slate-900 sm:text-xl">
                                <ImageIcon size={24} className="text-[#4CAF50]" />
                                {t?.PlaceAdvertisement.SampleAdvertisementSizes}
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                Boxes below are shown at their actual pixel size — scroll sideways if a box is wider than your screen.
                            </p>
                        </div>

                        <div className="space-y-8 p-5 sm:p-8">
                            <div>
                                <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Horizontal
                                </p>
                                <div className="flex flex-wrap items-center gap-4 overflow-x-auto pb-2">
                                    {sampleSizes.filter((item) => (item.type || (item.width >= item.height ? 'Horizontal' : 'Vertical')) === 'Horizontal').map((box) => {
                                        const label = sizeLabel(box);
                                        const dims = parseSizeDimensions(label);
                                        return (
                                            <button
                                                type="button"
                                                key={box.id || label}
                                                onClick={() => openInquiryModal(label)}
                                                style={{ width: `${dims.width}px`, height: `${dims.height}px` }}
                                                className={`flex shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed p-2 text-center transition hover:scale-[1.02] hover:shadow-md ${getAccentForSize(box.id ?? label)}`}
                                            >
                                                <span className="text-sm font-bold">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                                    Vertical
                                </p>
                                <div className="flex items-end justify-center gap-4 overflow-x-auto pb-2">
                                    {sampleSizes.filter((item) => (item.type || (item.width >= item.height ? 'Horizontal' : 'Vertical')) === 'Vertical').map((box) => {
                                        const label = sizeLabel(box);
                                        const dims = parseSizeDimensions(label);
                                        return (
                                            <button
                                                type="button"
                                                key={box.id || label}
                                                onClick={() => openInquiryModal(label)}
                                                style={{ width: `${dims.width}px`, height: `${dims.height}px` }}
                                                className={`flex shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed p-2 text-center transition hover:scale-[1.02] hover:shadow-md ${getAccentForSize(box.id ?? label)}`}
                                            >
                                                <span className="text-sm font-bold">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="rounded-3xl bg-linear-to-r from-[#1f3d1f] to-[#2f7a2f] px-6 py-8 text-center shadow-lg sm:px-10">
                        <h3 className="text-xl font-bold text-white sm:text-2xl"> {t?.PlaceAdvertisement.ReadytoadvertisewithStarAgro}</h3>
                        <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">
                            {t?.PlaceAdvertisement.Filloutourquickinquiryform}
                        </p>
                        <button
                            type="button"

                            className="mt-5 inline-block cursor-pointer rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#2f7a2f] shadow-md transition hover:bg-slate-100"
                        >
                            {t?.PlaceAdvertisement.AdvertisementInquiry}

                        </button>
                    </div>

                </div>
            </section>

            {showModel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-auto max-h-[90vh]">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900">   {t?.PlaceAdvertisement.AdvertisementInquiry}</h3>
                            <button
                                type="button"
                                onClick={closeInquiryModal}
                                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">   {t?.PlaceAdvertisement.selectedSize}</label>
                                <select
                                    name="selectedSize"
                                    value={formData.selectedSize}
                                    onChange={handleChange}
                                    required
                                    disabled
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none cursor-not-allowed"
                                >
                                    {sampleSizes.map((item) => {
                                        const label = sizeLabel(item);
                                        return (
                                            <option key={label} value={label}>{label}</option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">{t?.PlaceAdvertisement.type}</label>
                                <input
                                    type="text"
                                    value={getSizeType(formData.selectedSize, sampleSizes)}
                                    readOnly
                                    disabled
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">{t?.PlaceAdvertisement.name}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">{t?.PlaceAdvertisement.email}</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">{t?.PlaceAdvertisement.phone}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">{t?.PlaceAdvertisement.message}</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            {submitError && (
                                <p className="text-sm text-red-600">{submitError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-full bg-[#4CAF50] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#3d8f40] disabled:opacity-60"
                            >
                                {submitting ? 'Submitting...' : t?.PlaceAdvertisement.submitInquiry}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
