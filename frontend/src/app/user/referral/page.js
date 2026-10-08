'use client';
import { useState, useEffect } from 'react';
import { Users, Star, Copy, Share2 } from 'lucide-react';
import Swal from 'sweetalert2';
import api, { setAuthToken } from '../../utils/api';
import { translations } from '../../utils/translations.js';

export default function ReferralPage() {
    const [user, setUser] = useState(null);
    const [referrals, setReferrals] = useState([]);
    const [totalReferrals, setTotalReferrals] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const lang = localStorage.getItem('language');
        if (lang) setLanguage(lang);
    }, []);

    const t = translations[language]?.userPanel?.Referral || translations.en.userPanel.Referral;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) setAuthToken(token);

        const load = async () => {
            try {
                const [userRes, referralRes] = await Promise.all([
                    api.get('/user/me'),
                    api.get('/referral/my-referrals'),
                ]);
                setUser(userRes.data.user);
                setReferrals(referralRes.data.referrals || []);
                setTotalReferrals(referralRes.data.totalReferrals || 0);
                setTotalPoints(referralRes.data.totalPoints || 0);
            } catch (err) {
                console.error('Failed to load referrals', err);
                setError('Unable to load referral data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const referralLink = user?.referral_code
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${encodeURIComponent(user.referral_code)}&lang=${language}`
        : '';

    const handleCopy = async () => {
        if (!user?.referral_code) return;
        setBusy(true);
        try {
            await navigator.clipboard.writeText(user.referral_code);
            Swal.fire({ icon: 'success', title: 'Copied', text: t.copied, timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Failed', text: 'Unable to copy referral code' });
        } finally {
            setBusy(false);
        }
    };

    const handleShare = async () => {
        if (!user?.referral_code) return;
        setBusy(true);
        const shareText = `${t.shareText} ${user.referral_code}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: t.shareTitle, text: `${shareText}\n${referralLink}`, url: referralLink });
            } else {
                await navigator.clipboard.writeText(referralLink);
                Swal.fire({ icon: 'success', title: 'Copied', text: t.linkCopied, timer: 1500, showConfirmButton: false });
            }
        } catch (err) {
            if (err?.name !== 'AbortError') {
                Swal.fire({ icon: 'error', title: 'Failed', text: 'Unable to share referral invite' });
            }
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
                <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
                    <p className="text-slate-600">Loading your referrals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 sm:p-4 md:p-8">
            <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-4 sm:p-8 text-white shadow-xl mb-6">
                <h1 className="text-2xl sm:text-4xl font-bold">Referral Program</h1>
                <p className="mt-2 text-green-100 max-w-2xl">
                    Invite your friends to join Star Agro. When they register with your code, you both benefit and you earn reward points.
                </p>

                <div className="mt-6 rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-green-100/80">Your Referral Code</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <p className="text-xl font-bold">{user?.referral_code || 'Generating...'}</p>
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={busy || !user?.referral_code}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-2 text-sm font-semibold transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Copy size={16} />
                            Copy
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            disabled={busy || !user?.referral_code}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Share2 size={16} />
                            Share
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-3xl bg-rose-50 border border-rose-200 p-4 text-rose-700 shadow-sm">
                    {error}
                </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 mb-6">
                <div className="rounded-3xl bg-white p-6 shadow-lg flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Users size={26} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Referrals</p>
                        <p className="text-2xl font-bold text-slate-900">{totalReferrals}</p>
                    </div>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-lg flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                        <Star size={26} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Points Earned from Referrals</p>
                        <p className="text-2xl font-bold text-slate-900">{totalPoints}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl bg-white p-4 sm:p-8 shadow-lg">
                <h2 className="text-xl font-bold mb-6">People You've Referred</h2>

                {referrals.length === 0 ? (
                    <p className="text-slate-500">You haven't referred anyone yet. Share your code to start earning points!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="py-3 pr-4 font-semibold">Name</th>
                                    <th className="py-3 pr-4 font-semibold">Email</th>
                                    <th className="py-3 pr-4 font-semibold">Points Earned</th>
                                    <th className="py-3 pr-4 font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {referrals.map((r) => (
                                    <tr key={r.id} className="border-b border-slate-100">
                                        <td className="py-3 pr-4 font-medium text-slate-900">{r.referred_name || 'N/A'}</td>
                                        <td className="py-3 pr-4 text-slate-600">{r.referred_email || 'N/A'}</td>
                                        <td className="py-3 pr-4 text-emerald-600 font-semibold">+{r.points_awarded}</td>
                                        <td className="py-3 pr-4 text-slate-500">
                                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
