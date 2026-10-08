"use client";
import Image from "next/image";
import { useEffect, useState } from 'react';

import { Plus, Minus } from "lucide-react";
import api from '../../utils/api';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};
import { useRouter } from "next/navigation";
import Reveal from '../common/Reveal';
export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);
    const [faq, setFaq] = useState([]);
    const [language, setLanguage] = useState('en');

    const [cmsData, setCmsData] = useState([]);
    const [faqData, setFaqData] = useState([]);
    const faqImageSrc = faqData[0]?.image_url?.trim() || null;
    const router = useRouter();
    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') || 'en';
        setLanguage(savedLanguage);
    }, []);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const currentLanguage = localStorage.getItem('language') || 'en';
                setLanguage(currentLanguage);
                const response = await api.get(`/faq?language=${currentLanguage}`);
                setFaq(Array.isArray(response.data) ? response.data : []);
                console.log('Fetched FAQs:', response.data);
            } catch (error) {
                console.error('Error fetching FAQs:', error);
            }
        }

        fetchFaqs();
    }, [language]);


    useEffect(() => {

        const fetchContent = async () => {
            try {
                const currentLanguage = localStorage.getItem('language') || 'en';
                setLanguage(currentLanguage);
                const response = await api.get(`/cms/page/Home?language=${currentLanguage}`);
                const list = Array.isArray(response.data?.data)
                    ? response.data.data
                    : Array.isArray(response.data)
                        ? response.data
                        : [];
                setCmsData(list);

                const filtered = list.filter(
                    item =>
                        item.page?.toLowerCase() === 'home' &&
                        item.section === 'FAQ'
                );
                setFaqData(filtered);
            }
            catch (error) {
                console.error('Error fetching CMS content:', error);
            }

        }
        fetchContent();
    }, [])

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Show only one FAQ per category on the homepage.
    const displayFaqs = Object.values(
        faq
            .filter((faqItem) => (faqItem.status || 'active').toLowerCase() === 'active')
            .reduce((acc, faqItem) => {
                const categoryKey = faqItem.type || 'General FAQs';
                if (!acc[categoryKey]) acc[categoryKey] = faqItem;
                return acc;
            }, {})
    );

    return (
        <section className="w-full  py-6 sm:py-14 px-4 md:px-8 lg:px-12 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left Side */}
                    <Reveal direction="left">

                        {faqData[0]?.title && (

                            <h2 className="text-3xl md:text-4xl font-bold text-[#1f1f1f] leading-tight mb-4">
                                {faqData[0].title}

                            </h2>
                        )}

                        {faqData[0]?.subtitle && (
                            <p className="text-gray-600 text-base leading-relaxed mb-6">
                                {faqData[0].subtitle}

                            </p>
                        )
                        }


                        {/* Image */}
                        <div className="mt-8 relative h-[220px] sm:h-[260px] md:h-[320px] rounded-2xl overflow-hidden shadow-lg">
                            {faqImageSrc ? (
                                <Image
                                    src={resolveMediaUrl(faqImageSrc)}
                                    alt="Vegetables"
                                    fill
                                    priority
                                    unoptimized
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-100" />
                            )}
                        </div>
                    </Reveal>

                    {/* Right Side FAQ */}
                    <div className="space-y-4 mt-0 sm:mt-40">
                        {displayFaqs.map((faqItem, index) => {
                            const questionKey = language === 'hi'
                                ? 'question_Hindi'
                                : language === 'mr'
                                    ? 'question_Marathi'
                                    : 'question_english';
                            const answerKey = language === 'hi'
                                ? 'answer_Hindi'
                                : language === 'mr'
                                    ? 'answer_Marathi'
                                    : 'answer_english';

                            return (
                                <Reveal
                                    key={faqItem.id || index}
                                    direction="up"
                                    delay={index * 0.1}
                                    className={`bg-white border rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md ${openIndex === index
                                        ? "border-[#4CAF50] shadow-md"
                                        : "border-gray-100"
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleFAQ(index)}
                                        className="w-full flex items-center justify-between text-left px-5 py-5"
                                    >
                                        <h3 className="text-lg font-semibold text-[#222] pr-4">
                                            {faqItem[questionKey] || faqItem.question_english}
                                        </h3>

                                        <div
                                            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full transition-all duration-300 ${openIndex === index
                                                ? "bg-[#4CAF50] text-white rotate-180"
                                                : "bg-gray-100 text-[#222]"
                                                }`}
                                        >
                                            {openIndex === index ? (
                                                <Minus size={18} />
                                            ) : (
                                                <Plus size={18} />
                                            )}

                                        </div>
                                    </button>

                                    <div
                                        className={`grid transition-all duration-300 ease-in-out ${openIndex === index
                                            ? "grid-rows-[1fr] opacity-100"
                                            : "grid-rows-[0fr] opacity-0"
                                            }`}
                                    >
                                        <div className="overflow-hidden">
                                            <p className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                                                {faqItem[answerKey] || faqItem.answer_english}
                                            </p>
                                        </div>
                                    </div>
                                </Reveal>
                            );
                        })}

                        <Reveal direction="up" delay={displayFaqs.length * 0.1}>
                            <button
                                onClick={() => router.push("/faq")}

                                className="group bg-lime-500 hover:bg-lime-600 transition-all duration-300 text-white px-4 sm:px-8 py-2 sm:py-3.5 rounded-md text-sm sm:text-base font-medium shadow-lg flex items-center gap-2">
                                Read More
                            </button>
                        </Reveal>
                    </div>

                </div>

            </div>
        </section>
    );
}