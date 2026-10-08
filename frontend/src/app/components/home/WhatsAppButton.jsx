'use client';

import Image from 'next/image';
import { FaWhatsapp } from 'react-icons/fa';

const WHATSAPP_PHONE = '917517513960';
const IMAGE_BASE_URL = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '').replace(/\/+$/, '');

export default function WhatsAppButton() {
    const message = encodeURIComponent('Hello Star Agro, I would like to know more.');

    return (
        <div className="fixed bottom-6 right-5 z-40 flex items-center gap-3">
            <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('star-agro-install-request'))}
                aria-label="Install Star Agro app"
                title="Install Star Agro app"
                className="flex h-14 w-14 animate-pulse items-center justify-center shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
            >
                <Image
                    src={IMAGE_BASE_URL ? `${IMAGE_BASE_URL}/PDA.svg` : '/PDA.svg'}
                    alt=""
                    width={36}
                    height={36}
                    className="h-14 w-14 object-contain"
                />
            </button>
            <a
                href={`https://wa.me/${WHATSAPP_PHONE}?text=${message}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Star Agro on WhatsApp"
                title="Chat with us on WhatsApp"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1ebe5d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
            >
                <FaWhatsapp aria-hidden="true" className="h-7 w-7" />
            </a>
        </div>
    );
}