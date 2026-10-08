'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Tractor, Apple } from 'lucide-react';
import api from '../../utils/api';
import Reveal from '../common/Reveal';


export default function OrganicFarmSection() {


    const [cmsData, setCmsData] = useState([]);
    const [ourIntroductionsData, setOurIntroductionsData] = useState([]);

    useEffect(() => {
        const fetchContent = async () => {
            try {

                const language =
                    localStorage.getItem('language') || 'en';

                const response = await api.get(`/cms/page/Home?language=${language}`);

                const list = Array.isArray(response.data?.data)
                    ? response.data.data
                    : Array.isArray(response.data)
                        ? response.data
                        : [];
                setCmsData(list);

                const filtered = list.filter(
                    item =>
                        item.page?.toLowerCase() === 'home' &&
                        item.section === 'OurIntroductions'
                );
                setOurIntroductionsData(filtered);

            } catch (error) {
                console.error('Error fetching CMS content:', error);
            }
        }
        fetchContent();
    }, []);



    return (
        <>
            <section className="w-full  py-14 sm:py-16 px-4 md:px-10 lg:px-20 overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

                    {/* LEFT SIDE IMAGES */}
                    <Reveal direction="left" className="relative flex justify-center lg:justify-start">

                        {/* Main Circle Image */}
                        <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] lg:w-[420px] lg:h-[420px] rounded-full overflow-hidden">
                            <Image
                                src="/media/home-organicfarm.webp"
                                alt="Farm"
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Small Circle Image */}
                        <Reveal direction="scale" delay={0.25} className="hidden sm:block absolute bottom-[-10px] left-[-30px] w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] lg:w-[180px] lg:h-[180px] rounded-full overflow-hidden border-[6px] lg:border-[8px] border-[#f7f7f7] shadow-xl">
                            <Image
                                src="/media/home-organicfarm2.webp"
                                alt="Fruits"
                                fill
                                className="object-cover"
                            />
                        </Reveal>

                    </Reveal>

                    {/* RIGHT SIDE CONTENT */}
                    <Reveal direction="right">

                        {/* Small Heading */}
                        <p
                            className="text-[#d4a017] text-sm sm:text-base mb-2"
                            style={{
                                fontFamily: '"Comic Sans MS", cursive',
                            }}
                        >
                            Our Introductions
                        </p>
                        {/* Main Heading */}
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight font-bold text-[#222]">
                            {ourIntroductionsData[0]?.title}

                        </h2>

                        {/* Green Text */}
                        <p className="text-[#4CAF50] text-lg sm:text-xl lg:text-2xl font-semibold mt-4 lg:mt-6">
                            {
                                ourIntroductionsData[0]?.subtitle && (
                                    ourIntroductionsData[0]?.subtitle
                                )
                            }

                        </p>

                        {ourIntroductionsData[0]?.content && (
                            <p className="text-gray-500 leading-7 mt-4 lg:mt-6 max-w-xl text-sm sm:text-base">
                                {ourIntroductionsData[0]?.content}
                            </p>
                        )}


                        {/* Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 mt-8">

                            {/* Feature 1 */}
                            <Reveal direction="up" delay={0} className="flex items-center gap-3">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#8BC34A] flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>

                                <div>
                                    {ourIntroductionsData[0]?.text_1 && (
                                        <h4 className="text-lg sm:text-xl font-bold text-[#222] leading-6">
                                            {ourIntroductionsData[0]?.text_1}
                                        </h4>
                                    )}

                                </div>
                            </Reveal>

                            {/* Feature 2 */}
                            <Reveal direction="up" delay={0.08} className="flex items-center gap-3">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#8BC34A] flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>

                                <div>
                                    {ourIntroductionsData[0]?.text_2 && (
                                        <h4 className="text-lg sm:text-xl font-bold text-[#222] leading-6">
                                            {ourIntroductionsData[0]?.text_2}
                                        </h4>
                                    )}
                                </div>
                            </Reveal>

                            {/* Feature 3 */}
                            <Reveal direction="up" delay={0.16} className="flex items-center gap-3">
                               <div className="w-3.5 h-3.5 rounded-full bg-[#8BC34A] flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
 
                                <div>
                                    {ourIntroductionsData[0]?.text_3 && (
                                        <h4 className="text-lg sm:text-xl font-bold text-[#222] leading-6">
                                            {ourIntroductionsData[0]?.text_3}
                                        </h4>
                                    )}
                                </div>
                            </Reveal>
                            {/* Feature 4 */}
                            <Reveal direction="up" delay={0.24} className="flex items-center gap-3">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#8BC34A] flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>

                                <div>
                                    {ourIntroductionsData[0]?.text_4 && (
                                        <h4 className="text-lg sm:text-xl font-bold text-[#222] leading-6">
                                            {ourIntroductionsData[0]?.text_4}
                                        </h4>
                                    )}
                                </div>
                            </Reveal>
                            {/* Feature 5 */}
                            <Reveal direction="up" delay={0.32} className="flex items-center gap-3">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#8BC34A] flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>

                                <div>
                                    {ourIntroductionsData[0]?.text_5 && (
                                        <h4 className="text-lg sm:text-xl font-bold text-[#222] leading-6">
                                            {ourIntroductionsData[0]?.text_5}
                                        </h4>
                                    )}
                                </div>
                            </Reveal>
                            {/* Feature 6 */}
                            <Reveal direction="up" delay={0.4} className="flex items-center gap-3">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#8BC34A] flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>

                                <div>
                                    {ourIntroductionsData[0]?.text_6 && (
                                        <h4 className="text-lg sm:text-xl font-bold text-[#222] leading-6">
                                            {ourIntroductionsData[0]?.text_6}
                                        </h4>
                                    )}
                                </div>
                            </Reveal>

                        </div>


                    </Reveal>
                </div>
            </section>
        </>
    )
}