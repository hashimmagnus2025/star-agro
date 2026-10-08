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

export default function SubCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [subCategoryForm, setSubCategoryForm] = useState({
    name: '',
    name_hindi: '',
    name_marathi: '',
    description: '',
    description_hindi: '',
    description_marathi: '',
    category_id: '',
    image: null,
  });
  const [editingSubCategoryId, setEditingSubCategoryId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ImagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [categoriesRes, subCategoriesRes] = await Promise.all([
          api.get('/categories', { signal: controller.signal }),
          api.get('/sub-categories', { signal: controller.signal }),
        ]);

        if (!isActive) return;
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
        setSubCategories(Array.isArray(subCategoriesRes.data) ? subCategoriesRes.data : []);
      } catch (err) {
        if (!isActive) return;
        if (err?.code === 'ERR_CANCELED') return;
        if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and refresh.');
        } else {
          setError(err?.response?.data?.message || err.message || 'Unable to load subcategories');
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
    setSubCategoryForm({ name: '', name_hindi: '', name_marathi: '', description: '', description_hindi: '', description_marathi: '', category_id: '', image: null });
    setEditingSubCategoryId(null);
    setImagePreview(null);
  };

  const setImagePreviewFromValue = (value) => {
    if (value instanceof File) {
      setImagePreview(URL.createObjectURL(value));
      return;
    }
    setImagePreview(typeof value === 'string' ? value : null);
  };

  const openNewSubCategory = () => {
    resetForm();
    setShowSubCategoryModal(true);
  };

  const openEditSubCategory = (subCategory) => {
    setSubCategoryForm({
      name: subCategory.name || '',
      name_hindi: subCategory.name_hindi || '',
      name_marathi: subCategory.name_marathi || '',
      description: subCategory.description || '',
      description_hindi: subCategory.description_hindi || '',
      description_marathi: subCategory.description_marathi || '',
      category_id: subCategory.category_id ? String(subCategory.category_id) : '',
      image: subCategory.image || null,
    });
    setImagePreviewFromValue(subCategory.image || null);
    setEditingSubCategoryId(subCategory.id);
    setShowSubCategoryModal(true);
  };

  const handleSubCategorySubmit = async (event) => {
    event.preventDefault();

    if (countWords(subCategoryForm.description) > 15) {
      setError('Description cannot exceed 15 words');
      return;
    }

    if (countWords(subCategoryForm.description_hindi) > 15) {
      setError('Hindi description cannot exceed 15 words');
      return;
    }

    if (countWords(subCategoryForm.description_marathi) > 15) {
      setError('Marathi description cannot exceed 15 words');
      return;
    }
    if (!subCategoryForm.name.trim()) {
      setError('Subcategory name is required');
      return;
    }

    if (!subCategoryForm.category_id) {
      setError('Please select a parent category');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const hasFile = subCategoryForm.image instanceof File;
      const payload = hasFile
        ? new FormData()
        : {
          name: subCategoryForm.name.trim(),
          name_hindi: subCategoryForm.name_hindi || '',
          name_marathi: subCategoryForm.name_marathi || '',
          description: subCategoryForm.description || '',
          description_hindi: subCategoryForm.description_hindi || '',
          description_marathi: subCategoryForm.description_marathi || '',
          category_id: Number(subCategoryForm.category_id),
          image: subCategoryForm.image || null,
        };

      if (hasFile) {
        payload.append('name', subCategoryForm.name.trim());
        payload.append('name_hindi', subCategoryForm.name_hindi || '');
        payload.append('name_marathi', subCategoryForm.name_marathi || '');
        payload.append('description', subCategoryForm.description || '');
        payload.append('description_hindi', subCategoryForm.description_hindi || '');
        payload.append('description_marathi', subCategoryForm.description_marathi || '');
        payload.append('category_id', Number(subCategoryForm.category_id));
        payload.append('image', subCategoryForm.image);
      }

      if (editingSubCategoryId) {
        await api.put(`/sub-categories/${editingSubCategoryId}`, payload);
        setSuccessMessage('Subcategory updated successfully');
      } else {
        await api.post('/sub-categories', payload);
        setSuccessMessage('Subcategory created successfully');
      }

      const response = await api.get('/sub-categories');
      setSubCategories(Array.isArray(response.data) ? response.data : []);
      setCurrentPage(1);
      setShowSubCategoryModal(false);
      resetForm();

    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to save subcategory');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subcategory?')) return;
    setDeletingIds((prev) => [...prev, id]);
    setError('');
    try {
      await api.delete(`/sub-categories/${id}`);
      setSubCategories((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage('Subcategory deleted successfully');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to delete subcategory');
    } finally {
      setDeletingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };
  const countWords = (text = '') => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const filteredSubCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return subCategories.filter((subCategory) => {
      return [subCategory.name, subCategory.name_hindi, subCategory.name_marathi, subCategory.description, subCategory.description_hindi, subCategory.description_marathi, subCategory.category_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [searchTerm, subCategories]);

  const totalPages = Math.max(1, Math.ceil(filteredSubCategories.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSubCategories = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredSubCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSubCategories, safeCurrentPage]);

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
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Subcategories</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">Manage subcategories and create parent categories directly while selecting them.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={openNewSubCategory}
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl sm:px-6 sm:text-base"
          >
            <Plus size={18} />
            New Subcategory
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
          <div className="py-16 text-center text-slate-500">Loading subcategories...</div>
        ) : subCategories.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            {categories.length === 0 ? (
              'No parent categories yet. Create one directly from the new subcategory form.'
            ) : (
              'No subcategories found. Create your first subcategory.'
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Showing {filteredSubCategories.length} result{filteredSubCategories.length === 1 ? '' : 's'}</div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search subcategories..."
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs"
              />
            </div>
            {filteredSubCategories.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                No subcategories match your search. Try a different keyword.
              </div>
            ) : (
              <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-180 border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-50 text-left text-slate-900">
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Name (Hi)</th>
                    <th className="px-6 py-4 font-semibold">Name (Mr)</th>
                    <th className="px-6 py-4 font-semibold">Image</th>
                    <th className="px-6 py-4 font-semibold">Parent Category</th>
                    
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubCategories.map((subCategory, index) => (
                    <tr
                      key={subCategory.id}
                      className={`border-b border-slate-200 transition hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">{subCategory.name}</td>
                      <td className="px-6 py-4 text-slate-700 wrap-break-word">{subCategory.name_hindi || '-'}</td>
                      <td className="px-6 py-4 text-slate-700 wrap-break-word">{subCategory.name_marathi || '-'}</td>
                      <td className="px-6 py-4">
                        {subCategory.image ? (
                          <img src={resolveMediaUrl(subCategory.image)} alt={subCategory.name} className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
                        ) : (
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">No image</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{subCategory.category_name || '-'}</td>
                      
                      <td className="px-6 py-4 text-slate-600">{formatDate(subCategory.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditSubCategory(subCategory)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(subCategory.id)}
                            disabled={deletingIds.includes(subCategory.id)}
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
              {paginatedSubCategories.map((subCategory, index) => (
                <div key={subCategory.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{subCategory.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{subCategory.name_hindi || '-'}</p>
                      <p className="text-sm text-slate-600">{subCategory.name_marathi || '-'}</p>
                    </div>
                    {subCategory.image ? (
                      <img src={resolveMediaUrl(subCategory.image)} alt={subCategory.name} className="h-12 w-12 rounded-xl border border-slate-200 object-cover" />
                    ) : (
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">No image</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p><span className="font-medium text-slate-800">Parent:</span> {subCategory.category_name || '-'}</p>
                    <p><span className="font-medium text-slate-800">Description:</span> {subCategory.description || '-'}</p>
                    <p><span className="font-medium text-slate-800">Created:</span> {formatDate(subCategory.created_at)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditSubCategory(subCategory)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-100"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(subCategory.id)}
                      disabled={deletingIds.includes(subCategory.id)}
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
              totalItems={filteredSubCategories.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
              </>
            )}
          </>
        )}
      </div>

      {showSubCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-4 text-white sm:px-6 md:px-8 md:py-6">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">{editingSubCategoryId ? 'Update Subcategory' : 'Create Subcategory'}</h2>
                <p className="mt-1 text-sm text-white/80">{editingSubCategoryId ? 'Edit a subcategory and its parent category selection' : 'Create a subcategory and a category if needed from one form'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSubCategoryModal(false);
                  resetForm();
                }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/20"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubCategorySubmit} className="space-y-5 p-4 sm:p-6 md:space-y-6 md:p-8">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Subcategory Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={subCategoryForm.name}
                  onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Citrus Fruits, Leafy Vegetables"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Hindi Name</label>
                <input
                  type="text"
                  value={subCategoryForm.name_hindi}
                  onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, name_hindi: e.target.value }))}
                  placeholder="हिंदी नाम"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Marathi Name</label>
                <input
                  type="text"
                  value={subCategoryForm.name_marathi}
                  onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, name_marathi: e.target.value }))}
                  placeholder="मराठी नाव"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Parent Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={subCategoryForm.category_id}
                  onChange={(e) => setSubCategoryForm((prev) => ({ ...prev, category_id: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} {category.name_marathi}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
                <textarea
                  value={subCategoryForm.description}

                  onChange={(e)=> {
                    const value = e.target.value;
                    if (countWords(value) <= 15) {
                      setSubCategoryForm((prev) => ({ ...prev, description: value }));
                    }
                  }}
                  placeholder="Optional explanation for this subcategory"
                  rows="4"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Description (Hindi)</label>
                <textarea
                  value={subCategoryForm.description_hindi}
                  onChange={(e)=> {
                    const value = e.target.value;
                    if (countWords(value) <= 15) {
                      setSubCategoryForm((prev) => ({ ...prev, description_hindi: value }));
                    }
                  }}
                  placeholder="वैकल्पिक विवरण"
                  rows="4"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Description (Marathi)</label>
                <textarea
                  value={subCategoryForm.description_marathi}
                  onChange={(e)=> {
                    const value = e.target.value;
                    if (countWords(value) <= 15) {
                      setSubCategoryForm((prev) => ({ ...prev, description_marathi: value }));
                    }
                  }}
                  placeholder="ऐच्छिक वर्णन"
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
                    setSubCategoryForm((prev) => ({ ...prev, image: file }));
                    setImagePreviewFromValue(file);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                {ImagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900 mb-2">Image Preview:</p>
                    <img src={ImagePreview} alt="Preview" className="h-32 w-32 rounded-xl object-cover border border-slate-200" />
                  </div>
                )}
                {subCategoryForm.image instanceof File && (
                  <p className="mt-2 text-sm text-slate-500">{subCategoryForm.image.name} selected</p>
                )}
              </div>


              {error && (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}



              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubCategoryModal(false);
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
                  {editingSubCategoryId ? 'Update Subcategory' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
