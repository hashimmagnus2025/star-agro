
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import api from '../../utils/api';
import Pagination from '../components/Pagination.js';

const sortPermissionsNewestFirst = (data) => {
    const permissionList = Array.isArray(data) ? data : data?.data || [];
    return [...permissionList].sort((a, b) => Number(b.id) - Number(a.id));
};

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingIds, setDeletingIds] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        let mounted = true;
        async function fetchPermissions() {
            setLoading(true);
            try {
                const res = await api.get('/permission');
                if (!mounted) return;
                // assume backend returns an array
                setPermissions(sortPermissionsNewestFirst(res.data));
            } catch (err) {
                const msg = err?.response?.data?.message || err.message || 'Failed to load permissions';
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        }
        fetchPermissions();
        return () => { mounted = false; };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmitPermission = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.description.trim()) {
            toast.warn('Please fill in all fields');
            return;
        }
        // If editingId is set, perform update; otherwise create
        if (editingId) {
            setUpdating(true);
            try {
                await api.put(`/permission/${editingId}`, formData);
                const res = await api.get('/permission');
                setPermissions(sortPermissionsNewestFirst(res.data));
                setFormData({ name: '', description: '' });
                setShowModal(false);
                setEditingId(null);
                toast.success('Permission updated successfully');
            } catch (err) {
                const msg = err?.response?.data?.message || err.message || 'Failed to update permission';
                toast.error(msg);
            } finally {
                setUpdating(false);
            }
        } else {
            setCreating(true);
            try {
                await api.post('/permission', formData);
                // Refetch permissions list to ensure consistency
                const res = await api.get('/permission');
                setPermissions(sortPermissionsNewestFirst(res.data));
                setFormData({ name: '', description: '' });
                setShowModal(false);
                setCurrentPage(1);
                toast.success('Permission created successfully');
            } catch (err) {
                const msg = err?.response?.data?.message || err.message || 'Failed to create permission';
                toast.error(msg);
            } finally {
                setCreating(false);
            }
        }
    };

    const handleEditClick = (permission) => {
        setFormData({ name: permission.name || '', description: permission.description || '' });
        setEditingId(permission.id);
        setShowModal(true);
    };
    const closeModal = () => {
        setShowModal(false);
        setFormData({ name: '', description: '' });
        setEditingId(null);
    };

    const handleDeletePermission = async (id) => {
        if (!confirm('Delete this permission?')) return;
        setDeletingIds((s) => [...s, id]);
        try {
            await api.delete(`/permission/${id}`);
            setPermissions((prev) => prev.filter((permission) => permission.id !== id));
            toast.success('Permission deleted successfully');
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || 'Failed to delete permission';
            toast.error(msg);
        } finally {
            setDeletingIds((s) => s.filter((x) => x !== id));
        }
    };

    const filteredPermissions = permissions.filter((permission) => {
        const term = searchTerm.toLowerCase();
        return [permission.name, permission.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term));
    });

    const totalPages = Math.max(1, Math.ceil(filteredPermissions.length / itemsPerPage));
    const paginatedPermissions = filteredPermissions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-4">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">Permissions Management</h1>
                </div>
                <button
                    onClick={() => { setEditingId(null); setFormData({ name: '', description: '' }); setShowModal(true); }}
                    className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition"
                >
                    <Plus size={20} />
                    Create Permission
                </button>
            </div>

            {/* Permissions List */}
            <div className="rounded-3xl bg-white p-8 shadow-sm overflow-x-auto">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">Showing {filteredPermissions.length} result{filteredPermissions.length === 1 ? '' : 's'}</div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Search permissions..."
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs"
                    />
                </div>
                {loading ? (
                    <div className="text-center py-12">Loading permissions...</div>
                ) : permissions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 text-lg">No permissions created yet. Create your first permission!</p>
                    </div>
                ) : (
                    <table className="w-full border-collapse">
                        <thead className="hidden sm:table-header-group">
                            <tr className="border-b-2 border-slate-300 bg-slate-50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Permission Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Description</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPermissions.map((permission, index) => (
                                <tr
                                    key={permission.id}
                                    className={`block sm:table-row border-b border-slate-200 hover:bg-slate-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                                        }`}
                                >
                                    <td className="block sm:table-cell px-6 py-4 align-top">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Permission Name</span>
                                        <span className="font-semibold text-slate-900">{permission.name}</span>
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Description</span>
                                        {permission.description}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-center">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Actions</span>
                                        <div className="flex flex-wrap items-center justify-center gap-3 mt-2 sm:mt-0">
                                            <button onClick={() => handleEditClick(permission)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePermission(permission.id)}
                                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                                                title="Delete"
                                                disabled={deletingIds.includes(permission.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredPermissions.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="rounded-3xl bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white">
                            <h2 className="text-2xl font-bold">Create New Permission</h2>
                            <button
                                onClick={closeModal}
                                className="inline-flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/20 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmitPermission} className="p-8 space-y-6">
                            {/* Permission Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Permission Name <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Create Users, Edit Posts, Delete Comments"
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Description <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe what this permission allows..."
                                    rows="4"
                                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
                                    required
                                />
                            </div>

                            

                            {/* Buttons */}
                            <div className="flex items-center gap-4 justify-end pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-3xl border border-slate-300 px-8 py-3 text-slate-900 font-semibold hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || updating}
                                    className="rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50"
                                >
                                    {editingId ? 'Update Permission' : 'Create Permission'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}