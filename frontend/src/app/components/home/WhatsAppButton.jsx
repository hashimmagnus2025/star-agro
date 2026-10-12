'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FaWhatsapp } from 'react-icons/fa';
import { Plus, X } from 'lucide-react';

const WHATSAPP_PHONE = '917517513960';
const IMAGE_BASE_URL = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '').replace(/\/+$/, '');

export default function WhatsAppButton() {
    const [isOpen, setIsOpen] = useState(false);
    const actionsRef = useRef(null);
    const message = encodeURIComponent('Hello Star Agro, I would like to know more.');

    useEffect(() => {
        const handlePointerDown = (event) => {
            if (!actionsRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div ref={actionsRef} className="fixed bottom-6 right-5 z-40">
            <div
                id="floating-contact-actions"
                aria-hidden={!isOpen}
                className={`absolute bottom-full right-0 mb-3 flex flex-col items-end gap-3 transition-all duration-300 ${
                    isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
                }`}
            >
                <a
                    href={`https://wa.me/${WHATSAPP_PHONE}?text=${message}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with Star Agro on WhatsApp"
                    title="Chat with us on WhatsApp"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-full text-sm font-semibold text-slate-800 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
                >
                    
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white">
                        <FaWhatsapp aria-hidden="true" className="h-6 w-6" />
                    </span>
                </a>
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        window.dispatchEvent(new Event('star-agro-install-request'));
                    }}
                    aria-label="Install Star Agro app"
                    title="Install Star Agro app"
                    tabIndex={isOpen ? 0 : -1}
                    className="flex items-center gap-3 rounded-full text-sm font-semibold text-slate-800 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                >
                    
                    <span className="flex h-12 w-12 items-center justify-center rounded-full">
                        <Image
                            src={IMAGE_BASE_URL ? `${IMAGE_BASE_URL}/PDA.svg` : '/PDA.svg'}
                            alt=""
                            width={36}
                            height={36}
                            className="h-12 w-12 object-contain rounded-full"
                        />
                    </span>
                </button>
            </div>
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
                aria-expanded={isOpen}
                aria-controls="floating-contact-actions"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
            >
                {isOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Plus aria-hidden="true" className="h-7 w-7" />}
            </button>
        </div>
    );
}