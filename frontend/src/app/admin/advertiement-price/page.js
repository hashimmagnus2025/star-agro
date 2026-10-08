
'use client';

import { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../utils/api.js';
import Pagination from '../components/Pagination.js';

const emptyForm = { adSizeId: '', adDurationId: '', price: '', status: 'Active' };

export default function AdvertisementPricepage() {
    const [prices, setPrices] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [durations, setDurations] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = async () => {
        try {
            setLoading(true);
            const [priceResponse, sizeResponse, durationResponse] = await Promise.all([
                api.get('/advertisement-prices'),
                api.get('/advertisement-sizes'),
                api.get('/advertisement-durations'),
            ]);
            setPrices(Array.isArray(priceResponse.data) ? priceResponse.data : []);
            setSizes(Array.isArray(sizeResponse.data) ? sizeResponse.data : []);
            setDurations(Array.isArray(durationResponse.data) ? durationResponse.data : []);
            setCurrentPage(1);
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to load advertisement prices';
            setError(message);
            await Swal.fire({ icon: 'error', title: 'Unable to load prices', text: message });
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const totalPages = Math.max(1, Math.ceil(prices.length / itemsPerPage));
    const paginatedPrices = prices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const closeModal = () => { setShowModal(false); setEditingId(null); setFormData(emptyForm); };
    const openCreateModal = () => { setError(''); setFormData(emptyForm); setEditingId(null); setShowModal(true); };
    const openEditModal = (item) => {
        setError('');
        setFormData({ adSizeId: String(item.ad_size_id), adDurationId: String(item.ad_duration_id), price: item.price, status: item.status || 'Active' });
        setEditingId(item.id);
        setShowModal(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        if (!formData.adSizeId || !formData.adDurationId || formData.price === '' || Number(formData.price) < 0 || !Number.isFinite(Number(formData.price))) {
            await Swal.fire({ icon: 'warning', title: 'Invalid price details', text: 'Please select advertisement size, duration, and enter a valid price.' });
            return;
        }
        setProcessing(true);
        try {
            const payload = { adSizeId: Number(formData.adSizeId), adDurationId: Number(formData.adDurationId), price: Number(formData.price), status: formData.status };
            if (editingId) {
                await api.put(`/advertisement-prices/${editingId}`, payload);
                await Swal.fire({ icon: 'success', title: 'Updated', text: 'Advertisement price updated successfully', timer: 1600, showConfirmButton: false });
            } else {
                await api.post('/advertisement-prices', payload);
                await Swal.fire({ icon: 'success', title: 'Created', text: 'Advertisement price created successfully', timer: 1600, showConfirmButton: false });
            }
            closeModal();
            await fetchData();
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to save advertisement price';
            setError(message);
            await Swal.fire({ icon: 'error', title: 'Save failed', text: message });
        } finally { setProcessing(false); }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({ icon: 'warning', title: 'Delete advertisement price?', text: 'This action cannot be undone.', showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: '#dc2626' });
        if (!result.isConfirmed) return;
        try {
            setError('');
            await api.delete(`/advertisement-prices/${id}`);
            setPrices((current) => current.filter((item) => item.id !== id));
            await Swal.fire({ icon: 'success', title: 'Deleted', text: 'Advertisement price deleted successfully', timer: 1600, showConfirmButton: false });
        } catch (err) {
            const message = err?.response?.data?.message || 'Unable to delete advertisement price';
            setError(message);
            await Swal.fire({ icon: 'error', title: 'Delete failed', text: message });
        }
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Advertisement Prices</h1><p className="mt-2 text-sm text-slate-500">Manage prices for each advertisement size and duration.</p></div><button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl"><Plus size={20} /> New Price</button></div>
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm sm:p-6">{loading ? <div className="p-8 text-center text-slate-500">Loading advertisement prices...</div> : prices.length === 0 ? <div className="p-8 text-center text-slate-500">No advertisement prices created yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-140 text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-slate-900"><tr><th className="px-6 py-4 font-semibold">ID</th><th className="px-6 py-4 font-semibold">Ad Size</th><th className="px-6 py-4 font-semibold">Ad Duration</th><th className="px-6 py-4 font-semibold">Price</th><th className="px-6 py-4 font-semibold">Status</th><th className="px-6 py-4 text-center font-semibold">Actions</th></tr></thead><tbody>{paginatedPrices.map((item) => <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-6 py-4 text-slate-500">{item.id}</td><td className="px-6 py-4 font-semibold text-slate-900">{item.width} x {item.height} px</td><td className="px-6 py-4 text-slate-700">{item.duration ? `${item.duration} ${item.label}` : item.label}</td><td className="px-6 py-4 font-semibold text-slate-900">₹{Number(item.price).toFixed(2)}</td><td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Inactive' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.status || 'Active'}</span></td><td className="px-6 py-4"><div className="flex justify-center gap-2"><button title="Edit price" onClick={() => openEditModal(item)} className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"><Edit2 size={16} /></button><button title="Delete price" onClick={() => handleDelete(item.id)} className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={prices.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
            </div>
            {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"><div className="flex items-center justify-between rounded-t-3xl bg-emerald-700 px-6 py-5 text-white"><h2 className="text-lg font-semibold">{editingId ? 'Update Advertisement Price' : 'Create Advertisement Price'}</h2><button title="Close" onClick={closeModal} className="rounded-full p-2 hover:bg-white/20"><X size={20} /></button></div><form onSubmit={handleSubmit} className="space-y-5 p-6"><label className="block text-sm font-semibold text-slate-900">Ad Size<select required value={formData.adSizeId} onChange={(e) => setFormData({ ...formData, adSizeId: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"><option value="">Select ad size</option>{sizes.map((item) => <option key={item.id} value={item.id}>{item.width} x {item.height} px</option>)}</select></label><label className="block text-sm font-semibold text-slate-900">Ad Duration<select required value={formData.adDurationId} onChange={(e) => setFormData({ ...formData, adDurationId: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"><option value="">Select ad duration</option>{durations.map((item) => <option key={item.id} value={item.id}>{item.duration ? `${item.duration} ${item.label}` : item.label}</option>)}</select></label><label className="block text-sm font-semibold text-slate-900">Price<input type="number" min="0" step="0.01" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none" /></label><label className="block text-sm font-semibold text-slate-900">Status<select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 font-normal outline-none"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label><div className="flex justify-end gap-3"><button type="button" onClick={closeModal} className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700">Cancel</button><button disabled={processing} className="rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{processing ? 'Saving...' : editingId ? 'Update Price' : 'Create Price'}</button></div></form></div></div>}
        </div>
    );
}