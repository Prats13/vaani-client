'use client';

import { useState } from 'react';
import { type FarmerProfile, getFarmer, toE164 } from '@/lib/vaani-api';

interface PhoneEntryViewProps {
  onRegistered: (farmer: FarmerProfile, phone: string) => void;
  onNotRegistered: (phone: string) => void;
}

export function PhoneEntryView({ onRegistered, onNotRegistered }: PhoneEntryViewProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const e164 = toE164(digits);
      const farmer = await getFarmer(e164);

      if (farmer && farmer.is_profile_complete) {
        onRegistered(farmer, e164);
      } else {
        onNotRegistered(e164);
      }
    } catch {
      setError('Could not connect to Vaani. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#ECE5DD] dark:bg-[#0B141A]">
      <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-xl dark:bg-[#202C33]">
        {/* Logo / Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-2xl font-bold text-white shadow-md">
            V
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vaani</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              आपका कृषि सहायक • Your Farmer Buddy
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mobile Number
            </label>
            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 focus-within:border-[#25D366] focus-within:ring-1 focus-within:ring-[#25D366] dark:border-gray-700 dark:bg-[#2A3942]">
              <span className="mr-2 text-sm font-medium text-gray-500 select-none dark:text-gray-400">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter your mobile number"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
                autoComplete="tel-national"
                autoFocus
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || phone.replace(/\D/g, '').length !== 10}
            className="mt-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Checking…' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Built for AI for Bharat Hackathon 2026
        </p>
      </div>
    </div>
  );
}
