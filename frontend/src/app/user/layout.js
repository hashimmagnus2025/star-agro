"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaGlobe,
  FaLanguage,
  FaFlag,
  FaStar,
  FaExchangeAlt,
  FaMoneyBillWave, FaHome, FaThLarge, FaBars, FaSearch, FaBell, FaUserCircle, FaSignOutAlt, FaUserFriends, FaChevronDown, FaChevronUp, FaBox, FaInbox, FaComments, FaUser, FaTruckLoading
} from 'react-icons/fa';

const PICKUP_ROLE = 'Enterprenure/Treder';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

import { translations } from '../utils/translations.js';
import Image from 'next/image';
import api from '../utils/api.js';
export default function UserLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [language, setLanguage] = useState('en');
  const userMenuRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const languageMenuRef = useRef(null);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const notificationMenuRef = useRef(null);
  const [permissions, setPermissions] = useState(null);
  const [jurisdiction, setJurisdiction] = useState(null);



  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    }

    if (userMenuOpen || languageMenuOpen || notificationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen, languageMenuOpen, notificationMenuOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(Array.isArray(response.data?.notifications) ? response.data.notifications : []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Drives which sidebar links show up — a link whose backing page the user can't
  // actually use (403) is worse than no link at all.
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/user/me');
        setPermissions(Array.isArray(response.data?.permissions) ? response.data.permissions : []);
        setJurisdiction(response.data?.jurisdiction || null);
      } catch (error) {
        console.error('Failed to load permissions:', error);
        setPermissions([]);
      }
    };
    fetchPermissions();
  }, []);

  const hasPermission = (permissionName) => !permissionName || (permissions || []).includes(permissionName);

  const handleToggleNotifications = () => {
    setNotificationMenuOpen((prev) => !prev);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, is_read: 1 } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    if (notification.product_id) {
      router.push('/user/my-products');
    }
    setNotificationMenuOpen(false);
  };

  const getLocalizedNotification = (notification) => {
    const nt = translations[language]?.notifications;
    if (!nt) return { title: notification.title, message: notification.message };

    let data = notification.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { data = null; }
    }

    switch (notification.type) {
      case 'approval':
      case 'rejection': {
        const itemLabel = data?.itemLabel === 'crop' ? nt.crop : nt.product;
        const name = data?.name || '';
        const titleKey = notification.type === 'approval' ? 'approvalTitle' : 'rejectionTitle';
        const messageKey = notification.type === 'approval' ? 'approvalMessage' : 'rejectionMessage';
        return {
          title: nt[titleKey],
          message: nt[messageKey].replace('{itemLabel}', itemLabel).replace('{name}', name),
        };
      }
      case 'document_verified':
        return { title: nt.documentVerifiedTitle, message: nt.documentVerifiedMessage };
      case 'document_rejected':
        return { title: nt.documentRejectedTitle, message: nt.documentRejectedMessage };
      case 'destroy_alert':
        return {
          title: nt.destroyAlertTitle,
          message: data
            ? nt.destroyAlertMessage
              .replace('{farmerName}', data.farmerName || '')
              .replace('{farmerPhone}', data.farmerPhone || '')
              .replace('{cropName}', data.cropName || '')
            : notification.message,
        };
      case 'destroy_claimed':
        return {
          title: nt.destroyClaimedTitle,
          message: data
            ? nt.destroyClaimedMessage
              .replace('{claimerName}', data.claimerName || '')
              .replace('{claimerPhone}', data.claimerPhone || '')
              .replace('{cropName}', data.cropName || '')
            : notification.message,
        };
      case 'inquiry':
        return {
          title: nt.inquiryTitle,
          message: data
            ? nt.inquiryMessage
              .replace('{name}', data.name || '')
              .replace('{productName}', data.productName || '')
              .replace('{message}', data.message || '')
            : notification.message,
        };
      default:
        return { title: notification.title, message: notification.message };
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    handleResize();
    setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser({
            name: userData.name || userData.first_name,
            email: userData.email,
            role: userData.role || 'user',
            profile_image: userData.profile_image || null,
          });
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
      }
    };

    loadUser();
    window.addEventListener('userUpdated', loadUser);
    return () => window.removeEventListener('userUpdated', loadUser);
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };


  const currentTranslations = translations[language] || translations.en;
  const userMenuItems = [
    { href: '/', label: currentTranslations.home || 'Home', icon: FaHome },
    { href: '/user', label: currentTranslations.userPanel?.Dashboard || 'Dashboard', icon: FaThLarge },
    { href: '/user/profile', label: currentTranslations.userPanel?.myProfile?.myProfile || 'Profile', icon: FaUser },
    { href: '/user/add-product', label: currentTranslations.userPanel?.myProduct.addcroporProducts || 'Add Crops or Products', icon: FaInbox, permission: 'product.create' },
    { href: '/user/my-products', label: currentTranslations.userPanel?.myProduct.myCropsOrProducts || 'My Crops or Products', icon: FaInbox, permission: 'product.view' },
    { href: '/user/my-inquiries', label: currentTranslations.userPanel?.MyInquiries.myInquiries || 'My Inquiries', icon: FaComments },
    { href: '/user/add-services', label: currentTranslations.userPanel?.servicesProvider?.addService || 'Add Service', icon: FaComments, permission: 'service.create' },
    { href: '/user/my-services', label: currentTranslations.userPanel?.servicesProvider?.myServicesTitle || 'My Services', icon: FaComments, permission: 'service.view' },
    { href: '/user/wallet', label: currentTranslations.userPanel?.wallet.wallet || 'Wallet', icon: FaMoneyBillWave },
    { href: '/user/referral', label: currentTranslations.userPanel?.Referral.Referral || 'Referral', icon: FaUserFriends },
    { href: '/user/recharge-history', label: currentTranslations.userPanel?.rechargeHistory.recharge || 'Recharge History', icon: FaExchangeAlt },
    { href: '/user/my-favorites', label: currentTranslations.userPanel?.myFavorites.myFavorites || 'My Favorites', icon: FaStar },
    ...(jurisdiction
      ? [{ href: '/user/my-team', label: currentTranslations.userPanel?.myTeam.myTeam || 'My Team', icon: FaUserFriends }]
      : []),
    ...(jurisdiction?.scope_type === 'village'
      ? [{
        href: '/user/add-user',
        label: currentTranslations.userPanel?.addUser.addUser || 'Add User',
        icon: FaUserFriends,
        permission: 'user.create',
      },
      {
        href: '/user/add-user-products',
        label: 'Add User Products',
        icon: FaUserFriends,
        permission: 'product.create',
      },
      ]
      : []),
    ...(jurisdiction?.scope_type === 'district' || jurisdiction?.scope_type === 'taluka'
      ? [{
        href: '/user/my-team-products',
        label: 'My Team Products',
        icon: FaInbox,
        permission: 'product.approve',
      }]
      : []),
    ...(user?.role === PICKUP_ROLE
      ? [{ href: '/user/pickup-crops', label: currentTranslations.pickupCrops?.availableForPickup || 'Available for Pickup', icon: FaTruckLoading }]
      : []),
  ].filter((item) => hasPermission(item.permission));


  useEffect(() => {
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);
  }, []);

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className=" min-h-screen">
        {sidebarOpen && isMobile && (
          <div

            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden bg-white transition-all duration-300 ${sidebarOpen ? 'w-72 translate-x-0 shadow-xl' : 'w-72 -translate-x-full'
            }`}
        >
          <div className="flex h-full flex-col">
            <div className=" bg-[#b5c8f0] flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="">
                  <Image
                    src="/media/logo-cropped.svg"
                    alt="Star Agro Logo"
                    width={32}
                    height={32}
                    className=' h-18 w-16'
                  />

                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Star Agro</p>
                  <p className="text-xs text-slate-500">User portal</p>
                </div>
              </div>
              <div className='md:block lg:hidden block'>
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  aria-label="Toggle sidebar"
                >
                  <FaBars className="h-4 w-4" />
                </button>
              </div>

            </div>

            <nav className="mt-6 flex-1 px-2 pb-4 overflow-y-auto">
              {userMenuItems.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedMenu === item.label;

                if (item.children) {
                  return (
                    <div key={item.label} className="mb-2">
                      <button
                        type="button"
                        onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                        className={`group w-full flex items-center justify-between gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition ${isExpanded ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span className={`${sidebarOpen ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
                        </span>
                        <span className={`${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
                          {isExpanded ? <FaChevronUp className="h-4 w-4" /> : <FaChevronDown className="h-4 w-4" />}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-2 pl-6">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={`${child.href}-${child.label}`}
                                href={child.href}
                                className={`group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm transition ${pathname === child.href ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                              >
                                <ChildIcon className="h-4 w-4" />
                                <span className={`${sidebarOpen ? 'block' : 'hidden lg:block'}`}>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={`group mb-2 flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-semibold transition ${pathname === item.href ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className={`${sidebarOpen ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className={`flex  min-h-screen flex-1 flex-col transition-all duration-300 ${!isMobile && sidebarOpen ? 'lg:ml-72' : ''}`}>
          <header className=" sticky top-0 z-10 border-b border-slate-200 bg-[#b5c8f0] px-4 py-4 backdrop-blur-sm shadow-sm shadow-slate-100">
            <div className="flex  gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  aria-label="Toggle sidebar"
                >
                  <FaBars className="h-4 w-4" />
                </button>
                <div className=" md:hidden lg:block hidden">
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">User Portal</p>
                  <h1 className="mt-2 text-2xl font-black text-slate-900">Welcome back, {user?.name || 'User'}</h1>
                </div>
              </div>

              <div className="flex gap-3 flex-row items-center">
                <div className="md:hidden lg:block hidden relative w-full sm:w-80">
                  <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search products, messages..."
                    className="w-full rounded-3xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="relative" ref={languageMenuRef}>
                  <button
                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                    className=""
                    aria-expanded={languageMenuOpen}
                    aria-label="Toggle language"
                    title="Select Language"
                  >

                    <FaLanguage size={26} />
                  </button>
                  {languageMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-22 rounded-2xl border border-slate-200 bg-white shadow-lg p-2 z-50">
                      <button
                        onClick={() => {
                          localStorage.setItem('language', 'en');
                          setLanguageMenuOpen(false);
                          window.location.reload();
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 transition"
                      >
                        English
                      </button>
                      <button
                        onClick={() => {
                          localStorage.setItem('language', 'hi');
                          setLanguageMenuOpen(false);
                          window.location.reload();
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 transition"
                      >
                        हिन्दी
                      </button>
                      <button
                        onClick={() => {
                          localStorage.setItem('language', 'mr');
                          setLanguageMenuOpen(false);
                          window.location.reload();
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-700 hover:bg-emerald-50 transition"
                      >
                        मराठी
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative" ref={notificationMenuRef}>
                  <button
                    onClick={handleToggleNotifications}
                    className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                    aria-label="Notifications"
                    aria-expanded={notificationMenuOpen}
                    title="Notifications"
                  >
                    <FaBell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationMenuOpen && (
                    <div className="absolute -left-60 -lg:left-20 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg z-50">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <p className="font-semibold text-sm text-slate-900">{t?.notifications?.panelTitle || 'Notifications'}</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            {t?.notifications?.markAllRead || 'Mark all as read'}
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-slate-500">
                          {t?.notifications?.empty || 'No notifications yet'}
                        </div>
                      ) : (
                        notifications.map((notification) => {
                          const localized = getLocalizedNotification(notification);
                          return (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`block w-full text-left px-4 py-3 border-b border-slate-100 transition hover:bg-slate-50 ${!notification.is_read ? 'bg-emerald-50/50' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">{localized.title}</p>
                                {!notification.is_read && (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                )}
                              </div>
                              <p className="mt-1 text-xs text-slate-600 line-clamp-2">{localized.message}</p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}
                              </p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center gap-3 rounded-3xl bg-[#b5c8f0] px-2 py-1 text-sm text-slate-700 shadow-sm border border-slate-200 transition hover:bg-slate-50 cursor-pointer"
                  >
                    {user?.profile_image ? (
                      <Image
                        src={resolveMediaUrl(user.profile_image)}
                        alt={user?.name || 'Profile'}
                        width={20}
                        height={20}
                        className="h-12 w-12 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <FaUserCircle className="h-5 w-5 text-emerald-600" />
                    )}
                    <div className="hidden sm:block">
                      <p className="font-semibold">{user?.name}</p>
                    </div>
                  </button>

                  {userMenuOpen && (
                    < div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-lg border border-slate-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="font-semibold text-sm text-slate-900">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500">{user?.email || ''}</p>
                      </div>
                      <Link href="/user/profile" onClick={() => setUserMenuOpen(false)}>
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="font-semibold text-sm text-slate-900">{ } {t?.userPanel.myProfile.myProfile}</p>
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                      >
                        <FaSignOutAlt className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
