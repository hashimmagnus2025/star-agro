"use client";

import { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import api from "../../utils/api";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function AdminGalleryPage() {
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({ title: "", description: "", image: [] });
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [existingImage, setExistingImage] = useState("");
    const [selectedImagePreviews, setSelectedImagePreviews] = useState([]);

    const fetchGallery = async () => {
        try {
            setLoading(true);
            const response = await api.get("/gallery");
            setItems(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fetch gallery items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGallery(); }, []);

    useEffect(() => {
        const previewUrls = formData.image.map((image) => URL.createObjectURL(image));
        setSelectedImagePreviews(previewUrls);
        return () => previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    }, [formData.image]);

    const resetForm = () => {
        setFormData({ title: "", description: "", image: [] });
        setExistingImage("");
    };
    const openCreate = () => { resetForm(); setEditingId(null); setError(""); setShowModal(true); };
    const openEdit = (item) => {
        setFormData({ title: item.title || "", description: item.description || "", image: [] });
        setExistingImage(item.image || "");
        setEditingId(item.id);
        setError("");
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditingId(null); resetForm(); };

    const handleChange = (event) => {
        const { name, value, files } = event.target;
        setFormData((previous) => ({ ...previous, [name]: name === "image" ? Array.from(files || []) : value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!formData.title.trim() || (!editingId && !formData.image.length)) {
            setError(editingId ? "Title is required" : "Title and at least one image are required");
            return;
        }

        const data = new FormData();
        data.append("title", formData.title.trim());
        data.append("description", formData.description);
        formData.image.forEach((image) => data.append("image", image));

        try {
            setSubmitting(true);
            setError("");
            if (editingId) await api.put(`/gallery/${editingId}`, data);
            else await api.post("/gallery", data);
            await fetchGallery();
            closeModal();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to save gallery item");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this gallery item?")) return;
        try {
            await api.delete(`/gallery/${id}`);
            await fetchGallery();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete gallery item");
        }
    };

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">Administration</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">Gallery</h1>
                    <p className="mt-2 text-sm text-slate-600">Create event or product gallery sections and manage their images.</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl"><Plus size={18} /> Add Gallery Item</button>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                {loading ? <p className="text-sm text-slate-500">Loading gallery...</p> : items.length === 0 ? <p className="text-sm text-slate-500">No gallery items found.</p> : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200">
                                {item.image && <img src={resolveMediaUrl(item.image)} alt={item.title} className="h-48 w-full object-cover" />}
                                <div className="p-4">
                                    <h2 className="font-semibold text-slate-900">{item.title}</h2>
                                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.description || "No description provided."}</p>
                                    <div className="mt-4 flex gap-2">
                                        <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"><Edit2 size={15} /> Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={15} /> Delete</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-auto max-h-[90vh]">
                    <div className="flex items-center justify-between rounded-t-3xl bg-emerald-700 px-6 py-4 text-white">
                        <h2 className="text-lg font-semibold">{editingId ? "Update Gallery Item" : "Create Gallery Item"}</h2>
                        <button type="button" onClick={closeModal} aria-label="Close"><X size={22} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4 p-6">
                        <div><label className="mb-2 block text-sm font-semibold text-slate-900">Gallery label</label><input name="title" value={formData.title} onChange={handleChange} required className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="NASHIK AGRICULTURE FESTIVAL - 2024" /></div>
                        <div><label className="mb-2 block text-sm font-semibold text-slate-900">Description</label><textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full rounded-xl border border-slate-300 px-4 py-3" /></div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-900">Images {editingId && <span className="font-normal text-slate-500">(optional when editing)</span>}</label>
                            <input type="file" name="image" accept="image/*" multiple={!editingId} onChange={handleChange} required={!editingId} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />
                   
                            {(existingImage || selectedImagePreviews.length > 0) && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {existingImage && <div><img src={resolveMediaUrl(existingImage)} alt="Current gallery" className="h-28 w-full rounded-xl border border-slate-200 object-cover" /><p className="mt-1 text-center text-xs text-slate-500">Current image</p></div>}
                                {selectedImagePreviews.map((previewUrl, index) => <div key={previewUrl}><img src={previewUrl} alt={`Selected gallery ${index + 1}`} className="h-28 w-full rounded-xl border border-emerald-300 object-cover" /><p className="mt-1 text-center text-xs text-emerald-600">Selected image</p></div>)}
                            </div>}
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? "Saving..." : editingId ? "Update Gallery Item" : "Create Gallery Item"}</button>
                    </form>
                </div>
            </div>}
        </div>
    );
}
