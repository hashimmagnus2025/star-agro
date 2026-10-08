"use client";

import {
    Send,
    HelpCircle,
    X,
    ArrowLeft,
    Leaf,
    Heart,
    Share2,
    MapPin,
    Phone,
    Mail,
    User,
    Package,
    Mic,
    ChevronRight,
    Star,

} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { translations } from "../../utils/translations.js";
import api from "../../utils/api.js";
import Image from "next/image";
import Swal from "sweetalert2";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
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

export default function ProductDetailsPage({ params }) {
    const router = useRouter();
    const [product, setProduct] = useState(null);
    const [category, setCategory] = useState(null);
    const [subCategory, setSubCategory] = useState(null);
    const [language, setLanguage] = useState("en");
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [ownerInfo, setOwnerInfo] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const { productId } = params;
    const [activeTab, setActiveTab] = useState("description");
    const [imageLoaded, setImageLoaded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const modalRef = useRef(null);

    // Fall back to the sub-category image, then the category image, when the product has no image of its own
    const displayImagePath =
        product?.image_url || subCategory?.image || category?.image_url || "";

    // Mock images for gallery (using the same image multiple times for demo)
    const galleryImages = [
        resolveMediaUrl(displayImagePath),
        resolveMediaUrl(displayImagePath),
        resolveMediaUrl(displayImagePath),
    ];

    const [inquiryForm, setInquiryForm] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });
    const [listeningField, setListeningField] = useState(null);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [advertisements, setAdvertisements] = useState([]);
    const [verticalAdvertisements, setVerticalAdvertisements] = useState([]);

    useEffect(() => {
        const fetchAdvertisements = async () => {
            try {
                const response = await api.get("/advertisements/active");
                const ads = Array.isArray(response.data) ? response.data : [];
                setAdvertisements(ads.filter((ad) => ad.image_size === "940x235"));
                setVerticalAdvertisements(ads.filter((ad) => ad.image_size === "235x470"));
            } catch (err) {
                console.error("Error fetching advertisements:", err);
            }
        };
        fetchAdvertisements();
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && (window["SpeechRecognition"] || window["webkitSpeechRecognition"])) {
            setSpeechSupported(true);
        }
    }, []);

    const getSpeechLang = () => {

        if (typeof window === "undefined") return "en-IN";
        const lang = localStorage.getItem("language") || "en";
        const langMap = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
        return langMap[lang] || "en-IN";
    };

    const handleVoiceInput = (fieldName) => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = window["SpeechRecognition"] || window["webkitSpeechRecognition"];
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = getSpeechLang();
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setListeningField(fieldName);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInquiryForm((prev) => ({
                ...prev,
                [fieldName]: fieldName === "message" && prev.message
                    ? `${prev.message} ${transcript}`
                    : transcript,
            }));
        };
        recognition.onerror = () => setListeningField(null);
        recognition.onend = () => setListeningField(null);

        recognition.start();
    };

    useEffect(() => {
        const lang = localStorage.getItem("language") || "en";
        setLanguage(lang);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        try {
            const parsedUser = JSON.parse(storedUser);
            const fullName =
                [parsedUser?.first_name, parsedUser?.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || parsedUser?.name || "";

            setCurrentUserId(parsedUser?.id ?? null);

            setInquiryForm((prev) => ({
                ...prev,
                name: prev.name || fullName,
                email: prev.email || parsedUser?.email || "",
                phone:
                    prev.phone ||
                    parsedUser?.phone ||
                    parsedUser?.phone_number ||
                    parsedUser?.mobile ||
                    "",
            }));
        } catch (error) {
            console.error("Error parsing stored user:", error);
        }
    }, []);

    const isOwnListing =
        currentUserId !== null &&
        product?.user_id !== undefined &&
        product?.user_id !== null &&
        String(currentUserId) === String(product.user_id);

    const t = translations[language];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const productRes = await api.get(`/products/${productId}`);
                setProduct(productRes.data);
                console.log("Fetched product:", productRes.data);

                const ownerUserId = productRes.data?.user_id;
                if (ownerUserId) {
                    try {
                        const ownerRes = await api.get(`/user/${ownerUserId}`);
                        setOwnerInfo(ownerRes.data || null);
                    } catch (ownerError) {
                        console.error("Error fetching owner details:", ownerError);
                        setOwnerInfo(null);
                    }
                } else {
                    setOwnerInfo(null);
                }

                const productData = productRes.data || {};
                setSubCategory(null);
                setCategory(null);

                const categoryIdFromProduct = productData?.category_id;
                const subCategoryIdFromProduct = productData?.sub_category_id;

                if (categoryIdFromProduct) {
                    try {
                        const catRes = await api.get(`/categories/${categoryIdFromProduct}`);
                        setCategory(catRes.data || null);
                    } catch (categoryError) {
                        console.error("Error fetching category details:", categoryError);
                        setCategory(null);
                    }
                }

                if (subCategoryIdFromProduct) {
                    try {
                        const subCatRes = await api.get(
                            `/sub-categories/${subCategoryIdFromProduct}`
                        );
                        setSubCategory(subCatRes.data || null);

                        const subCategoryParentId = subCatRes.data?.category_id;
                        if (
                            subCategoryParentId &&
                            (!categoryIdFromProduct || categoryIdFromProduct !== subCategoryParentId)
                        ) {
                            try {
                                const catRes = await api.get(`/categories/${subCategoryParentId}`);
                                setCategory(catRes.data || null);
                            } catch (parentCategoryError) {
                                console.error(
                                    "Error fetching parent category details:",
                                    parentCategoryError
                                );
                            }
                        }
                    } catch (subCategoryError) {
                        console.error("Error fetching sub-category details:", subCategoryError);
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchFavoriteStatus = async () => {
            if (typeof window === "undefined") return;
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await api.get(`/favorites/status/${productId}`);
                setIsFavorite(response.data.favorite);
            } catch (error) {
                console.error("Error fetching favorite status:", error);
            }
        };

        if (productId) {
            fetchData();
            fetchFavoriteStatus();
        }
    }, [productId]);

    const handleToggleFavorite = async () => {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        setFavoriteLoading(true);

        try {
            const response = await api.post(`/favorites/${productId}`);
            setIsFavorite(response.data.favorite);
        } catch (error) {
            console.error("Error toggling favorite:", error);
        } finally {
            setFavoriteLoading(false);
        }
    };

    const handleShare = async () => {
        if (typeof window === "undefined") return;

        const shareData = {
            title: productName,
            text: productDescription || productName,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }

            await navigator.clipboard.writeText(shareData.url);
            Swal.fire({
                icon: "success",
                title: t?.productDetails?.share || "Share",
                text: "Product link copied to clipboard.",
                confirmButtonText: t?.swal?.okButton || "OK",
            });
        } catch (error) {
            if (error?.name !== "AbortError") {
                console.error("Error sharing product:", error);
                Swal.fire({
                    icon: "error",
                    title: "Unable to share",
                    text: "Please copy the page URL and share it manually.",
                    confirmButtonText: t?.swal?.okButton || "OK",
                });
            }
        }
    };

    const handleInquiry = () => {
        if (typeof window === "undefined") return;

        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token) {
            router.push("/login");
            return;
        }

        if (isOwnListing) {
            Swal.fire({
                icon: "info",
                title: t?.productDetails?.ownListingTitle || "This is your own listing",
                text:
                    t?.productDetails?.ownListingText ||
                    "You can't send an inquiry for a product or crop you uploaded yourself.",
                confirmButtonText: t?.swal?.okButton || "OK",
            });
            return;
        }

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const fullName =
                    [parsedUser?.first_name, parsedUser?.last_name]
                        .filter(Boolean)
                        .join(" ")
                        .trim() || parsedUser?.name || "";

                setInquiryForm((prev) => ({
                    ...prev,
                    name: fullName || prev.name,
                    email: parsedUser?.email || prev.email,
                    phone:
                        parsedUser?.phone ||
                        parsedUser?.phone_number ||
                        parsedUser?.mobile ||
                        prev.phone,
                }));
            } catch (error) {
                console.error("Error parsing stored user:", error);
            }
        }

        setShowInquiryModal(true);
        document.body.style.overflow = "hidden";
    };

    const handleCloseModal = () => {
        setShowInquiryModal(false);
        document.body.style.overflow = "auto";
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInquiryForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const handleInquirySubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post("/product-inquiries", {
                product_id: productId,
                name: inquiryForm.name,
                email: inquiryForm.email,
                phone: inquiryForm.phone,
                message: inquiryForm.message,
            });
            console.log("Inquiry submitted:", response.data);
            handleCloseModal();
            Swal.fire({
                icon: "success",
                title: t?.inquirySentTitle || "Inquiry Sent",
                text: t?.inquirySentMessage || "Your inquiry has been sent successfully. We will get back to you soon.",
                confirmButtonText: "OK",
            });
        } catch (error) {
            console.error("Error submitting inquiry:", error);
            Swal.fire({
                icon: "error",
                title: t?.inquiryFailedTitle || "Inquiry Failed",
                text: error?.response?.data?.message || t?.inquiryFailedMessage || "Something went wrong while sending your inquiry. Please try again.",
                confirmButtonText: "OK",
            });
        }
    };

    // Gallery navigation
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    };
    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? galleryImages.length - 1 : prev - 1
        );
    };

    // Click outside modal
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                handleCloseModal();
            }
        };

        if (showInquiryModal) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showInquiryModal]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 rounded-full border-4 border-green-200 border-t-green-600 animate-spin"></div>
                        <Leaf
                            size={28}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-600"
                        />
                    </div>
                    <p className="mt-6 text-green-600 font-medium text-lg tracking-wide">
                        {t?.productDetails?.loading || "Loading product..."}
                    </p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
                <div className="text-center p-10 bg-white rounded-3xl shadow-2xl max-w-md">
                    <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                        <Package size={40} className="text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-3">
                        {t?.productDetails?.notFoundTitle || "Product Not Found"}
                    </h1>
                    <p className="text-gray-500 mb-6">
                        {t?.productDetails?.notFoundText || "The product you're looking for doesn't exist or has been removed."}
                    </p>
                    <Link
                        href="/crops"
                        className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200"
                    >
                        <ArrowLeft size={18} />
                        {t?.productDetails?.browseProducts || "Browse Products"}
                    </Link>
                </div>
            </div>
        );
    }

    const ownerDisplayName = ownerInfo
        ? ownerInfo.name ||
        `${ownerInfo.first_name || ""} ${ownerInfo.last_name || ""}`.trim() ||
        "N/A"
        : "Not available";

    const productTypeNormalized = String(product?.type).toLowerCase();
    const isAnimalProduct = productTypeNormalized.includes('animal');
    const isNurseryProduct = productTypeNormalized.includes('nursery');
    const isEnglishOnlyNameProduct = isAnimalProduct || isNurseryProduct;

    const productName = isEnglishOnlyNameProduct
        ? product.name
        : language === "hi"
            ? product.name_hindi
            : language === "mr"
                ? product.name_marathi
                : product.name;

    const productDescription = product.description;

    const isInStock = product.stock_quantity > 0;
    const stockStatus = isInStock ? (t?.productDetails?.inStock || "In Stock") : (t?.productDetails?.outOfStock || "Out of Stock");
    const stockColor = isInStock ? "text-emerald-600" : "text-rose-600";
    const stockBg = isInStock ? "bg-emerald-50" : "bg-rose-50";



    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-amber-50/50 font-sans">
            {/* Top Navigation - Minimal */}
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link
                        href="/crops"
                        className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors group"
                    >
                        <ArrowLeft
                            size={18}
                            className="group-hover:-translate-x-1 transition-transform"
                        />
                        <span className="font-medium">{t?.productDetails?.back || "Back"}</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToggleFavorite}
                            disabled={favoriteLoading}
                            className={`p-2.5 rounded-full transition-all duration-300 ${isFavorite
                                ? "bg-rose-50 text-rose-500"
                                : "bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                                } ${favoriteLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                            <Heart
                                size={20}
                                fill={isFavorite ? "currentColor" : "none"}
                                className="transition-transform hover:scale-110"
                            />
                        </button>
                        <button
                            onClick={handleInquiry}
                            disabled={isOwnListing}
                            title={isOwnListing ? (t?.productDetails?.ownListingTitle || "This is your own listing") : undefined}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isOwnListing
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                : "bg-green-600 text-white hover:bg-green-400 shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-105"
                                }`}
                        >
                            <HelpCircle size={18} />
                            {t?.productDetails?.inquire || "Inquire"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Image Gallery - spans 3 columns */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="relative bg-white rounded-3xl shadow-xl shadow-amber-100/50 overflow-hidden">
                            <div
                                className={`relative w-full aspect-[4/3] ${!imageLoaded ? "animate-pulse bg-gray-100" : ""
                                    }`}
                            >
                                <Image
                                    width={800}
                                    height={600}
                                    src={galleryImages[currentImageIndex]}
                                    alt={productName}
                                    className={`object-cover w-full h-full transition-opacity duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"
                                        }`}
                                    onLoad={() => setImageLoaded(true)}
                                    priority
                                />
                            </div>



                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                {product.type === "Crop" && (
                                    <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                        <Leaf size={13} />
                                        {t?.productDetails?.crop || "Crop"}
                                    </span>
                                )}

                                {/* {product.is_processed && (
                                    <span className="bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                        Processed
                                    </span>
                                )}
                                {product.is_dehydrated && (
                                    <span className="bg-sky-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                        Dehydrated
                                    </span>
                                )} */}
                            </div>

                            {/* Stock Badge */}
                            <div className="absolute bottom-4 left-4">
                                <div
                                    className={`${stockBg} backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2`}
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full ${isInStock ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                            }`}
                                    ></div>
                                    <span className={`${stockColor} font-semibold text-sm`}>
                                        {stockStatus}
                                    </span>
                                    {isInStock && (
                                        <span className="text-gray-500 text-sm font-medium">
                                            ({product.stock_quantity} {t?.productDetails?.units || "units"})
                                        </span>
                                    )}
                                </div>
                            </div>


                        </div>


                    </div>

                    {/* Right Column: Product Info - spans 2 columns */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Link href="/" className="hover:text-amber-600 transition-colors">
                                {t?.productDetails?.home || "Home"}
                            </Link>
                            <span>›</span>
                            <Link href="/crops" className="hover:text-amber-600 transition-colors">
                                {t?.productDetails?.products || "Products"}
                            </Link>
                            <span>›</span>
                            <span className="text-gray-600 truncate max-w-[150px]">
                                {productName}
                            </span>
                        </div>

                        {/* Title & Rating */}
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 leading-tight">
                                {productName}
                            </h1>
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    {/* <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => {
                                            if (i < Math.floor(rating)) {
                                                return (
                                                    <Star key={i} size={18} fill="currentColor" />
                                                );
                                            } else if (i < Math.ceil(rating) && rating % 1 !== 0) {
                                                return (
                                                    <StarHalf key={i} size={18} fill="currentColor" />
                                                );
                                            } else {
                                                return (
                                                    <Star
                                                        key={i}
                                                        size={18}
                                                        className="text-gray-300"
                                                    />
                                                );
                                            }
                                        })}
                                    </div> */}
                                    {/* <span className="font-semibold text-gray-800">
                                        {rating}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        ({reviewCount} reviews)
                                    </span> */}
                                </div>
                                <span className="w-px h-5 bg-gray-200"></span>

                                <span className="text-gray-500 text-sm flex items-center gap-1.5">
                                    <Leaf size={15} />
                                    {language === "hi"
                                        ? category?.name_hindi
                                        : language === "mr"
                                            ? category?.name_marathi
                                            : category?.name}
                                </span>
                            </div>
                        </div>

                        {/* Price */}
                        {!isAnimalProduct && (
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold text-green-600 backdrop-blur-sm ">
                                    ₹{product.price}
                                </span>
                                <span className="text-gray-400 text-sm mb-1">{t?.productDetails?.per || "per"} {QUANTITY_UNIT_LABELS[product.quantity_unit] || product.quantity_unit || 'unit'}</span>
                            </div>
                        )}

                        {/* Tabs: Description, Details, Seller */}
                        <div className="border-b border-gray-200">
                            <div className="flex gap-6 overflow-x-auto">
                                {[
                                    { key: "description", label: t?.productDetails?.tabDescription || "Description" },
                                    { key: "details", label: t?.productDetails?.tabDetails || "Details" },
                                    ...(product.product_video ? [{ key: "video", label: t?.productDetails?.tabVideo || "Video" }] : []),
                                    { key: "seller", label: t?.productDetails?.tabSeller || "Seller" },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`py-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === tab.key
                                            ? "text-green-500/90 backdrop-blur-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.key && (
                                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/90 backdrop-blur-sm rounded-full"></span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[150px]">
                            {activeTab === "description" && (
                                <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                                    <p>{productDescription || t?.productDetails?.noDescription || "No description available."}</p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {product.type && (
                                            <span className="bg-amber-50 text-green-500 px-3 py-1 rounded-full text-xs font-medium">
                                                {String(product.type).toLowerCase() === 'crop' ? (t?.crop || product.type) : (t?.product || product.type)}
                                            </span>
                                        )}
                                        {product.product_type && (
                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                                {t?.[product.product_type] || product.product_type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {activeTab === "details" && (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {product.min_quantity > 0 && (
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-gray-400">{t?.productDetails?.minOrder || "Min. Order"}</p>
                                            <p className="font-semibold text-gray-800">{product.min_quantity} {QUANTITY_UNIT_LABELS[product.quantity_unit] || product.quantity_unit || t?.productDetails?.units || 'units'}</p>
                                        </div>
                                    )}
                                    {product.max_quantity > 0 && (
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-gray-400">{t?.productDetails?.maxOrder || "Max. Order"}</p>
                                            <p className="font-semibold text-gray-800">{product.max_quantity} {QUANTITY_UNIT_LABELS[product.quantity_unit] || product.quantity_unit || t?.productDetails?.units || 'units'}</p>
                                        </div>
                                    )}
                                    {product.type === "Crop" && product.planting_crops_date && (
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-gray-400">{t?.productDetails?.plantingDate || "Planting Date"}</p>
                                            <p className="font-semibold text-gray-800">
                                                {new Date(product.planting_crops_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                    {product.type === "Crop" && product.harvesting_start_date && (
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-gray-400">{t?.productDetails?.harvestStart || "Harvest Start"}</p>
                                            <p className="font-semibold text-gray-800">
                                                {new Date(product.harvesting_start_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                    {product.type === "Crop" && product.harvesting_end_date && (
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                            <p className="text-gray-400">{t?.productDetails?.harvestEnd || "Harvest End"}</p>
                                            <p className="font-semibold text-gray-800">
                                                {new Date(product.harvesting_end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === "video" && product.product_video && (
                                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-md bg-black">
                                    <video
                                        controls
                                        className="w-full max-h-105"
                                    >
                                        <source src={resolveMediaUrl(product.product_video)} />
                                    </video>
                                </div>
                            )}
                            {activeTab === "seller" && (
                                product?.user_id ? (
                                    <Link
                                        href={`/seller/${product.user_id}`}
                                        className="group flex items-center gap-4 bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:border-green-300 hover:shadow-lg transition-all"
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg shadow-green-300">
                                            {ownerDisplayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition-colors truncate">
                                                {ownerDisplayName}
                                            </h3>
                                            <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-0.5">
                                                <Star size={13} />
                                                {t?.productDetails?.viewProfileHint || "View profile, listings & reviews"}
                                            </p>
                                        </div>
                                        <ChevronRight
                                            size={20}
                                            className="text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all flex-shrink-0"
                                        />
                                    </Link>
                                ) : (
                                    <div className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-md border border-gray-100">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg shadow-green-300">
                                            {ownerDisplayName.charAt(0).toUpperCase()}
                                        </div>
                                        <h3 className="font-bold text-gray-800">
                                            {ownerDisplayName}
                                        </h3>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={handleInquiry}
                                disabled={isOwnListing}
                                title={isOwnListing ? (t?.productDetails?.ownListingTitle || "This is your own listing") : undefined}
                                className={`flex-1 flex items-center justify-center gap-2.5 backdrop-blur-sm px-6 py-4 rounded-xl font-bold text-base transition-all active:scale-[0.98] ${isOwnListing
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                    : "bg-green-600 text-white hover:bg-green-500 shadow-xl shadow-green-200 hover:shadow-green-200 hover:scale-[1.02]"
                                    }`}
                            >
                                <HelpCircle size={20} />
                                {t?.productDetails?.getQuote || "Get a Quote"}
                            </button>
                            <button
                                type="button"
                                onClick={handleShare}
                                className="flex items-center justify-center gap-2.5 bg-white border-2 border-gray-200 text-green-500 px-6 py-4 rounded-xl font-bold text-base hover:border-green-300 hover:text-green-600 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Share2 size={20} />
                                {t?.productDetails?.share || "Share"}
                            </button>
                        </div>

                        {/* Trust Badges */}
                        {/* <div className="flex items-center justify-center gap-6 text-xs text-gray-400 pt-2">
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck size={15} className="text-emerald-500" />
                                Secure
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Truck size={15} className="text-blue-500" />
                                Fast Delivery
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Award size={15} className="text-amber-500" />
                                Quality Assured
                            </span>
                        </div> */}


                    </div>

                    {verticalAdvertisements.length > 0 && (
                        <div className="hidden lg:block lg:col-span-3">
                            <div className="sticky top-24 flex justify-center">
                                <div className="w-[235px] overflow-hidden rounded-[26px] shadow-xl shadow-amber-100/60 ring-1 ring-gray-100">
                                    <Swiper
                                        modules={[Autoplay, Pagination]}
                                        direction="vertical"
                                        slidesPerView={1}
                                        spaceBetween={8}
                                        autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                                        pagination={{ clickable: true }}
                                        loop={verticalAdvertisements.length > 1}
                                        className="h-[470px] w-[235px]"
                                    >
                                        {verticalAdvertisements.map((ad) => (
                                            <SwiperSlide key={ad.id} className="overflow-hidden rounded-[26px]">
                                                <img
                                                    src={resolveMediaUrl(ad.image)}
                                                    alt={ad.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Inquiry Modal */}
            {showInquiryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        ref={modalRef}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
                    >
                        {/* Modal Header */}
                        <div className="relative bg-gradient-to-r from-green-600 to-green-500 px-6 py-5">
                            <button
                                onClick={handleCloseModal}
                                className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
                            >
                                <X size={18} />
                            </button>
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <HelpCircle size={24} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {t?.productDetails?.inquiryModalTitle || "Product Inquiry"}
                                    </h2>
                                    <p className="text-sm text-white/80">
                                        {t?.productDetails?.forLabel || "For:"}{" "}
                                        <span className="font-semibold">{productName}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <form onSubmit={handleInquirySubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            {t?.productDetails?.fullName || "Full Name"} <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <User
                                                size={17}
                                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder={t?.productDetails?.yourName || "Your name"}
                                                className="text-black w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-gray-50/50"
                                                name="name"
                                                value={inquiryForm.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            {t?.productDetails?.phone || "Phone"} <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone
                                                size={17}
                                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                type="tel"
                                                placeholder={t?.productDetails?.yourPhone || "Your phone"}
                                                className="text-black w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-gray-50/50"
                                                name="phone"
                                                value={inquiryForm.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        {t?.productDetails?.emailAddress || "Email Address"} <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail
                                            size={17}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                        <input
                                            type="email"
                                            placeholder="your@email.com"
                                            className="text-black w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-gray-50/50"
                                            name="email"
                                            value={inquiryForm.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        {t?.productDetails?.message || "Message"}
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            rows={4}
                                            placeholder={(t?.productDetails?.messagePlaceholder || "I'm interested in {name}. Please provide more details...").replace('{name}', productName)}
                                            className={`text-black w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all bg-gray-50/50 resize-none ${speechSupported ? "pr-12" : ""}`}
                                            name="message"
                                            value={inquiryForm.message}
                                            onChange={handleInputChange}
                                        />
                                        {speechSupported && (
                                            <button
                                                type="button"
                                                onClick={() => handleVoiceInput("message")}
                                                aria-label="Voice input"
                                                title="Speak to fill this field"
                                                className={`absolute right-3.5 top-4 transition-colors ${listeningField === "message" ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-amber-600"}`}
                                            >
                                                <Mic size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3.5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        {t?.productDetails?.cancel || "Cancel"}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-all shadow-lg shadow-green-200 hover:shadow-green-200"
                                    >
                                        <Send size={17} />
                                        {t?.productDetails?.sendInquiry || "Send Inquiry"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {advertisements.length > 0 && (
                <section className="mx-auto my-10 aspect-[940/235] w-full max-w-[940px] overflow-hidden rounded-3xl shadow-lg shadow-gray-200">
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        pagination={{ clickable: true }}
                        loop={advertisements.length > 1}
                        className="h-full w-full"
                    >
                        {advertisements.map((ad) => (
                            <SwiperSlide key={ad.id}>
                                <img
                                    src={resolveMediaUrl(ad.image)}
                                    alt={ad.title}
                                    className="h-full w-full object-cover"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}
        </div>
    );
}
