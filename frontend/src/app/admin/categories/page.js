'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';

import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', name_hindi: '', name_marathi: '', description: '', description_hindi: '',
    description_marathi: '', imageFile: null, image_url: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ImagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchCategories = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/categories', { signal: controller.signal });
        if (!isActive) return;
        setCategories(Array.isArray(res.data) ? res.data : []);
        setCurrentPage(1);
      } catch (err) {
        if (!isActive) return;
        if (err?.code === 'ERR_CANCELED') return;
        if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and refresh.');
        } else {
          setError(err?.response?.data?.message || err.message || 'Unable to load categories');
        }
      } finally {
        if (!isActive) return;
        setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: '', name_hindi: '', name_marathi: '', description: '', description_hindi: '',
      description_marathi: '', imageFile: null, image_url: ''
    });
    setEditingId(null);
    setImagePreview(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setImagePreview(category.image_url || null);
    setFormData({
      name: category.name || '',
      name_hindi: category.name_hindi || '',
      name_marathi: category.name_marathi || '',
      description: category.description || '',
      description_hindi: category.description_hindi || '',
      description_marathi: category.description_marathi || '',
      imageFile: null,
      image_url: category.image_url || '',
    });
    setEditingId(category.id);
    setShowModal(true);
  };

  const handleFileChange = (event) => {
    const imageFile = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, imageFile }));
    if (imageFile) {
      setImagePreview(URL.createObjectURL(imageFile));
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      if (countWords(formData.description) > 15) {
        setError('Description cannot exceed 15 words');
        return;
      }

      if (countWords(formData.description_hindi) > 15) {
        setError('Hindi description cannot exceed 15 words');
        return;
      }

      if (countWords(formData.description_marathi) > 15) {
        setError('Marathi description cannot exceed 15 words');
        return;
      }
      setError('Category name is required');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('name_hindi', formData.name_hindi || '');
      payload.append('name_marathi', formData.name_marathi || '');
      payload.append('description', formData.description || '');
      payload.append('description_hindi', formData.description_hindi || '');
      payload.append('description_marathi', formData.description_marathi || '');
      if (formData.imageFile) {
        payload.append('image', formData.imageFile);
      } else if (formData.image_url) {
        payload.append('image_url', formData.image_url);
      }

      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        setSuccessMessage('Category updated successfully');
      } else {
        await api.post('/categories', payload);
        setSuccessMessage('Category created successfully');
      }

      const res = await api.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : []);
      setCurrentPage(1);
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    setDeletingIds((prev) => [...prev, id]);
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((category) => category.id !== id));
      setSuccessMessage('Category deleted successfully');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Delete failed');
    } finally {
      setDeletingIds((prev) => prev.filter((item) => item !== id));
    }
  };
  const countWords = (text = '') => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };
  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };


  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return categories.filter((category) => [
      category.name,
      category.name_hindi,
      category.name_marathi,
      category.description,
      category.description_hindi,
      category.description_marathi,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term)));
  }, [categories, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentCategories = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredCategories.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCategories, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
      <div className="mb-4 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Categories</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">Create, update, and delete categories from here.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl sm:px-6 sm:text-base"
        >
          <Plus size={20} />
          New Category
        </button>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6 md:p-8">
        {error && (
          <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        )}
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No categories created yet.</div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Showing {filteredCategories.length} result{filteredCategories.length === 1 ? '' : 's'}</div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search categories..."
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs"
              />
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-180 border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-50 text-left text-slate-900">
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Name (Hi)</th>
                    <th className="px-6 py-4 font-semibold">Name (Mr)</th>
                    <th className="px-6 py-4 font-semibold">Image</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCategories.map((category, index) => (
                    <tr
                      key={category.id || index}
                      className={`border-b border-slate-200 transition hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">{category.name}</td>
                      <td className="px-6 py-4 text-slate-700 wrap-break-word">{category.name_hindi || '-'}</td>
                      <td className="px-6 py-4 text-slate-700 wrap-break-word">{category.name_marathi || '-'}</td>
                      <td className="px-6 py-4">
                        {category.image_url ? (
                          <img src={resolveMediaUrl(category.image_url)} alt={category.name} className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
                        ) : (
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">No image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(category.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(category.id)}
                            disabled={deletingIds.includes(category.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {currentCategories.map((category, index) => (
                <div key={category.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{category.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{category.name_hindi || '-'}</p>
                      <p className="text-sm text-slate-600">{category.name_marathi || '-'}</p>
                    </div>
                    {category.image_url ? (
                      <img src={resolveMediaUrl(category.image_url)} alt={category.name} className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
                    ) : (
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">No image</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">{formatDate(category.created_at)}</span>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingIds.includes(category.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filteredCategories.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-4 text-white sm:px-6 md:px-8 md:py-6">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{editingId ? 'Update Category' : 'Create Category'}</h2>
                <p className="mt-1 text-sm text-white/80">{editingId ? 'Edit category details below' : 'Add a new category to the system'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/20"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6 md:space-y-6 md:p-8">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Fruits, Vegetables, Seeds"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Hindi Name</label>
                <input
                  type="text"
                  name="name_hindi"
                  value={formData.name_hindi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name_hindi: e.target.value }))}
                  placeholder="हिंदी नाम"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Marathi Name</label>
                <input
                  type="text"
                  name="name_marathi"
                  value={formData.name_marathi}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name_marathi: e.target.value }))}
                  placeholder="मराठी नाव"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (countWords(value) <= 15) {
                      setFormData((prev) => ({
                        ...prev,
                        description: value,
                      }));
                    }
                  }}
                  placeholder="Optional category description"
                  rows="4"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {countWords(formData.description)}/15 words
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description (Hindi)
                </label>
                <textarea
                  name="description_hindi"
                  value={formData.description_hindi}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (countWords(value) <= 15) {
                      setFormData((prev) => ({
                        ...prev,
                        description_hindi: value,
                      }));
                    }
                  }}
                  rows="4"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  placeholder="हिंदी विवरण"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {countWords(formData.description_hindi)}/15 words
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description (Marathi)
                </label>
                <textarea
                  name="description_marathi"
                  value={formData.description_marathi}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (countWords(value) <= 15) {
                      setFormData((prev) => ({
                        ...prev,
                        description_marathi: value,
                      }));
                    }
                  }}
                  rows="4"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                  placeholder="मराठी वर्णन"
                />

                <p className="text-xs text-slate-500 mt-1">
                  {countWords(formData.description_marathi)}/15 words
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition file:cursor-pointer file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:text-white"
                />

                {formData.image_url && !formData.imageFile && (
                  <p className="mt-2 text-sm text-slate-500">Current image will be preserved unless a new file is selected.</p>
                )}
                {formData.imageFile && (
                  <p className="mt-2 text-sm text-slate-500">{formData.imageFile.name} selected</p>
                )}
                {ImagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900 mb-2">Image Preview:</p>
                    <img src={ImagePreview} alt="Preview" className="h-32 w-32 rounded-xl object-cover border border-slate-200" />
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="w-full rounded-3xl border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 sm:w-auto"
                >
                  {editingId ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
