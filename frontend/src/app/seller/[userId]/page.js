"use client";

import {
    ArrowLeft,
    BadgeCheck,
    BriefcaseBusiness,
    Calendar,
    Leaf,
    Mail,
    MapPin,
    MessageSquareText,
    Package,
    Phone,
    Share2,
    Star,
    User,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import api from "../../utils/api.js";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

const getMediaUrl = (value) => {
    if (!value) return "";
    const trimmed = String(value).trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `${IMAGE_BASE_URL}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
};

const serviceTypeStyles = {
    Transport: "bg-sky-50 text-sky-700 border-sky-200",
    machine: "bg-violet-50 text-violet-700 border-violet-200",
    Labour: "bg-amber-50 text-amber-700 border-amber-200",
    Guidance: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function SellerDetailsPage() {
    const { userId } = useParams();
    const router = useRouter();
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [listings, setListings] = useState([]);
    const [services, setServices] = useState([]);
    const [listingsLoading, setListingsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("crops");
    const [shareStatus, setShareStatus] = useState("");
    const [reviewSummary, setReviewSummary] = useState({ average_rating: 0, total_reviews: 0 });
    const [reviews, setReviews] = useState([]);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewMessage, setReviewMessage] = useState("");
    const [visibleReviewsCount, setVisibleReviewsCount] = useState(6);
    const [advertisements, setAdvertisements] = useState([]);

    useEffect(() => {
        const fetchAdvertisements = async () => {
            try {
                const response = await api.get("/advertisements/active");
                const ads = Array.isArray(response.data) ? response.data.filter(Boolean) : [];
                setAdvertisements(ads.filter((ad) => ad && ad.image_size === "705x235"));
            } catch (err) {
                console.error("Error fetching advertisements:", err);
            }
        };
        fetchAdvertisements();
    }, []);
    const [currentUserId, setCurrentUserId] = useState(null);

    const normalizeType = (value) => String(value ?? "").trim().toLowerCase();

    useEffect(() => {
        if (!userId) return;

        const fetchSeller = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await api.get(`/user/${userId}`);
                setSeller(response.data || null);
            } catch (fetchError) {
                console.error("Error fetching seller:", fetchError);
                setError(fetchError?.response?.data?.message || "Unable to load this profile right now.");
            } finally {
                setLoading(false);
            }
        };

        const fetchListings = async () => {
            try {
                setListingsLoading(true);
                const [productsRes, servicesRes] = await Promise.all([
                    api.get(`/products?user_id=${userId}`).catch(() => ({ data: [] })),
                    api.get(`/services?user_id=${userId}`).catch(() => ({ data: [] })),
                ]);
                setListings(Array.isArray(productsRes.data) ? productsRes.data : []);
                setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
            } catch (listingsError) {
                console.error("Error fetching seller listings:", listingsError);
            } finally {
                setListingsLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                const response = await api.get(`/reviews/${userId}`);
                const reviewData = response.data || {};
                setReviewSummary({
                    average_rating: Number(reviewData.average_rating || 0),
                    total_reviews: Number(reviewData.total_reviews || 0),
                });
                setReviews(Array.isArray(reviewData.reviews) ? reviewData.reviews : []);
                setVisibleReviewsCount(6);
            } catch (reviewError) {
                console.error("Error fetching seller reviews:", reviewError);
                setReviewSummary({ average_rating: 0, total_reviews: 0 });
                setReviews([]);
            }
        };

        fetchSeller();
        fetchListings();
        fetchReviews();
    }, [userId]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;
            const parsedUser = JSON.parse(storedUser);
            setCurrentUserId(parsedUser?.id ?? parsedUser?.user_id ?? null);
        } catch (error) {
            console.error("Error parsing user from localStorage:", error);
        }
    }, []);

    const crops = useMemo(
        () => listings.filter((item) => normalizeType(item.type) === "crop"),
        [listings, normalizeType],
    );
    const products = useMemo(
        () => listings.filter((item) => !["crop", "nursery", "animal"].includes(normalizeType(item.type))),
        [listings, normalizeType],
    );
    const nurseries = useMemo(
        () => listings.filter((item) => normalizeType(item.type) === "nursery"),
        [listings, normalizeType],
    );
    const animals = useMemo(
        () => listings.filter((item) => normalizeType(item.type) === "animal"),
        [listings, normalizeType],
    );

    useEffect(() => {
        if (!listingsLoading) {
            if (crops.length > 0) setActiveTab("crops");
            else if (products.length > 0) setActiveTab("products");
            else if (nurseries.length > 0) setActiveTab("nursery");
            else if (animals.length > 0) setActiveTab("animal");
            else if (services.length > 0) setActiveTab("services");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listingsLoading]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="relative inline-block">
                    <div className="h-20 w-20 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
                    <User size={26} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-green-600" />
                </div>
            </main>
        );
    }

    if (error || !seller) {
        return (
            <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-amber-50 to-orange-50 px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                    <User className="text-amber-600" size={36} />
                </div>
                <h1 className="text-xl font-bold text-slate-900">{error || "Seller not found"}</h1>
                <p className="max-w-sm text-sm text-gray-500">
                    This profile doesn&apos;t exist or may have been removed.
                </p>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-200 transition hover:bg-green-500"
                >
                    Go Back
                </button>
            </main>
        );
    }

    const sellerName =
        seller.name || `${seller.first_name || ""} ${seller.last_name || ""}`.trim() || "N/A";

    const location = [seller.village, seller.taluka, seller.district, seller.state]
        .filter(Boolean)
        .join(", ");

    const joinedDate = seller.created_at
        ? new Date(seller.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
        })
        : null;

    const profileImage = getMediaUrl(seller.profile_image);
    const isVerified = String(seller.document_status || "").toLowerCase() === "verified";

    const tabDefinitions = [
        { key: "crops", label: "Crops", icon: Leaf, count: crops.length },
        { key: "products", label: "Products", icon: Package, count: products.length },
        { key: "nursery", label: "Nursery", icon: Leaf, count: nurseries.length },
        { key: "animal", label: "Animal", icon: BadgeCheck, count: animals.length },
        { key: "services", label: "Services", icon: BriefcaseBusiness, count: services.length },
    ];

    const tabs = tabDefinitions.filter((tab) => tab.count > 0);
    const activeTabExists = tabs.some((tab) => tab.key === activeTab);
    const safeActiveTab = activeTabExists ? activeTab : tabs[0]?.key || "services";

    const resolvedActiveItems =
        safeActiveTab === "crops"
            ? crops
            : safeActiveTab === "products"
                ? products
                : safeActiveTab === "nursery"
                    ? nurseries
                    : safeActiveTab === "animal"
                        ? animals
                        : services;

    const renderProductCard = (item) => {
        const imgSrc = getMediaUrl(item.image_url);
        const href = item.type === "Crop" ? `/crops/${item.id}` : `/crops/${item.id}`;
        return (
            <Link href={href} key={`p-${item.id}`}>
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100/70 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(10,26,18,0.12)]">
                    <div className="relative mb-3 h-[140px] w-full overflow-hidden rounded-xl bg-gray-50">
                        {imgSrc ? (
                            <Image
                                src={imgSrc}
                                alt={item.name || "Listing"}
                                width={320}
                                height={240}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                                <Package size={32} />
                            </div>
                        )}
                        <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-lg ${item.type === "Crop" ? "bg-emerald-600/90 text-white" : "bg-amber-600/90 text-white"}`}>
                            {item.type || "Product"}
                        </span>
                    </div>
                    <h3 className="line-clamp-1 text-sm font-bold text-gray-800 transition-colors group-hover:text-green-600">
                        {item.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-green-600">
                        {item.price ? `₹${item.price}` : "Price on request"}
                    </p>
                </div>
            </Link>
        );
    };

    const renderServiceCard = (service) => {
        const imgSrc = getMediaUrl(service.image_url);
        const badgeClass = serviceTypeStyles[service.service_type] || "bg-slate-50 text-slate-700 border-slate-200";
        return (
            <Link href={`/service-hub/${service.id}`} key={`s-${service.id}`}>
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100/70 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(10,26,18,0.12)]">
                    <div className="relative mb-3 h-[140px] w-full overflow-hidden rounded-xl bg-gray-50">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={service.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-500">
                                <BriefcaseBusiness size={32} />
                            </div>
                        )}
                        <span className={`absolute left-2 top-2 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-lg ${badgeClass}`}>
                            {service.service_type || "Service"}
                        </span>
                    </div>
                    <h3 className="line-clamp-1 text-sm font-bold text-gray-800 transition-colors group-hover:text-green-600">
                        {service.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-green-600">
                        {service.price ? `₹${service.price}` : "On request"}
                    </p>
                </div>
            </Link>
        );
    };

    const activeItems = resolvedActiveItems;
    const isOwnProfile = !!currentUserId && Number(currentUserId) === Number(userId);
    const userHasReviewed = Boolean(
        !isOwnProfile && currentUserId && reviews.some((review) => String(review.reviewer_user_id) === String(currentUserId))
    );

    const renderStars = (value, filledColor = "text-yellow-400", emptyColor = "text-gray-300") => (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
                <Star
                    key={`${value}-${index}`}
                    size={16}
                    className={index < Math.round(value) ? `${filledColor} fill-current` : emptyColor}
                />
            ))}
        </div>
    );

    const handleShare = async () => {
        if (typeof window === "undefined") return;

        const shareUrl = window.location.href;
        const shareText = `Check out ${sellerName}'s profile on Star Agro`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Star Agro Seller Profile",
                    text: shareText,
                    url: shareUrl,
                });
                setShareStatus("Shared");
                return;
            }

            await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            setShareStatus("Link copied");
        } catch (shareError) {
            if (shareError?.name === "AbortError") return;

            try {
                await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                setShareStatus("Link copied");
            } catch {
                setShareStatus("Share unavailable");
            }
        }

        setTimeout(() => setShareStatus(""), 2000);
    };

    const handleReviewSubmit = async (event) => {
        event.preventDefault();

        if (typeof window === "undefined") return;

        if (isOwnProfile) {
            setReviewMessage("You cannot review your own profile.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        if (!userId) return;

        try {
            setReviewSubmitting(true);
            setReviewMessage("");

            const response = await api.post("/reviews", {
                target_user_id: Number(userId),
                rating: Number(reviewRating),
                comment: reviewComment.trim(),
            });

            setReviewMessage(response?.data?.message || "Review submitted successfully.");
            setShowReviewModal(false);
            setReviewComment("");
            setReviewRating(5);

            const reviewResponse = await api.get(`/reviews/${userId}`);
            const reviewData = reviewResponse.data || {};
            setReviewSummary({
                average_rating: Number(reviewData.average_rating || 0),
                total_reviews: Number(reviewData.total_reviews || 0),
            });
            setReviews(Array.isArray(reviewData.reviews) ? reviewData.reviews : []);
        } catch (submitError) {
            const message = submitError?.response?.data?.message || "Unable to submit review.";
            setReviewMessage(message);
        } finally {
            setReviewSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-amber-50/50 font-sans">
            <div className="sticky top-0 z-40 border-b border-amber-100/50 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 text-gray-600 transition hover:text-amber-600"
                    >
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        <span className="font-medium">Back</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100"
                    >
                        <Share2 size={16} />
                        <span>{shareStatus || "Share"}</span>
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
                {/* Profile Card */}
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-amber-100/50">
                    <div className="relative bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 px-6 pb-16 pt-10 sm:px-10">
                        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
                        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={sellerName}
                                    className="h-24 w-24 rounded-2xl border-4 border-white/40 object-cover shadow-lg"
                                />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white/40 bg-white/20 text-3xl font-bold text-white shadow-lg">
                                    {sellerName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-bold text-white sm:text-3xl">{sellerName}</h1>
                                    {isVerified && (
                                        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                            <BadgeCheck size={14} /> Verified
                                        </span>
                                    )}
                                </div>
                                {joinedDate && (
                                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/80">
                                        <Calendar size={14} /> Member since {joinedDate}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact info + stats overlapping the cover */}
                    <div className="relative -mt-8 px-6 pb-6 sm:px-10 sm:pb-8">
                        <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-lg shadow-black/5 sm:grid-cols-3">
                            {seller.phone && (
                                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                        <Phone size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-gray-400">Phone</p>
                                        <p className="truncate text-sm font-semibold text-gray-800">{seller.phone}</p>
                                    </div>
                                </div>
                            )}
                            {seller.email && (
                                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                        <Mail size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-gray-400">Email</p>
                                        <p className="truncate text-sm font-semibold text-gray-800">{seller.email}</p>
                                    </div>
                                </div>
                            )}
                            {location && (
                                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-gray-400">Location</p>
                                        <p className="truncate text-sm font-semibold text-gray-800">{location}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-amber-500">{renderStars(reviewSummary.average_rating || 0)}</div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {reviewSummary.total_reviews > 0 ? `${reviewSummary.average_rating.toFixed(1)} / 5` : "No reviews yet"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {reviewSummary.total_reviews} {reviewSummary.total_reviews === 1 ? "review" : "reviews"}
                                    </p>
                                </div>
                            </div>

                            {!isOwnProfile && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (typeof window !== "undefined") {
                                            const token = localStorage.getItem("token");
                                            if (!token) {
                                                router.push("/login");
                                                return;
                                            }
                                        }
                                        setShowReviewModal(true);
                                    }}
                                    disabled={userHasReviewed}
                                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${userHasReviewed
                                        ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                        : "bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-500"}`}
                                >
                                    {userHasReviewed ? "Reviewed" : "Rate Seller"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {reviews.length > 0 && (
                    <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                        <div className="mb-4 flex items-center gap-2">
                            <MessageSquareText size={18} className="text-green-600" />
                            <h2 className="text-lg font-bold text-gray-800">Customer Reviews</h2>
                        </div>

                        <div className="space-y-4">
                            {reviews.slice(0, visibleReviewsCount).map((review) => {
                                const reviewerName = review.reviewer_name || [review.first_name, review.last_name].filter(Boolean).join(" ") || "Customer";
                                return (
                                    <div key={review.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-800">{reviewerName}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(review.created_at).toLocaleDateString(undefined, {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 text-amber-500">{renderStars(Number(review.rating) || 0)}</div>
                                        </div>
                                        {review.comment && <p className="mt-3 text-sm leading-6 text-gray-600">{review.comment}</p>}
                                    </div>
                                );
                            })}
                        </div>

                        {visibleReviewsCount < reviews.length && (
                            <div className="mt-4 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setVisibleReviewsCount((prev) => prev + 6)}
                                    className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 transition-colors"
                                >
                                    See More
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {advertisements.length > 0 && (
                    <div className="relative mx-auto mt-8 aspect-[705/235] w-full max-w-[705px] overflow-hidden rounded-3xl shadow-lg shadow-gray-200">
                        <Swiper
                            modules={[Autoplay, Pagination]}
                            autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                            pagination={{ clickable: true }}
                            loop={advertisements.length > 1}
                            className="h-full w-full"
                        >
                            {advertisements.map((ad) => (
                                <SwiperSlide key={ad.id}>
                                    {ad.type === 'video' ? (
                                        <video
                                            src={getMediaUrl(ad.image)}
                                            className="h-full w-full object-cover"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={getMediaUrl(ad.image)}
                                            alt={ad.title}
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}

                {/* Listings */}
                <div className="mt-8">
                    <div className="border-b border-gray-200">
                        <div className="flex gap-6 overflow-x-auto">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`relative flex items-center gap-1.5 whitespace-nowrap py-3 text-sm font-medium transition-all ${safeActiveTab === tab.key ? "text-green-600" : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        <Icon size={15} />
                                        {tab.label}
                                        <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${safeActiveTab === tab.key ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                            {tab.count}
                                        </span>
                                        {safeActiveTab === tab.key && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6">
                        {listingsLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
                            </div>
                        ) : activeItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/60 py-16 text-center shadow-sm">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                    {safeActiveTab === "services" ? <BriefcaseBusiness size={26} /> : <Leaf size={26} />}
                                </div>
                                <p className="text-sm font-medium text-gray-500">
                                    No {safeActiveTab} listed by {sellerName} yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {safeActiveTab === "services"
                                    ? activeItems.map(renderServiceCard)
                                    : activeItems.map(renderProductCard)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Rate {sellerName}</h3>
                                <p className="text-sm text-gray-500">One review per seller is allowed.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Your rating</label>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: 5 }).map((_, index) => {
                                        const starValue = index + 1;
                                        const isActive = starValue <= reviewRating;
                                        return (
                                            <button
                                                key={starValue}
                                                type="button"
                                                onClick={() => setReviewRating(starValue)}
                                                className="rounded-full p-1 transition"
                                                aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                                            >
                                                <Star
                                                    size={28}
                                                    className={isActive ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Your review</label>
                                <textarea
                                    rows={4}
                                    value={reviewComment}
                                    onChange={(event) => setReviewComment(event.target.value)}
                                    placeholder="Share your experience with this seller..."
                                    className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-green-400 focus:bg-white"
                                />
                            </div>

                            {reviewMessage && (
                                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                    {reviewMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={reviewSubmitting}
                                className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-green-300"
                            >
                                {reviewSubmitting ? "Submitting..." : "Submit Review"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
