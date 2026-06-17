import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Compass, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const { login, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('login'); // 'login' or 'otp'
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resendStatus, setResendStatus] = useState('');

  // Handle countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResendStatus('');
    try {
      const response = await login(form.email, form.password);
      if (response && response.requiresOTP) {
        setStep('otp');
        setResendTimer(30);
        setOtp('');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit verification code.');
      return;
    }
    setLoading(true); setError(''); setResendStatus('');
    try {
      await verifyOTP(form.email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true); setError(''); setResendStatus('');
    try {
      await resendOTP(form.email);
      setResendStatus('Verification code resent successfully.');
      setResendTimer(30);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen mesh-bg flex items-center justify-center px-4 py-16">
      <div className="relative z-10 w-full max-w-md animate-slide-up">

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-indigo-dark shadow-md shadow-indigo-200">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-black text-slate-900">
              TripCraft <span className="text-gradient">AI</span>
            </span>
          </div>

          {step === 'login' ? (
            <>
              <h1 className="font-display text-3xl font-black text-slate-900 mb-1">Welcome back</h1>
              <p className="text-slate-400 text-sm mb-8">Sign in to continue your journey</p>

              {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email" required placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-dark w-full rounded-xl pl-11 pr-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input-dark w-full rounded-xl pl-11 pr-11 py-3 text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  {loading
                    ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <>Sign In <ArrowRight className="h-4 w-4" /></>
                  }
                </button>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-indigo font-bold hover:underline">Create one free</Link>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setStep('login'); setError(''); setResendStatus(''); }}
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 mb-6 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
              </button>

              <h1 className="font-display text-3xl font-black text-slate-900 mb-1">Verify Email</h1>
              <p className="text-slate-400 text-sm mb-6">
                Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{form.email}</span>
              </p>

              {error && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
                  {error}
                </div>
              )}

              {resendStatus && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {resendStatus}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-dark w-full rounded-xl pl-12 pr-4 py-4 text-center font-mono text-2xl tracking-[0.5em] focus:ring-2 focus:ring-brand-indigo placeholder:tracking-normal"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || otp.length !== 6}
                  className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  {loading
                    ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <>Verify & Continue <ArrowRight className="h-4 w-4" /></>
                  }
                </button>
              </form>

              <div className="flex flex-col items-center gap-2 mt-6">
                <span className="text-slate-400 text-sm">
                  Didn't receive the code?
                </span>
                {resendTimer > 0 ? (
                  <span className="text-slate-400 text-sm font-semibold">
                    Resend code in {resendTimer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-brand-indigo font-bold hover:underline text-sm disabled:opacity-50 cursor-pointer"
                  >
                    Resend verification code
                  </button>
                )}
              </div>

              {/* Developer Helper Hint Box */}
              <div className="mt-8 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex gap-2 items-start">
                <Sparkles className="h-4 w-4 text-brand-indigo shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">Developer Hint:</span> Check the server terminal console logs for the 6-digit OTP code in local development mode.
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3 text-brand-indigo" />
          AI-powered travel planning — free to start
        </p>
      </div>
    </div>
  );
}
