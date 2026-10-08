"use client";


import Image from "next/image";
import { useEffect, useState } from 'react';
import {
    ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from '../../utils/api';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};



export default function FAQAbout() {
    const [active, setActive] = useState(0);
    const [faq, setFaq] = useState([]);
    const [cmsData, setCmsData] = useState([]);
    const [faqData, setFaqData] = useState([]);
    const [language, setLanguage] = useState('en');
    const router = useRouter();

    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') || 'en';
        setLanguage(savedLanguage);
    }, []);


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
            } catch (error) {
                console.error('Error fetching FAQs:', error);
            }
        };

        fetchFaqs();
    }, [language]);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const currentLanguage = localStorage.getItem('language') || 'en';
                setLanguage(currentLanguage);
                const response = await api.get(`/cms/page/About Us?language=${currentLanguage}`);

                const list = Array.isArray(response.data?.data)
                    ? response.data.data
                    : Array.isArray(response.data)
                        ? response.data
                        : [];
                setCmsData(list);

                const filtered = list.filter(
                    item =>
                        item.page === 'About Us' &&
                        item.section === 'FAQ'
                );
                setFaqData(filtered);

            } catch (error) {
                console.error('Error fetching CMS content:', error);
            }
        }
        fetchContent();
    }, []);

    const toggleFAQ = (index) => {
        setActive(active === index ? null : index);
    };

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
        <>
            <section className="w-full  py-8 sm:py-10 md:py-14 lg:py-16 px-4 sm:px-6 md:px-8 lg:px-16 overflow-hidden">

                <div className="max-w-7xl mx-auto">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                        {/* LEFT SIDE */}
                        <div className="relative">

                            {/* IMAGE */}
                            <div className="overflow-hidden rounded-[32px] shadow-[0_25px_70px_rgba(15,23,42,0.12)]">

                                {faqData[0]?.image_url ? (
                                    <Image
                                        src={resolveMediaUrl(faqData[0].image_url)}
                                        alt="Star Agro Premium Quality Produce FAQ"
                                        width={1200}
                                        height={800}
                                        className="w-full h-[300px] sm:h-[420px] md:h-[520px] lg:h-[620px] object-cover hover:scale-105 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-[300px] sm:h-[420px] md:h-[520px] lg:h-[620px] bg-gray-200" />
                                )}

                            </div>

                            {/* FLOATING BOX */}
                            <div className="sm:block hidden absolute bottom-4 left-4 sm:bottom-5 sm:left-5 md:bottom-8 md:left-8 bg-white/95 backdrop-blur-xl rounded-[30px] p-5 sm:p-6 md:p-8 max-w-[300px] shadow-2xl border border-white/40">

                                <span className="text-[#4CAF50] text-xs sm:text-sm font-bold tracking-[2px] uppercase">
                                    Star Agro
                                </span>
                                {faqData[0]?.text_1 && (

                                    <h3 className="text-2xl sm:text-3xl md:text-3xl font-extrabold text-[#111] mt-3 leading-tight">
                                        {faqData[0]?.text_1}

                                    </h3>
                                )}

                                {faqData[0]?.text_2 && (

                                    <p className="text-gray-500 leading-7 mt-4 text-xs sm:text-sm md:text-base">
                                        {faqData[0]?.text_2}

                                    </p>
                                )}

                            </div>

                        </div>

                        {/* RIGHT SIDE */}
                        <div>



                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold text-[#111] leading-tight mt-6">
                                {faqData[0]?.title}

                            </h2>

                            <p className="text-gray-500 text-sm sm:text-base md:text-lg leading-8 mt-3 max-w-2xl">
                                {faqData[0]?.subtitle}

                            </p>

                            {/* FAQ LIST */}
                            <div className="mt-6 space-y-5">

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
                                        <div
                                            key={faqItem.id || `${faqItem.type || 'General FAQs'}-${index}`}
                                            className={`rounded-[28px] overflow-hidden transition-all duration-500 border ${active === index
                                                ? "bg-[#111] border-[#111] shadow-2xl"
                                                : "bg-white border-[#ececec]"
                                                }`}
                                        >

                                            {/* QUESTION */}
                                            <button
                                                onClick={() => toggleFAQ(index)}
                                                className="w-full flex flex-row items-start sm:items-center justify-between gap-4 sm:gap-5 text-left p-4 sm:p-5 md:p-3"
                                            >

                                                <div className="flex items-start gap-4 sm:gap-5 w-full">

                                                    {/* NUMBER */}
                                                    <div
                                                        className={`min-w-[50px] h-[50px] rounded-2xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${active === index
                                                            ? "bg-[#4CAF50] text-white"
                                                            : "bg-[#f5f5f5] text-[#111]"
                                                            }`}
                                                    >
                                                        0{index + 1}
                                                    </div>

                                                    {/* TITLE */}
                                                    <h3
                                                        className={`text-sm sm:text-lg md:text-xl font-bold leading-5 sm:leading-8 md:leading-8  transition-all duration-300 ${active === index
                                                            ? "text-white"
                                                            : "text-[#111]"
                                                            }`}
                                                    >
                                                        {faqItem[questionKey] || faqItem.question_english || 'FAQ'}
                                                    </h3>

                                                </div>

                                                {/* ICON */}
                                                <div
                                                    className={`min-w-[45px] h-[45px] rounded-full flex items-center justify-center transition-all duration-300 ${active === index
                                                        ? "bg-white text-[#111]"
                                                        : "bg-[#f5f5f5] text-[#111]"
                                                        }`}
                                                >

                                                    <ChevronDown
                                                        size={22}
                                                        className={`transition-all duration-500 ${active === index
                                                            ? "rotate-180"
                                                            : ""
                                                            }`}
                                                    />

                                                </div>

                                            </button>

                                            {/* ANSWER */}
                                            <div
                                                className={`transition-all duration-500 ease-in-out overflow-hidden ${active === index
                                                    ? "max-h-[320px] opacity-100"
                                                    : "max-h-0 opacity-0"
                                                    }`}
                                            >

                                                <div className="px-5 sm:px-6 md:px-8 pb-6 ">

                                                    <p className="text-white/80 leading-8  text-sm sm:text-base md:text-base">
                                                        {faqItem[answerKey] || faqItem.answer_english || ''}
                                                    </p>

                                                </div>

                                            </div>

                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={() => router.push('/faq')}
                                    className="mt-4 inline-flex items-center justify-center rounded-full bg-[#4CAF50] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#409244]"
                                >
                                    Read More
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            </section>
        </>
    );
}