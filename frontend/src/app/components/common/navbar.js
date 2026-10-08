'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { Phone, Mail, MapPin, Search, ShoppingCart, Heart, Menu, X, Globe } from 'lucide-react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import Image from "next/image";
import api, { setAuthToken } from '../../utils/api.js';
import { translations } from '../../utils/translations.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
    const [language, setLanguage] = useState('en');
    const [user, setUser] = useState(null);
    const userMenuRef = useRef(null);
    const languageMenuRef = useRef(null);

    useEffect(() => {
        const loadUser = () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (!storedUser) {
                    setUser(null);
                    return;
                }
                let userData = JSON.parse(storedUser);

                // Unwrap common wrappers that some endpoints use
                if (userData?.user) userData = userData.user;
                if (userData?.data) {
                    if (userData.data.user) userData = userData.data.user;
                    else if (userData.data.userInfo) userData = userData.data.userInfo;
                    else if (typeof userData.data === 'object') userData = userData.data;
                }

                const name = userData?.name || userData?.first_name || userData?.fullName || userData?.username || (userData?.firstName && `${userData.firstName} ${userData.lastName}`) || 'Account';
                const email = userData?.email || userData?.emailAddress || userData?.username || '';
                const role = userData?.role || 'user';
                const profileImage = userData?.profile_image || null;

                setUser({ name, email, role, profile_image: profileImage });
                console.debug('Navbar: loaded user from localStorage', { name, email, role });

                // If we only have a token (no real name/email), try fetching profile from backend
                const hasRealName = !!(name && name !== 'Account');
                if ((!email || !hasRealName) && (userData?.token || localStorage.getItem('token'))) {
                    (async () => {
                        const token = userData?.token || localStorage.getItem('token');
                        try {
                            setAuthToken(token);
                            const resp = await api.get('/user/me');
                            const fetched = resp.data?.user || resp.data;
                            if (fetched) {
                                setUser({
                                    name: fetched.name || fetched.first_name || fetched.fullName || 'Account',
                                    email: fetched.email || '',
                                    role: fetched.role || 'user',
                                    profile_image: fetched.profile_image || null,
                                });
                            }
                        } catch (e) {
                            console.warn('Navbar: failed to fetch /me', e?.response?.data || e.message || e);
                        }
                    })();
                }
            } catch (error) {
                console.error('Failed to load user from localStorage:', error);
            }
        };

        loadUser();
        window.addEventListener('userUpdated', loadUser);
        return () => window.removeEventListener('userUpdated', loadUser);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
            if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
                setLanguageMenuOpen(false);
            }
        }

        if (userMenuOpen || languageMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [userMenuOpen, languageMenuOpen]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const toggleMenu = () => {
        setIsOpen(s => !s);
        setSearchOpen(false);
    };

    const toggleSearch = () => {
        setSearchOpen(s => !s);
        setIsOpen(false);
    };
    useEffect(() => {
        const lang =
            localStorage.getItem('language') || 'en';

        setLanguage(lang);
    }, []);

    const t = translations[language];

    const handleLanguageChange = async (lang) => {
        localStorage.setItem('language', lang);
        setLanguageMenuOpen(false);

        const token = localStorage.getItem('token');
        if (token) {
            // Persist so server-side actions (e.g. WhatsApp notifications) can use this user's language later.
            try {
                await api.put('/user/me', { language: lang });
            } catch (err) {
                console.error('Failed to save language preference', err);
            }
        }

        window.location.reload();
    };

    return (


        <div>
            <nav className="bg-black backdrop-blur-lg sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between py-4">
                        <div className="flex items-center justify-between gap-3">
                            <Link href="/" className="flex items-center gap-3">
                                <Image src="/media/logo-cropped.svg" alt="Star Agro Logo" width={150} height={50} className="sm:w-20 sm:h-18 w-20 h-16" />

                            </Link>
                            <div className="lg:hidden flex items-center gap-2">
                                <button
                                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                                    className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-white hover:bg-slate-50 transition"
                                    aria-expanded={languageMenuOpen}
                                    aria-label="Toggle language"
                                >
                                    <Globe size={20} />
                                </button>
                                <button
                                    onClick={toggleSearch}
                                    className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 text-white hover:bg-slate-50 transition"
                                    aria-expanded={searchOpen}
                                    aria-label="Toggle search"
                                >
                                    <Search size={20} />
                                </button>
                                <button
                                    className="p-2 rounded-xl border border-slate-200 text-white hover:bg-slate-50 transition"
                                    onClick={toggleMenu}
                                    aria-label="Toggle menu"
                                >
                                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                                </button>
                            </div>
                        </div>

                        <div className="hidden lg:flex items-center justify-center gap-8 text-white ">
                            <Link href="/" className=" hover:text-emerald-600 font-medium transition ">{t.home}</Link>
                            <Link href="/about-us" className=" hover:text-emerald-600 font-medium transition">{t.about}</Link>
                            <Link href="/services" className=" hover:text-emerald-600 font-medium transition">{t.services}</Link>
                            <Link href="/crops" className="font-semibold text-emerald-300 transition hover:text-emerald-200 animate-pulse [animation-duration:1.8s]">{t.Listing}</Link>
                            <Link href="/service-hub" className=" hover:text-emerald-600 font-medium transition">{t.ServiceHub}</Link>
                            <Link href="/gallery" className=" hover:text-emerald-600 font-medium transition">{t.gallery}</Link>
                            <Link href="/contact" className=" hover:text-emerald-600 font-medium transition">{t.contact}</Link>
                        </div>

                        <div className="hidden lg:flex items-center gap-3">

                            <div className="relative" ref={languageMenuRef}>
                                <button
                                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                                    className=""
                                    aria-expanded={languageMenuOpen}
                                    aria-label="Toggle language"
                                    title="Select Language"
                                >
                                    <Globe size={20} />
                                </button>
                                {languageMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-22 rounded-2xl border border-slate-200 bg-white shadow-lg p-2 z-50">
                                        <button
                                            onClick={() => handleLanguageChange('en')}
                                            className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 transition"
                                        >
                                            English
                                        </button>
                                        <button
                                            onClick={() => handleLanguageChange('hi')}
                                            className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 transition"
                                        >
                                            हिन्दी
                                        </button>
                                        <button
                                            onClick={() => handleLanguageChange('mr')}
                                            className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 transition"
                                        >
                                            मराठी
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="relative">

                                <button
                                    onClick={toggleSearch}
                                    className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-slate-200 text-white hover:bg-slate-50 transition"
                                    aria-expanded={searchOpen}
                                    aria-label="Toggle search"
                                >
                                    <Search size={20} />
                                </button>
                                {searchOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white shadow-lg p-3">
                                        <input
                                            autoFocus
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') setSearchOpen(false);
                                                if (e.key === 'Enter') {
                                                    const q = encodeURIComponent(searchQuery.trim());
                                                    if (q) window.location.href = `/search?q=${q}`;
                                                    setSearchOpen(false);
                                                }
                                            }}
                                            placeholder="Search products, crops, services..."
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                        />
                                    </div>
                                )}
                            </div>
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                                    >
                                        {user.profile_image ? (
                                            <Image
                                                src={resolveMediaUrl(user.profile_image)}
                                                alt={user.name || 'Profile'}
                                                width={20}
                                                height={20}
                                                className="h-9 w-9 rounded-full object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <FaUserCircle className="h-5 w-5" />
                                        )}
                                        <span className="font-medium">{user.name}</span>
                                    </button>
                                    {userMenuOpen && (

                                        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white shadow-lg border border-slate-200 z-50 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-slate-100">
                                                <p className="font-semibold text-sm text-slate-900">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>

                                            </div>
                                            <Link href={user.role === 'admin' || user.role === 'super_admin' ? '/admin/profile' : '/user/profile'}>
                                                <div className="px-4 py-3 border-b border-slate-100">
                                                    <p className="font-semibold text-md text-slate-900">
                                                        {t?.userPanel.myProfile.myProfile}
                                                    </p>
                                                </div>
                                            </Link>
                                            <Link href={user.role === 'admin' || user.role === 'super_admin' ? "/admin" : "/user/add-product"}>
                                                <div className="px-4 py-3 border-b border-slate-100 transition-all duration-300 hover:bg-emerald-50">
                                                    <p className="font-semibold text-md text-emerald-800 animate-pulse [animation-duration:1.8s]">
                                                        {user.role === 'admin' || user.role === 'super_admin' ? "Dashboard" : `${t?.userPanel.myProduct.addcroporProducts}`}
                                                    </p>
                                                </div>
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                                            >
                                                <FaSignOutAlt className="h-4 w-4" />
                                                {t?.loginPage.logout}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link href="/register" className="px-4 py-2 rounded-full bg-emerald-600 text-white hover:opacity-95 transition">{t?.Register}</Link>
                                    <Link href="/login" className="px-4 py-2 rounded-full bg-emerald-600 text-white hover:opacity-95 transition">{t?.login}</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`lg:hidden transition-max-h duration-300 ease-in-out overflow-hidden ${searchOpen ? 'max-h-44' : 'max-h-0'}`}>
                    <div className="px-4 pb-4 pt-3 bg-white border-t">
                        {searchOpen && (
                            <input
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setSearchOpen(false);
                                    if (e.key === 'Enter') {
                                        const q = encodeURIComponent(searchQuery.trim());
                                        if (q) window.location.href = `/search?q=${q}`;
                                        setSearchOpen(false);
                                    }
                                }}
                                placeholder="Search crops, services or news..."
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                        )}
                    </div>
                </div>

                <div className={`lg:hidden transition-max-h duration-300 ease-in-out overflow-hidden ${languageMenuOpen ? 'max-h-44' : 'max-h-0'}`}>
                    <div className="px-4 pb-4 pt-3 bg-white border-t space-y-2">
                        <button
                            onClick={() => handleLanguageChange('en')}
                            className="w-full text-left px-4 py-3 rounded-xl text-slate-700 hover:bg-emerald-50 transition"
                        >
                            English
                        </button>
                        <button
                            onClick={() => handleLanguageChange('hi')}
                            className="w-full text-left px-4 py-3 rounded-xl text-slate-700 hover:bg-emerald-50 transition"
                        >
                            हिन्दी
                        </button>
                        <button
                            onClick={() => handleLanguageChange('mr')}
                            className="w-full text-left px-4 py-3 rounded-xl text-slate-700 hover:bg-emerald-50 transition"
                        >
                            मराठी
                        </button>
                    </div>
                </div>

                <div className={`lg:hidden transition-max-h duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-150' : 'max-h-0'}`}>
                    <div className="px-4 pb-4 pt-4 space-y-2 bg-white border-t">
                        <Link href="/" onClick={toggleMenu} className="block px-4 py-2 text-slate-700 hover:bg-emerald-50 border-b border-black">{t.home}</Link>
                        <Link href="/about-us" onClick={toggleMenu} className="block px-4 py-2 text-slate-700 hover:bg-emerald-50 border-b border-black">{t.about}</Link>
                        <Link href="/services" onClick={toggleMenu} className="block px-4 py-2 text-slate-700 hover:bg-emerald-50 border-b border-black">{t.services}</Link>
                        <Link href="/crops" onClick={toggleMenu} className="block px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50 border-b border-black animate-pulse [animation-duration:1.8s]">{t.Listing}</Link>
                        <Link href="/service-hub" onClick={toggleMenu} className="block px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50 border-b border-black animate-pulse [animation-duration:1.8s]">{t.ServiceHub}</Link>
                        <Link href="/gallery" onClick={toggleMenu} className="block px-4 py-2 text-slate-700 hover:bg-emerald-50 border-b border-black">{t.gallery}</Link>
                        <Link href="/contact" onClick={toggleMenu} className="block px-4 py-2 text-slate-700 hover:bg-emerald-50 border-b border-black">{t.contact}</Link>
                        <div className="pt-3 border-t border-slate-200">
                            {user ? (
                                <div className="space-y-2">
                                    <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                                        <p className="font-semibold text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                    <Link href={user.role === 'admin' || user.role === 'super_admin' ? '/admin/profile' : '/user/profile'}>
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="font-extrabold text-md text-slate-900">
                                                {t?.userPanel.myProfile.myProfile}
                                            </p>
                                        </div>
                                    </Link>
                                    <Link href={user.role === 'admin' || user.role === 'super_admin' ? "/admin" : "/user/add-product"}>
                                        <div className="px-4 py-2 border-b border-slate-100 transition-all duration-300 hover:bg-emerald-50">
                                            <p className="font-extrabold text-md text-emerald-800 animate-pulse [animation-duration:1.8s]">
                                                {user.role === 'admin' || user.role === 'super_admin' ? "Dashboard" : `${t?.userPanel.myProduct.addcroporProducts}`}
                                            </p>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={() => { handleLogout(); toggleMenu(); }}
                                        className="w-full flex items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-3 text-white font-medium hover:bg-red-700 transition"
                                    >
                                        <FaSignOutAlt className="h-4 w-4" />
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link href="/register" onClick={toggleMenu} className="block w-full rounded-full border border-emerald-600 px-4 py-3 text-center text-emerald-600 hover:bg-emerald-50">Register</Link>
                                    <Link href="/login" onClick={toggleMenu} className="mt-2 block w-full rounded-full bg-emerald-600 px-4 py-3 text-center text-white">Login</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
}
