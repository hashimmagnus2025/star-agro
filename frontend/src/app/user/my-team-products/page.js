'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Ban, Loader2, Package } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';

const statusBadgeClass = (status) => {
    const normalized = String(status || 'Pending').toLowerCase();
    if (normalized === 'approved') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
};

export default function MyTeamProductsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [products, setProducts] = useState([]);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products/district-team');
            setProducts(Array.isArray(response.data) ? response.data : []);
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load products for your team.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (product, status) => {
        setUpdatingId(product.id);
        try {
            await api.put(`/products/${product.id}/status`, { status });
            setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status } : p)));
            Swal.fire({
                icon: 'success',
                title: status === 'Approved' ? 'Approved' : 'Rejected',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Action failed',
                text: err?.response?.data?.message || 'Unable to update this product.',
            });
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
                <div className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
                    <p className="text-slate-700">{error}</p>
                    <Link
                        href="/user/my-team"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800"
                    >
                        <ArrowLeft size={16} /> Back to My Team
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-slate-50">
            <div className="p-4 sm:p-6 lg:p-2">
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-xl font-bold text-slate-900">My Team Products</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Products from users in your assigned district or taluka — approve or reject before buyers can see them.
                    </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Owner</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Phone</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{product.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{product.farmer_name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{product.farmer_phone || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{product.type || 'Product'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(product.status)}`}>
                                                {product.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                {String(product.status).toLowerCase() !== 'approved' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStatus(product, 'Approved')}
                                                        disabled={updatingId === product.id}
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                                {String(product.status).toLowerCase() !== 'rejected' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUpdateStatus(product, 'Rejected')}
                                                        disabled={updatingId === product.id}
                                                        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                                            <Package className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                                            No products found in your district yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
