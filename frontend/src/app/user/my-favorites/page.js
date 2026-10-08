'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import api from '../../utils/api.js';
import { translations } from '../../utils/translations.js';

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

const QUANTITY_UNIT_LABELS = {
  kg: 'Kg/किलो',
  Crates: 'Crates',
  Bags: 'Bags/बॅग्स',
  boxes: 'Boxes/बॉक्स',
  Qunital: 'Qunital/क्विंटल',
  Ton: 'Ton/टन',
  bandles: 'bandles/बंडल्स',
  Dozen: 'Dozen/डझन',
  grams: 'Grams/ग्रॅम',
  liter: 'Liter/लिटर',
  'Mili Liter': 'Mili Liter/मिली लिटर',
  Nos: 'Nos/नग',
};

const getImageUrl = (value) => {
  if (!value || typeof value !== 'string' || !value.trim()) return '';
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${IMAGE_BASE_URL || ''}${normalizedPath}`;
};

export default function MyFavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [language, setLanguage] = useState('en');

  // Same fallback order as My Products: product's own image first, then its
  // sub-category image, then its category image.
  const getProductDisplayImageUrl = (product) => {
    const productImage = getImageUrl(product?.image_url);
    if (productImage) return productImage;

    const subCategory = subCategories.find((sub) => Number(sub.id) === Number(product?.sub_category_id));
    const subCategoryImage = getImageUrl(subCategory?.image);
    if (subCategoryImage) return subCategoryImage;

    const category = categories.find((cat) => Number(cat.id) === Number(product?.category_id));
    return getImageUrl(category?.image_url);
  };

  useEffect(() => {
    const lang = localStorage.getItem('language') || 'en';
    setLanguage(lang);
  }, []);

  const t = translations[language];

  const getDisplayName = (product) => {
    if (language === 'hi' && product?.name_hindi) return product.name_hindi;
    if (language === 'mr' && product?.name_marathi) return product.name_marathi;
    return product?.name || '';
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const res = await api.get('/favorites');
        setFavorites(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Unable to load favorites');
      } finally {
        setLoading(false);
      }
    };
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    const fetchSubCategories = async () => {
      try {
        const res = await api.get('/sub-categories');
        setSubCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching sub-categories:', err);
      }
    };
    fetchFavorites();
    fetchCategories();
    fetchSubCategories();
  }, []);

  const handleRemoveFavorite = async (productId) => {
    try {
      setRemovingId(productId);
      await api.post(`/favorites/${productId}`);
      setFavorites((prev) => prev.filter((product) => product.id !== productId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="p-4 sm:p-6 lg:p-2">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Favorites</h1>
          <p className="text-sm text-slate-500 mt-1">Products you've marked as favorite</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-slate-500">{t?.loading || 'Loading...'}</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-4">You haven't favorited any products yet</p>
            <Link   
              href="/crops"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favorites.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <Link href={`/crops/${product.id}`} className="block">
                  <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-slate-100 relative">
                    {getProductDisplayImageUrl(product) ? (
                      <img
                        src={getProductDisplayImageUrl(product)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        {t?.noImage || 'No image'}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">
                    {getDisplayName(product)}
                  </h3>
                  <p className="text-emerald-600 font-bold text-base">
                    ₹{parseFloat(product.price || 0).toFixed(2)}
                    {product.quantity_unit && (
                      <span className="text-xs font-medium text-slate-500">
                        {' '}/ {QUANTITY_UNIT_LABELS[product.quantity_unit] || product.quantity_unit}
                      </span>
                    )}
                  </p>
                </Link>

                <button
                  onClick={() => handleRemoveFavorite(product.id)}
                  disabled={removingId === product.id}
                  className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 transition py-2 text-xs font-medium ${removingId === product.id ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                >
                  <Heart size={14} fill="currentColor" />
                  Remove from Favorites
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
