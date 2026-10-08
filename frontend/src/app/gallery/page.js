"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { translations } from "../utils/translations.js";
import api from "../utils/api.js";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function Gallery() {
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState("all");
    const [language, setLanguage] = useState("en");
    const [loading, setLoading] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setLanguage(localStorage.getItem("language") || "en");
        const fetchGallery = async () => {
            try {
                const response = await api.get("/gallery");
                setItems(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error fetching gallery:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);

    const t = translations[language] || translations.en;
    const groupedTabs = items.reduce((groups, item) => {
        const title = item.title?.trim();
        if (!title) return groups;
        if (!groups[title]) groups[title] = [];
        groups[title].push(item);
        return groups;
    }, {});
    const tabs = [{ key: "all", label: "ALL GALLERY", items }, ...Object.entries(groupedTabs).map(([label, groupedItems]) => ({ key: label, label, items: groupedItems }))];
    const currentTab = tabs.find((tab) => tab.key === activeTab) || tabs[0];

    const handleTabChange = (key) => {
        if (key === activeTab) return;
        setIsAnimating(true);
        setActiveTab(key);
        window.setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <main className="bg-[#f4fff4]">
            <section className="relative h-56 w-full overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/media/about-hero.jpg')" }} />
                <div className="absolute inset-0 bg-black/45" />
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[2px] text-white/80"><Link href="/" className="hover:underline">{t.home}</Link><span>/</span><span>{t.gallery}</span></div>
                    <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">{t.gallery}</h1>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-14">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex w-full flex-wrap items-center justify-center gap-2 px-1 py-2">
                        {tabs.map((tab) => <button key={tab.key} type="button" onClick={() => handleTabChange(tab.key)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition duration-200 sm:text-sm ${activeTab === tab.key ? "border-transparent bg-linear-to-r from-lime-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700"}`}>{tab.label}</button>)}
                    </div>
                    <div className="w-full text-center"><p className="text-sm uppercase tracking-[3px] text-slate-500">{t.gallery}</p><h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">Explore our latest events and product displays</h2></div>
                </div>

                {loading ? <p className="mt-10 text-center text-sm text-slate-500">Loading gallery...</p> : currentTab.items.length === 0 ? <p className="mt-10 text-center text-sm text-slate-500">No gallery items available.</p> : (
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {currentTab.items.map((item, index) => <div key={item.id} className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-500 ${isAnimating ? "translate-y-8 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100 hover:-translate-y-1 hover:shadow-xl"}`} style={{ transitionDelay: `${index * 50}ms` }}>
                            <div className="relative h-72 overflow-hidden">
                                <img src={resolveMediaUrl(item.image)} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-emerald-500/90 opacity-0 [clip-path:polygon(0_0,0_0,0_100%,0_100%)] transition duration-700 ease-out group-hover:opacity-100 group-hover:[clip-path:polygon(0_0,100%_0,72%_100%,0_100%)]" />
                                <div className="absolute inset-0 flex flex-col justify-between p-5 text-white opacity-0 transition-all duration-500 group-hover:opacity-100">
                                    <div className="max-w-[80%] -translate-x-5 transition-transform duration-500 group-hover:translate-x-0">
                                        <h3 className="text-2xl font-bold leading-tight drop-shadow-sm">{item.title}</h3>
                                        {item.description && <p className="mt-2 line-clamp-2 text-sm text-white/90">{item.description}</p>}
                                    </div>
                                    <div className="flex h-10 w-10 translate-y-5 items-center justify-center rounded-full bg-slate-900/80 transition-transform duration-500 group-hover:translate-y-0" aria-hidden="true">
                                        <Link2 size={19} />
                                    </div>
                                </div>
                            </div>

                        </div>)}
                    </div>
                )}
            </section>
        </main>
    );
}
