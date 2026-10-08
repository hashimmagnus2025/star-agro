import RegisterForm from './RegisterForm';
import { translations } from '../utils/translations.js';

const ogLocaleMap = { en: "en_IN", hi: "hi_IN", mr: "mr_IN" };

export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const langParam = Array.isArray(params?.lang) ? params.lang[0] : params?.lang;
    const lang = translations[langParam] ? langParam : 'en';
    const seo = translations[lang]?.seo || translations.en.seo;

    const refParam = Array.isArray(params?.ref) ? params.ref[0] : params?.ref;
    const canonicalPath = refParam
        ? `/register?ref=${encodeURIComponent(refParam)}&lang=${lang}`
        : `/register?lang=${lang}`;

    return {
        title: seo.registerTitle,
        description: seo.registerDescription,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            type: "website",
            locale: ogLocaleMap[lang] || "en_IN",
            url: canonicalPath,
            siteName: "Star Agro",
            title: seo.registerTitle,
            description: seo.registerDescription,
            images: [
                {
                    url: "/media/home-hero.jpg",
                    width: 1200,
                    height: 630,
                    alt: seo.registerTitle,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: seo.registerTitle,
            description: seo.registerDescription,
            images: ["/media/home-hero.jpg"],
        },
    };
}

export default function RegisterPage() {
    return <RegisterForm />;
}
