"use client";
import { useState, useEffect } from 'react';
import {
  FaCoins,
  FaSeedling,
  FaInbox,
  FaGift,
} from 'react-icons/fa';
import api from '../utils/api.js';
import { translations } from '../utils/translations.js';

export default function UserPage() {

  const [language, setLanguage] = useState('en');
  const [products, setProducts] = useState([]);
  const [inquiryCounts, setInquiryCounts] = useState({});
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [favoriteLoading, setFavoriteLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    const walletRecharge = async () => {
      try {
        setWalletLoading(true);
        const response = await api.get('/wallet/summary');
        setBalance(response?.data?.balance || 0);
        setTransactions(Array.isArray(response?.data?.transactions) ? response.data.transactions : []);
      } catch (err) {
        console.error('Failed to load wallet summary', err);
        setError(err?.response?.data?.message || 'Failed to load wallet summary');
      } finally {
        setWalletLoading(false);
      }
    };

    walletRecharge();
  }, []);

  const fetchFavoriteProducts = async () => {
    try {
      setFavoriteLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setFavoriteProducts([]);
        return;
      }
      const response = await api.get('/favorites');
      setFavoriteProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load favorite products', err);
      setFavoriteProducts([]);
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);
        const response = await api.get('/products/my-products');
        const normalizedProducts = Array.isArray(response.data) ? response.data : [];
        setProducts(normalizedProducts);

        const counts = await Promise.all(
          normalizedProducts.map(async (product) => {
            try {
              const inquiryResponse = await api.get(`/product-inquiries/product/${product.id}`);
              const inquiries = Array.isArray(inquiryResponse.data) ? inquiryResponse.data : [];
              return [product.id, inquiries.length];
            } catch (error) {
              console.error('Error fetching inquiry count for product', product.id, error);
              return [product.id, 0];
            }
          })
        );

        setInquiryCounts(Object.fromEntries(counts));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
    fetchFavoriteProducts();
  }, []);

  const getProductLabel = (product) => {
    if (!product) return '';

    return language === 'hi'
      ? product.name_hindi || product.name
      : language === 'mr'
        ? product.name_marathi || product.name
        : product.name;
  };

  const totalProducts = products.length;

  const totalInquiries = Object.values(inquiryCounts).reduce((sum, count) => sum + count, 0);
  const productsWithInquiries = Object.values(inquiryCounts).filter((count) => count > 0).length;
  const topProduct = products.reduce((best, product) => {
    if (!best) return product;
    const bestCount = inquiryCounts[best.id] ?? 0;
    const currentCount = inquiryCounts[product.id] ?? 0;
    return currentCount > bestCount ? product : best;
  }, null);

  const t = translations[language];

  return (
    <div className="space-y-6">
      {/* <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Overview</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">
              {t?.userPanel.ProductInquiryOverview || 'Product inquiry overview'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {t?.userPanel.ProductInquiryDescription || 'See how many inquiries your products have received and which products are most requested.'}
            </p>
          </div>
          <div className="rounded-3xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            Live analytics active
          </div>
        </div>
      </section> */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {t?.userPanel.WalletBalance || 'Wallet Balance'}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600 shadow-sm">
                  <FaCoins size={28} />
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {walletLoading ? '...' : balance}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div> */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {t?.userPanel.TotalCrops || 'Total Crops'}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600 shadow-sm">
                  <FaSeedling size={28} />
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {dashboardLoading ? '...' : totalProducts}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {t?.userPanel.Inquiries || 'Total inquiries'}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600 shadow-sm">
                  <FaInbox size={28} />
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {dashboardLoading ? '...' : totalInquiries}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-md hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {t?.userPanel.RefferralPoints || 'Products with inquiries'}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600 shadow-sm">
                  <FaGift size={28} />
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    200
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>


      </section>

      {/* <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">User engagement</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Monthly signup trend</h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Stable
            </span>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-sm text-slate-700">New farmer onboarding</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" />
              </div>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4">
              <p className="text-sm text-slate-700">Order completion rate</p>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-teal-500 to-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Quick actions</p>
          <div className="mt-6 grid gap-3">
            <button className="rounded-3xl bg-emerald-600 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-emerald-700">
              Review pending requests
            </button>
            <button className="rounded-3xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Update pricing plans
            </button>
            <button className="rounded-3xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              Export activity report
            </button>
          </div>
        </div>
      </section> */}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">{t?.product} {t.inquiry}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{t?.Myproductsandinquirycounts}</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-3 pr-6">{t?.product || 'Product'}</th>
                <th className="py-3 pr-6">{t?.price || 'Price'}</th>
                <th className="py-3 pr-6">{t?.inquiry || 'Inquiries'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="py-4 pr-6 font-semibold text-slate-900">{getProductLabel(product)}</td>
                  <td className="py-4 pr-6 text-slate-600">₹{Number(product.price || 0).toFixed(2)}</td>
                  <td className="py-4 pr-6 text-slate-600">{inquiryCounts[product.id] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">{t?.Favoriteproducts}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{t?.Productsyouhavefavorited}</h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            {favoriteLoading ? 'Loading...' : `${favoriteProducts.length} favorites`}
          </span>
        </div>

        {favoriteLoading ? (
          <div className="p-8 text-center text-slate-500">Loading favorite products...</div>
        ) : favoriteProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">You have not favorited any products yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 pr-6">{t?.product} </th>
                  <th className="py-3 pr-6">{t?.price}</th>
                  <th className="py-3 pr-6">{t?.userPanel.myProduct.category}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {favoriteProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="py-4 pr-6 font-semibold text-slate-900">{getProductLabel(product)}</td>
                    <td className="py-4 pr-6 text-slate-600">₹{Number(product.price || 0).toFixed(2)}</td>
                    <td className="py-4 pr-6 text-slate-600">{product.category_name || product.category || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
