

"use client";

import { useEffect, useState } from "react";
import { Edit2, Plus, Trash2, X, Video } from "lucide-react";
import Swal from "sweetalert2";
import api from "../../../utils/api";

const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${MEDIA_BASE_URL}${value}`;
};

const emptyForm = { title: "", description: "", video: null };

export default function AdminHowToUse() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [existingVideo, setExistingVideo] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get("/how-to-use");
            setItems(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            await Swal.fire({
                icon: "error",
                title: "Unable to load videos",
                text: err?.response?.data?.message || "Failed to load how-to videos",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const resetForm = () => {
        setForm(emptyForm);
        setExistingVideo("");
        setEditingId(null);
    };

    const openCreate = () => { resetForm(); setError(""); setShowModal(true); };
    const openEdit = (item) => {
        setForm({ title: item.title || "", description: item.description || "", video: null });
        setExistingVideo(item.video_url || "");
        setEditingId(item.id);
        setError("");
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); resetForm(); };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!form.title.trim() || (!editingId && !form.video)) {
            await Swal.fire({
                icon: "warning",
                title: "Missing details",
                text: editingId ? "Title is required" : "Title and video are required",
            });
            return;
        }

        const data = new FormData();
        data.append("title", form.title.trim());
        data.append("description", form.description);
        if (form.video) data.append("video", form.video);

        try {
            setSaving(true);
            setError("");
            if (editingId) await api.put(`/how-to-use/${editingId}`, data);
            else await api.post("/how-to-use", data);
            await fetchItems();
            closeModal();
            await Swal.fire({
                icon: "success",
                title: editingId ? "Video updated" : "Video uploaded",
                text: editingId ? "The tutorial video was updated successfully." : "The tutorial video was uploaded successfully.",
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (err) {
            await Swal.fire({
                icon: "error",
                title: "Upload failed",
                text: err?.response?.data?.message || "Failed to save how-to video",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmation = await Swal.fire({
            icon: "warning",
            title: "Delete this video?",
            text: "This tutorial video will be permanently deleted.",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc2626",
        });
        if (!confirmation.isConfirmed) return;

        try {
            await api.delete(`/how-to-use/${id}`);
            setItems((previous) => previous.filter((item) => item.id !== id));
            await Swal.fire({
                icon: "success",
                title: "Deleted",
                text: "The tutorial video was deleted successfully.",
                timer: 1600,
                showConfirmButton: false,
            });
        } catch (err) {
            await Swal.fire({
                icon: "error",
                title: "Delete failed",
                text: err?.response?.data?.message || "Failed to delete how-to video",
            });
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">How To Use</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">Manage tutorial videos</h1>
                    <p className="mt-2 text-sm text-slate-600">Upload videos that explain how to use the Star Agro website.</p>
                </div>
                <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-emerald-700 px-5 py-3 font-semibold text-white shadow-lg hover:shadow-xl"><Plus size={18} /> Add Video</button>
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                {loading ? <p className="text-sm text-slate-500">Loading videos...</p> : items.length === 0 ? <p className="text-sm text-slate-500">No tutorial videos found.</p> : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((item) => (
                            <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200">
                                <video controls preload="metadata" className="aspect-video w-full bg-slate-900" src={resolveMediaUrl(item.video_url)} />
                                <div className="p-4">
                                    <h2 className="font-semibold text-slate-900">{item.title}</h2>
                                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.description || "No description provided."}</p>
                                    <div className="mt-4 flex gap-2">
                                        <button type="button" onClick={() => openEdit(item)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"><Edit2 size={15} /> Edit</button>
                                        <button type="button" onClick={() => handleDelete(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={15} /> Delete</button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between bg-emerald-700 px-6 py-4 text-white">
                        <h2 className="text-lg font-semibold">{editingId ? "Update Tutorial Video" : "Add Tutorial Video"}</h2>
                        <button type="button" onClick={closeModal} aria-label="Close"><X size={22} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4 p-6">
                        <div><label className="mb-2 block text-sm font-semibold text-slate-900">Video title</label><input name="title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className="w-full rounded-xl border border-slate-300 px-4 py-3" placeholder="How to add a product" /></div>
                        <div><label className="mb-2 block text-sm font-semibold text-slate-900">Description</label><textarea name="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" className="w-full rounded-xl border border-slate-300 px-4 py-3" /></div>
                        <div><label className="mb-2 block text-sm font-semibold text-slate-900">Video {editingId && <span className="font-normal text-slate-500">(optional when editing)</span>}</label><input type="file" accept="video/*" onChange={(event) => setForm({ ...form, video: event.target.files?.[0] || null })} required={!editingId} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" /></div>
                        {existingVideo && <div><p className="mb-2 text-sm font-semibold text-slate-900">Current video</p><video controls className="aspect-video w-full rounded-xl bg-slate-900" src={resolveMediaUrl(existingVideo)} /></div>}
                        {form.video && <p className="flex items-center gap-2 text-sm text-emerald-700"><Video size={16} /> {form.video.name}</p>}
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button type="submit" disabled={saving} className="w-full rounded-xl bg-linear-to-r from-emerald-600 to-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : editingId ? "Update Video" : "Upload Video"}</button>
                    </form>
                </div>
            </div>}
        </div>
    );
}