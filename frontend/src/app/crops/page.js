"use client"
import { Search, ChevronDown, Leaf, Filter, X, MapPin, Package, SlidersHorizontal, ChevronUp, Mic, BadgeCheck, CircleCheckBig } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef, useMemo, Fragment } from "react";
import { translations } from "../utils/translations.js";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

import api from "../utils/api.js";

export default function Crops() {

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [subCategoryCounts, setSubCategoryCounts] = useState({});

    const [products, setProducts] = useState([]);
    const [types, setTypes] = useState([]);
    const [advertisements, setAdvertisements] = useState([]);
    const [squareAdvertisements, setSquareAdvertisements] = useState([]);
    const [selectedAdIndex, setSelectedAdIndex] = useState(null);
    const [showCategory, setShowCategory] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedType, setSelectedType] = useState('');

    // Advanced Filter States
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [sellerState, setSellerState] = useState('');
    const [sellerDistrict, setSellerDistrict] = useState('');
    const [sellerTaluka, setSellerTaluka] = useState('');
    const [sellerVillage, setSellerVillage] = useState('');
    const [locationStates, setLocationStates] = useState([]);
    const [locationDistricts, setLocationDistricts] = useState([]);
    const [locationTalukas, setLocationTalukas] = useState([]);
    const [locationVillages, setLocationVillages] = useState([]);
    const [locationIds, setLocationIds] = useState({ state_id: '', district_id: '', taluka_id: '' });
    const [selectedProductTypes, setSelectedProductTypes] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [stockStatus, setStockStatus] = useState('all');
    const [sortBy, setSortBy] = useState('relevance');
    const [activeFilters, setActiveFilters] = useState({});

    // Product type options
    const productTypeOptions = [
        { value: 'crop', label: 'Crop' },
        { value: 'processed', label: 'Processed' },
        { value: 'dehydrated', label: 'Dehydrated' },
        { value: 'organic', label: 'Organic' },
        { value: 'fresh', label: 'Fresh' },
    ];

    useEffect(() => {
        const fetchIndiaStates = async () => {
            try {
                const countriesRes = await api.get('/countries');
                const india = countriesRes.data.find((c) => c.iso2 === 'IN' || c.name === 'India');
                if (!india) return;
                const statesRes = await api.get(`/states?country_id=${india.id}`);
                setLocationStates(statesRes.data || []);
            } catch (err) {
                console.error('Failed to load states', err);
            }
        };
        fetchIndiaStates();
    }, []);

    const defaultStateAppliedRef = useRef(false);
    useEffect(() => {
        if (!locationStates.length || defaultStateAppliedRef.current) return;
        defaultStateAppliedRef.current = true;

        const defaultState = locationStates.find((s) => s.name?.toLowerCase() === 'maharashtra');
        if (!defaultState) return;

        setLocationIds((prev) => ({ ...prev, state_id: String(defaultState.id) }));
        setSellerState(defaultState.name);
    }, [locationStates]);

    useEffect(() => {
        if (!locationIds.state_id) {
            setLocationDistricts([]);
            return;
        }
        const fetchDistricts = async () => {
            try {
                const res = await api.get(`/districts?state_id=${locationIds.state_id}`);
                setLocationDistricts(res.data || []);
            } catch (err) {
                console.error('Failed to load districts', err);
                setLocationDistricts([]);
            }
        };
        fetchDistricts();
    }, [locationIds.state_id]);

    useEffect(() => {
        if (!locationIds.district_id) {
            setLocationTalukas([]);
            return;
        }
        const fetchTalukas = async () => {
            try {
                const res = await api.get(`/talukas?district_id=${locationIds.district_id}`);
                setLocationTalukas(res.data || []);
            } catch (err) {
                console.error('Failed to load talukas', err);
                setLocationTalukas([]);
            }
        };
        fetchTalukas();
    }, [locationIds.district_id]);

    useEffect(() => {
        if (!locationIds.taluka_id) {
            setLocationVillages([]);
            return;
        }
        const fetchVillages = async () => {
            try {
                const res = await api.get(`/villages?taluka_id=${locationIds.taluka_id}`);
                setLocationVillages(res.data || []);
            } catch (err) {
                console.error('Failed to load villages', err);
                setLocationVillages([]);
            }
        };
        fetchVillages();
    }, [locationIds.taluka_id]);

    const handleSellerStateSelect = (e) => {
        const stateId = e.target.value;
        const match = locationStates.find((s) => String(s.id) === stateId);
        setLocationIds({ state_id: stateId, district_id: '', taluka_id: '' });
        setSellerState(match ? match.name : '');
        setSellerDistrict('');
        setSellerTaluka('');
        setSellerVillage('');
    };

    const handleSellerDistrictSelect = (e) => {
        const districtId = e.target.value;
        const match = locationDistricts.find((d) => String(d.id) === districtId);
        setLocationIds((prev) => ({ ...prev, district_id: districtId, taluka_id: '' }));
        setSellerDistrict(match ? match.district_name : '');
        setSellerTaluka('');
        setSellerVillage('');
    };

    const handleSellerTalukaSelect = (e) => {
        const talukaId = e.target.value;
        const match = locationTalukas.find((t) => String(t.id) === talukaId);
        setLocationIds((prev) => ({ ...prev, taluka_id: talukaId }));
        setSellerTaluka(match ? match.taluka_name : '');
        setSellerVillage('');
    };

    const handleSellerVillageSelect = (e) => {
        setSellerVillage(e.target.value);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await api.get('/products');
                setProducts(response.data || []);
                console.log('Fetched products:', response.data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const response = await api.get('/types');
                const activeTypes = Array.isArray(response.data)
                    ? response.data.filter((type) => String(type.status).trim().toLowerCase() === 'active')
                    : [];
                setTypes(activeTypes);
            } catch (error) {
                console.error('Error fetching types:', error);
            }
        };

        fetchTypes();
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
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await api.get('/categories');
                setCategories(response.data);
                console.log('Fetched categories:', response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Fetch sub-categories once and compute counts per category
    useEffect(() => {
        const fetchSubCategoryCounts = async () => {
            try {
                const res = await api.get('/sub-categories');
                const subs = res.data || [];
                setSubCategories(subs);
                const counts = {};
                subs.forEach((s) => {
                    const cid = s.category_id;
                    counts[cid] = (counts[cid] || 0) + 1;
                });
                setSubCategoryCounts(counts);
            } catch (err) {
                console.error('Error fetching sub-categories:', err);
            }
        };
        fetchSubCategoryCounts();
    }, []);

    const [language, setLanguage] = useState('en');
    useEffect(() => {
        const lang = localStorage.getItem('language') || 'en';
        setLanguage(lang);
    }, []);

    const t = translations[language];

    const getImageUrl = (value) => {
        if (!value) return '';
        const trimmedValue = String(value).trim();
        if (!trimmedValue) return '';
        if (/^https?:\/\//i.test(trimmedValue) || trimmedValue.startsWith('data:')) {
            return trimmedValue;
        }
        const normalizedPath = trimmedValue.startsWith('/') ? trimmedValue : `/${trimmedValue}`;
        return `${IMAGE_BASE_URL || ''}${normalizedPath}`;
    };

    const getCategoryImageUrl = (category) => getImageUrl(category?.image_url);
    const getSubCategoryImageUrl = (subCategory) => getImageUrl(subCategory?.image);

    const getProductDisplayImageUrl = (product) => {
        const productImage = getImageUrl(product?.image_url);
        if (productImage) return productImage;

        const subCategory = subCategories.find((sub) => Number(sub.id) === Number(product?.sub_category_id));
        const subCategoryImage = getSubCategoryImageUrl(subCategory);
        if (subCategoryImage) return subCategoryImage;

        const category = categories.find((cat) => Number(cat.id) === Number(product?.category_id));
        return getCategoryImageUrl(category);
    };

    const [searchText, setSearchText] = useState('');
    const [queryText, setQueryText] = useState('');
    const [listeningField, setListeningField] = useState(null);
    const [speechSupported, setSpeechSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && (window['SpeechRecognition'] || window['webkitSpeechRecognition'])) {
            setSpeechSupported(true);
        }
    }, []);

    const getSpeechLang = () => {
        const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
        return langMap[language] || 'en-IN';
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
            setQueryText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };
        recognition.onerror = () => setListeningField(null);
        recognition.onend = () => setListeningField(null);

        recognition.start();
    };

    const handleSearch = () => {
        setSearchText(queryText.trim());
        setCurrentPage(1);
    };

    const handleReset = () => {
        setQueryText('');
        setSearchText('');
        setSelectedCategory(null);
        setSelectedType('');
        setSellerState('');
        setSellerDistrict('');
        setSellerTaluka('');
        setSellerVillage('');
        setLocationIds({ state_id: '', district_id: '', taluka_id: '' });
        setSelectedProductTypes([]);
        setSelectedCategories([]);
        setPriceRange({ min: 0, max: 10000 });
        setStockStatus('all');
        setSortBy('relevance');
        setActiveFilters({});
        setCurrentPage(1);
    };

    const normalizeSearch = (value) => {
        if (value == null) return '';
        if (Array.isArray(value)) return value.join(' ').toLowerCase();
        return String(value).toLowerCase();
    };

    // Toggle advanced filter
    const toggleAdvancedFilter = () => {
        setShowAdvancedFilter(!showAdvancedFilter);
    };

    // Handle product type toggle
    const toggleProductType = (type) => {
        setSelectedProductTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    // Handle category toggle
    const toggleCategory = (categoryId) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Apply advanced filters
    const applyAdvancedFilters = () => {
        const filters = {
            sellerState,
            sellerDistrict,
            sellerTaluka,
            sellerVillage,
            types: selectedProductTypes,
            categories: selectedCategories,
            priceRange: priceRange,
            stockStatus: stockStatus,
        };
        setActiveFilters(filters);
        setCurrentPage(1);
        setShowAdvancedFilter(false);
    };

    // Remove a specific filter
    const removeFilter = (filterKey, value) => {
        if (filterKey === 'sellerState') {
            setSellerState('');
            setSellerDistrict('');
            setSellerTaluka('');
            setSellerVillage('');
            setLocationIds({ state_id: '', district_id: '', taluka_id: '' });
            setActiveFilters(prev => ({ ...prev, sellerState: '', sellerDistrict: '', sellerTaluka: '', sellerVillage: '' }));
        } else if (filterKey === 'sellerDistrict') {
            setSellerDistrict('');
            setSellerTaluka('');
            setSellerVillage('');
            setLocationIds(prev => ({ ...prev, district_id: '', taluka_id: '' }));
            setActiveFilters(prev => ({ ...prev, sellerDistrict: '', sellerTaluka: '', sellerVillage: '' }));
        } else if (filterKey === 'sellerTaluka') {
            setSellerTaluka('');
            setSellerVillage('');
            setLocationIds(prev => ({ ...prev, taluka_id: '' }));
            setActiveFilters(prev => ({ ...prev, sellerTaluka: '', sellerVillage: '' }));
        } else if (filterKey === 'sellerVillage') {
            setSellerVillage('');
            setActiveFilters(prev => ({ ...prev, sellerVillage: '' }));
        } else if (filterKey === 'type') {
            setSelectedProductTypes(prev => prev.filter(t => t !== value));
            setActiveFilters(prev => ({
                ...prev,
                types: prev.types?.filter(t => t !== value) || []
            }));
        } else if (filterKey === 'category') {
            setSelectedCategories(prev => prev.filter(id => id !== value));
            setActiveFilters(prev => ({
                ...prev,
                categories: prev.categories?.filter(id => id !== value) || []
            }));
        } else if (filterKey === 'price') {
            setPriceRange({ min: 0, max: 10000 });
            setActiveFilters(prev => ({ ...prev, priceRange: { min: 0, max: 10000 } }));
        } else if (filterKey === 'stock') {
            setStockStatus('all');
            setActiveFilters(prev => ({ ...prev, stockStatus: 'all' }));
        }
        setCurrentPage(1);
    };

    // Count active filters
    const getActiveFilterCount = () => {
        let count = 0;
        if (sellerState) count++;
        if (sellerDistrict) count++;
        if (sellerTaluka) count++;
        if (sellerVillage) count++;
        if (selectedProductTypes.length > 0) count += selectedProductTypes.length;
        if (selectedCategories.length > 0) count += selectedCategories.length;
        if (priceRange.min > 0 || priceRange.max < 10000) count++;
        if (stockStatus !== 'all') count++;
        return count;
    };

    const visibleProducts = products.filter((product) => {
        const status = String(product?.status || 'Pending').trim().toLowerCase();
        return status === 'approved';
    });

    const filteredProducts = visibleProducts.filter((product) => {
        const query = searchText.trim().toLowerCase();
        const matchesCategory = selectedCategory
            ? Number(product.category_id) === Number(selectedCategory.id)
            : true;
        const matchesSelectedType = selectedType
            ? [product.type, product.type_of_crop, product.product_type].some(
                (value) => String(value || '').trim().toLowerCase() === selectedType.trim().toLowerCase()
            )
            : true;

        // Advanced filters
        const matchesSellerState = activeFilters.sellerState
            ? product.seller_state?.toLowerCase() === activeFilters.sellerState.toLowerCase()
            : true;
        const matchesSellerDistrict = activeFilters.sellerDistrict
            ? product.seller_district?.toLowerCase() === activeFilters.sellerDistrict.toLowerCase()
            : true;
        const matchesSellerTaluka = activeFilters.sellerTaluka
            ? product.seller_taluka?.toLowerCase() === activeFilters.sellerTaluka.toLowerCase()
            : true;
        const matchesSellerVillage = activeFilters.sellerVillage
            ? product.seller_village?.toLowerCase() === activeFilters.sellerVillage.toLowerCase()
            : true;

        const matchesTypes = activeFilters.types && activeFilters.types.length > 0
            ? activeFilters.types.some(type => {
                const productType = product.type?.toLowerCase() || '';
                const isProcessed = product.is_processed ? 'processed' : '';
                const isDehydrated = product.is_dehydrated ? 'dehydrated' : '';
                const isOrganic = product.is_organic ? 'organic' : '';
                const isFresh = product.is_fresh ? 'fresh' : '';
                const types = [productType, isProcessed, isDehydrated, isOrganic, isFresh].filter(Boolean);
                return types.includes(type);
            })
            : true;

        const matchesCategories = activeFilters.categories && activeFilters.categories.length > 0
            ? activeFilters.categories.includes(Number(product.category_id))
            : true;

        const matchesPrice = activeFilters.priceRange
            ? product.price >= activeFilters.priceRange.min && product.price <= activeFilters.priceRange.max
            : true;

        const matchesStock = activeFilters.stockStatus && activeFilters.stockStatus !== 'all'
            ? activeFilters.stockStatus === 'in-stock'
                ? product.stock_quantity > 0
                : product.stock_quantity === 0
            : true;

        if (!query) {
            return matchesCategory && matchesSelectedType && matchesSellerState && matchesSellerDistrict && matchesSellerTaluka && matchesSellerVillage && matchesTypes && matchesCategories && matchesPrice && matchesStock;
        }

        const productCategory = categories.find((c) => Number(c.id) === Number(product.category_id));
        const productSubCategory = subCategories.find((s) => Number(s.id) === Number(product.sub_category_id));

        const searchableFields = [
            product.name,
            product.name_hindi,
            product.name_marathi,
            product.description,
            product.tags,
            product.type_of_crop,
            product.location,
            productCategory?.name,
            productCategory?.name_hindi,
            productCategory?.name_marathi,
            productSubCategory?.name,
            productSubCategory?.name_hindi,
            productSubCategory?.name_marathi,
        ];

        const matchesText = searchableFields.some((field) =>
            normalizeSearch(field).includes(query)
        );

        return matchesCategory && matchesSelectedType && matchesSellerState && matchesSellerDistrict && matchesSellerTaluka && matchesSellerVillage && matchesTypes && matchesCategories && matchesPrice && matchesStock && matchesText;
    });

    // Sub-categories to display in the filter: if a parent category is selected,
    // show only its sub-categories; otherwise show all sub-categories
    const displaySubCategories = selectedCategory
        ? subCategories.filter(s => Number(s.category_id) === Number(selectedCategory.id))
        : [];

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'name':
                return a.name?.localeCompare(b.name || '') || 0;
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            default:
                return 0;
        }
    });

    // Page target is 24 cards total (4 rows of 6). Square (235x235) ads fill up to
    // 2 slots per row (max 8 ads across 4 rows); products fill the rest, so however
    // many square ads exist (few or many), the page still shows 24 cards total.
    const maxAdsPerPage = 8;
    const adsToUsePerPage = Math.min(squareAdvertisements.length, maxAdsPerPage);
    const itemsPerPage = 24 - adsToUsePerPage;

    const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const currentProducts = sortedProducts.filter((productItem) => productItem && productItem.id).slice(startIndex, endIndex);

    // Every full row (6 cards each on desktop) gets up to 2 random ad slots when
    // square (235x235) ads are available. Each ad is used at most once per page (no
    // repeats) - once the ad pool runs out, remaining rows render as plain products.
    const { firstRowSlots, restProducts } = useMemo(() => {
        if (adsToUsePerPage === 0 || currentProducts.length < 4) {
            return { firstRowSlots: null, restProducts: currentProducts };
        }

        const shuffledAds = [...squareAdvertisements].sort(() => Math.random() - 0.5).slice(0, adsToUsePerPage);
        let adCursor = 0;
        let productCursor = 0;
        const slots = [];

        while (adCursor < shuffledAds.length) {
            const adsThisRow = Math.min(2, shuffledAds.length - adCursor);
            const productsNeeded = 6 - adsThisRow;
            if (currentProducts.length - productCursor < productsNeeded) break;

            const adPositions = new Set();
            while (adPositions.size < adsThisRow) {
                adPositions.add(Math.floor(Math.random() * 6));
            }
            for (let col = 0; col < 12; col++) {
                if (adPositions.has(col)) {
                    slots.push({ type: 'ad', ad: shuffledAds[adCursor], key: `ad-${slots.length}` });
                    adCursor++;
                } else {
                    slots.push({ type: 'product', product: currentProducts[productCursor] });
                    productCursor++;
                }
            }
        }

        // Wide banner ad (1175x235) sits between the 2nd and 3rd row, i.e. after 12 cards.
        if (advertisements.length > 0 && slots.length > 12) {
            slots.splice(12, 0, { type: 'banner', key: 'main-banner-ad' });
        }

        return {
            firstRowSlots: slots.length > 0 ? slots : null,
            restProducts: currentProducts.slice(productCursor),
        };
    }, [currentProducts, squareAdvertisements, adsToUsePerPage, advertisements]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, selectedCategory, selectedType, activeFilters, sortBy]);

    const renderProductCard = (productItem) => {
        if (!productItem || !productItem.id) return null;

        const productImageSrc = getProductDisplayImageUrl(productItem);

        return (
            <Link href={`/crops/${productItem.id}`} key={productItem.id}>
                <div
                    className="group bg-white rounded-[24px] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(10,26,18,0.12)] border border-gray-100/50 transition-all duration-500 hover:-translate-y-2 flex flex-col cursor-pointer"
                >
                    <div className="relative w-full h-[150px] rounded-[18px] bg-gray-50 overflow-hidden mb-3">
                        {productImageSrc ? (
                            <Image
                                src={productImageSrc}
                                alt={productItem.name || productItem.name_hindi || productItem.name_marathi || 'Product'}
                                width={400}
                                height={300}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
                                <Package size={36} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent group-hover:opacity-100 transition-opacity duration-500"></div>

                        {/* Seller Verified Badge (falls back to Product Type Badge when seller isn't verified) */}
                        {String(productItem.seller_document_status).toLowerCase() === 'verified' ? (
                            <div className="absolute top-0 right-1 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-1 py-1 rounded-full shadow-lg flex items-center gap-1">
                                <CircleCheckBig size={16} />

                            </div>
                        ) : (
                            productItem.type && (
                                <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                                    {productItem.type}
                                </div>
                            )
                        )}

                        {/* Stock Badge */}
                        <div className={`absolute bottom-2 left-1 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1.5 ${productItem.stock_quantity > 0 ? 'bg-emerald-50/90 text-emerald-600' : 'bg-rose-50/90 text-rose-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${productItem.stock_quantity > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                            {productItem.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </div>
                    </div>

                    <div className="px-3 pb-2">
                        <h3 className="text-md font-bold text-[#0A1A12] mb-1 group-hover:text-[#3B5C43] transition-colors duration-300 line-clamp-1">
                            {language === 'hi'
                                ? productItem.name_hindi || productItem.name
                                : language === 'mr'
                                    ? productItem.name_marathi || productItem.name
                                    : productItem.name}
                        </h3>
                    </div>
                </div>
            </Link>
        );
    };

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

                            <h3 className="absolute top-2 left-2 bg-gray-700 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                                {t?.advertisement || 'Advertisement'}
                            </h3>
                            <img
                                src={getImageUrl(ad.image)}
                                alt={ad.title}
                                className="h-full w-full object-cover"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
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
                className="group bg-white rounded-[24px] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(10,26,18,0.12)] border border-gray-100/50 transition-all duration-500 hover:-translate-y-2 flex flex-col cursor-pointer"
            >
                <div className="relative w-full h-[150px] rounded-[18px] bg-gray-50 overflow-hidden mb-3">
                    <img
                        src={getImageUrl(slot.ad.image)}
                        alt={slot.ad.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                </div>

                <div className="px-3 pb-2">
                    <h3 className="text-md font-bold text-[#0A1A12] mb-1 line-clamp-1">
                        {t?.advertisement || 'Advertisement'}
                    </h3>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen bg-[#f4fff4] font-sans pb-24">

            {/* Premium Header Section */}
            <div style={{
                backgroundImage: "url('/media/about-hero.jpg')"
            }} className="w-full sm:py-28 py-18 px-4 relative overflow-hidden bg-cover bg-center">

                {/* Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-black/60 z-0"></div>

                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#2C4232] rounded-full filter blur-[100px] opacity-40 translate-x-1/3 -translate-y-1/3 pointer-events-none z-0"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3B5C43] rounded-full filter blur-[100px] opacity-30 -translate-x-1/3 translate-y-1/3 pointer-events-none z-0"></div>

                <div className="max-w-[1300px] mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-6 backdrop-blur-md shadow-sm">
                        <Leaf size={16} className="text-[#8cc63f]" />
                        <span>Premium Selection</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-light text-white font-['Covered_By_Your_Grace'] mb-4">
                        <span className="font-bold italic"> {t?.cropPage.maintitle}</span>
                    </h1>
                    <p className="text-white/70 text-lg max-w-2xl mx-auto">
                        {t?.cropPage.description}
                    </p>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 sm:px-10 -mt-10 relative z-20">

                {/* Modern Search & Filter Bar */}
                <div className="bg-white rounded-[32px] p-4 sm:p-6 shadow-[0_20px_40px_rgba(10,26,18,0.08)] border border-[#2C4232]/5 mb-6">

                    {/* Top Row: Search, Category, Buttons */}
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="relative w-full md:flex-1 h-14">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={queryText}
                                onChange={(e) => {
                                    setQueryText(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                                placeholder="Search products by title, description, tags or crop type..."
                                className={`w-full h-full pl-12 ${speechSupported ? 'pr-12' : 'pr-4'} bg-gray-50 border border-gray-400 rounded-2xl text-gray-700 outline-none focus:bg-white focus:border-[#3B5C43] focus:ring-4 focus:ring-[#3B5C43]/10 transition-all text-base`}
                            />
                            {speechSupported && (
                                <button
                                    type="button"
                                    onClick={() => handleVoiceInput('search')}
                                    aria-label="Voice input"
                                    title="Speak to search"
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${listeningField === 'search' ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#3B5C43]'}`}
                                >
                                    <Mic size={20} />
                                </button>
                            )}
                        </div>

                        <div className="relative w-full md:w-[260px]">
                            <button
                                onClick={() => setShowCategory(!showCategory)}
                                className="w-full h-14 border border-gray-400 rounded-2xl px-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {selectedCategory ? (
                                        <>
                                            {getCategoryImageUrl(selectedCategory) ? (
                                                <Image
                                                    src={getCategoryImageUrl(selectedCategory)}
                                                    width={35}
                                                    height={35}
                                                    className="rounded-full object-cover w-8 h-8"
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold">
                                                    {String(selectedCategory?.name || 'C').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-black text-sm truncate max-w-[150px]">
                                                {language === "hi"
                                                    ? selectedCategory.name_hindi
                                                    : language === "mr"
                                                        ? selectedCategory.name_marathi
                                                        : selectedCategory.name}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-black text-sm">All Categories</span>
                                    )}
                                </div>

                                <ChevronDown size={20} className="text-gray-400" />
                            </button>

                            {showCategory && (
                                <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-xl border max-h-72 overflow-y-auto z-50">
                                    <div
                                        onClick={() => {
                                            setSelectedCategory(null);
                                            setShowCategory(false);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 cursor-pointer"
                                    >
                                        <span className="text-black font-medium text-sm">All Categories</span>
                                    </div>
                                    {categories.map((category) => (
                                        <div
                                            key={category.id}
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                setShowCategory(false);
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 cursor-pointer"
                                        >
                                            {getCategoryImageUrl(category) ? (
                                                <Image
                                                    src={getCategoryImageUrl(category)}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full object-cover w-10 h-10"
                                                    alt={category.name}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-semibold">
                                                    {String(category?.name || 'C').charAt(0).toUpperCase()}
                                                </div>
                                            )}

                                            <span className="text-black font-medium text-sm">
                                                {language === "hi"
                                                    ? category.name_hindi
                                                    : language === "mr"
                                                        ? category.name_marathi
                                                        : category.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            className="w-full md:w-auto h-14 px-8 bg-[#0A1A12] hover:bg-[#2C4232] text-white rounded-2xl font-semibold transition-colors duration-300 shadow-md flex items-center justify-center gap-2"
                            onClick={handleSearch}
                        >
                            Search
                        </button>

                        <button
                            className="w-full md:w-auto h-14 px-8 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition-colors duration-300 flex items-center justify-center gap-2"
                            onClick={handleReset}
                        >
                            Reset
                        </button>

                        {/* Advanced Filter Toggle Button */}
                        <button
                            onClick={toggleAdvancedFilter}
                            className={`w-full md:w-auto h-14 px-6 rounded-2xl font-semibold transition-all duration-300 shadow-md flex items-center justify-center gap-2 relative ${showAdvancedFilter
                                ? 'bg-green-700 hover:bg-green-800 text-white'
                                : 'bg-green-600 hover:bg-green-500 text-white'
                                }`}
                        >
                            <SlidersHorizontal size={20} />
                            {showAdvancedFilter ? 'Hide Filters' : 'Advanced Filter'}
                            {getActiveFilterCount() > 0 && !showAdvancedFilter && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {getActiveFilterCount()}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Advanced Filter Section (expandable) */}
                    {showAdvancedFilter && (
                        <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                {/* Seller Location Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <MapPin size={16} className="inline mr-1.5 text-gray-400" />
                                        Location
                                    </label>
                                    <div className="space-y-2">
                                        <select
                                            value={locationIds.state_id}
                                            onChange={handleSellerStateSelect}
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/50 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700"
                                        >
                                            <option value="">All States</option>
                                            {locationStates.map((state) => (
                                                <option key={state.id} value={state.id}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={locationIds.district_id}
                                            onChange={handleSellerDistrictSelect}
                                            disabled={!locationIds.state_id || !locationDistricts.length}
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/50 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">All Districts</option>
                                            {locationDistricts.map((district) => (
                                                <option key={district.id} value={district.id}>
                                                    {district.district_name}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={locationIds.taluka_id}
                                            onChange={handleSellerTalukaSelect}
                                            disabled={!locationIds.district_id || !locationTalukas.length}
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/50 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">All Talukas</option>
                                            {locationTalukas.map((taluka) => (
                                                <option key={taluka.id} value={taluka.id}>
                                                    {taluka.taluka_name}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={sellerVillage}
                                            onChange={handleSellerVillageSelect}
                                            disabled={!locationIds.taluka_id || !locationVillages.length}
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/50 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">All Villages</option>
                                            {locationVillages.map((village) => (
                                                <option key={village.id} value={village.village_name}>
                                                    {village.village_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>



                                {/* Category Filter (multi-select from existing categories) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="inline mr-1.5 text-gray-400">
                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                            <rect x="14" y="14" width="7" height="7" rx="1" />
                                        </svg>
                                        Sub-Categories
                                    </label>
                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                        {selectedCategory ? (
                                            displaySubCategories.length > 0 ? (
                                                displaySubCategories.map(sub => (
                                                    <label
                                                        key={sub.id}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${selectedCategories.includes(sub.id)
                                                            ? 'bg-purple-100 border-purple-300 text-purple-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategories.includes(sub.id)}
                                                            onChange={() => toggleCategory(sub.id)}
                                                            className="hidden"
                                                        />
                                                        {language === "hi"
                                                            ? sub.name_hindi
                                                            : language === "mr"
                                                                ? sub.name_marathi
                                                                : sub.name}
                                                    </label>
                                                ))
                                            ) : (
                                                <div className="text-sm text-gray-400 px-3 py-2">No sub-categories for selected category</div>
                                            )
                                        ) : (
                                            <div className="text-sm text-gray-400 px-3 py-2">Select a parent category to view sub-categories</div>
                                        )}
                                    </div>
                                </div>

                                {/* Stock Status */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="inline mr-1.5 text-gray-400">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                        </svg>
                                        Stock Status
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${stockStatus === 'all' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                            <input
                                                type="radio"
                                                name="stockStatus"
                                                value="all"
                                                checked={stockStatus === 'all'}
                                                onChange={(e) => setStockStatus(e.target.value)}
                                                className="hidden"
                                            />
                                            All
                                        </label>
                                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${stockStatus === 'in-stock' ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                            <input
                                                type="radio"
                                                name="stockStatus"
                                                value="in-stock"
                                                checked={stockStatus === 'in-stock'}
                                                onChange={(e) => setStockStatus(e.target.value)}
                                                className="hidden"
                                            />
                                            In Stock
                                        </label>
                                        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors border ${stockStatus === 'out-of-stock' ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                            <input
                                                type="radio"
                                                name="stockStatus"
                                                value="out-of-stock"
                                                checked={stockStatus === 'out-of-stock'}
                                                onChange={(e) => setStockStatus(e.target.value)}
                                                className="hidden"
                                            />
                                            Out of Stock
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Price Range and Apply/Reset */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="inline mr-1.5 text-gray-400">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="2" x2="12" y2="6" />
                                            <line x1="12" y1="18" x2="12" y2="22" />
                                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                                            <line x1="2" y1="12" x2="6" y2="12" />
                                            <line x1="18" y1="12" x2="22" y2="12" />
                                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                                        </svg>
                                        Price Range
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="10000"
                                                value={priceRange.min}
                                                onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50/50 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700"
                                                placeholder="Min"
                                            />
                                        </div>
                                        <span className="text-gray-300">—</span>
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="10000"
                                                value={priceRange.max}
                                                onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || 10000 }))}
                                                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-gray-50/50 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-gray-50/50 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700"
                                        >
                                            <option value="relevance">Relevance</option>
                                            <option value="price-low">Price: Low → High</option>
                                            <option value="price-high">Price: High → Low</option>
                                            <option value="name">Name</option>
                                            <option value="newest">Newest</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={applyAdvancedFilters}
                                            className="h-14 px-6 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-semibold transition-colors duration-300 shadow-md flex items-center justify-center gap-2"
                                        >
                                            Apply Filters
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSellerState('');
                                                setSellerDistrict('');
                                                setSellerTaluka('');
                                                setSellerVillage('');
                                                setLocationIds({ state_id: '', district_id: '', taluka_id: '' });
                                                setSelectedProductTypes([]);
                                                setSelectedCategories([]);
                                                setPriceRange({ min: 0, max: 10000 });
                                                setStockStatus('all');
                                            }}
                                            className="h-14 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl font-semibold transition-colors duration-300 flex items-center justify-center"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedType('');
                            setCurrentPage(1);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${!selectedType
                            ? 'border-green-300 bg-green-100 text-green-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {t?.cropPage?.allTypes || 'All Types'}
                    </button>
                    {types.map((type) => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                                setSelectedType(type.name);
                                setCurrentPage(1);
                            }}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selectedType === type.name
                                ? 'border-green-300 bg-green-100 text-green-700'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {language === 'hi'
                                ? type.name_hindi || type.name
                                : language === 'mr'
                                    ? type.name_marathi || type.name
                                    : type.name}
                        </button>
                    ))}
                </div>

                {/* Active Filters Tags */}
                {(getActiveFilterCount() > 0 || searchText || selectedCategory || selectedType) && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {searchText && (
                            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-200">
                                "{searchText}"
                                <button onClick={() => { setSearchText(''); setQueryText(''); setCurrentPage(1); }} className="hover:bg-blue-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {selectedCategory && (
                            <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-200">
                                Category: {selectedCategory.name}
                                <button onClick={() => { setSelectedCategory(null); setCurrentPage(1); }} className="hover:bg-purple-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {selectedType && (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
                                Type: {selectedType}
                                <button onClick={() => { setSelectedType(''); setCurrentPage(1); }} className="hover:bg-green-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {sellerState && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
                                <MapPin size={12} />
                                State: {sellerState}
                                <button onClick={() => removeFilter('sellerState')} className="hover:bg-emerald-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {sellerDistrict && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
                                District: {sellerDistrict}
                                <button onClick={() => removeFilter('sellerDistrict')} className="hover:bg-emerald-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {sellerTaluka && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
                                Taluka: {sellerTaluka}
                                <button onClick={() => removeFilter('sellerTaluka')} className="hover:bg-emerald-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {sellerVillage && (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200">
                                Village: {sellerVillage}
                                <button onClick={() => removeFilter('sellerVillage')} className="hover:bg-emerald-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {selectedProductTypes.map(type => (
                            <span key={type} className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                <button onClick={() => removeFilter('type', type)} className="hover:bg-amber-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                        {selectedCategories.map(catId => {
                            const cat = categories.find(c => c.id === catId);
                            return cat ? (
                                <span key={catId} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-200">
                                    {cat.name}
                                    <button onClick={() => removeFilter('category', catId)} className="hover:bg-indigo-100 rounded-full p-0.5">
                                        <X size={14} />
                                    </button>
                                </span>
                            ) : null;
                        })}
                        {(priceRange.min > 0 || priceRange.max < 10000) && (
                            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-medium px-3 py-1.5 rounded-full border border-rose-200">
                                ₹{priceRange.min} - ₹{priceRange.max}
                                <button onClick={() => removeFilter('price')} className="hover:bg-rose-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {stockStatus !== 'all' && (
                            <span className="inline-flex items-center gap-1.5 bg-cyan-50 text-cyan-700 text-xs font-medium px-3 py-1.5 rounded-full border border-cyan-200">
                                {stockStatus === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                                <button onClick={() => removeFilter('stock')} className="hover:bg-cyan-100 rounded-full p-0.5">
                                    <X size={14} />
                                </button>
                            </span>
                        )}
                        {(getActiveFilterCount() > 0 || searchText || selectedCategory) && (
                            <button
                                onClick={handleReset}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 hover:bg-red-50 rounded-full transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                )}

                {/* Sort and Results Count */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing <span className="font-bold text-gray-700">{sortedProducts.length}</span> products
                    </p>
                </div>


                {/* Premium Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-2 lg:gap-8">

                    {loading ? ([...Array(12)].map((_, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-[24px] p-3 shadow border animate-pulse"
                        >
                            <div className="w-full h-[150px] bg-gray-200 rounded-[18px] mb-3"></div>

                            <div className="px-3 pb-2">
                                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))
                    ) : sortedProducts.length === 0 ? (
                        <div className="col-span-full text-center text-slate-500 py-24">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-xl font-semibold text-gray-700">No Products found</p>
                            <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or search term.</p>
                            <button
                                onClick={handleReset}
                                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-500 transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : firstRowSlots ? (
                        <>
                            {firstRowSlots.map((slot) => {
                                if (slot.type === 'banner') return renderBannerAd(slot.key);
                                return slot.type === 'ad' ? renderSquareAdCard(slot) : renderProductCard(slot.product);
                            })}
                            {firstRowSlots.length <= 12 && advertisements.length > 0 && renderBannerAd('main-banner-ad')}
                            {restProducts.map((productItem) => renderProductCard(productItem))}
                        </>
                    ) : (
                        currentProducts.map((productItem, index) => {
                            const card = renderProductCard(productItem);

                            if (index === 11 && advertisements.length > 0) {
                                return (
                                    <Fragment key={`${productItem.id}-with-ad`}>
                                        {card}
                                        {renderBannerAd(`banner-after-${productItem.id}`)}
                                    </Fragment>
                                );
                            }

                            return card;
                        })
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-14 flex-wrap">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg border ${currentPage === 1
                                ? "bg-gray-600 text-white cursor-not-allowed"
                                : "bg-[#3d8f40] hover:bg-[#0A1A12] hover:text-white"
                                }`}
                        >
                            Prev
                        </button>

                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index + 1)}
                                className={`w-10 h-10 rounded-lg font-semibold transition ${currentPage === index + 1
                                    ? "bg-[#0A1A12] text-white"
                                    : "bg-[#3d8f40] border hover:bg-[#0A1A12] hover:text-white"
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg border ${currentPage === totalPages
                                ? "bg-gray-600 text-white cursor-not-allowed"
                                : "bg-[#3d8f40] hover:bg-[#0A1A12] hover:text-white"
                                }`}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

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
                            className="absolute -top-10 right-0 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
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
                                    <div className="relative w-full aspect-square rounded-[18px] overflow-hidden bg-white">
                                        <img
                                            src={getImageUrl(ad.image)}
                                            alt={ad.title}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>
            )}
        </div>
    );
}