'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaArrowRight, FaSeedling } from 'react-icons/fa';
import api from '../utils/api.js';


export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await api.post('/user/forgot-password', { email: email.trim() });
      const payload = response.data || {};
      setMessage(payload.message || 'If your email is registered, you will receive a password reset link shortly.');
      setMessageType(payload.emailError ? 'error' : 'success');
      setEmail('');

      if (payload.resetUrl) {
        setMessage(`${payload.message || 'Password reset link sent.'} ${payload.emailError ? 'Email send failed:' : ''} ${payload.emailError || ''}\nCopy this link if email delivery is not configured: ${payload.resetUrl}`);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fff4] flex items-center justify-center px-4 py-8 sm:py-10">
      <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-[40px] shadow-2xl overflow-hidden border border-green-100">
        <div className="p-6 sm:p-10 lg:p-14">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-linear-to-r from-green-600 to-emerald-600 flex items-center justify-center shadow-xl">
              <FaSeedling className="text-white text-2xl sm:text-3xl" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-800 mt-4 sm:mt-5">
              Star Agro
            </h1>
          </div>

          {/* Heading */}
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800">
              Forgot Password
            </h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Enter your email address to receive a password reset link
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-center ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <FaEnvelope 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" 
              />
              <input
                type="email"
                id="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-10 pr-4 py-3 sm:py-3.5 rounded-lg sm:rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all duration-300 ${
                  isLoading ? 'opacity-80' : ''
                }`}
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-4 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-lg sm:rounded-xl transition-all duration-300 shadow-xl hover:scale-[1.01] flex items-center justify-center gap-2 sm:gap-3 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
              <FaArrowRight className="ml-2" />
            </button>

            {/* Back to Login */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-green-600 font-semibold hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}