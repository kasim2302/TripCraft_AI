import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Compass, User, Mail, Lock, Eye, EyeOff, ArrowRight, Check, Sparkles } from 'lucide-react';

const BENEFITS = [
  'AI-generated day-by-day itineraries',
  'Smart OCR booking extraction',
  'Beautiful shareable travel pages',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = form.password.length < 4 ? 1 : form.password.length < 7 ? 2 : form.password.length < 10 ? 3 : 4;
  const pwLabel   = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];
  const pwColor   = ['', 'bg-rose-500', 'bg-amber-400', 'bg-indigo-400', 'bg-emerald-500'][pwStrength];

  return (
    <div className="relative min-h-screen mesh-bg flex items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-lg animate-slide-up">

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-indigo-dark shadow-md shadow-indigo-200">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-black text-slate-900">
              TripCraft <span className="text-gradient">AI</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-black text-slate-900 mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-3">Start planning AI-powered trips today</p>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-7">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-slate-400">
                <Check className="h-3 w-3 text-brand-indigo shrink-0" />{b}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input type="text" required placeholder="Alex Johnson" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-dark w-full rounded-xl pl-11 pr-4 py-3 text-sm" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input type="email" required placeholder="you@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-dark w-full rounded-xl pl-11 pr-4 py-3 text-sm" />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input type={showPassword ? 'text' : 'password'} required placeholder="Min 6 chars" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-dark w-full rounded-xl pl-11 pr-11 py-3 text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input type={showPassword ? 'text' : 'password'} required placeholder="Repeat password" value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    className={`input-dark w-full rounded-xl pl-11 pr-4 py-3 text-sm ${form.confirm && form.confirm !== form.password ? 'border-rose-300' : ''}`} />
                </div>
              </div>
            </div>

            {/* Strength bar */}
            {form.password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= pwStrength ? pwColor : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">{pwLabel} password</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm mt-2 disabled:opacity-60 cursor-pointer">
              {loading
                ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <>Create Account <ArrowRight className="h-4 w-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-indigo font-bold hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3 text-brand-indigo" />
          Free forever — no credit card required
        </p>
      </div>
    </div>
  );
}
