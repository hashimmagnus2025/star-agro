"use client";
import Link from "next/link";
import { Tractor, Store, Users, Briefcase, Landmark, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import api from '../utils/api';
import { translations } from '../utils/translations.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

export default function Services() {


  const [cmsData, setCmsData] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const language =
          localStorage.getItem('language') || 'en';

        const response = await api.get(
          `/cms/page/Services?language=${language}`
        );

        const list = Array.isArray(response.data)
          ? response.data
          : [];

        setServicesData(list);
      } catch (error) {
        console.error(
          'Error fetching CMS content:',
          error
        );
      }
    };

    fetchContent();
  }, []);

  useEffect(() => {
    const fetchAdvertisements = async () => {
      try {
        const response = await api.get('/advertisements/active');
        const ads = Array.isArray(response.data) ? response.data : [];
        setAdvertisements(ads.filter((ad) => ad.image_size === '1175x235'));
      } catch (error) {
        console.error('Error fetching advertisements:', error);
      }
    };

    fetchAdvertisements();
  }, []);

  useEffect(() => {
    const language =
      localStorage.getItem('language') || 'en';
    setLanguage(language);
  }, []);

  const t = translations[language];

  return (
    <>
      <section className="relative w-full h-[220px] overflow-hidden ">

        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/media/about-hero.jpg')",
          }}
        ></div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/45"></div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-white/80 uppercase tracking-[2px] text-[11px] font-semibold">

            <Link href="/" className="hover:underline">
              {t.home}

            </Link>

            <span>/</span>

            <span>{t.servicespage?.maintitle}</span>

          </div>

          {/* Title */}
          <h1 className="text-white text-4xl md:text-5xl font-bold mt-3">
            {t.servicespage?.maintitle}

          </h1>

        </div>
      </section>

      {advertisements.length > 0 && (
        <section className="w-full bg-[#f4fff4] px-4 pt-8 sm:px-6 lg:pt-12">
          <div className="mx-auto w-full max-w-[1175px] overflow-hidden rounded-2xl shadow-lg shadow-emerald-950/10">
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              loop={advertisements.length > 1}
              className="aspect-[1175/235] w-full"
            >
              {advertisements.map((ad) => (
                <SwiperSlide key={ad.id}>
                  <img
                    src={resolveMediaUrl(ad.image)}
                    alt={ad.title || 'Advertisement'}
                    className="h-full w-full object-cover"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* Bento Grid Services Section */}
      <section ref={ref} className="w-full py-16 bg-[#f4fff4] ">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">

          <motion.div
            className="text-center max-w-3xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              {t.servicespage?.title} <span className="text-green-600">{t.servicespage?.highlight1}</span>
            </motion.h2>
            <motion.p
              className="text-slate-500 text-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {t.servicespage?.description}

            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(220px,auto)] gap-6">

            {/* Card 1: Wide */}
            {servicesData[0]?.text_1 && (
              <motion.div
                className="md:col-span-2 bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-8 hover:-translate-y-1 transition-transform duration-300"
                initial={{ opacity: 0, x: -50 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.div
                  className="w-20 h-20 shrink-0 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <Tractor size={40} strokeWidth={1.5} />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3"> {t.servicespage?.AgriculturalResources}</h3>
                  <p className="text-slate-500 text-base leading-relaxed">{servicesData[0]?.text_1}</p>
                </div>
              </motion.div>
            )}


            {/* Card 2: Square */}
            {servicesData[0]?.text_2 && (
              <motion.div
                className="md:col-span-1 bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-[16px] bg-blue-50 text-blue-600 flex items-center justify-center mb-6"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 90 }}
                  transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Store size={28} strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3"> {t.servicespage?.Marketplace}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{servicesData[0]?.text_2}</p>
              </motion.div>
            )}


            {/* Card 3: Tall Accent */}
            {servicesData[0]?.text_3 && (
              <motion.div
                className="md:col-span-1 md:row-span-2 bg-green-600 p-8 sm:p-10 rounded-[32px] shadow-[0_20px_40px_rgba(22,163,74,0.3)] flex flex-col items-start text-white hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                <motion.div
                  className="w-16 h-16 rounded-[16px] bg-white/20 text-white flex items-center justify-center mb-8 backdrop-blur-sm relative z-10"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  <Users size={32} strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 relative z-10">{t.servicespage?.CommunityBuilding}</h3>
                <p className="text-green-50 text-base leading-relaxed relative z-10">{servicesData[0]?.text_3}</p>
                <div className="mt-auto pt-8 relative z-10 w-full flex justify-end">

                </div>
              </motion.div>
            )}


            {/* Card 4: Square */}
            {servicesData[0]?.text_4 && (
              <motion.div
                className="md:col-span-1 bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-[16px] bg-orange-50 text-orange-600 flex items-center justify-center mb-6"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
                  transition={{ duration: 0.6, delay: 0.7, type: "spring", stiffness: 200 }}
                >
                  <Briefcase size={28} strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t.servicespage?.BusinessSupport}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{servicesData[0]?.text_4}</p>
              </motion.div>
            )}


            {/* Card 5: Square */}
            {servicesData[0]?.text_5 && (
              <motion.div
                className="md:col-span-1 bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <motion.div
                  className="w-14 h-14 rounded-[16px] bg-purple-50 text-purple-600 flex items-center justify-center mb-6"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 90 }}
                  transition={{ duration: 0.6, delay: 0.8, type: "spring", stiffness: 200 }}
                >
                  <Landmark size={28} strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{t.servicespage?.GovernmentSchemes}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{servicesData[0]?.text_5}</p>
              </motion.div>
            )}


            {/* Card 6: Wide Dark */}
            {servicesData[0]?.text_6 && (
              <motion.div
                className="md:col-span-2 bg-slate-900 p-8 sm:p-10 rounded-[32px] shadow-[0_20px_40px_rgba(15,23,42,0.3)] flex flex-col sm:flex-row items-start sm:items-center gap-8 text-white hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
                initial={{ opacity: 0, x: 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.7, delay: 0.8 }}
              >
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-slate-900 to-slate-900"></div>
                <motion.div
                  className="w-16 h-16 shrink-0 rounded-2xl bg-white/10 text-white flex items-center justify-center relative z-10 backdrop-blur-sm"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                  transition={{ duration: 0.6, delay: 0.9, type: "spring", stiffness: 200 }}
                >
                  <Sparkles size={32} strokeWidth={1.5} />
                </motion.div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-3">{t.servicespage?.OtherServices}</h3>
                  <p className="text-slate-300 text-base leading-relaxed">{servicesData[0]?.text_6}</p>
                </div>
              </motion.div>
            )}


          </div>
        </div>
      </section>

    </>
  )
}