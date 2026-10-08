"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaMapPin,
  FaLocationArrow,
  FaHome,
  FaGlobe
} from "react-icons/fa";
import { translations } from "../../utils/translations.js";
import api from "../../utils/api.js";

export default function Footer() {
  const [year, setYear] = useState("");
  const [language, setLanguage] = useState("en");
  const [contactInfo, setContactInfo] = useState({
    email: "staragrofvp@gmail.com",
    address:
      "Shop No 1, LA Park, Plot No. 10, Valley of flowers,Sinnar,Tal-Sinnar, Dist.Nashik 422103, Maharashtra.",
    company_address: "",
  });

  useEffect(() => {
    const lang =
      localStorage.getItem("language") || 'en';
    setLanguage(lang);
  }, []);

  const t = translations[language];


  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/general-settings");
        const data = res.data;
        setContactInfo((prev) => ({
          email: data?.company_email || prev.email,
          address: data?.address || data?.location || prev.address,
          company_address: data?.company_address || prev.company_address,
        }));
      } catch (err) {
        // keep default fallback contact info on failure
      }
    };
    fetchSettings();
  }, []);
  return (
    <footer className="bg-black text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-6 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">

            <Image src="/media/logo-cropped.svg" alt="Star Agro Logo" width={150} height={50} className="w-30 md:w-30 h-35" />

            <p className="text-slate-300">Fresh produce and organic inputs — directly from growers to you. Quality you can trust.</p>

          </div>

          <div className="grid grid-cols-2 gap-6 md:col-span-1">
            <div>
              <h4 className="text-lg font-semibold text-slate-200 mb-3">{t.QuickLinks}</h4>
              <ul className="space-y-2 text-slate-300">
                <li><a href="/contact" className="hover:text-white">{t.contact}</a></li>
                <li><a href="/terms-and-conditions" className="hover:text-white">{t.TermsConditions}</a></li>
                <li><a href="/privacy-policy" className="hover:text-white">{t.PrivacyPolicy}</a></li>
                <li><a href="/how-to-use" className="hover:text-white">{t.howtouse}</a></li>
                <li><a href="/advertisements" className="hover:text-white">{t.AllAdvertisements}</a></li>

              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-200 mb-3">{t.menu}</h4>
              <ul className="space-y-2 text-slate-300">

                <li><a href="/faq" className="hover:text-white">{t.faq}</a></li>
                <li><a href="/advertisement" className="hover:text-white">{t.advertisement}</a></li>
                <li><a href="/jobs" className="hover:text-white">{t.CareerApplyForRepresentative}</a></li>

              </ul>
            </div>
          </div>

          <div className="md:text-right">
            <h4 className="text-lg font-semibold text-slate-200 mb-3">Connect with us</h4>
            <p className="text-slate-300 mb-4">Follow for updates, events & offers</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 justify-start md:justify-end">
                <span className="shrink-0 flex items-center"><FaEnvelope /></span>
                <span className="text-slate-300 text-left md:text-right max-w-55">{contactInfo.email}</span>
              </div>
              <div className="flex items-start gap-3 justify-start md:justify-end">
                <span className="shrink-0 mt-1"><FaMapMarkerAlt className="text-slate-300" size={16} /></span>
                <span className="text-slate-300 text-left md:text-left max-w-55">
                  <span className="block text-xs font-semibold text-green-400 uppercase tracking-wide">Office</span>
                  {contactInfo.address}
                </span>
              </div>
              {contactInfo.company_address && (
                <div className="flex items-start gap-3 justify-start md:justify-end">
                  <span className="shrink-0 mt-1"><FaMapMarkerAlt className="text-slate-300" size={16} /></span>
                  <span className="text-slate-300 text-left md:text-left max-w-55">
                    <span className="block text-xs font-semibold text-green-400 uppercase tracking-wide">Works</span>
                    {contactInfo.company_address}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 text-slate-400 text-sm md:text-right">
              <p>&copy; {year || new Date().getFullYear()} Star Agro. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}