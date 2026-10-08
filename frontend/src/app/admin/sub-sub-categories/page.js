
'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
const ITEMS_PER_PAGE = 10;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function SubSubCategoriesPage() {
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubSubCategoryModal, setShowSubSubCategoryModal] = useState(false);
  const [subSubCategoryForm, setSubSubCategoryForm] = useState({
    name: '',
    name_hindi: '',
    name_marathi: '',
    description: '',
    sub_category_id: '',
    image: null,
  });
  const [editingSubSubCategoryId, setEditingSubSubCategoryId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [subCategoriesRes, subSubCategoriesRes] = await Promise.all([
          api.get('/sub-categories', { signal: controller.signal }),
          api.get('/sub-sub-categories', { signal: controller.signal }),
        ]);

        if (!isActive) return;
        setSubCategories(Array.isArray(subCategoriesRes.data) ? subCategoriesRes.data : []);
        setSubSubCategories(Array.isArray(subSubCategoriesRes.data) ? subSubCategoriesRes.data : []);
      } catch (err) {
        if (!isActive) return;
        if (err?.code === 'ERR_CANCELED') return;
        if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and refresh.');
        } else {
          setError(err?.response?.data?.message || err.message || 'Unable to load sub-sub-categories');
        }
      } finally {
        if (!isActive) return;
        setLoading(false);
      }
    };

    loadData();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const resetForm = () => {
    setSubSubCategoryForm({ name: '', name_hindi: '', name_marathi: '', description: '', sub_category_id: '', image: null });
    setEditingSubSubCategoryId(null);
    setImagePreview(null);
  };

  const setImagePreviewFromValue = (value) => {
    if (value instanceof File) {
      setImagePreview(URL.createObjectURL(value));
      return;
    }
    setImagePreview(typeof value === 'string' ? value : null);
  };

  const openNewSubSubCategory = () => {
    resetForm();
    setShowSubSubCategoryModal(true);

  };

  const openEditSubSubCategory = (subSubCategory) => {
    setSubSubCategoryForm({
      name: subSubCategory.name || '',
      name_hindi: subSubCategory.name_hindi || '',
      name_marathi: subSubCategory.name_marathi || '',
      description: subSubCategory.description || '',
      sub_category_id: subSubCategory.sub_category_id ? String(subSubCategory.sub_category_id) : '',
      image: subSubCategory.image || null,
    });
    setEditingSubSubCategoryId(subSubCategory.id);
    setImagePreviewFromValue(subSubCategory.image || null);
    setShowSubSubCategoryModal(true);
  };

  const handleSubSubCategorySubmit = async (event) => {
    event.preventDefault();
    if (!subSubCategoryForm.name.trim()) {
      setError('Sub-sub-category name is required');
      return;
    }

    if (!subSubCategoryForm.sub_category_id) {
      setError('Please select a parent sub-category');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const hasFile = subSubCategoryForm.image instanceof File;
      const payload = hasFile
        ? new FormData()
        : {
          name: subSubCategoryForm.name.trim(),
          name_hindi: subSubCategoryForm.name_hindi || '',
          name_marathi: subSubCategoryForm.name_marathi || '',
          description: subSubCategoryForm.description || '',
          sub_category_id: Number(subSubCategoryForm.sub_category_id),
          image: subSubCategoryForm.image || null,
        };

      if (hasFile) {
        payload.append('name', subSubCategoryForm.name.trim());
        payload.append('name_hindi', subSubCategoryForm.name_hindi || '');
        payload.append('name_marathi', subSubCategoryForm.name_marathi || '');
        payload.append('description', subSubCategoryForm.description || '');
        payload.append('sub_category_id', Number(subSubCategoryForm.sub_category_id));
        payload.append('image', subSubCategoryForm.image);
      }

      if (editingSubSubCategoryId) {
        await api.put(`/sub-sub-categories/${editingSubSubCategoryId}`, payload);
        setSuccessMessage('Sub-sub-category updated successfully');
      } else {
        await api.post('/sub-sub-categories', payload);
        setSuccessMessage('Sub-sub-category created successfully');
      }

      const response = await api.get('/sub-sub-categories');
      setSubSubCategories(Array.isArray(response.data) ? response.data : []);
      setImagePreview(null);
      setShowSubSubCategoryModal(false);

      resetForm();

    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to save sub-sub-category');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sub-sub-category?')) return;
    setDeletingIds((prev) => [...prev, id]);
    setError('');
    try {
      await api.delete(`/sub-sub-categories/${id}`);
      setSubSubCategories((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage('Sub-sub-category deleted successfully');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to delete sub-sub-category');
    } finally {
      setDeletingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const filteredSubSubCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return subSubCategories.filter((subSubCategory) => {
      return [subSubCategory.name, subSubCategory.name_hindi, subSubCategory.name_marathi, subSubCategory.description, subSubCategory.sub_category_name, subSubCategory.category_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [searchTerm, subSubCategories]);

  const totalPages = Math.max(1, Math.ceil(filteredSubSubCategories.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSubSubCategories = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubSubCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubSubCategories, safeCurrentPage]);

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
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Sub-Sub-Categories</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage sub-sub-categories and organize your product hierarchy.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={openNewSubSubCategory}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl sm:px-6 sm:text-base"
          >
            <Plus size={18} />
            New Sub-Sub-Category
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm sm:p-6 md:p-8">
        {error && (
          <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
        )}
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading sub-sub-categories...</div>
        ) : subSubCategories.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            {subCategories.length === 0 ? (
              'No parent sub-categories yet. Create sub-categories first to add sub-sub-categories.'
            ) : (
              'No sub-sub-categories found. Create your first sub-sub-category.'
            )}
          </div>
        ) : filteredSubSubCategories.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            {searchTerm ? 'No sub-sub-categories match your search. Try a different keyword.' : 'No sub-sub-categories found. Create your first sub-sub-category.'}
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Showing {filteredSubSubCategories.length} result{filteredSubSubCategories.length === 1 ? '' : 's'}</div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search sub-sub-categories..."
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
                    <th className="px-6 py-4 font-semibold">Parent Sub-Category</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubSubCategories.map((subSubCategory, index) => (
                    <tr
                      key={subSubCategory.id}
                      className={`border-b border-slate-200 transition hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">{subSubCategory.name}</td>
                      <td className="px-6 py-4 text-slate-700 wrap-break-word">{subSubCategory.name_hindi || '-'}</td>
                      <td className="px-6 py-4 text-slate-700 wrap-break-word">{subSubCategory.name_marathi || '-'}</td>
                      <td className="px-6 py-4">
                        {subSubCategory.image ? (
                          <img src={resolveMediaUrl(subSubCategory.image)} alt={subSubCategory.name} className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
                        ) : (
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">No image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{subSubCategory.sub_category_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{subSubCategory.category_name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 wrap-break-word">{subSubCategory.description || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(subSubCategory.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditSubSubCategory(subSubCategory)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(subSubCategory.id)}
                            disabled={deletingIds.includes(subSubCategory.id)}
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
              {paginatedSubSubCategories.map((subSubCategory, index) => (
                <div key={subSubCategory.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{subSubCategory.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{subSubCategory.name_hindi || '-'}</p>
                      <p className="text-sm text-slate-600">{subSubCategory.name_marathi || '-'}</p>
                    </div>
                    {subSubCategory.image ? (
                      <img src={resolveMediaUrl(subSubCategory.image)} alt={subSubCategory.name} className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
                    ) : (
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">No image</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p><span className="font-medium text-slate-800">Parent:</span> {subSubCategory.sub_category_name || '-'}</p>
                    <p><span className="font-medium text-slate-800">Category:</span> {subSubCategory.category_name || '-'}</p>
                    <p><span className="font-medium text-slate-800">Description:</span> {subSubCategory.description || '-'}</p>
                    <p><span className="font-medium text-slate-800">Created:</span> {formatDate(subSubCategory.created_at)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditSubSubCategory(subSubCategory)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(subSubCategory.id)}
                      disabled={deletingIds.includes(subSubCategory.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={filteredSubSubCategories.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {showSubSubCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-4 text-white sm:px-6 md:px-8 md:py-6">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{editingSubSubCategoryId ? 'Update Sub-Sub-Category' : 'Create Sub-Sub-Category'}</h2>
                <p className="mt-1 text-sm text-white/80">{editingSubSubCategoryId ? 'Edit a sub-sub-category' : 'Create a new sub-sub-category'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSubSubCategoryModal(false);
                  resetForm();
                }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/20"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubSubCategorySubmit} className="space-y-5 p-4 sm:p-6 md:space-y-6 md:p-8">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Sub-Sub-Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={subSubCategoryForm.name}
                  onChange={(e) => setSubSubCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sweet Oranges, Bitter Spinach"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Hindi Name</label>
                <input
                  type="text"
                  value={subSubCategoryForm.name_hindi}
                  onChange={(e) => setSubSubCategoryForm((prev) => ({ ...prev, name_hindi: e.target.value }))}
                  placeholder="हिंदी नाम"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Marathi Name</label>
                <input
                  type="text"
                  value={subSubCategoryForm.name_marathi}
                  onChange={(e) => setSubSubCategoryForm((prev) => ({ ...prev, name_marathi: e.target.value }))}
                  placeholder="मराठी नाव"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Parent Sub-Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={subSubCategoryForm.sub_category_id}
                  onChange={(e) => setSubSubCategoryForm((prev) => ({ ...prev, sub_category_id: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                >
                  <option value="">Select a sub-category</option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name} {subCategory.name_marathi}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                <textarea
                  value={subSubCategoryForm.description}
                  onChange={(e) => setSubSubCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional explanation for this sub-sub-category"
                  rows="4"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSubSubCategoryForm((prev) => ({ ...prev, image: file }));
                    setImagePreviewFromValue(file);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900 mb-2">Image Preview:</p>
                    <img src={imagePreview} alt="Preview" className="h-32 w-32 rounded-xl object-cover border border-slate-200" />
                  </div>
                )}

              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubSubCategoryModal(false);
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
                  {editingSubSubCategoryId ? 'Update Sub-Sub-Category' : 'Create Sub-Sub-Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

