'use client';

import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

const emptyForm = {
    duration: '',
    label: '',
    status: 'Active',
};

const labelOptions = [
    'Days',
    'Months',
    'Years',
    'Lifetime',
];

export default function AdvertisementDurationPage() {
    const [durations, setDurations] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    const fetchDurations = async () => {
        try {
            setLoading(true);

            const response = await api.get('/advertisement-durations');

            setDurations(
                Array.isArray(response.data) ? response.data : []
            );

            setCurrentPage(1);
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                'Unable to load advertisement durations';

            setError(message);

            await Swal.fire({
                icon: 'error',
                title: 'Unable to load durations',
                text: message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDurations();
    }, []);

    const totalPages = Math.max(
        1,
        Math.ceil(durations.length / itemsPerPage)
    );

    const paginatedDurations = durations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
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

    const openEditModal = (item) => {
        setError('');

        setFormData({
            duration: item.duration,
            label: item.label,
            status: item.status || 'Active',
        });

        setEditingId(item.id);
        setShowModal(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');

        if (
            (formData.duration !== '' &&
                (!Number.isInteger(Number(formData.duration)) ||
                    Number(formData.duration) <= 0)) ||
            !formData.label
        ) {
            await Swal.fire({
                icon: 'warning',
                title: 'Invalid duration',
                text: 'Please enter a positive duration and select a label.',
            });

            return;
        }

        setProcessing(true);

        try {
            const payload = {
                duration: formData.duration === '' ? null : Number(formData.duration),
                label: formData.label,
                status: formData.status,
            };

            if (editingId) {
                await api.put(
                    `/advertisement-durations/${editingId}`,
                    payload
                );

                await Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'Advertisement duration updated successfully',
                    timer: 1600,
                    showConfirmButton: false,
                });
            } else {
                await api.post('/advertisement-durations', payload);

                await Swal.fire({
                    icon: 'success',
                    title: 'Created',
                    text: 'Advertisement duration created successfully',
                    timer: 1600,
                    showConfirmButton: false,
                });
            }

            closeModal();
            await fetchDurations();
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                'Unable to save advertisement duration';

            setError(message);

            await Swal.fire({
                icon: 'error',
                title: 'Save failed',
                text: message,
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete advertisement duration?',
            text: 'This action cannot be undone.',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
        });

        if (!result.isConfirmed) return;

        try {
            setError('');

            await api.delete(`/advertisement-durations/${id}`);

            setDurations((current) =>
                current.filter((item) => item.id !== id)
            );

            await Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Advertisement duration deleted successfully',
                timer: 1600,
                showConfirmButton: false,
            });
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                'Unable to delete advertisement duration';

            setError(message);

            await Swal.fire({
                icon: 'error',
                title: 'Delete failed',
                text: message,
            });
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
                        Advertisement Durations
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage duration options available for advertisements.
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl"
                >
                    <Plus size={20} />
                    New Duration
                </button>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm sm:p-6">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        Loading advertisement durations...
                    </div>
                ) : durations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No advertisement durations created yet.
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
                                        Duration
                                    </th>

                                    <th className="px-6 py-4 font-semibold">
                                        Label
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
                                {paginatedDurations.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-slate-100 hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4 text-slate-500">
                                            {item.id}
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {item.duration}
                                        </td>

                                        <td className="px-6 py-4 text-slate-700">
                                            {item.label}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    item.status === 'Inactive'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                {item.status || 'Active'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    title="Edit duration"
                                                    onClick={() =>
                                                        openEditModal(item)
                                                    }
                                                    className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Edit2 size={16} />
                                                </button>

                                                <button
                                                    title="Delete duration"
                                                    onClick={() =>
                                                        handleDelete(item.id)
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
                    totalItems={durations.length}
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
                                    ? 'Update Advertisement Duration'
                                    : 'Create Advertisement Duration'}
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
                                Duration

                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={formData.duration}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            duration: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"
                                />
                            </label>

                            <label className="block text-sm font-semibold text-slate-900">
                                Label

                                <select
                                    required
                                    value={formData.label}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            label: e.target.value,
                                        })
                                    }
                                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"
                                >
                                    <option value="">
                                        Select label
                                    </option>

                                    {labelOptions.map((label) => (
                                        <option
                                            key={label}
                                            value={label}
                                        >
                                            {label}
                                        </option>
                                    ))}
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
                                            ? 'Update Duration'
                                            : 'Create Duration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}