'use client';
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from 'react';

import api from '../../utils/api';
import Reveal from '../common/Reveal';


export default function AboutUsSection() {


  const [cmsData, setCmsData] = useState([]);
  const [aboutStarAgroData, setAboutStarAgroData] = useState([]);


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
            item.section === 'AboutStarAgro'
        );
        setAboutStarAgroData(filtered);

      }
      catch (error) {
        console.error("Error fetching CMS content:", error);
      }

    }
    fetchContent();
  }, []);



  return (
    <section className="w-full  py-6 sm:py-8  px-4 sm:px-6 md:px-8 lg:px-10 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">

          {/* LEFT CONTENT */}
          <Reveal direction="left">

            <span className="inline-flex items-center gap-2 bg-white px-3 sm:px-4 py-1.5 sm:px-2 rounded-full shadow-sm border border-gray-100">
              <span className="w-2 h-2 bg-[#4CAF50] rounded-full"></span>


              <span className="text-xs font-semibold tracking-[2px] uppercase text-[#4CAF50]">
                About Star Agro
              </span>
            </span>

            {aboutStarAgroData[0]?.title && (
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#111] leading-[1.3] mt-3 sm:mt-4">
                {aboutStarAgroData[0].title}

              </h2>
            )}

            {aboutStarAgroData[0]?.content && (
              <p className="text-gray-600 text-sm md:text-base leading-[1.6] mt-3 sm:mt-4 max-w-none">
                {aboutStarAgroData[0].content}

              </p>
            )}


            {/* Features */}
            <div className="space-y-3 md:space-y-4 mt-5 sm:mt-6">

              <Reveal direction="up" delay={0.1} className="flex items-start gap-2 md:gap-3">

                <div className="min-w-[40px] md:min-w-[48px] h-[40px] md:h-[48px] rounded-lg md:rounded-xl bg-white shadow-md flex items-center justify-center flex-shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#4CAF50]"></div>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-bold text-[#111]">
                    Premium Quality
                  </h3>
                  {aboutStarAgroData[0]?.text_1 && (
                    <p className="text-gray-500 text-sm leading-[1.5] mt-1.5">
                      {aboutStarAgroData[0].text_1}

                    </p>
                  )}

                </div>
              </Reveal>

              <Reveal direction="up" delay={0.2} className="flex items-start gap-2 md:gap-3">

                <div className="min-w-[40px] md:min-w-[48px] h-[40px] md:h-[48px] rounded-lg md:rounded-xl bg-white shadow-md flex items-center justify-center flex-shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-orange-400"></div>
                </div>

                <div>
                  <h3 className="text-base md:text-lg font-bold text-[#111]">
                    Farmer Empowerment
                  </h3>
                  {aboutStarAgroData[0]?.text_2 && (

                    <p className="text-gray-500 text-sm leading-[1.5] mt-1.5">
                      {aboutStarAgroData[0].text_2}

                    </p>
                  )}

                </div>
              </Reveal>

            </div>

          </Reveal>

          {/* RIGHT IMAGES */}
          <Reveal direction="right" className="relative mt-6 md:mt-0">

            {/* Main Image */}
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl h-[250px] sm:h-[300px] md:h-[350px]">
              <Image
                src="/media/home-AboutStarAgro.jpg"
                alt="Farmer"
                fill
                className="object-cover hover:scale-105 transition-all duration-500"
              />
            </div>

            {/* Floating Small Image */}
            <Reveal direction="scale" delay={0.3} className=" absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 md:-bottom-5 md:-left-5 hidden md:block overflow-hidden rounded-xl md:rounded-2xl border-4 md:border-6 border-[#f3f5ef] shadow-lg w-[120px] sm:w-[140px] md:w-[160px] h-[120px] sm:h-[140px] md:h-[160px]">
              <Image
                src="/media/home-organicfarm2.webp"
                alt="Vegetables"
                fill
                className="object-cover"
              />
            </Reveal>

            {/* Floating Stats Card */}
            <Reveal direction="scale" delay={0.45} className="hidden sm:block absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 bg-white rounded-lg md:rounded-xl px-3 sm:px-4 md:px-5 py-3 sm:py-4 md:py-5 shadow-md">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111]">
                500+
              </h3>

              <p className="text-gray-500 mt-1.5 text-xs sm:text-sm leading-[1.4]">
                Farmers connected with our sustainable agricultural ecosystem.
              </p>

            </Reveal>

          </Reveal>

        </div>

      </div>
    </section>
  );
}