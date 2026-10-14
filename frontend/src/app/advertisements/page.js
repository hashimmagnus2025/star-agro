"use client";

import { useEffect, useState } from "react";
import api from "../utils/api.js";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

// CDN uploads (e.g. Bunny) store a full URL already; local uploads store a relative
// /uploads path that still needs the backend host prefixed.
const resolveMediaUrl = (value) => {
    if (!value) return '';
    return /^https?:\/\//i.test(value) ? value : `${IMAGE_BASE_URL}${value}`;
};

// Ad sizes are admin-configurable, so classify by the joined size record
// (type / width / height) instead of hardcoding known "WxH" strings.
const getDimensions = (ad) => {
    if (ad.size_width && ad.size_height) {
        return { width: Number(ad.size_width), height: Number(ad.size_height) };
    }
    const [w, h] = String(ad.image_size || "").split("x").map(Number);
    return { width: w || 0, height: h || 0 };
};

const getOrientation = (ad) => {
    if (ad.size_type) return ad.size_type;
    const { width, height } = getDimensions(ad);
    if (!width || !height) return "Horizontal";
    if (width === height) return "Square";
    return width > height ? "Horizontal" : "Vertical";
};

export default function AdvertisementsUI() {
    const [verticalAds, setVerticalAds] = useState([]);
    const [horizontalAds, setHorizontalAds] = useState([]);
    const [squareAds, setSquareAds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdvertisements = async () => {
            try {
                const response = await api.get("/advertisements/active");
                const ads = Array.isArray(response.data) ? response.data : [];
                setHorizontalAds(ads.filter((ad) => getOrientation(ad) === "Horizontal"));
                setVerticalAds(ads.filter((ad) => getOrientation(ad) === "Vertical"));
                setSquareAds(ads.filter((ad) => getOrientation(ad) === "Square"));
            } catch (err) {
                console.error("Error fetching advertisements:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdvertisements();
    }, []);

    const totalAds = verticalAds.length + horizontalAds.length + squareAds.length;

    // Split the vertical ads between the left and right columns so both sides fill up evenly.
    const leftVerticalAds = verticalAds.filter((_, i) => i % 2 === 0);
    const rightVerticalAds = verticalAds.filter((_, i) => i % 2 === 1);

    const AdCard = ({ ad, rounded = "rounded-2xl" }) => {
        const { width, height } = getDimensions(ad);
        return (
            <div
                className={`relative mx-auto ${rounded} overflow-hidden shadow-lg shadow-gray-200 border border-white bg-gray-100`}
                style={
                    width && height
                        ? { width: `${width}px`, height: `${height}px` }
                        : { width: "100%" }
                }
            >
                {ad.type === 'video' ? (
                    <video
                        src={resolveMediaUrl(ad.image)}
                        className="h-full w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                ) : (
                    <img
                        src={resolveMediaUrl(ad.image)}
                        alt={ad.title}
                        className="h-full w-full object-cover"
                    />
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-3 sm:px-6">
            <div className="max-w-400 mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">All Advertisements</h1>
                <p className="text-gray-500 mb-8">
                    {loading ? "Loading..." : `${totalAds} active advertisement${totalAds === 1 ? "" : "s"}`}
                </p>

                {!loading && totalAds === 0 && (
                    <div className="text-center py-20 text-gray-400">No active advertisements found.</div>
                )}

                {!loading && totalAds > 0 && (
                    <div
                        className={`grid grid-cols-1 gap-6 ${leftVerticalAds.length > 0 && rightVerticalAds.length > 0
                            ? "lg:grid-cols-[235px_1fr_235px]"
                            : leftVerticalAds.length > 0
                                ? "lg:grid-cols-[235px_1fr]"
                                : rightVerticalAds.length > 0
                                    ? "lg:grid-cols-[1fr_235px]"
                                    : ""
                            }`}
                    >
                        {leftVerticalAds.length > 0 && (
                            <div className="flex flex-col gap-4">
                                {leftVerticalAds.map((ad) => (
                                    <AdCard key={ad.id} ad={ad} />
                                ))}
                            </div>
                        )}

                        <div
                            className={`flex flex-col gap-6 ${leftVerticalAds.length === 0 && rightVerticalAds.length === 0
                                ? "w-full max-w-3xl"
                                : ""
                                }`}
                        >
                            {horizontalAds.map((ad) => (
                                <AdCard key={ad.id} ad={ad} rounded="rounded-3xl" />
                            ))}

                            {squareAds.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {squareAds.map((ad) => (
                                        <AdCard key={ad.id} ad={ad} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {rightVerticalAds.length > 0 && (
                            <div className="flex flex-col gap-4">
                                {rightVerticalAds.map((ad) => (
                                    <AdCard key={ad.id} ad={ad} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
