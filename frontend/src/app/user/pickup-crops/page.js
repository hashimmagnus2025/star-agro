'use client';

import { useState, useEffect } from 'react';
import { Phone, User, MapPin, Clock, PackageCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
const PICKUP_ROLE = 'Enterprenure/Treder';

export default function PickupCropsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);
  }, []);

  const t = translations[language];
  const pickupText = t?.pickupCrops || translations.en.pickupCrops;

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser?.role === PICKUP_ROLE) {
        setAllowed(true);
      } else {
        setAllowed(false);
        setLoading(false);
      }
    } catch {
      setAllowed(false);
      const displayName = getDisplayName(listing);
      const confirmText = (t?.swal?.takeCropConfirmText || 'You\'ll be marked as taking "{name}". The farmer will be notified with your name and phone number.').replace('{name}', displayName);
    }
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/destroy-listings');
      setListings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) fetchListings();
  }, [allowed]);

  const handleClaim = async (listing) => {
    const confirmText = (t?.swal?.takeCropConfirmText || 'You\'ll be marked as taking "{name}". The farmer will be notified with your name and phone number.').replace('{name}', listing.name);
    const result = await Swal.fire({
      icon: 'question',
      title: t?.swal?.takeCropConfirmTitle || 'Take this crop?',
      text: confirmText,
      showCancelButton: true,
      confirmButtonText: t?.swal?.takeCropConfirmButton || 'Yes, take it',
      cancelButtonText: t?.swal?.cancelButton || 'Cancel',
      confirmButtonColor: '#059669',
    });
    if (!result.isConfirmed) return;

    setClaimingId(listing.id);
    try {
      await api.post(`/products/${listing.id}/claim-destroy`);
      Swal.fire({
        icon: 'success',
        title: t?.swal?.claimedTitle || 'Claimed',
        text: t?.swal?.claimedText || 'The farmer has been notified. Please contact them to arrange pickup.',
        timer: 2500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      setListings((prev) => prev.filter((item) => item.id !== listing.id));
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: t?.swal?.claimFailedTitle || 'Could not claim',
        text: err.response?.data?.message || t?.swal?.claimFailedText || 'This crop may have already been taken.',
        confirmButtonText: t?.swal?.okButton || 'OK',
      });
      fetchListings();
    } finally {
      setClaimingId(null);
    }
  };

  const daysLeft = (expiresAt) => {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const getDisplayName = (listing) => {
    if (!listing) return '';
    if (language === 'hi' && listing.name_hindi) return listing.name_hindi;
    if (language === 'mr' && listing.name_marathi) return listing.name_marathi;
    return listing.name || listing.name_hindi || listing.name_marathi || '';
  };

  const getListingImageUrl = (listing) => {
    const resolve = (value) => {
      if (!value || typeof value !== 'string' || !value.trim()) return '';
      const trimmed = value.trim();
      if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
      const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `${IMAGE_BASE_URL || ''}${normalizedPath}`;
    };

    return resolve(listing.image_url) || resolve(listing.sub_category_image) || resolve(listing.category_image);
  };

  if (!allowed && !loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="rounded-3xl bg-white p-10 shadow-xl text-center max-w-md">
          <PackageCheck className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <p className="text-slate-700 font-semibold">{pickupText.restricted}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-xs sm:text-sm uppercase tracking-[0.24em] text-emerald-600 font-semibold">{pickupText.availableForPickup}</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">{pickupText.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{pickupText.description}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">{pickupText.loading}</div>
      ) : listings.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <PackageCheck className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">{pickupText.noCrops}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-slate-100">
                {getListingImageUrl(listing) ? (
                  <img src={getListingImageUrl(listing)} alt={getDisplayName(listing)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">{pickupText.noImage}</div>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 text-sm mb-2 line-clamp-2">{getDisplayName(listing)}</h3>

              <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span>{listing.farmer_name || pickupText.unknownFarmer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span>{listing.farmer_phone || pickupText.phoneUnavailable}</span>
                </div>
                {(listing.seller_village || listing.seller_taluka) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{[listing.seller_village, listing.seller_taluka, listing.seller_district].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="font-medium text-amber-600">{daysLeft(listing.destroy_expires_at)} {pickupText.dayLeft}</span>
                </div>
              </div>

              <button
                onClick={() => handleClaim(listing)}
                disabled={claimingId === listing.id}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-white font-semibold text-sm hover:shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {claimingId === listing.id ? pickupText.claiming : pickupText.takeIt}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
