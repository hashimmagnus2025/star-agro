'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaFolderOpen,
  FaImages,
  FaQuestionCircle,
  FaBoxOpen,
  FaCogs,
  FaWrench,
  FaCube,
  FaBars, FaCog, FaTags, FaTag, FaCommentDots, FaKey, FaUserShield, FaChartLine, FaUsers, FaClipboardList, FaSearch, FaBell, FaUserCircle, FaSignOutAlt, FaChevronDown, FaChevronUp, FaNewspaper
} from 'react-icons/fa';

import { translations } from '../utils/translations.js';

import Image from 'next/image';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};
const adminMenuItems = [
  { href: '/admin', label: 'Dashboard', icon: FaChartLine },
  { href: '/admin/cms', label: 'CMS', icon: FaNewspaper },
  { href: '/admin/contact-inquiries', label: 'Inquiry From', icon: FaCommentDots },
  { href: '/admin/products', label: 'Products', icon: FaCube },
  { href: '/admin/services', label: 'Services', icon: FaWrench },
  {
    label: 'Settings',
    icon: FaCog,
    children: [
      { href: '/admin/users', label: 'Users', icon: FaUsers },
      { href: '/admin/roles', label: 'Roles', icon: FaUserShield },
      { href: '/admin/permissions', label: 'Permissions', icon: FaKey },
      { href: '/admin/general-settings', label: 'General Settings', icon: FaCogs },
      { href: '/admin/gallery', label: 'Gallery', icon: FaImages },
      { href: '/admin/product-type', label: 'Product Type', icon: FaBoxOpen },
      { href: '/admin/type', label: 'Type', icon: FaBoxOpen },
      { href: '/admin/how-to-use', label: 'How to Use', icon: FaBoxOpen },


    ],
  },

  {
    label: 'Categories',
    icon: FaTags,
    children: [
      { href: '/admin/categories', label: 'Categories', icon: FaTag },
      { href: '/admin/sub-categories', label: 'Sub-categories', icon: FaTag },
      { href: '/admin/sub-sub-categories', label: 'Sub-sub categories', icon: FaTag },
    ],
  },
  { href: '/admin/reports', label: 'Reports', icon: FaClipboardList },
  { href: '/admin/farmer-documents', label: 'Farmer Document', icon: FaFolderOpen },
  { href: '/admin/job-application', label: 'Job Application', icon: FaClipboardList },
  {
    label: 'advertisement',
    icon: FaWrench,
    children: [
      { href: '/admin/advertisement-inquiries', label: 'Advertisement Inquiries', icon: FaCommentDots },
      { href: '/admin/advertisement', label: 'Advertisement Manager', icon: FaTag },
      { href: '/admin/advertisement-size', label: 'Advertisement Size', icon: FaTag },
      { href: '/admin/advertiement-price', label: 'Advertisement Price', icon: FaTag },
      { href: '/admin/advertiement-duration', label: 'Advertisement Duration', icon: FaTag },


    ],
  },
  {
    label: 'FAQ',
    icon: FaQuestionCircle,
    children: [
      { href: '/admin/faq', label: 'FAQ', icon: FaQuestionCircle },
      { href: '/admin/faq-categories', label: 'FAQ Category', icon: FaQuestionCircle },



    ],
  },

];

const getVisibleMenuItems = (userRole) => {
  if (userRole === 'user') return [];
  return adminMenuItems;
};

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const userMenuRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const visibleMenuItems = user ? getVisibleMenuItems(user.role) : [];

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
    if (
      pathname.startsWith('/admin/users') ||
      pathname.startsWith('/admin/roles') ||
      pathname.startsWith('/admin/permissions') ||
      pathname.startsWith('/admin/general-settings') ||
      pathname.startsWith('/admin/product-type') ||
      pathname.startsWith('/admin/type') ||
      pathname.startsWith('/admin/gallery')
    ) {
      setExpandedMenu('Settings');
    } else if (
      pathname.startsWith('/admin/categories') ||
      pathname.startsWith('/admin/sub-categories') ||
      pathname.startsWith('/admin/sub-sub-categories')
    ) {
      setExpandedMenu('Categories');
    } else {
      setExpandedMenu(null);
    }
  }, [pathname]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
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
    if (user && user.role === 'user') {
      const restricted = [
        '/admin/users',
        '/admin/roles',
        '/admin/permissions',
        '/admin/general-settings',
        '/admin/categories',
        '/admin/sub-categories',
        '/admin/sub-sub-categories',
        '/admin/cms',
        '/admin/contact-inquiries',
        '/admin/reports',
        '/admin/profile'
      ];

      if (pathname === '/admin' || restricted.some((path) => pathname.startsWith(path))) {
        router.push('/');
      }
    }

    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [pathname, user, userMenuOpen, router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {sidebarOpen && isMobile && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden  bg-white transition-all duration-300 ${sidebarOpen ? 'w-72 translate-x-0 shadow-xl' : 'w-72 -translate-x-full'
            }`}
        >
          <div className="flex h-full flex-col overflow-y-auto">
            <div className="bg-[#b5c8f0] flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-[10px]">
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
                  <p className="text-xs text-slate-500">
                    {user?.role === 'admin' || user?.role === 'super_admin' ? "Admin panel" : "User portal"}
                  </p>
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

            <nav className="mt-6 flex-1 px-2 pb-4">
              {visibleMenuItems.map((item) => {
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
                                key={child.href}
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
                    key={item.href}
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

        <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${!isMobile && sidebarOpen ? 'lg:ml-72' : ''}`}>
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
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">{user?.role === 'admin' || user?.role === 'super_admin' ? "Admin panel" : "User portal"}</p>
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



                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center gap-3 rounded-3xl bg-[#b5c8f0] px-4 py-3 text-sm text-slate-700 shadow-sm border border-slate-200 transition hover:bg-slate-50 cursor-pointer"
                  >
                    {user?.profile_image ? (
                      <Image
                        src={resolveMediaUrl(user.profile_image)}
                        alt={user?.name || 'Profile'}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover"
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
                          <p className="font-semibold text-sm text-slate-900">myProfile</p>
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

          <main className="flex-1 overflow-y-auto bg-slate-100">{children}</main>
        </div>
      </div>
    </div>
  );
}
