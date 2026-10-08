'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, Edit2, X } from 'lucide-react';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

const emptyForm = {
    question_english: '',
    answer_english: '',
    question_Marathi: '',
    answer_Marathi: '',
    question_Hindi: '',
    answer_Hindi: '',
    type: '',
    status: 'active',
};

export default function AdminFaqPage() {
    const [faqs, setFaqs] = useState([]);
    const [faqCategories, setFaqCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedFaq, setSelectedFaq] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchFaqs();
        fetchFaqCategories();
    }, []);

    const fetchFaqs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/faq');
            setFaqs(Array.isArray(response.data) ? response.data : []);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFaqCategories = async () => {
        try {
            const response = await api.get('/faq-categories');
            const categories = Array.isArray(response.data) ? response.data : [];
            setFaqCategories(categories.filter((category) => category.status === 'Active'));
        } catch (error) {
            console.error('Error fetching FAQ categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (faq) => {
        setEditingId(faq.id);
        setFormData({
            question_english: faq.question_english || '',
            answer_english: faq.answer_english || '',
            question_Marathi: faq.question_Marathi || '',
            answer_Marathi: faq.answer_Marathi || '',
            question_Hindi: faq.question_Hindi || '',
            answer_Hindi: faq.answer_Hindi || '',
            type: faq.type || '',
            status: faq.status || 'active',
        });
        setShowModal(true);
        setShowViewModal(false);
    };

    const openViewModal = (faq) => {
        setSelectedFaq(faq);
        setShowViewModal(true);
        setShowModal(false);
    };

    const closeModal = () => {
        setShowModal(false);
        setShowViewModal(false);
        setSelectedFaq(null);
        resetForm();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingId) {
                await api.put(`/faq/${editingId}`, formData);
            } else {
                await api.post('/faq', formData);
            }

            await fetchFaqs();
            closeModal();
        } catch (error) {
            console.error('Error saving FAQ:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (faqId) => {
        if (!window.confirm('Delete this FAQ?')) return;

        try {
            await api.delete(`/faq/${faqId}`);
            setFaqs((prev) => prev.filter((faq) => faq.id !== faqId));
        } catch (error) {
            console.error('Error deleting FAQ:', error);
        }
    };

    const totalPages = Math.max(1, Math.ceil(faqs.length / itemsPerPage));
    const paginatedFaqs = faqs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">FAQ Management</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">Manage FAQ questions</h1>
                    <p className="mt-2 text-sm text-slate-600">Create, edit, and delete FAQ items from the admin panel.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl"
                >
                    <Plus size={18} />
                    Add FAQ
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
                    <h2 className="text-lg font-semibold text-slate-900">FAQ List</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading FAQs...</div>
                ) : faqs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No FAQs found yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Question (English)</th>

                                    <th className="px-4 py-3 font-semibold">Question (Marathi)</th>
                                    <th className="px-4 py-3 font-semibold">Type</th>
                                    <th className="px-4 py-3 font-semibold">status</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {paginatedFaqs.map((faq) => (
                                    <tr key={faq.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-4">{faq.question_english || '-'}</td>

                                        <td className="px-4 py-4">{faq.question_Marathi || '-'}</td>
                                        <td className="px-4 py-4">{faq.type || 'General FAQs'}</td>
                                        <td className="px-4 py-4">{faq.status || '-'}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openViewModal(faq)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    <Eye size={16} />

                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(faq)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    <Pencil size={16} />

                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(faq.id)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
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
                    totalItems={faqs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {showViewModal && selectedFaq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-4 text-white">
                            <div>
                                <h2 className="text-xl font-bold">FAQ Details</h2>
                                <p className="text-sm text-emerald-100">View full FAQ content.</p>
                            </div>
                            <button type="button" onClick={closeModal} className="rounded-full bg-white/15 p-2 transition hover:bg-white/25">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 p-5 sm:p-6 text-sm text-slate-700">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-1 font-semibold text-slate-500">Status</p>
                                <p className="font-medium capitalize">{selectedFaq.status || 'active'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-1 font-semibold text-slate-500">Question (English)</p>
                                <p>{selectedFaq.question_english || '-'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-1 font-semibold text-slate-500">Answer (English)</p>
                                <p>{selectedFaq.answer_english || '-'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-1 font-semibold text-slate-500">Question (Hindi)</p>
                                <p>{selectedFaq.question_Hindi || '-'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-1 font-semibold text-slate-500">Answer (Hindi)</p>
                                <p>{selectedFaq.answer_Hindi || '-'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-1 font-semibold text-slate-500">Question (Marathi)</p>
                                <p>{selectedFaq.question_Marathi || '-'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-1 font-semibold text-slate-500">Answer (Marathi)</p>
                                <p>{selectedFaq.answer_Marathi || '-'}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="mb-1 font-semibold text-slate-500">Type</p>
                                <p>{selectedFaq.type || 'General FAQs'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-4 text-white">
                            <div>
                                <h2 className="text-xl font-bold">{editingId ? 'Edit FAQ' : 'Add FAQ'}</h2>
                                <p className="text-sm text-emerald-100">Create or update FAQ content for all languages.</p>
                            </div>
                            <button type="button" onClick={closeModal} className="rounded-full bg-white/15 p-2 transition hover:bg-white/25">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-semibold text-slate-700">
                                    Question (English)
                                    <textarea
                                        name="question_english"
                                        value={formData.question_english}
                                        onChange={handleInputChange}
                                        rows={3}
                                        required
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </label>
                                <label className="space-y-2 text-sm font-semibold text-slate-700">
                                    Answer (English)
                                    <textarea
                                        name="answer_english"
                                        value={formData.answer_english}
                                        onChange={handleInputChange}
                                        rows={3}
                                        required
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </label>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-semibold text-slate-700">
                                    Question (Hindi)
                                    <textarea
                                        name="question_Hindi"
                                        value={formData.question_Hindi}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </label>
                                <label className="space-y-2 text-sm font-semibold text-slate-700">
                                    Answer (Hindi)
                                    <textarea
                                        name="answer_Hindi"
                                        value={formData.answer_Hindi}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </label>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-semibold text-slate-700">
                                    Question (Marathi)
                                    <textarea
                                        name="question_Marathi"
                                        value={formData.question_Marathi}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </label>
                                <label className="space-y-2 text-sm font-semibold text-slate-700">
                                    Answer (Marathi)
                                    <textarea
                                        name="answer_Marathi"
                                        value={formData.answer_Marathi}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </label>


                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm font-semibold text-slate-700">
                                    Type
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        <option value="" disabled>Select category</option>
                                        {faqCategories.map((category) => (
                                            <option key={category.id} value={category.faqcategoryname}>
                                                {category.faqcategoryname}
                                            </option>
                                        ))}
                                        {formData.type && !faqCategories.some((category) => category.faqcategoryname === formData.type) && (
                                            <option value={formData.type}>{formData.type} (Inactive)</option>
                                        )}
                                    </select>
                                </label>
                                <label className="space-y-2 text-sm font-semibold text-slate-700">
                                    Status
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </label>
                            </div>
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {saving ? 'Saving...' : editingId ? 'Update FAQ' : 'Save FAQ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}