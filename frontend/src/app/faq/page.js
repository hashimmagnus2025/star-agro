"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, Search } from 'lucide-react';
import api from '../utils/api.js';

const DEFAULT_TYPES = ['General FAQs', 'Farmer FAQs', 'Products FAQs', 'Inquiry and Payment FAQs'];

export default function FaqPage() {
    const [faqs, setFaqs] = useState([]);
    const [activeType, setActiveType] = useState('All');
    const [openIndex, setOpenIndex] = useState(0);
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const syncLanguage = () => {
            const savedLanguage = localStorage.getItem('language') || 'en';
            setLanguage(savedLanguage);
        };

        syncLanguage();
        window.addEventListener('storage', syncLanguage);

        return () => {
            window.removeEventListener('storage', syncLanguage);
        };
    }, []);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                setLoading(true);
                const currentLanguage = localStorage.getItem('language') || 'en';
                setLanguage(currentLanguage);
                const response = await api.get(`/faq?language=${currentLanguage}`);
                const data = Array.isArray(response.data) ? response.data : [];
                setFaqs(data);
            } catch (error) {
                console.error('Error fetching FAQs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, [language]);

    const tabOptions = useMemo(() => ['All', ...Array.from(
        new Set([
            ...DEFAULT_TYPES,
            ...faqs
                .map((faq) => faq.type)
                .filter(Boolean)
                .filter((type) => type && !DEFAULT_TYPES.includes(type)),
        ])
    )], [faqs]);

    const getText = (faq, field) => {
        if (field === 'question') {
            const questionKey = language === 'hi'
                ? 'question_Hindi'
                : language === 'mr'
                    ? 'question_Marathi'
                    : 'question_english';
            return faq[questionKey] || faq.question_english || '';
        }

        const answerKey = language === 'hi'
            ? 'answer_Hindi'
            : language === 'mr'
                ? 'answer_Marathi'
                : 'answer_english';
        return faq[answerKey] || faq.answer_english || '';
    };

    const visibleFaqs = faqs
        .filter((faq) => activeType === 'All' || (faq.type || 'General FAQs') === activeType)
        .filter((faq) => {
            if (!search.trim()) return true;
            const q = getText(faq, 'question').toLowerCase();
            const a = getText(faq, 'answer').toLowerCase();
            return q.includes(search.toLowerCase()) || a.includes(search.toLowerCase());
        });

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="min-h-screen bg-[#f7fbf6]">
            {/* Hero */}
            <div className="relative overflow-hidden bg-[#1f3d1f]">
                <Image
                    src="/media/about-hero.jpg"
                    alt=""
                    fill
                    priority
                    className="object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1f3d1f]/80 via-[#1f3d1f]/70 to-[#f7fbf6]" />
                <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#a7d9a3]">Help Center</p>
                    <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
                        Frequently Asked Questions
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 sm:text-base">
                        Everything you need to know about our products, farmer support, inquiries and payments — all in one place.
                    </p>

                    {/* Search */}
                    <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white px-5 py-3 shadow-lg">
                        <Search size={18} className="shrink-0 text-[#4CAF50]" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search your question..."
                            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto mt-6 max-w-5xl px-4 pb-16 sm:-mt-8 sm:px-6 lg:px-8">
                <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
                    {/* Tabs */}
                    <div className="-mx-5 mb-6 overflow-x-auto px-5 pt-1 sm:mx-0 sm:overflow-visible sm:px-0">
                        <div className="flex w-max min-w-full flex-nowrap justify-start gap-2 sm:w-auto sm:flex-wrap sm:justify-center sm:gap-3">
                            {tabOptions.map((type) => {
                                const isActive = activeType === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setActiveType(type);
                                            setOpenIndex(0);
                                        }}
                                        className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition sm:text-sm ${isActive
                                                ? 'border-[#4CAF50] bg-[#4CAF50] text-white shadow-sm'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#4CAF50]/50 hover:text-[#4CAF50]'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                            Loading FAQs...
                        </div>
                    ) : visibleFaqs.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                            No FAQs found. Try a different search or category.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {visibleFaqs.map((faq, index) => {
                                const question = getText(faq, 'question');
                                const answer = getText(faq, 'answer');
                                const isOpen = openIndex === index;

                                return (
                                    <div
                                        key={faq.id || `${activeType}-${index}`}
                                        className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${isOpen ? 'border-[#4CAF50] shadow-md' : 'border-slate-100 shadow-sm hover:shadow-md'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => toggleFaq(index)}
                                            className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left"
                                        >
                                            <span className="text-sm font-semibold text-[#1f1f1f] sm:text-base">
                                                {question || 'FAQ'}
                                            </span>
                                            <span
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'rotate-180 bg-[#4CAF50] text-white' : 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                                            </span>
                                        </button>

                                        <div
                                            className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                                }`}
                                        >
                                            <div className="overflow-hidden">
                                                <p className="whitespace-pre-line border-t border-slate-100 px-5 py-3 text-sm leading-7 text-slate-600">
                                                    {answer || 'No answer available.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Contact CTA */}
                <div className="mt-8 rounded-2xl bg-[#eaf6ea] p-6 text-center sm:p-8">
                    <p className="text-base font-semibold text-[#1f3d1f]">Still have a question?</p>
                    <p className="mt-1 text-sm text-slate-600">
                        Can&apos;t find the answer you&apos;re looking for? Reach out and our team will help.
                    </p>
                    <a
                        href="/contact"
                        className="mt-4 inline-block rounded-full bg-[#4CAF50] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#409244]"
                    >
                        Contact Us
                    </a>
                </div>
            </div>
        </section>
    );
}
