const fs = require('fs');
const file = 'D:/HelpVerse Projects/Portal HelpVerse/src/app/forgot-password/page.tsx';

const content = `'use client';

import React, { useState } from 'react';
import { forgotPasswordAction } from '../actions/auth';
import { KeyRound, Mail, ArrowLeft, Loader2, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    <div className="relative min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/40 via-slate-950 to-slate-950 px-4 py-12 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 mb-4">
            <KeyRound className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Reset Request
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Securely request a password reset from the Super Admin
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 shadow-2xl glow-purple">
          {success ? (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-sm">
                <p className="font-semibold text-lg text-white mb-2">Request Submitted</p>
                Your password reset request has been securely dispatched to the Super Admin for approval.
                <br /><br />
                Once approved, return to the login screen with your email to set a new password.
              </div>

              <Link
                href="/login"
                className="inline-flex items-center text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-start space-x-2">
                  <span>??</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                To prevent unauthorized resets, you must verify your identity with your current Authy token. 
                Once verified, the Super Admin must approve your request before you can change your password.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 form-input text-sm"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">
                  Authy Authenticator Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ''))}
                    className="w-full pl-11 form-input text-sm tracking-widest"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
`;

fs.writeFileSync(file, content);
console.log('Successfully updated forgot-password/page.tsx');
