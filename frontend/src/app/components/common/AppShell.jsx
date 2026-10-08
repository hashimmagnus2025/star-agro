'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import Footer from './footer';
import { setAuthToken } from '../../utils/api';
import { registerServiceWorker } from '../../register-sw';

export default function AppShell({ children }) {
  const [hideShell, setHideShell] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const pathname = usePathname();

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) setAuthToken(token);
    } catch (e) {
      // ignore
    }
    // compute hideShell on client only to keep server and client initial markup identical
    try {
      const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
      setHideShell(path?.startsWith('/admin') || path?.startsWith('/user'));
    } catch (e) { }
    registerServiceWorker();
    setAuthLoaded(true);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    let alreadyInstalled = false;
    let installPromptDismissed = false;
    try {
      alreadyInstalled = localStorage.getItem('starAgroInstalled') === 'true';
      installPromptDismissed = localStorage.getItem('starAgroInstallDismissed') === 'true';
    } catch (e) { }

    const shouldShow = !isStandalone && !alreadyInstalled && !installPromptDismissed;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (shouldShow) {
        setShowInstallModal(true);
      }
    };

    const handleAppInstalled = () => {
      setShowInstallModal(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('starAgroInstalled', 'true');
      } catch (e) { }
    };

    const handleInstallRequest = () => setShowInstallModal(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('star-agro-install-request', handleInstallRequest);

    const timer = window.setTimeout(() => {
      if (shouldShow) {
        setShowInstallModal(true);
      }
    }, 1000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('star-agro-install-request', handleInstallRequest);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstallModal(false);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        try {
          localStorage.setItem('starAgroInstalled', 'true');
        } catch (e) { }
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
    }

    setShowInstallModal(false);
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    setShowInstallModal(false);
    try {
      localStorage.setItem('starAgroInstallDismissed', 'true');
    } catch (e) { }
  };

  const isHomePage = pathname === '/';
  const installModal = showInstallModal && !hideShell && isHomePage ? (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Top Gradient */}
        <div className="bg-linear-to-r from-emerald-500 via-green-500 to-emerald-600 p-6 text-center text-white">
          <button
            type="button"
            onClick={handleDismissInstall}
            aria-label="Close install prompt"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 12l-4-4m4 4l4-4M5 20h14"
              />
            </svg>
          </div>

          <h3 className="mt-4 text-2xl font-bold">
            Install Star Agro
          </h3>

          <p className="mt-2 text-sm text-emerald-100">
            Add Star Agro to your home screen for faster access and a better experience.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 p-6">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              ⚡
            </div>
            <div>
              <p className="font-medium text-slate-800">
                Faster Loading
              </p>
              <p className="text-sm text-slate-500">
                Open instantly without searching.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              📱
            </div>
            <div>
              <p className="font-medium text-slate-800">
                Home Screen Access
              </p>
              <p className="text-sm text-slate-500">
                Launch just like a native app.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              🔔
            </div>
            <div>
              <p className="font-medium text-slate-800">
                Stay Updated
              </p>
              <p className="text-sm text-slate-500">
                Receive important notifications instantly.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex gap-3">


            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 rounded-xl bg-linear-to-r from-emerald-500 to-green-600 py-3 font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (!authLoaded) {
    return (
      <>
        {!hideShell && <div className="navbar-placeholder" aria-hidden="true" />}
        {children}
        {!hideShell && <div className="footer-placeholder" aria-hidden="true" />}
        {installModal}
      </>
    );
  }

  return (
    <>
      {!hideShell && <Navbar />}
      {children}
      {!hideShell && <Footer />}
      {installModal}
    </>
  );
}
