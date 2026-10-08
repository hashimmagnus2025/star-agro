"use client"
import { useEffect, useState } from 'react';

import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

export default function AdvertisementInquiriesPage() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        let mounted = true;
        const fetchInquiries = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await api.get('/advertisement-inquiries');
                if (!mounted) return;
                setInquiries(Array.isArray(response.data) ? response.data : []);
            } catch (fetchError) {
                console.error('Error fetching advertisement inquiries:', fetchError);
                if (!mounted) return;
                setError(fetchError?.response?.data?.message || fetchError.message || 'Unable to load inquiries');
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };
        fetchInquiries();
        return () => { mounted = false; };
    }, []);

    const getSizeType = (label) => {
        const numbers = String(label || '').match(/\d+/g);
        if (!numbers || numbers.length < 2) return '-';
        const [width, height] = numbers.map(Number);
        if (width === height) return 'Square';
        return width > height ? 'Horizontal' : 'Vertical';
    };

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString();
    };

    const filteredInquiries = inquiries.filter((inquiry) => {
        const term = searchTerm.toLowerCase();
        return [inquiry.name, inquiry.email, inquiry.phone, inquiry.selected_size, inquiry.message]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term));
    });

    const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / itemsPerPage));
    const paginatedInquiries = filteredInquiries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6 p-4">
            <div>
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">Advertisement Inquiries</h1>
                <p className="mt-2 text-slate-500">Review inquiries submitted from the advertisement page.</p>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm overflow-x-auto">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">Showing {filteredInquiries.length} result{filteredInquiries.length === 1 ? '' : 's'}</div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Search inquiries..."
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:max-w-xs"
                    />
                </div>
                {loading ? (
                    <div className="text-center py-16 text-slate-500">Loading inquiries...</div>
                ) : error ? (
                    <div className="text-center py-16 text-red-600">{error}</div>
                ) : filteredInquiries.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">No advertisement inquiries found yet.</div>
                ) : (
                    <table className="w-full min-w-full border-collapse text-sm">
                        <thead className="hidden sm:table-header-group">
                            <tr className="border-b-2 border-slate-300 bg-slate-50 text-left text-slate-900">
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Phone</th>
                                <th className="px-6 py-4 font-semibold">Selected Size</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Message</th>
                                <th className="px-6 py-4 font-semibold">Received</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedInquiries.map((inquiry, index) => (
                                <tr
                                    key={inquiry.id || index}
                                    className={`block sm:table-row border-b border-slate-200 transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                >
                                    <td className="block sm:table-cell px-6 py-4 align-top">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Name</span>
                                        <span className="font-semibold text-slate-900">{inquiry.name || '-'}</span>
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600 break-words">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Email</span>
                                        {inquiry.email || '-'}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Phone</span>
                                        {inquiry.phone || '-'}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Selected Size</span>
                                        {inquiry.selected_size || '-'}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Type</span>
                                        {getSizeType(inquiry.selected_size)}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600 max-w-xl break-words whitespace-pre-wrap">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Message</span>
                                        {inquiry.message || '-'}
                                    </td>
                                    <td className="block sm:table-cell px-6 py-4 align-top text-slate-600">
                                        <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:hidden">Received</span>
                                        {formatDate(inquiry.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredInquiries.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
