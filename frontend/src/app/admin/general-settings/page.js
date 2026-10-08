'use client';

import { useEffect, useState } from 'react';
import { X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed. Appends a cache-busting
// timestamp either way so a freshly-replaced logo/favicon doesn't show a stale image.
const resolveMediaUrl = (value) => {
  if (!value) return null;
  const base = /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
  return `${base}?t=${Date.now()}`;
};

const EMPTY_FORM = {
  name: '',
  company_name: '',
  company_email: '',
  company_phone: '',
  address: '',
  company_address: '',
  location: '',
  gst: '',
  description: '',
  logo: '',
  logoFile: null,
  favicon: '',
  faviconFile: null,
};

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoSrc, setLogoSrc] = useState(null);
  const [faviconSrc, setFaviconSrc] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [migrating, setMigrating] = useState(false);

  const applySettings = (data) => {
    setFormData({
      name: data?.name || '',
      company_name: data?.company_name || '',
      company_email: data?.company_email || '',
      company_phone: data?.company_phone || '',
      address: data?.address || '',
      company_address: data?.company_address || '',
      location: data?.location || '',
      gst: data?.gst || '',
      description: data?.description || '',
      logo: data?.logo || '',
      logoFile: null,
      favicon: data?.favicon || '',
      faviconFile: null,
    });
    setLogoSrc(resolveMediaUrl(data?.logo));
    setFaviconSrc(resolveMediaUrl(data?.favicon));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/general-settings');
        setSettings(res.data);
        applySettings(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Unable to load general settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, logoFile: file }));
    if (file) setLogoSrc(URL.createObjectURL(file));
  };

  const handleFaviconChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, faviconFile: file }));
    if (file) setFaviconSrc(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setFormData((prev) => ({ ...prev, logoFile: null, logo: '' }));
    setLogoSrc(null);
  };

  const clearFavicon = () => {
    setFormData((prev) => ({ ...prev, faviconFile: null, favicon: '' }));
    setFaviconSrc(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.company_email.trim() ||
      !formData.company_phone.trim()
    ) {
      setError('Name, description, company email, and company phone are required');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('company_name', formData.company_name.trim());
      payload.append('company_email', formData.company_email.trim());
      payload.append('company_phone', formData.company_phone.trim());
      payload.append('address', formData.address.trim());
      payload.append('company_address', formData.company_address.trim());
      payload.append('location', formData.location.trim());
      payload.append('gst', formData.gst.trim());
      payload.append('description', formData.description.trim());

      if (formData.logoFile) {
        payload.append('logo', formData.logoFile);
      } else if (formData.logo) {
        payload.append('logo', formData.logo);
      }

      if (formData.faviconFile) {
        payload.append('favicon', formData.faviconFile);
      } else if (formData.favicon) {
        payload.append('favicon', formData.favicon);
      }

      await api.put('/general-settings', payload);
      setSuccess('General settings updated successfully');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleMigrateUploads = async () => {
    const confirmResult = await Swal.fire({
      icon: 'question',
      title: 'Migrate old uploads to Bunny CDN?',
      text: 'This pushes every existing local /uploads file (products, ads, categories, gallery, profiles, etc.) to Bunny and updates the database. Safe to run more than once — already-migrated files are skipped.',
      showCancelButton: true,
      confirmButtonText: 'Yes, start migration',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#059669',
    });
    if (!confirmResult.isConfirmed) return;

    setMigrating(true);
    try {
      const res = await api.post('/migration/uploads-to-bunny');
      const totals = (res.data?.results || []).reduce(
        (acc, r) => ({
          migrated: acc.migrated + r.migrated,
          skipped: acc.skipped + r.skipped,
          failed: acc.failed + r.failed,
        }),
        { migrated: 0, skipped: 0, failed: 0 }
      );
      await Swal.fire({
        icon: 'success',
        title: 'Migration finished',
        html: `Migrated: <b>${totals.migrated}</b><br/>Skipped (file missing): <b>${totals.skipped}</b><br/>Failed: <b>${totals.failed}</b>`,
        confirmButtonColor: '#059669',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Migration failed',
        text: err?.response?.data?.message || err.message || 'Something went wrong',
        confirmButtonColor: '#dc2626',
      });
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">General Settings</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">General Settings</h1>
        </div>
        <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
          <p className="text-slate-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">General Settings</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">General Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Manage your company details, contact information, and branding.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Bunny CDN migration</h2>
          <p className="mt-1 text-xs text-slate-500">
            One-time move of old locally-stored photos/videos to Bunny CDN. Safe to run again — already-migrated files are skipped.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMigrateUploads}
          disabled={migrating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-3xl border border-emerald-600 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UploadCloud size={16} />
          {migrating ? 'Migrating...' : 'Migrate old uploads to Bunny'}
        </button>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Star Agro"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Company Name
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="Star Agro Pvt Ltd"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Company Email
              <input
                type="email"
                name="company_email"
                value={formData.company_email}
                onChange={handleInputChange}
                placeholder="contact@staragro.com"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Company Phone
              <input
                type="text"
                name="company_phone"
                value={formData.company_phone}
                onChange={handleInputChange}
                placeholder="+91 00000 00000"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              Location
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Pune, Maharashtra"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              GST Number
              <input
                type="text"
                name="gst"
                value={formData.gst}
                onChange={handleInputChange}
                placeholder="27ABCDE1234F1Z5"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700 block">
              Address
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                placeholder="Address"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 block">
              Company Address
              <textarea
                name="company_address"
                value={formData.company_address}
                onChange={handleInputChange}
                rows="3"
                placeholder="Registered company address"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-semibold text-slate-700 block">
            Description
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Brief description about your company or website"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
              required
            />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-700 block">
              Logo
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition file:cursor-pointer file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:text-white"
              />
              {formData.logo && !formData.logoFile && (
                <p className="text-xs text-slate-500">Current logo will be kept unless a new file is selected.</p>
              )}
              {formData.logoFile && (
                <p className="text-xs text-slate-500">{formData.logoFile.name} selected</p>
              )}
              {logoSrc ? (
                <div className="mt-4 flex items-start gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img src={logoSrc} alt="Logo preview" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                  >
                    <X size={14} />
                    Remove logo
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                  <ImageIcon className="h-8 w-8 text-slate-400" />
                </div>
              )}
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 block">
              Favicon Icon
              <input
                type="file"
                accept="image/*"
                onChange={handleFaviconChange}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition file:cursor-pointer file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:text-white"
              />
              {formData.favicon && !formData.faviconFile && (
                <p className="text-xs text-slate-500">Current favicon will be kept unless a new file is selected.</p>
              )}
              {formData.faviconFile && (
                <p className="text-xs text-slate-500">{formData.faviconFile.name} selected</p>
              )}
              {faviconSrc ? (
                <div className="mt-4 flex items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    <img src={faviconSrc} alt="Favicon preview" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={clearFavicon}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                  >
                    <X size={14} />
                    Remove favicon
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                </div>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                applySettings(settings);
                setError('');
                setSuccess('');
              }}
              className="rounded-3xl border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
