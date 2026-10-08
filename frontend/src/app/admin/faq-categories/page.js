'use client';

import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

const emptyForm = {
    faqcategoryname: '',
    description: '',
    status: 'Active',
};

export default function FaqCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchCategories = async () => {
        try {
            setLoading(true);

            const response = await api.get('/faq-categories');

            setCategories(Array.isArray(response.data) ? response.data : []);
            setCurrentPage(1);
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to load FAQ categories';
            setError(message);
            await Swal.fire({ icon: 'error', title: 'Unable to load categories', text: message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const totalPages = Math.max(1, Math.ceil(categories.length / itemsPerPage));
    const paginatedCategories = categories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData(emptyForm);
    };

    const openCreateModal = () => {
        setError('');
        setFormData(emptyForm);
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setError('');

        setFormData({
            faqcategoryname: category.faqcategoryname,
            description: category.description || '',
            status: category.status || 'Active',
        });

        setEditingId(category.id);
        setShowModal(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        if (!formData.faqcategoryname.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Invalid name',
                text: 'FAQ category name is required',
            });
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                faqcategoryname: formData.faqcategoryname.trim(),
                description: formData.description,
                status: formData.status,
            };

            if (editingId) {
                await api.put(
                    `/faq-categories/${editingId}`,
                    payload
                );
                await Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'FAQ category updated successfully',
                    timer: 1600,
                    showConfirmButton: false,
                });
            } else {
                await api.post('/faq-categories', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Created',
                    text: 'FAQ category created successfully',
                    timer: 1600,
                    showConfirmButton: false,
                });
            }

            closeModal();
            await fetchCategories();
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to save FAQ category';
            setError(message);
            await Swal.fire({ icon: 'error', title: 'Save failed', text: message });
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete FAQ category?',
            text: 'This action cannot be undone.',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
        });
        if (!result.isConfirmed) return;

        try {
            setError('');

            await api.delete(`/faq-categories/${id}`);

            setCategories((current) =>
                current.filter((category) => category.id !== id)
            );

            await Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'FAQ category deleted successfully',
                timer: 1600,
                showConfirmButton: false,
            });
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to delete FAQ category';
            setError(message);
            await Swal.fire({ icon: 'error', title: 'Delete failed', text: message });
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">
                        Administration
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                        FAQ Categories
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage the categories used to group frequently asked questions.
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl"
                >
                    <Plus size={20} />
                    New Category
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        Loading FAQ categories...
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No FAQ categories created yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-140 text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-slate-900">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        ID
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Category Name
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Description
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-center font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedCategories.map((category) => (
                                    <tr
                                        key={category.id}
                                        className="border-b border-slate-100 hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4 text-slate-500">
                                            {category.id}
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {category.faqcategoryname}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {category.description || '—'}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    category.status === 'Inactive'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                {category.status || 'Active'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    title="Edit category"
                                                    onClick={() =>
                                                        openEditModal(category)
                                                    }
                                                    className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                <button
                                                    title="Delete category"
                                                    onClick={() =>
                                                        handleDelete(category.id)
                                                    }
                                                    className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50"
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
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={categories.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between rounded-t-3xl bg-emerald-700 px-6 py-5 text-white">
                            <h2 className="text-lg font-semibold">
                                {editingId
                                    ? 'Update FAQ Category'
                                    : 'Create FAQ Category'}
                            </h2>

                            <button
                                title="Close"
                                onClick={closeModal}
                                className="rounded-full p-2 hover:bg-white/20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >
                            <label className="block text-sm font-semibold text-slate-900">
                                Category Name

                                <input
                                    type="text"
                                    required
                                    value={formData.faqcategoryname}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            faqcategoryname: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"
                                />
                            </label>

                            <label className="block text-sm font-semibold text-slate-900">
                                Description

                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"
                                />
                            </label>

                            <label className="block text-sm font-semibold text-slate-900">
                                Status

                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"
                                >
                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Inactive">
                                        Inactive
                                    </option>
                                </select>
                            </label>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
                                >
                                    Cancel
                                </button>

                                <button
                                    disabled={processing}
                                    className="rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-60"
                                >
                                    {processing
                                        ? 'Saving...'
                                        : editingId
                                            ? 'Update Category'
                                            : 'Create Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
