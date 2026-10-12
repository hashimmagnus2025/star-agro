'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  role: 'user',
};

function AddUserByVillageRepForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = Boolean(editId);

  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const t = translations[language]?.userPanel?.addUser || translations.en.userPanel.addUser;

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(translations[savedLanguage] ? savedLanguage : 'en');
    const languageText = translations[savedLanguage]?.userPanel?.addUser || translations.en.userPanel.addUser;

    const verifyAccess = async () => {
      try {
        const response = await api.get('/user/me');
        const hasPermission = isEditMode
          ? response.data?.permissions?.includes('user.edit')
          : response.data?.permissions?.includes('user.create');
        const hasVillageScope = response.data?.jurisdiction?.scope_type === 'village';
        setIsAuthorized(Boolean(hasPermission && hasVillageScope));

        if (isEditMode && hasPermission && hasVillageScope) {
          const userResponse = await api.get(`/user/${editId}`);
          const user = userResponse.data || {};
          setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            role: user.role || 'user',
          });
        }
      } catch (accessError) {
        console.error('Failed to verify Add User access:', accessError);
        setError(accessError.response?.data?.message || languageText.accessCheckFailed);
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [editId, isEditMode]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        const { password, ...updatePayload } = formData;
        await api.put(`/user/${editId}`, updatePayload);
        await Swal.fire({
          icon: 'success',
          title: t.updateSuccessTitle,
          text: t.updateSuccessMessage,
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        await api.post('/user', formData);
        await Swal.fire({
          icon: 'success',
          title: t.successTitle,
          text: t.successMessage,
          timer: 1800,
          showConfirmButton: false,
        });
      }
      router.push('/user/my-team');
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || (isEditMode ? t.updateFailed : t.createFailed));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t.loading}
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-700">{error || t.accessDenied}</p>
          <Link
            href="/user/my-team"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800"
          >
            <ArrowLeft size={16} /> {t.backToTeam}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-2">
      <Link
        href="/user/my-team"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
      >
        <ArrowLeft size={16} /> {t.backToTeam}
      </Link>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-5 text-white sm:px-8">
          <UserPlus size={24} />
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">{isEditMode ? t.editTitle : t.title}</h1>
            <p className="mt-1 text-sm text-emerald-50">{isEditMode ? t.editDescription : t.description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">
                {t.firstName} <span className="text-red-600">*</span>
              </span>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleInputChange}
                autoComplete="given-name"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">{t.lastName}</span>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                autoComplete="family-name"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-900">
              {t.email} <span className="text-red-600">*</span>
            </span>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">{t.phone}</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                autoComplete="tel"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">
                {t.role} <span className="text-red-600">*</span>
              </span>
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="user">{t.userRole}</option>
                <option value="farmer">{t.farmerRole}</option>
                <option value="Enterprenure/Treder">{t.traderRole}</option>
              </select>
            </label>
          </div>

          {!isEditMode && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">
                {t.password} <span className="text-red-600">*</span>
              </span>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <span className="mt-1 block text-xs text-slate-500">{t.passwordHint}</span>
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <Link
              href="/user/my-team"
              className="inline-flex justify-center rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t.cancel}
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {isEditMode
                ? (submitting ? t.updating : t.updateSubmit)
                : (submitting ? t.creating : t.submit)}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AddUserByVillageRep() {
  return (
    <Suspense fallback={(
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
      </div>
    )}>
      <AddUserByVillageRepForm />
    </Suspense>
  );
}
