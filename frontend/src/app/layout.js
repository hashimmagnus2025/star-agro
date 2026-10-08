import "./globals.css";
import AppShell from './components/common/AppShell';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5000";
const siteName = "Star Agro";
const siteDescription =
  "Star Agro connects farmers, buyers, and agriculture businesses with fresh produce, crop services, organic farming resources, and smart farming support.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: "Star Agro FVP | Smart Farming and Agriculture Services",
    template: "%s | Star Agro",
  },
  description: siteDescription,
  keywords: [
    "Star Agro",
    "agriculture services",
    "organic farming",
    "fresh produce",
    "crop marketplace",
    "smart farming",
    "farmers in India",
  ],
  authors: [{ name: "Star Agro" }],
  creator: "Star Agro",
  publisher: "Star Agro",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/PDA.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName,
    title: "Star Agro FVP | Smart Farming and Agriculture Services",
    description: siteDescription,
    images: [
      {
        url: "/media/home-hero.jpg",
        width: 1200,
        height: 630,
        alt: "Star Agro smart farming and agriculture services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Star Agro FVP | Smart Farming and Agriculture Services",
    description: siteDescription,
    images: ["/media/home-hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="theme-color" content="#0f766e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Star Agro" />
      </head>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
