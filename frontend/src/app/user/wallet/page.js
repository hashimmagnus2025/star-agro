"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Wallet } from 'lucide-react';
import api from '../../utils/api.js';
import {translations} from '../../utils/translations.js';
export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ amount: '' });

const [language, setLanguage] = useState('en'); // Default language
useEffect(() => {
  const lang = localStorage.getItem('language');
  if (lang) {
    setLanguage(lang);
  }
}, []);

const t = translations[language] || translations.en; // Fallback to English if translation not found

  const fetchWalletSummary = async () => {
    try {
      setLoading(true); 
      const response = await api.get('/wallet/summary');
      setBalance(response?.data?.balance || 0);
      setTransactions(Array.isArray(response?.data?.transactions) ? response.data.transactions : []);
    } catch (err) {
      console.error('Failed to load wallet summary', err);
      setError(err?.response?.data?.message || 'Failed to load wallet summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletSummary();

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openCreateModal = () => {
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleRecharge = async (e) => {
    e.preventDefault();
    const amount = Number(formData.amount);

    if (!amount || amount <= 0) {
      setError('Please enter a valid recharge amount');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');


      const orderResponse = await api.post('/wallet/create-order', { amount });
      const order = orderResponse?.data?.order;

      if (!order?.id) {
        throw new Error('Unable to create payment order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xAK5yuk7ejZvD3',
        amount: order.amount,
        currency: order.currency,
        name: 'Star Agro',
        description: 'Wallet Recharge',
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/wallet/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount,
              points: Math.round(amount),
            });
            setSuccess(`Recharge successful. You earned ${Math.round(amount)} points.`);
            setShowModal(false);
            setFormData({ amount: '' });
            await fetchWalletSummary();
          } catch (verifyErr) {
            setError(verifyErr?.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: 'User',
          email: '',
        },
        theme: {
          color: '#059669',
        },
      };

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK is not loaded');
      }
    } catch (err) {
      console.error('Recharge failed', err);
      setError(err?.response?.data?.message || err.message || 'Recharge failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-600">{t?.userPanel?.wallet.wallet}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{t?.userPanel?.wallet.wallet}</h1>
         
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition"
        >
          <Plus size={20} />
          {t?.userPanel?.wallet.recharge}

        </button>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-600 p-3 text-white">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-sm text-emerald-700">{t?.userPanel?.wallet.Currentpointsbalance}</p>
            <p className="text-2xl font-bold text-emerald-800">{loading ? '...' : balance}</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="rounded-3xl bg-white p-4 sm:p-8 shadow-sm overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{t?.userPanel?.wallet.RecentRechargeHistory}</h2>
        </div>

        {loading ? (
          <div className="py-6 text-center text-sm text-slate-500">Loading wallet history...</div>
        ) : transactions.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">No recharge history yet.</div>
        ) : (
          <table className="w-full min-w-full sm:min-w-[720px] border-collapse text-sm table-auto">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-50 text-left text-slate-900">
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold">{t?.Amount}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold">{t?.Points}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold">{t?.Status}</th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold">{t?.date}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                  <td className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-slate-900">₹{Number(txn.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-700">{Number(txn.points || 0).toFixed(0)}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-700 capitalize">{txn.payment_status}</td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-slate-600">{txn.created_at ? new Date(txn.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recharge Wallet</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRecharge}>
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 sm:text-sm"
                />
                <p className="mt-2 text-xs text-slate-500">You will receive {formData.amount ? Math.round(Number(formData.amount)) : 0} points</p>
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-3xl border border-slate-300 px-8 py-3 text-slate-900 font-semibold hover:bg-slate-100 transition sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50 sm:w-auto"
                >
                  <Plus size={20} />
                  {submitting ? 'Processing...' : 'Recharge Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}