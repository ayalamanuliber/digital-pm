'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

export default function WorkerLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0].current?.focus();
  }, []);

  const handlePinChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (index === 3 && value) {
      const fullPin = [...newPin.slice(0, 3), value].join('');
      handleLogin(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleLogin = async (pinValue?: string) => {
    const fullPin = pinValue || pin.join('');

    if (fullPin.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/worker/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      });

      const data = await response.json();

      if (data.success && data.worker) {
        setSuccess(true);

        // Store worker info in sessionStorage
        sessionStorage.setItem('workerId', data.worker.id);
        sessionStorage.setItem('workerName', data.worker.name);

        // Redirect to worker dashboard
        setTimeout(() => {
          router.push(`/worker/${data.worker.id}`);
        }, 800);
      } else {
        setError(data.error || 'Invalid PIN. Please try again.');
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please check your internet and try again.');
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Digital PM</h1>
          <p className="text-slate-400 text-lg">Modern Design & Development</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
          {success ? (
            // Success State
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome Back!</h2>
              <p className="text-slate-600">Loading your dashboard...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                  <Lock size={28} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Worker Login</h2>
                <p className="text-slate-600">Enter your 4-digit PIN to continue</p>
              </div>

              {/* PIN Input */}
              <div className="mb-6">
                <div className="flex gap-3 justify-center mb-6">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={loading}
                      className={`w-16 h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all ${
                        error
                          ? 'border-red-500 bg-red-50 text-red-600'
                          : digit
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-slate-300 bg-white text-slate-900'
                      } focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50`}
                    />
                  ))}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-600 text-sm font-bold text-center">{error}</p>
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm font-bold">Verifying...</span>
                  </div>
                )}

                {/* Manual Submit Button (backup) */}
                {pin.every((d) => d) && !loading && (
                  <button
                    onClick={() => handleLogin()}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-xl transition-all"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Help Text */}
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500">
                  Don't have a PIN?{' '}
                  <a href="tel:(303)555-0199" className="text-blue-600 font-bold hover:underline">
                    Contact Office
                  </a>
                </p>
                <p className="text-xs text-slate-400">
                  Your PIN was provided by your project manager
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-slate-400 text-sm">
            🔒 Secure Access • Your data is protected
          </p>
          <p className="text-slate-500 text-xs">
            Modern Design & Development © 2025
          </p>
        </div>
      </div>
    </div>
  );
}
