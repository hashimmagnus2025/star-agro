
'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, MapPin, Play, Search, Sparkles, Tag, X, CircleCheckBig } from 'lucide-react';
import Link from 'next/link';
import api from '../utils/api.js';
import { translations } from '../utils/translations.js';
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

export default function ServiceHubPage() {
    const [services, setServices] = useState([]);
    const [selectedType, setSelectedType] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [language, setLanguage] = useState('en');
    const [advertisements, setAdvertisements] = useState([]);
    const [squareAdvertisements, setSquareAdvertisements] = useState([]);
    const [selectedAdIndex, setSelectedAdIndex] = useState(null);

    const t = translations[language]?.serviceHub || translations.en.serviceHub;

    useEffect(() => {
        setLanguage(localStorage.getItem('language') || 'en');
    }, []);

    useEffect(() => {
        const fetchAdvertisements = async () => {
            try {
                const response = await api.get('/advertisements/active');
                const ads = Array.isArray(response.data) ? response.data.filter(Boolean) : [];
                setAdvertisements(ads.filter((ad) => ad && ad.image_size === '1175x235'));
                setSquareAdvertisements(ads.filter((ad) => ad && ad.image_size === '235x235'));
            } catch (err) {
                console.error('Error fetching advertisements:', err);
            }
        };
        fetchAdvertisements();
    }, []);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setLoading(true);
                const response = await api.get('/services');
                const approvedServices = Array.isArray(response.data)
                    ? response.data.filter((service) => String(service.status || '').trim().toLowerCase() === 'approved')
                    : [];
                setServices(approvedServices);
            } catch (fetchError) {
                console.error('Error fetching public services:', fetchError);
                setError(fetchError?.response?.data?.message || t.unableToLoad);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    const serviceTypes = useMemo(() => (
        ['All', ...new Set(services.map((service) => service.service_type).filter(Boolean))]
    ), [services]);

    const filteredServices = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return services.filter((service) => {
            const matchesType = selectedType === 'All' || service.service_type === selectedType;
            const searchableText = [
                service.name,
                service.description,
                service.service_type,
                service.provider_name,
                service.coverage_area,
            ].filter(Boolean).join(' ').toLowerCase();
            return matchesType && searchableText.includes(query);
        });
    }, [services, searchTerm, selectedType]);

    const getTypeLabel = (value) => t.types?.[value] || value || t.title;

    // Every full row (6 cards each on desktop) gets up to 2 random ad slots when
    // square (235x235) ads are available. Each ad is used at most once (no repeats)
    // - once the ad pool runs out, remaining rows render as plain service cards.
    const maxAdsToUse = 8;
    const adsToUse = Math.min(squareAdvertisements.length, maxAdsToUse);

    const { firstRowSlots, restServices } = useMemo(() => {
        if (adsToUse === 0 || filteredServices.length < 4) {
            return { firstRowSlots: null, restServices: filteredServices };
        }

        const shuffledAds = [...squareAdvertisements].sort(() => Math.random() - 0.5).slice(0, adsToUse);
        let adCursor = 0;
        let serviceCursor = 0;
        const slots = [];

        while (adCursor < shuffledAds.length) {
            const adsThisRow = Math.min(2, shuffledAds.length - adCursor);
            const servicesNeeded = 6 - adsThisRow;
            if (filteredServices.length - serviceCursor < servicesNeeded) break;

            const adPositions = new Set();
            while (adPositions.size < adsThisRow) {
                adPositions.add(Math.floor(Math.random() * 6));
            }
            for (let col = 0; col < 6; col++) {
                if (adPositions.has(col)) {
                    slots.push({ type: 'ad', ad: shuffledAds[adCursor], key: `ad-${slots.length}` });
                    adCursor++;
                } else {
                    slots.push({ type: 'service', service: filteredServices[serviceCursor] });
                    serviceCursor++;
                }
            }
        }

        // Wide banner ad (1175x235) sits between the 2nd and 3rd row, i.e. after 12 cards.
        if (advertisements.length > 0 && slots.length > 12) {
            slots.splice(12, 0, { type: 'banner', key: 'main-banner-ad' });
        }

        return {
            firstRowSlots: slots.length > 0 ? slots : null,
            restServices: filteredServices.slice(serviceCursor),
        };
    }, [filteredServices, squareAdvertisements, adsToUse, advertisements]);

    const renderBannerAd = (key) => {
        const bannerAds = Array.isArray(advertisements) ? advertisements.filter((ad) => ad && ad.id) : [];
        if (!bannerAds.length) return null;

        return (
            <div key={key} className="col-span-full relative w-full h-[120px] sm:h-[160px] md:h-[200px] lg:h-[235px] rounded-3xl overflow-hidden shadow-lg shadow-gray-200">
                <Swiper
                    modules={[Autoplay, Pagination]}
                    autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    pagination={{ clickable: true }}
                    loop={bannerAds.length > 1}
                    className="h-full w-full"
                >
                    {bannerAds.map((ad) => (
                        <SwiperSlide key={ad.id}>
                            <h3 className="absolute top-2 left-2 z-10 rounded-full bg-gray-700 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
                                {t?.advertisement || 'Advertisement'}
                            </h3>
                            <img src={getMediaUrl(ad.image)} alt={ad.title} className="h-full w-full object-cover" />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        );
    };

    const renderServiceCard = (service) => {
        if (!service || !service.id) return null;

        const imageUrl = getMediaUrl(service.image_url);
        const badgeClass = typeStyles[service.service_type] || 'bg-slate-50 text-slate-700 border-slate-200';

        return (
            <Link key={service.id} href={`/service-hub/${service.id}`} className="group flex flex-col overflow-hidden rounded-[24px] border border-gray-100/50 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(10,26,18,0.12)]">
                <div className="relative mb-3 h-[150px] w-full overflow-hidden rounded-[18px] bg-gray-50">
                    {imageUrl ? <img src={imageUrl} alt={service.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-600"><BriefcaseBusiness size={36} /></div>}
                    <span className={`absolute left-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badgeClass}`}>{getTypeLabel(service.service_type)}</span>

                    {String(service.provider_document_status || '').trim().toLowerCase() === 'verified' && (
                        <div className="absolute top-0 right-1 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-1 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <CircleCheckBig size={16} />
                        </div>
                    )}
                </div>
                <div className="flex flex-1 flex-col px-3 pb-2">
                    <h2 className="line-clamp-1 text-md font-bold text-[#0A1A12]">{service.name}</h2>

                    <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                        <p className="flex items-center gap-1.5 truncate"><MapPin size={13} className="shrink-0 text-emerald-600" /> {service.coverage_area || t.areaNotSpecified}</p>
                        <p className="flex items-center gap-1.5 truncate"><Tag size={13} className="shrink-0 text-emerald-600" /> {service.price ? `Rs. ${service.price} ${service.price_unit || ''}` : t.priceOnRequest}</p>
                    </div>
                </div>
            </Link>
        );
    };

    const renderSquareAdCard = (slot) => {
        if (!slot || !slot.ad || !slot.ad.id) return null;

        return (
            <div
                key={slot.key}
                onClick={() => {
                    const clickedIndex = squareAdvertisements.findIndex((ad) => ad && ad.id === slot.ad.id);
                    setSelectedAdIndex(clickedIndex >= 0 ? clickedIndex : 0);
                }}
                className="group flex flex-col overflow-hidden rounded-[24px] border border-gray-100/50 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(10,26,18,0.12)] cursor-pointer"
            >
                <div className="relative mb-3 h-[150px] w-full overflow-hidden rounded-[18px] bg-gray-50">
                    <img
                        src={getMediaUrl(slot.ad.image)}
                        alt={slot.ad.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                </div>
                <div className="flex flex-1 flex-col px-3 pb-2">
                    <h2 className="line-clamp-1 text-md font-bold text-[#0A1A12]">{t?.advertisement || 'Advertisement'}</h2>
                </div>
            </div>
        );
    };

    return (
        <main className="min-h-screen w-full bg-[#f4fff4] pb-24 font-sans">
            <section className="relative w-full overflow-hidden bg-cover bg-center px-4 py-20 sm:py-28" style={{ backgroundImage: "url('/media/about-hero.jpg')" }}>
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#2C4232] opacity-40 blur-[100px]" />
                <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#3B5C43] opacity-30 blur-[100px]" />
                <div className="relative z-10 mx-auto max-w-[1300px] text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-md">
                        <Sparkles size={16} className="text-[#8cc63f]" /> {t.premiumServices}
                    </div>
                    <h1 className="text-4xl font-light text-white sm:text-6xl">
                        <span className="font-bold italic">{t.title}</span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
                        {t.description}
                    </p>
                </div>
            </section>

            <section className="relative z-20 mx-auto -mt-10 max-w-[1400px] px-6 sm:px-10">
                <div className="rounded-[32px] border border-[#2C4232]/5 bg-white p-4 shadow-[0_20px_40px_rgba(10,26,18,0.08)] sm:p-6">
                    <div className="flex flex-col items-center gap-4 md:flex-row">
                        <div className="relative h-14 w-full md:flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder={t.searchPlaceholder}
                                className="h-full w-full rounded-2xl border border-gray-400 bg-gray-50 pl-12 pr-12 text-base text-gray-700 outline-none transition-all focus:border-[#3B5C43] focus:bg-white focus:ring-4 focus:ring-[#3B5C43]/10"
                            />
                            {searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700" aria-label="Clear search"><X size={18} /></button>}
                        </div>
                        <button type="button" onClick={() => { setSearchTerm(''); setSelectedType('All'); }} className="h-14 w-full rounded-2xl bg-gray-200 px-8 font-semibold text-gray-700 transition-colors hover:bg-gray-300 md:w-auto">
                            {t.reset}
                        </button>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {serviceTypes.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setSelectedType(type)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selectedType === type ? 'border-green-300 bg-green-100 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {type === 'All' ? t.allServices : getTypeLabel(type)}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[1400px] px-6 pt-10 sm:px-10 lg:pt-14">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-gray-500">{t.showing} <span className="font-bold text-gray-700">{filteredServices.length}</span> {t.services}</p>

                </div>
                {loading ? (
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                        {[...Array(12)].map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[24px] bg-white p-3 shadow-sm" />)}
                    </div>
                ) : error ? (
                    <div className="rounded-3xl bg-white px-6 py-20 text-center text-red-600 shadow-sm">{error}</div>
                ) : filteredServices.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-emerald-200 bg-white px-6 py-20 text-center">
                        <BriefcaseBusiness className="mx-auto text-emerald-500" size={42} />
                        <h2 className="mt-4 text-xl font-bold text-slate-900">{t.noMatching}</h2>
                        <p className="mt-2 text-sm text-slate-500">{t.tryAnother}</p>
                    </div>  
                ) : (
                    <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                        {firstRowSlots ? (
                            <>
                                {firstRowSlots.map((slot) => {
                                    if (slot.type === 'banner') return renderBannerAd(slot.key);
                                    return slot.type === 'ad' ? renderSquareAdCard(slot) : renderServiceCard(slot.service);
                                })}
                                {firstRowSlots.length <= 12 && advertisements.length > 0 && renderBannerAd('main-banner-ad')}
                                {restServices.map((service) => renderServiceCard(service))}
                            </>
                        ) : (
                            filteredServices.map((service, index) => {
                                const card = renderServiceCard(service);

                                if (index === 11 && advertisements.length > 0) {
                                    return (
                                        <Fragment key={`${service.id}-with-ad`}>
                                            {card}
                                            {renderBannerAd(`banner-after-${service.id}`)}
                                        </Fragment>
                                    );
                                }

                                return card;
                            })
                        )}
                    </div>
                )}
            </section>

            {selectedAdIndex !== null && squareAdvertisements.length > 0 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setSelectedAdIndex(null)}
                >
                    <div
                        className="relative w-full max-w-[320px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedAdIndex(null)}
                            className="absolute -top-10 right-0 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <Swiper
                            modules={[Pagination]}
                            pagination={{ clickable: true }}
                            initialSlide={selectedAdIndex}
                            loop={squareAdvertisements.length > 1}
                            className="w-full square-ad-modal-swiper"
                        >
                            {squareAdvertisements.filter((ad) => ad && ad.id).map((ad) => (
                                <SwiperSlide key={ad.id}>
                                    <div className="group flex flex-col overflow-hidden rounded-[24px] border border-gray-100/50 bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                        <div className="relative mb-3 h-[235px] w-full overflow-hidden rounded-[18px] bg-gray-50">
                                            <img
                                                src={getMediaUrl(ad.image)}
                                                alt={ad.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col px-3 pb-2">
                                            <h2 className="line-clamp-1 text-md font-bold text-[#0A1A12]">{t?.advertisement || 'Advertisement'}</h2>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            )}
        </main>
    );
}