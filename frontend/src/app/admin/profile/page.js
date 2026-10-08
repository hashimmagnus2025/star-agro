'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Camera, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import api, { setAuthToken } from '../../utils/api';

export default function AdminProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('edit');
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        profile_image: '',
    });
    const [moreInfoData, setMoreInfoData] = useState({
        gender: '',
        date_of_birth: '',
        state: '',
        district: '',
        taluka: '',
        village: '',
        address: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('[AdminProfilePage] loaded token:', token);
        if (token) setAuthToken(token);
        else {
            setError('Login token not found. Please login again.');
            setLoading(false);
            return;
        }

        const loadUser = async () => {
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    if (parsedUser.role === 'user') {
                        router.push('/user/profile');
                        return;
                    }
                    setUser(parsedUser);
                    setFormData({
                        first_name: parsedUser.first_name || '',
                        last_name: parsedUser.last_name || '',
                        email: parsedUser.email || '',
                        phone: parsedUser.phone || '',
                        profile_image: parsedUser.profile_image || '',
                    });
                    setMoreInfoData({
                        gender: parsedUser.gender || '',
                        date_of_birth: parsedUser.date_of_birth ? parsedUser.date_of_birth.slice(0, 10) : '',
                        state: parsedUser.state || '',
                        district: parsedUser.district || '',
                        taluka: parsedUser.taluka || '',
                        village: parsedUser.village || '',
                        address: parsedUser.address || '',
                    });
                    setLoading(false);
                    return;
                } catch (err) {
                    console.error('Unable to parse stored user', err);
                }
            }

            try {
                const res = await api.get('/user/me');
                const fetchedUser = res.data.user;
                setUser(fetchedUser);
                localStorage.setItem('user', JSON.stringify(fetchedUser));
                setFormData({
                    first_name: fetchedUser.first_name || '',
                    last_name: fetchedUser.last_name || '',
                    email: fetchedUser.email || '',
                    phone: fetchedUser.phone || '',
                    profile_image: fetchedUser.profile_image || '',
                });
                setMoreInfoData({
                    gender: fetchedUser.gender || '',
                    date_of_birth: fetchedUser.date_of_birth ? fetchedUser.date_of_birth.slice(0, 10) : '',
                    state: fetchedUser.state || '',
                    district: fetchedUser.district || '',
                    taluka: fetchedUser.taluka || '',
                    village: fetchedUser.village || '',
                    address: fetchedUser.address || '',
                });
            } catch (err) {
                console.error('Failed to load current user', err);
                setError('Unable to load profile. Please login again.');
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleMoreInfoChange = (e) => {
        const { name, value } = e.target;
        setMoreInfoData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            const res = await api.put('/user/me', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone: formData.phone,
                profile_image: formData.profile_image,
            });
            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setMessage('Profile updated successfully');
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
            console.error('Profile update error', err);
        } finally {
            setSubmitting(false);
        }
        // Dispatch event to update AdminLayout in real-time
        window.dispatchEvent(new Event('userUpdated'));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        try {
            await api.put('/user/me', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setMessage('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
            console.error('Password change error', err);
        } finally {
            setSubmitting(false);
        }
        // Dispatch event to update AdminLayout in real-time
        window.dispatchEvent(new Event('userUpdated'));
    };

    const handleMoreInfoSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setSubmitting(true);

        try {
            const res = await api.put('/user/me', {
                gender: moreInfoData.gender,
                date_of_birth: moreInfoData.date_of_birth,
                state: moreInfoData.state,
                district: moreInfoData.district,
                taluka: moreInfoData.taluka,
                village: moreInfoData.village,
                address: moreInfoData.address,
            });
            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setMoreInfoData({
                gender: updatedUser.gender || '',
                date_of_birth: updatedUser.date_of_birth ? updatedUser.date_of_birth.slice(0, 10) : '',
                state: updatedUser.state || '',
                district: updatedUser.district || '',
                taluka: updatedUser.taluka || '',
                village: updatedUser.village || '',
                address: updatedUser.address || '',
            });
            setMessage('More information updated successfully');
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update more information');
            console.error('More info update error', err);
        } finally {
            setSubmitting(false);
        }
        window.dispatchEvent(new Event('userUpdated'));
    };

    if (loading) {
        return (
            <div className="min-h-screen  flex items-center justify-center p-6">
                <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"></div>
                    <p className="text-slate-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen  flex items-center justify-center p-6">
                <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
                    <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                    <p className="text-slate-700 font-semibold">No profile found. Please log in again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen  p-6">
            <div className="bg-linear-to-r from-emerald-600 to-emerald-500 rounded-3xl p-8 text-white shadow-xl mb-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                    <div className="relative">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=ffffff&color=16a34a&size=200`}
                            alt="profile"
                            className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
                        />
                        <button className="absolute right-0 bottom-0 rounded-full bg-white p-3 text-green-600 shadow-lg">
                            <Camera size={18} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-bold">{user?.name || 'Admin Profile'}</h1>
                        <p className="text-green-100 max-w-2xl">
                            Update your profile, contact details, and security settings from one place.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-3xl bg-white/10 p-4">
                                <p className="text-xs uppercase tracking-[0.3em] text-green-100/80">Email</p>
                                <p className="mt-2 text-sm font-semibold text-white">{user.email || 'Not set'}</p>
                            </div>
                            <div className="rounded-3xl bg-white/10 p-4">
                                <p className="text-xs uppercase tracking-[0.3em] text-green-100/80">Phone</p>
                                <p className="mt-2 text-sm font-semibold text-white">{user.phone || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className="mb-6 rounded-3xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700 shadow-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{message}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-3xl bg-rose-50 border border-rose-200 p-4 text-rose-700 shadow-sm">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="rounded-3xl bg-white p-6 shadow-lg">
                    <h3 className="text-xl font-bold mb-6">Account Overview</h3>
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-green-100 p-3 text-green-600">
                                <User />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Full Name</p>
                                <p className="font-semibold text-slate-900">{user?.name || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-blue-100 p-3 text-blue-600">
                                <Mail />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Email</p>
                                <p className="font-semibold text-slate-900">{user.email || 'Not set'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-orange-100 p-3 text-orange-600">
                                <Phone />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Phone</p>
                                <p className="font-semibold text-slate-900">{user.phone || 'Not set'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="rounded-3xl bg-white p-8 shadow-lg">
                        <div className="flex flex-wrap gap-3 mb-8">
                            <button
                                type="button"
                                onClick={() => setActiveTab('edit')}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'edit' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Edit Profile
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('more-info')}
                                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === 'more-info' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                More Information
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold mb-8">{activeTab === 'edit' ? 'Edit Profile' : 'More Information'}</h2>

                        {activeTab === 'edit' ? (
                            <form onSubmit={handleProfileSubmit} className="grid gap-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">First Name</span>
                                        <input
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleFormChange}
                                            type="text"
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            placeholder="First name"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Last Name</span>
                                        <input
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleFormChange}
                                            type="text"
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            placeholder="Last name"
                                        />
                                    </label>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Email</span>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleFormChange}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            placeholder="Email address"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Phone</span>
                                        <input
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleFormChange}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            placeholder="Phone number"
                                        />
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-3 text-white font-semibold shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleMoreInfoSubmit} className="grid gap-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Gender</span>
                                        <select
                                            name="gender"
                                            value={moreInfoData.gender}
                                            onChange={handleMoreInfoChange}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Date of Birth</span>
                                        <input
                                            name="date_of_birth"
                                            type="date"
                                            value={moreInfoData.date_of_birth}
                                            onChange={handleMoreInfoChange}
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        />
                                    </label>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">State</span>
                                        <input
                                            name="state"
                                            value={moreInfoData.state}
                                            onChange={handleMoreInfoChange}
                                            type="text"
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            placeholder="State"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">District</span>
                                        <input
                                            name="district"
                                            value={moreInfoData.district}
                                            onChange={handleMoreInfoChange}
                                            type="text"
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            placeholder="District"
                                        />
                                    </label>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Taluka</span>
                                        <input
                                            name="taluka"
                                            value={moreInfoData.taluka}
                                            onChange={handleMoreInfoChange}
                                            type="text"
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            placeholder="Taluka"
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="text-sm font-medium text-slate-700">Village</span>
                                        <input
                                            name="village"
                                            value={moreInfoData.village}
                                            onChange={handleMoreInfoChange}
                                            type="text"
                                            className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                            placeholder="Village"
                                        />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="text-sm font-medium text-slate-700">Address</span>
                                    <textarea
                                        name="address"
                                        value={moreInfoData.address}
                                        onChange={handleMoreInfoChange}
                                        rows="3"
                                        className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                        placeholder="Address"
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center rounded-3xl bg-linear-to-r from-emerald-600 to-emerald-700 px-8 py-3 text-white font-semibold shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? 'Saving...' : 'Save More Info'}
                                </button>
                            </form>
                        )}
                    </div>
                    {activeTab === 'edit' && (<div className="rounded-3xl bg-slate-900 p-8 shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-8">
                            <Lock className="h-6 w-6" />
                            <h2 className="text-2xl font-bold">Change Password</h2>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="space-y-5">
                            <label className="block relative">
                                <span className="text-sm font-medium text-slate-200">Current Password</span>
                                <input
                                    name="currentPassword"
                                    type={showPassword.currentPassword ? 'text' : 'password'}
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    className="mt-2 w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
                                    placeholder="Current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('currentPassword')}
                                    className="absolute right-3 top-[40px] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                                >
                                    {showPassword.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </label>
                            <label className="block relative">
                                <span className="text-sm font-medium text-slate-200">New Password</span>
                                <input
                                    name="newPassword"
                                    type={showPassword.newPassword ? 'text' : 'password'}
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    className="mt-2 w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
                                    placeholder="New password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('newPassword')}
                                    className="absolute right-3 top-[40px] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                                >
                                    {showPassword.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </label>
                            <label className="block relative">
                                <span className="text-sm font-medium text-slate-200">Confirm Password</span>
                                <input
                                    name="confirmPassword"
                                    type={showPassword.confirmPassword ? 'text' : 'password'}
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    className="mt-2 w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30"
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirmPassword')}
                                    className="absolute right-3 top-[40px] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                                >
                                    {showPassword.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </label>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center justify-center rounded-3xl bg-white px-8 py-3 text-slate-900 font-semibold shadow-lg transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    </div>)}

                </div>
            </div>
        </div>
    );
}
