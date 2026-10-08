
'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Leaf, ArrowRight } from 'lucide-react';

import api from '../../utils/api';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function Hero() {
    const router = useRouter();
    const [cmsData, setCmsData] = useState([]);
    const [heroData, setHeroData] = useState([]);
    const heroImageSrc = heroData[0]?.image_url?.trim() || null;

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const language =
                    localStorage.getItem('language') || 'en';

                const response = await api.get(
                    `/cms/page/Home?language=${language}`
                );

                const list = Array.isArray(response.data)
                    ? response.data
                    : [];

                const filtered = list.filter(
                    item =>
                        item.section?.toLowerCase() === 'hero'
                );

                setHeroData(filtered);

            } catch (error) {
                console.error(
                    'Error fetching CMS content:',
                    error
                );
            }
        };

        fetchContent();
    }, []);


    return (
        <>
            <section className="relative w-full sm:min-h-[90vh] min-h-70 overflow-hidden flex items-center">
                {/* Background Image */}
                {heroImageSrc ? (
                    <div className="absolute inset-0">
                        <Image
                            src={resolveMediaUrl(heroImageSrc)}
                            alt="Fresh Fruits & Vegetables Processing"
                            fill
                            priority
                            unoptimized
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-gray-900/80" />
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50 z-10"></div>

                {/* Content */}
                <div className="relative z-20 flex sm:items-end items-center min-h-[65vh] sm:h-full px-5 sm:px-8 md:px-20">
                    <div className="w-full max-w-2xl text-white">
                        {/* Tag / Badge */}
                        <div className="inline-flex items-center gap-2 bg-lime-500/90 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5 sm:mb-7">

                            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white">
                                Star Agro Fruits &amp; Vegetables Processing
                            </span>
                        </div>

                        {/* Main Heading */}
                        <h1
                            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] font-bold font-['Covered_By_Your_Grace']"
                        >
                            {heroData[0]?.title && (
                                <span>{heroData[0]?.title}</span>
                            )}
                        </h1>

                        {/* Description */}
                        <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-gray-200 max-w-lg leading-relaxed">
                            {heroData[0]?.content}
                        </p>

                        {heroData[0]?.text_1 && (
                            <div className="mt-4 sm:mt-5 flex items-center gap-2 text-gray-20">
                                <h4 className="text-sm sm:text-base font-semibold tracking-wide">
                                    {heroData[0].text_1}
                                </h4>
                            </div>
                        )}

                        {/* Buttons + Leaf */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-6 sm:mt-8">

                            <button onClick={() => router.push("/contact")} className="group bg-lime-500 hover:bg-lime-600 transition-all duration-300 text-white px-4 sm:px-8 py-2 sm:py-3.5 rounded-md text-sm sm:text-base font-medium shadow-lg flex items-center gap-2">
                                Contact Us
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                        </div>
                    </div>
                </div>

                {/* Right Side Decorative Circles */}
                <div className="absolute -right-16 md:right-20 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-14 md:h-14 border border-white/30 rounded-full"></div>
                    <div className="w-6 h-6 md:w-8 md:h-8 border border-white/30 rounded-full"></div>
                    <div className="w-14 h-14 md:w-20 md:h-20 border border-lime-400/40 rounded-full"></div>
                </div>

                {/* Bottom decorative line */}
                <div className="absolute bottom-0 left-0 w-full z-20">
                    <div className="h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent"></div>
                </div>
            </section>
        </>
    );
}
