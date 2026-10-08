"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <>
      <section className="relative w-full h-[220px] overflow-hidden">

        {/* Background Image */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/media/about-hero.jpg')",
          }}
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        ></motion.div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/45"></div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5">

          {/* Breadcrumb */}
          <motion.div
            className="flex items-center gap-2 text-white/80 uppercase tracking-[2px] text-[11px] font-semibold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >

            <Link href="/" className="hover:underline">
              Home
            </Link>

            <span>/</span>

            <span>About</span>

          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-white text-4xl md:text-5xl font-bold mt-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
          >
            About
          </motion.h1>

        </div>
      </section>
    </>
  );
}
