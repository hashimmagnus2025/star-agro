'use client';

import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

const emptyForm = {
    width: '',
    height: '',
    type: 'Horizontal',
    status: 'Active',
};

export default function AdvertisementSizePage() {
    const [sizes, setSizes] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchSizes = async () => {
        try {
            setLoading(true);

            const response = await api.get('/advertisement-sizes');

            setSizes(Array.isArray(response.data) ? response.data : []);
            setCurrentPage(1);
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to load advertisement sizes';
            setError(message);
            await Swal.fire({ icon: 'error', title: 'Unable to load sizes', text: message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSizes();
    }, []);

    const totalPages = Math.max(1, Math.ceil(sizes.length / itemsPerPage));
    const paginatedSizes = sizes.slice(
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

    const openEditModal = (size) => {
        setError('');

        setFormData({
            width: size.width,
            height: size.height,
            type: size.type || 'Horizontal',
            status: size.status || 'Active',
        });

        setEditingId(size.id);
        setShowModal(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');
        if (
            !Number.isInteger(Number(formData.width)) ||
            Number(formData.width) <= 0 ||
            !Number.isInteger(Number(formData.height)) ||
            Number(formData.height) <= 0
        ) {
            await Swal.fire({
                icon: 'warning',
                title: 'Invalid dimensions',
                text: 'Width and height must be positive whole numbers',
            });
            return;
        }

        setProcessing(true);

        try {
            const payload = {
                width: Number(formData.width),
                height: Number(formData.height),
                type: formData.type,
                status: formData.status,
            };

            if (editingId) {
                await api.put(
                    `/advertisement-sizes/${editingId}`,
                    payload
                );
                await Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'Advertisement size updated successfully',
                    timer: 1600,
                    showConfirmButton: false,
                });
            } else {
                await api.post('/advertisement-sizes', payload);
                await Swal.fire({
                    icon: 'success',
                    title: 'Created',
                    text: 'Advertisement size created successfully',
                    timer: 1600,
                    showConfirmButton: false,
                });
            }

            closeModal();
            await fetchSizes();
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to save advertisement size';
            setError(message);
            await Swal.fire({ icon: 'error', title: 'Save failed', text: message });
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete advertisement size?',
            text: 'This action cannot be undone.',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
        });
        if (!result.isConfirmed) return;

        try {
            setError('');

            await api.delete(`/advertisement-sizes/${id}`);

            setSizes((current) =>
                current.filter((size) => size.id !== id)
            );

            await Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Advertisement size deleted successfully',
                timer: 1600,
                showConfirmButton: false,
            });
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to delete advertisement size';
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
                        Advertisement Sizes
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage width and height options for advertisements.
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl"
                >
                    <Plus size={20} />
                    New Size
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
                        Loading advertisement sizes...
                    </div>
                ) : sizes.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No advertisement sizes created yet.
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
                                        Width (px)
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Height (px)
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Type
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
                                {paginatedSizes.map((size) => (
                                    <tr
                                        key={size.id}
                                        className="border-b border-slate-100 hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4 text-slate-500">
                                            {size.id}
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {size.width}
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {size.height}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    size.type === 'Vertical'
                                                        ? 'bg-violet-100 text-violet-700'
                                                        : 'bg-sky-100 text-sky-700'
                                                }`}
                                            >
                                                {size.type || 'Horizontal'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    size.status === 'Inactive'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                {size.status || 'Active'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    title="Edit size"
                                                    onClick={() =>
                                                        openEditModal(size)
                                                    }
                                                    className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                <button
                                                    title="Delete size"
                                                    onClick={() =>
                                                        handleDelete(size.id)
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
                    totalItems={sizes.length}
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
                                    ? 'Update Advertisement Size'
                                    : 'Create Advertisement Size'}
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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="text-sm font-semibold text-slate-900">
                                    Width (px)

                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        required
                                        value={formData.width}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                width: e.target.value,
                                            })
                                        }
                                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"
                                    />
                                </label>

                                <label className="text-sm font-semibold text-slate-900">
                                    Height (px)

                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        required
                                        value={formData.height}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                height: e.target.value,
                                            })
                                        }
                                        className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"
                                    />
                                </label>
                            </div>

                            <label className="block text-sm font-semibold text-slate-900">
                                Type

                                <select
                                    value={formData.type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            type: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"
                                >
                                    <option value="Horizontal">
                                        Horizontal
                                    </option>

                                    <option value="Vertical">
                                        Vertical
                                    </option>
                                </select>
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
                                            ? 'Update Size'
                                            : 'Create Size'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}