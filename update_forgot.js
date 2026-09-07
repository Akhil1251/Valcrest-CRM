const fs = require('fs');
const path = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/forgot-password/page.tsx';

const newContent = `'use client';

import React, { useState } from 'react';
import { forgotPasswordAction } from '../actions/auth';
import { Mail, ArrowLeft, Loader2, Send, ShieldCheck, KeyRound } from 'lucide-react';
import Link from 'next/link';
import '../login/loader-bg.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Track keystrokes for typing glow effect
  React.useEffect(() => {
    if (errorMsg && (email || otp)) {
      setErrorMsg('');
    }
    if (!email && !otp) return;
    setIsTyping(true);
    const timeout = setTimeout(() => setIsTyping(false), 300);
    return () => clearTimeout(timeout);
  }, [email, otp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!/\\S+@\\S+\\.\\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!otp || otp.length !== 6) {
      setErrorMsg('A valid 6-digit Authy code is required.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', otp);

      const res = await forgotPasswordAction(null, formData);
      if (res.success) {
        setSuccess(true);
      } else {
        setErrorMsg(res.error || 'Failed to send request.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      
      {/* Left Column: Intro Animation */}
      <div className="hidden lg:flex relative items-center justify-center bg-black overflow-hidden transition-all duration-[2000ms] ease-in-out w-1/2">
        {/* Background Loader Animation */}
        <div className="loader-container">
          <div className="bg-glow"></div>
          <div className="h-wrapper">
            <div className="flare"></div>
            <div className="h-lines">
              <div className="line-loader line-left"></div>
              <div className="line-loader line-right"></div>
            </div>
          </div>
        </div>

        {/* Grain Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
        />

        <div className="absolute bottom-10 left-10 z-10 text-white/40 text-[10px] font-semibold tracking-[2px] text-left">
          HELPVERSE OPERATIONAL UNIT<br />
          GLOBAL ACCESS TERMINAL 01
        </div>
      </div>

      {/* Right Column: Form Card */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-center px-4 py-4 lg:py-8 bg-black overflow-y-auto max-h-screen">
        {/* Grain Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
        />

        <div className="w-full max-w-md z-10 relative">
          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-4 w-full">
              <img src="/Logo (2).png" alt="Helpverse Logo" className="w-32 md:w-40 h-auto object-contain max-w-full" />
            </div>
            <p className="mt-2 text-sm text-white/70 font-medium tracking-widest uppercase">
              Enterprise Management System
            </p>
          </div>

          {/* Form Card */}
          <div className={\`rounded-3xl p-6 lg:px-8 lg:py-6 relative bg-black/40 backdrop-blur-2xl border w-full min-h-[400px] flex flex-col transition-all duration-500 \${
            errorMsg 
              ? 'shadow-[0_0_40px_rgba(239,68,68,0.4)] border-red-500/50' 
              : isTyping 
                ? 'shadow-[0_0_40px_rgba(255,255,255,0.2)] border-white/40' 
                : 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-white/20'
          }\`}>
            {/* Top highlight bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-white/10 via-white/40 to-white/10" />

            <div className="flex-1 flex flex-col justify-center">
              <h2 className="text-lg font-semibold text-white mb-2 text-center">
                Reset Request
              </h2>

              {success ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-1000">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <ShieldCheck className="h-8 w-8 text-white/80" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white tracking-tight">Request Submitted</h3>
                    <p className="text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
                      Your password reset request has been securely dispatched to the Super Admin for approval.
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto mt-2">
                      Once approved, return to the login screen with your email to set a new password.
                    </p>
                  </div>

                  <Link
                    href="/login"
                    className="inline-flex items-center text-xs font-semibold text-white/60 hover:text-white transition-colors mt-4"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    Return to Sign In
                  </Link>
                </div>
              ) : (
                <div className="mt-4 flex-1 flex flex-col">
                  {errorMsg && (
                    <div className="mb-4 p-2.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2 shadow-sm">
                      <span className="font-bold shrink-0">?</span>
                      <span className="leading-tight">{errorMsg}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-white/50 leading-relaxed mb-6 text-center">
                    To prevent unauthorized resets, you must verify your identity with your current Authy token. 
                    Once verified, the Super Admin must approve your request before you can change your password.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      {/* Email Field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/60 tracking-wider uppercase block">
                          Email Address
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                            <Mail className="h-4 w-4" />
                          </span>
                          <input
                            type="email"
                            required
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input text-xs w-full pl-9 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* OTP Field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/60 tracking-wider uppercase block">
                          Authy Authenticator Code
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/50">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ''))}
                            className="form-input text-xs w-full pl-9 py-2.5 tracking-[0.3em] font-mono bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/20 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 space-y-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Submit Request
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </button>

                      <div className="text-center">
                        <Link
                          href="/login"
                          className="inline-flex items-center text-[10px] font-medium tracking-wide text-white/40 hover:text-white transition-colors"
                        >
                          <ArrowLeft className="h-3 w-3 mr-1" />
                          Return to Sign In
                        </Link>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-[9px] text-white/30 font-semibold tracking-widest uppercase">
              &copy; 2026 HELPVERSE SYSTEMS. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path, newContent);
console.log('Successfully updated forgot-password page layout to match login page');
