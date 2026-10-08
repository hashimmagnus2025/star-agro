"use client";
import { ArrowRight, Leaf, Sun } from "lucide-react";
import { useEffect, useState } from 'react';
import Image from "next/image";

import api from '../../utils/api';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

import { translations } from '../../utils/translations.js';
export default function AboutUsSection() {

  const [cmsData, setCmsData] = useState([]);
  const [aboutStarAgroData, setAboutStarAgroData] = useState([]);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const fetchContent = async () => {

      try {
        const language =
          localStorage.getItem('language') || 'en';
        const response = await api.get(`/cms/page/About Us?language=${language}`);
        const list = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setCmsData(list);

        const filtered = list.filter(
          item =>
            item.page === 'About Us' &&
            item.section === 'AboutStarAgro'
        );
        setAboutStarAgroData(filtered);
       
      }
      catch (error) {
        console.error('Error fetching CMS content:', error);
      }
    }
    fetchContent();
  }, [])


  useEffect(() => {
    const lang =
      localStorage.getItem('language') || 'en';

    setLanguage(lang);
  }, []);

  const t = translations[language];

  return (
    <section className="relative w-full py-10 lg:py-16  overflow-hidden">
      <div className="max-w-[1300px] mx-auto px-6 sm:px-10 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-0 lg:gap-24 ">

          {/* Left Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left z-10">
            {/* Minimalist Tag */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-[1px] bg-[#2C4232]"></div>
              <span className="text-[#2C4232] font-semibold tracking-[0.2em] uppercase text-xs sm:text-sm">
                About Star Agro
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[64px] text-[#1A281F] leading-[1.1] mb-8 font-['Covered_By_Your_Grace'] tracking-tight">
              {t.aboutUS.about.line1}{" "}
              <span className="font-bold text-[#3B5C43]">
                {t.aboutUS.about.highlight1}
              </span>
              <br />
              {t.aboutUS.about.line2}{" "}
              <span className="italic text-[#6B8E73]">
                {t.aboutUS.about.highlight2}
              </span>
            </h2>

            {/* Paragraphs */}
            {aboutStarAgroData[0]?.content && (

              <p className="text-[#4A5D50] text-lg sm:text-xl leading-relaxed mb-6 font-light max-w-lg">
                {aboutStarAgroData[0].content}

              </p>

            )}



            {/* Features (Minimalist Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 mb-12 w-full max-w-lg">
              {aboutStarAgroData[0]?.text_1 && (
                <div className="flex flex-col gap-3">
                  <Leaf className="text-[#6B8E73]" strokeWidth={1.5} size={32} />
                  <h4 className="text-[#1A281F] font-bold text-lg tracking-wide"> {t.aboutUS.about.Organic}</h4>
                  <p className="text-[#4A5D50] text-sm leading-relaxed font-light">
                    {aboutStarAgroData[0].text_1}
                  </p>
                </div>
              )}
              {aboutStarAgroData[0]?.text_2 && (
                <div className="flex flex-col gap-3">
                  <Sun className="text-[#6B8E73]" strokeWidth={1.5} size={32} />
                  <h4 className="text-[#1A281F] font-bold text-lg tracking-wide">{t.aboutUS.about.Dehydrated}</h4>
                  <p className="text-[#4A5D50] text-sm leading-relaxed font-light">
                    {aboutStarAgroData[0].text_2}
                  </p>
                </div>
              )}

            </div>


          </div>

          {/* Right Images (Arched Elegance) */}
          <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end mt-2 lg:mt-0">

            {/* Background Blob/Shape */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] bg-[#E3E8E1] rounded-full blur-[60px] sm:blur-[80px] -z-10"></div>

            {/* Main Arched Image */}
              {aboutStarAgroData[0]?.image_url && (
                <div className="relative w-full max-w-[320px] sm:max-w-[420px] aspect-[3/4] rounded-t-full rounded-b-[150px] sm:rounded-b-[200px] overflow-hidden shadow-[0_20px_50px_rgba(44,66,50,0.1)] border-[6px] sm:border-8 border-white group">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-700 z-10"></div>
                  <Image
                    src={resolveMediaUrl(aboutStarAgroData[0].image_url)}
                    alt="Fresh organic produce"
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}

            {/* Overlapping Small Circular Image */}
            {aboutStarAgroData[0]?.second_image_url && (
              <div className="absolute bottom-8 sm:bottom-12 -left-2 sm:left-4 lg:-left-12 w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.15)] border-4 border-[#F9F8F6] z-20 hover:scale-105 transition-transform duration-500">
                <Image
                  src={resolveMediaUrl(aboutStarAgroData[0].second_image_url)}
                  alt="Processing"
                  className="w-full h-full object-cover"
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}

            {/* Floating Glassmorphic Badge */}
            <div className="absolute top-12 sm:top-16 left-2 sm:left-0 lg:left-20 bg-white/70 backdrop-blur-md px-5 py-3 sm:px-6 sm:py-4 rounded-2xl shadow-xl border border-white flex items-center gap-4 z-20 hover:-translate-y-2 transition-transform duration-500">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#1A281F]">10+</p>
                <p className="text-[10px] sm:text-xs font-bold text-[#4A5D50] uppercase tracking-wider mt-1">Years<br />Expertise</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}