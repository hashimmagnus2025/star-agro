


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import api from "../utils/api.js";

const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${MEDIA_BASE_URL}${value}`;
};

export default function HowToUse() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await api.get("/how-to-use");
                setVideos(Array.isArray(response.data) ? response.data : []);
            } catch (requestError) {
                setError(requestError?.response?.data?.message || "Unable to load tutorial videos.");
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    return (
        <main className="min-h-screen bg-[#f7fbf6]">
            <section className="relative overflow-hidden bg-[#1f3d1f]">
                <div className="absolute inset-0 bg-[url('/media/about-hero.jpg')] bg-cover bg-center opacity-25" />
                <div className="absolute inset-0 bg-linear-to-b from-[#1f3d1f]/90 via-[#1f3d1f]/75 to-[#f7fbf6]" />
                <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20">
                    <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[2px] text-white/75">
                        <Link href="/" className="hover:text-white hover:underline">Home</Link>
                        <span>/</span>
                        <span>How To Use</span>
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.35em] text-[#a7d9a3]">Star Agro Help Center</p>
                    <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl md:text-5xl">How To Use Star Agro</h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 sm:text-base">Watch these quick videos to learn how to use the website.</p>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
                {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading tutorial videos...</div>
                ) : error ? (
                    <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700">{error}</div>
                ) : videos.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">No tutorial videos are available yet.</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {videos.map((item) => (
                            <article key={item.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                                <div className="px-5 pb-4 pt-5 sm:px-6">
                                    <div className="flex items-start gap-3">
                                        <PlayCircle className="mt-0.5 shrink-0 text-emerald-600" size={24} />
                                        <div>
                                            <h2 className="text-xl font-bold leading-tight text-slate-900">{item.title}</h2>
                                            {item.description && <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>}
                                        </div>
                                    </div>
                                </div>
                                <video controls preload="metadata" className="aspect-video w-full bg-slate-950" src={resolveMediaUrl(item.video_url)}>
                                    Your browser does not support video playback.
                                </video>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}