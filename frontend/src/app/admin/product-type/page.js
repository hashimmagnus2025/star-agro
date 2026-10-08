"use client";

import { useEffect, useState } from 'react';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
const typeOptions = [
    { value: 'Product Type', label: 'Product Type' },
    { value: 'Unit', label: 'Unit' },
];

export default function ProductTypePage() {
    const [productTypes, setProductTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'Product Type',
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchProductTypes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/product-types');
            setProductTypes(response.data || []);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching product types:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductTypes();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', type: 'Product Type' });
        setEditingId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name || '',
            description: item.description || '',
            type: item.type || 'Product Type',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) return;

        try {
            setSubmitting(true);
            if (editingId) {
                await api.put(`/product-types/${editingId}`, formData);
            } else {
                await api.post('/product-types', formData);
            }

            await fetchProductTypes();
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error saving product type:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Kya aap is product type ko delete karna chahte hain?')) return;

        try {
            await api.delete(`/product-types/${id}`);
            await fetchProductTypes();
        } catch (error) {
            console.error('Error deleting product type:', error);
        }
    };

    const totalPages = Math.max(1, Math.ceil(productTypes.length / itemsPerPage));
    const paginatedProductTypes = productTypes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Product Types</h1>
                    <p className="text-sm text-slate-600">Product Type aur Unit ko manage karen.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="rounded-lg bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-xl"
                >
                    + Add New
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-700">All Entries</h2>
                </div>

                {loading ? (
                    <div className="p-6 text-sm text-slate-500">Loading...</div>
                ) : productTypes.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">No product types found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold">Description</th>
                                    <th className="px-4 py-3 font-semibold">Type</th>
                                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {paginatedProductTypes.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.description || 'No description'}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                                {item.type || 'Product Type'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="px-4 pb-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={productTypes.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between ">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {editingId ? 'Edit Product Type' : 'Add Product Type'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Close
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                                    rows="3"
                                    placeholder="Enter description"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
                                >
                                    {typeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-lg bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-xl disabled:opacity-60"
                                >
                                    {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}