"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../utils/api.js";

const CMS_PAGE_KEY = "Terms & Conditions";

export default function TermsAndConditions() {
  const [cmsData, setCmsData] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.get(`/cms/page/${encodeURIComponent(CMS_PAGE_KEY)}`);
        const entries = Array.isArray(response.data) ? response.data : [];
        const title = entries.map((entry) => entry.title).filter(Boolean)[0] || "";
        const subtitle = entries.map((entry) => entry.subtitle).filter(Boolean)[0] || "";
        const html = entries
          .map((entry) => entry.content)
          .filter(Boolean)
          .join("");
        setCmsData({ title, subtitle, html });
      } catch (err) {
        console.error("Error fetching Terms & Conditions content:", err);
        setCmsData({ title: "", subtitle: "", html: "" });
      }
    };
    fetchContent();
  }, []);

  const cmsHtml = cmsData?.html || "";

  return (
    <>
      <section className="relative w-full h-56 overflow-hidden ">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/media/about-hero.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-black/45"></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5">
          <div className="flex items-center gap-2 text-white/80 uppercase tracking-[2px] text-[11px] font-semibold">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <span>/</span>
            <span>home/terms-and-conditions</span>
          </div>
          <h1 className="text-white text-4xl md:text-5xl font-bold mt-3">Terms & Conditions</h1>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {cmsData === null ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : cmsHtml ? (
          <div className="space-y-4 ">
            {cmsData.title && (
              <h2 className="text-2xl font-bold text-slate-900 text-center">{cmsData.title}</h2>
            )}
            {cmsData.subtitle && (
              <p className="text-base font-semibold text-emerald-700 text-center">{cmsData.subtitle}</p>
            )}
            <div
              className="prose-sm max-w-none space-y-4 text-sm leading-7 text-slate-700 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-emerald-600 [&_a]:underline [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: cmsHtml }}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500">No content has been added yet.</p>
        )}
      </main>
    </>
  );
}
