import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Compass, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
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
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3 text-brand-indigo" />
          AI-powered travel planning — free to start
        </p>
      </div>
    </div>
  );
}
