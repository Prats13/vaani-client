'use client';

import { useEffect, useState } from 'react';
import { initiateOutboundCall } from '@/lib/vaani-api';

interface OnboardingPendingViewProps {
  phone: string;
  onBack: () => void;
}

type Status = 'initiating' | 'waiting' | 'error';

export function OnboardingPendingView({ phone, onBack }: OnboardingPendingViewProps) {
  const [status, setStatus] = useState<Status>('initiating');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initiateOutboundCall('new_farmer', phone, 'farmer_onboarding')
      .then(() => setStatus('waiting'))
      .catch((err) => {
        console.error('Onboarding call failed:', err);
        setErrorMsg('Could not initiate the call. Please try again.');
        setStatus('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#ECE5DD] dark:bg-[#0B141A]">
      <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 text-center shadow-xl dark:bg-[#202C33]">
        {status === 'initiating' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#25D366] border-t-transparent" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Setting up your call…
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please wait a moment.</p>
          </>
        )}

        {status === 'waiting' && (
          <>
            {/* Phone ringing icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]/10">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 6C8 6 10 4 13 5L17 9C18 10 18 12 17 13L15 15C15 15 17 19 21 23C25 27 29 29 29 29L31 27C32 26 34 26 35 27L39 31C40 34 38 36 38 36C35 39 30 38 25 34C20 30 10 18 8 10C6 5 8 6 8 6Z"
                    fill="#25D366"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Vaani is calling you!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Vaani will call{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">{phone}</span> shortly.
              <br />
              Please pick up — the onboarding takes only <strong>2–3 minutes</strong>.
            </p>

            <div className="mt-6 rounded-xl bg-[#25D366]/10 px-4 py-3 text-left">
              <p className="text-xs font-medium text-[#128C7E] dark:text-[#25D366]">
                What will happen on the call:
              </p>
              <ul className="mt-1.5 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li>• Language preference selection</li>
                <li>• Your farm location &amp; details</li>
                <li>• Crops you grow</li>
              </ul>
            </div>

            <p className="mt-5 text-xs text-gray-400 dark:text-gray-500">
              Once onboarding is complete, come back here to start chatting with Vaani.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="16" cy="16" r="14" stroke="#EF4444" strokeWidth="2" />
                  <path
                    d="M10 10L22 22M22 10L10 22"
                    stroke="#EF4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Call Failed</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{errorMsg}</p>
          </>
        )}

        <button
          onClick={onBack}
          className="mt-6 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
