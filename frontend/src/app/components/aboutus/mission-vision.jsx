"use client";
import { useEffect, useState, useRef } from 'react';
import { Target, Eye, ShieldCheck, Heart, Leaf, Globe } from "lucide-react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import api from '../../utils/api';
import { translations } from '../../utils/translations.js';



export default function MissionVision() {
  const [cmsData, setCmsData] = useState([]);
  const [missionVisionData, setMissionVisionData] = useState([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const lang =
      localStorage.getItem('language') || 'en';

    setLanguage(lang);
  }, []);

  const t = translations[language];

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
            item.section === 'MissionVision'
        );
        setMissionVisionData(filtered);
        
      } catch (error) {
        console.error('Error fetching CMS content:', error);
      }
    }
    fetchContent();
  }, []);


  
  return (
    <section ref={ref} className="relative w-full py-10 lg:py-8">
      <div className="max-w-[1300px] mx-auto px-6 sm:px-10 lg:px-12">

        {/* HEADING */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16 lg:mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#2C4232]/10 text-[#2C4232] font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase shadow-sm mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"></span>
            Our Purpose
          </motion.span>
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#1A281F] leading-tight mb-6 font-['Covered_By_Your_Grace']"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
             {t.aboutUS?.missionVisson.title} <span className="font-bold text-[#3B5C43]">{t.aboutUS?.missionVisson?.highlight1} </span> {t.aboutUS?.missionVisson?.title2}
          </motion.h2>
        </motion.div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* MISSION CARD (Spans 2 columns) */}
          <motion.div 
            className="lg:col-span-2 group relative overflow-hidden rounded-[32px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col sm:flex-row min-h-[400px]"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="w-full sm:w-1/2 relative min-h-[250px] sm:min-h-full overflow-hidden">
              <Image
                src="/media/about-misson-vison.jpg"
                alt="Mission"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
            </div>
            <div className="w-full sm:w-1/2 p-8 sm:p-8 flex flex-col justify-center bg-white relative">
              <motion.div 
                className="w-14 h-14 rounded-2xl bg-[#E5F6EB] flex items-center justify-center text-[#2C4232] mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500"
                initial={{ scale: 0, rotate: -180 }}
                animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <Target size={28} />
              </motion.div>
              <motion.h3 
                className="text-3xl sm:text-4xl font-bold text-[#1A281F] mb-4"
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {t.aboutUS?.missionVisson.OurMission}
                
              </motion.h3>
              <motion.p 
                className="text-[#4A5D50] text-base sm:text-lg leading-relaxed font-light"
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {missionVisionData[0]?.text_1}

              </motion.p>
            </div>
          </motion.div>

          {/* VISION CARD */}
          <motion.div 
            className="group relative overflow-hidden rounded-[32px] bg-[#1A281F] shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-500 p-8 sm:p-8 flex flex-col justify-center min-h-[400px]"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B5C43] rounded-full blur-[80px] opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
            <div className="relative z-10">
              <motion.div 
                className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-8 backdrop-blur-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"
                initial={{ scale: 0, rotate: 180 }}
                animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 180 }}
                transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
              >
                <Eye size={28} />
              </motion.div>
              <motion.h3 
                className="text-3xl sm:text-4xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {t.aboutUS?.missionVisson.OurVision}
              </motion.h3>
              <motion.p 
                className="text-[#A2B3A8] text-base sm:text-lg leading-relaxed font-light"
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                {missionVisionData[0]?.text_2}

              </motion.p>
            </div>
          </motion.div>

          {/* VALUES CARD */}
          <motion.div 
            className="group relative overflow-hidden rounded-[32px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500 p-8 sm:p-8 flex flex-col justify-center min-h-[400px]"
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <motion.div 
              className="w-14 h-14 rounded-2xl bg-[#FFF4E5] flex items-center justify-center text-[#D97706] mb-8 group-hover:scale-110 transition-transform duration-500"
              initial={{ scale: 0, rotate: -90 }}
              animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -90 }}
              transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 200 }}
            >
              <ShieldCheck size={28} />
            </motion.div>
            <motion.h3 
              className="text-3xl sm:text-4xl font-bold text-[#1A281F] mb-6"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {t.aboutUS?.missionVisson?.OurValues}
            </motion.h3>
            <motion.p 
              className="text-[#4A5D50] text-base sm:text-lg leading-relaxed font-light"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {missionVisionData[0]?.text_3}

            </motion.p>
          </motion.div>

          {/* EXTRA IMAGE CARD (Spans 2 columns) */}
          <motion.div 
            className="lg:col-span-2 group relative overflow-hidden rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] min-h-[300px] sm:min-h-[400px]"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            <Image
              src="/media/about-tactor.jpg"
              alt="Sustainable Future"
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <motion.div 
              className="absolute bottom-8 left-8 sm:bottom-12 sm:left-12 z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <p className="text-white font-bold text-2xl sm:text-3xl tracking-tight mb-2">Preserving nature's bounty.</p>
              <p className="text-white/80 text-sm sm:text-base font-medium uppercase tracking-widest">100% Organic & Chemical-Free</p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}