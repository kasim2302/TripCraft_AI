import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import {
  Compass, LogOut, User as UserIcon, Plus, LayoutDashboard,
  Menu, X, ChevronDown, Sparkles, Heart, KeyRound, Eye, EyeOff, Check,
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Change Password Modal ──────────────────────────
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const openPwModal = () => {
    setProfileDropdownOpen(false);
    setPwForm({ current: '', newPw: '', confirm: '' });
    setPwError(''); setPwSuccess(false);
    setShowPwModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.newPw !== pwForm.confirm) { setPwError('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    setPwLoading(true);
    try {
      await authService.changePassword(pwForm.current, pwForm.newPw);
      setPwSuccess(true);
      setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => setShowPwModal(false), 2000);
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  const pwStrength = pwForm.newPw.length < 4 ? 1 : pwForm.newPw.length < 7 ? 2 : pwForm.newPw.length < 10 ? 3 : 4;
  const pwColor   = ['', 'bg-rose-500', 'bg-amber-400', 'bg-indigo-400', 'bg-emerald-500'][pwStrength];
  const pwLabel   = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setProfileDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => setMobileSidebarOpen(false), [location.pathname]);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Trip',  path: '/create-trip', icon: Plus },
  ];

  /* ── Unauthenticated shell ── */
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-slate-800">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-indigo-dark shadow-md shadow-brand-indigo/20 transition-transform duration-200 group-hover:scale-105">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-slate-900">
                TripCraft <span className="text-gradient font-black">AI</span>
              </span>
            </Link>
            <nav className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                Log in
              </Link>
              <Link to="/register" className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm">
                <Sparkles className="h-3.5 w-3.5" /> Get Started
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-100 py-8 px-4">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-indigo to-brand-indigo-dark">
                <Compass className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-slate-500">TripCraft AI</span>
              <span className="text-slate-300">·</span>
              <span>© {new Date().getFullYear()} All rights reserved.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-rose-500 fill-current" />
              <span>using Gemini AI</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  /* ── Authenticated shell ── */
  return (
    <div className="min-h-screen bg-bg-base text-slate-800 flex flex-col">

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center px-4 sm:px-6 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-indigo to-brand-indigo-dark">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-base font-bold text-slate-900">TripCraft <span className="text-brand-indigo">AI</span></span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-slate-400">Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Travel Panel</span>
          </div>
        </div>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all text-sm font-medium cursor-pointer shadow-sm"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-brand-indigo font-bold text-xs border border-indigo-200">
              {user?.name?.[0]?.toUpperCase() ?? <UserIcon className="h-4 w-4" />}
            </div>
            <span className="hidden sm:block max-w-[120px] truncate font-semibold text-slate-700">{user?.name}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 text-sm divide-y divide-slate-100 animate-fade-in z-50">
              <div className="px-4 py-3">
                <p className="font-display font-bold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <link.icon className="h-4 w-4 text-brand-indigo" />
                    {link.name}
                  </Link>
                ))}
                <button
                  onClick={openPwModal}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left text-sm"
                >
                  <KeyRound className="h-4 w-4 text-brand-indigo" /> Change Password
                </button>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="w-60 hidden lg:flex flex-col border-r border-slate-200 bg-white shrink-0">
          <div className="h-16 px-5 border-b border-slate-100 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-indigo-dark shadow-md shadow-indigo-200">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-slate-900">
              TripCraft <span className="text-gradient font-black">AI</span>
            </span>
          </div>

          <nav className="flex-1 px-3 py-5 space-y-1">
            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Navigation</p>
            {navLinks.map(({ name, path, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'nav-link-active' : 'nav-link'}`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-brand-indigo' : 'text-slate-400'}`} />
                  {name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-brand-indigo text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="w-64 flex flex-col bg-white border-r border-slate-200 h-full animate-slide-left shadow-xl">
              <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-indigo to-brand-indigo-dark">
                    <Compass className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-display font-bold text-slate-900">TripCraft AI</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-5 space-y-1">
                {navLinks.map(({ name, path, icon: Icon }) => {
                  const active = isActive(path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'nav-link-active' : 'nav-link'}`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-brand-indigo' : 'text-slate-400'}`} />
                      {name}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 text-sm font-bold cursor-pointer hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
            <div className="flex-grow bg-slate-900/30 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          </div>
        )}

        {/* Main content + footer */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <main className="flex-1 p-5 sm:p-7 lg:p-8">
            {children}
          </main>

          <footer className="border-t border-slate-100 px-6 py-5 mt-auto bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-brand-indigo to-brand-indigo-dark">
                  <Compass className="h-3 w-3 text-white" />
                </div>
                <span className="font-display font-semibold text-slate-500">TripCraft AI</span>
                <span className="text-slate-300">·</span>
                <span>© {new Date().getFullYear()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Powered by</span>
                <span className="text-brand-indigo font-bold">Gemini AI</span>
                <span className="text-slate-300">·</span>
                <span>Made with</span>
                <Heart className="h-2.5 w-2.5 text-rose-500 fill-current" />
              </div>
            </div>
          </footer>
        </div>
      </div>
      {/* ── Change Password Modal ─────────────────────── */}
      {showPwModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPwModal(false)} />

          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 animate-slide-up">
            {/* Close */}
            <button onClick={() => setShowPwModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-indigo">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-black text-slate-900">Change Password</h2>
                <p className="text-xs text-slate-400 mt-0.5">Update your account password</p>
              </div>
            </div>

            {pwSuccess ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Check className="h-7 w-7 text-brand-emerald" />
                </div>
                <p className="font-display font-bold text-slate-900">Password Updated!</p>
                <p className="text-sm text-slate-400">Your password has been changed successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {pwError && (
                  <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{pwError}</div>
                )}

                {/* Current password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'} required
                      value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                      placeholder="Enter current password"
                      className="input-dark w-full rounded-xl px-4 pr-11 py-3 text-sm"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'} required
                      value={pwForm.newPw}
                      onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
                      placeholder="Min 6 characters"
                      className="input-dark w-full rounded-xl px-4 pr-11 py-3 text-sm"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {pwForm.newPw && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= pwStrength ? pwColor : 'bg-slate-200'}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400">{pwLabel} password</p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Confirm New Password</label>
                  <input
                    type="password" required
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    placeholder="Repeat new password"
                    className={`input-dark w-full rounded-xl px-4 py-3 text-sm ${pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'border-rose-300 bg-rose-50/30' : ''}`}
                  />
                  {pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                    <p className="text-[10px] text-rose-500 mt-1">Passwords don't match</p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowPwModal(false)}
                    className="btn-ghost flex-1 rounded-xl py-3 text-sm cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={pwLoading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm cursor-pointer disabled:opacity-60">
                    {pwLoading
                      ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <><KeyRound className="h-4 w-4" /> Update Password</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
