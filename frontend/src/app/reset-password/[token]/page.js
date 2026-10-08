'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaLock, FaArrowRight, FaSeedling } from 'react-icons/fa';
import api from '../../utils/api.js';

export default function ResetPasswordPage({ params }) {
  const router = useRouter();
  const token = params?.token || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');

    if (!password.trim() || !confirmPassword.trim()) {
      setMessage('Please enter both password fields.');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageType('error');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/user/reset-password', {
        token,
        password,
        confirmPassword,
      });

      setMessage(response.data?.message || 'Password reset successfully.');
      setMessageType('success');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => router.push('/login'), 2500);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reset password.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fff4] flex items-center justify-center px-4 py-8 sm:py-10">
      <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden border border-green-100">
        <div className="p-6 sm:p-10 lg:p-14">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-linear-to-r from-green-600 to-emerald-600 flex items-center justify-center shadow-xl">
              <FaSeedling className="text-white text-2xl sm:text-3xl" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mt-4 sm:mt-5">
              Reset Password
            </h1>
          </div>

          <div className="mb-6 sm:mb-8 text-center">
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Enter your new password and confirm to complete the reset.
            </p>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-center ${
              messageType === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all duration-300"
                required
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all duration-300"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-4 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-lg transition-all duration-300 shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Updating...' : 'Reset Password'}
              <FaArrowRight className="ml-2" />
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remembered your password?{' '}
                <Link href="/login" className="text-green-600 font-semibold hover:underline">
                  Login instead
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
