import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, Sparkles, Zap, Globe2, Shield, ChevronRight,
  Star, ArrowRight, MapPin, Camera, Utensils, Plane
} from 'lucide-react';

const DESTINATIONS = [
  { name: 'Kyoto, Japan',       tag: 'Cultural', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
  { name: 'Santorini, Greece',  tag: 'Coastal',  img: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80' },
  { name: 'Bali, Indonesia',    tag: 'Tropical', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80' },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Itinerary Planner',
    desc: 'Upload your bookings — flights, hotels, PDFs — and our AI crafts a day-by-day personalized travel plan in seconds.',
    bg: 'bg-indigo-50', border: 'border-indigo-100', icon_cls: 'bg-indigo-100 text-brand-indigo',
  },
  {
    icon: Zap,
    title: 'Smart OCR Extraction',
    desc: 'Scan images or PDFs of your travel documents. We extract dates, airlines, hotels, and booking details automatically.',
    bg: 'bg-violet-50', border: 'border-violet-100', icon_cls: 'bg-violet-100 text-brand-violet',
  },
  {
    icon: Globe2,
    title: 'Share Your Journey',
    desc: 'Generate a beautiful public shareable page with QR code. Let friends follow your adventure without an account.',
    bg: 'bg-teal-50', border: 'border-teal-100', icon_cls: 'bg-teal-100 text-brand-teal',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    desc: 'JWT-authenticated accounts with encrypted passwords. Your travel data stays yours, always.',
    bg: 'bg-emerald-50', border: 'border-emerald-100', icon_cls: 'bg-emerald-100 text-brand-emerald',
  },
];

const STATS = [
  { value: '50k+', label: 'Trips Planned' },
  { value: '120+', label: 'Destinations' },
  { value: '4.9★', label: 'User Rating' },
  { value: '< 5s', label: 'AI Generation' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-800">

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative mesh-bg min-h-[92vh] flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-brand-indigo uppercase tracking-widest mb-8 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Gemini AI
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-none tracking-tight mb-6 animate-slide-up">
            Craft Journeys<br />
            <span className="text-gradient">With Intelligence</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 font-light leading-relaxed animate-slide-up" style={{animationDelay:'80ms'}}>
            Upload your travel documents. Let AI extract the details, build your day-by-day itinerary,
            and create a stunning shareable travel page — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{animationDelay:'160ms'}}>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base">
              <Plane className="h-4 w-4" />
              Start Planning Free
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-ghost inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-slate-400 animate-fade-in" style={{animationDelay:'300ms'}}>
            <div className="flex -space-x-2">
              {['#4f46e5','#7c3aed','#0d9488','#d97706'].map((c,i)=>(
                <div key={i} className="h-7 w-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white" style={{background:c}}>
                  {String.fromCharCode(65+i)}
                </div>
              ))}
            </div>
            <span>Join <strong className="text-slate-600">50,000+</strong> travelers worldwide</span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_,i)=><Star key={i} className="h-3.5 w-3.5 fill-current"/>)}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent z-10" />
      </section>

      {/* ── Stats bar ─────────────────────────────────── */}
      <section className="relative z-20 -mt-4 max-w-4xl mx-auto px-4 sm:px-6 mb-24">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-3xl font-black text-gradient">{value}</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Destinations ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-28">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-indigo mb-3">Explore The World</p>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900">
            Dream destinations,<br /><span className="text-gradient">planned to perfection</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {DESTINATIONS.map((dest) => (
            <Link to="/register" key={dest.name} className="group relative rounded-3xl overflow-hidden aspect-[3/4] block shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <img src={dest.img} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="card-img-overlay absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="pill-indigo text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 border-white/30 text-white backdrop-blur-sm">
                  {dest.tag}
                </span>
                <p className="font-display text-xl font-bold text-white mt-2">{dest.name}</p>
                <div className="flex items-center gap-1.5 mt-1 text-slate-300 text-xs">
                  <MapPin className="h-3 w-3 text-indigo-300" /> AI itinerary available
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-28">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-violet mb-3">Everything You Need</p>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900">
            Travel smarter,<br /><span className="text-gradient-violet">not harder</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, bg, border, icon_cls }) => (
            <div key={title} className={`rounded-3xl p-7 border ${bg} ${border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl mb-5 ${icon_cls}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-28">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-teal mb-3">Simple Process</p>
          <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900">
            Three steps to your<br /><span className="text-gradient">perfect trip</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step:'01', icon:Camera,   label:'Upload Documents',   desc:'Drop in your booking PDFs, flight screenshots, or hotel confirmations.' },
            { step:'02', icon:Sparkles, label:'AI Extracts & Plans', desc:'Gemini AI reads your documents and generates a full day-by-day itinerary.' },
            { step:'03', icon:Globe2,   label:'Share & Explore',    desc:'Get a public shareable link with QR code. Download or send to travel companions.' },
          ].map(({ step, icon: Icon, label, desc }) => (
            <div key={step} className="bg-white rounded-3xl p-7 text-center relative border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <span className="absolute top-5 right-5 font-display text-5xl font-black text-slate-100">{step}</span>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-brand-indigo mb-5">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{label}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-20">
        <div className="mesh-bg rounded-3xl p-12 text-center border border-indigo-100 shadow-lg overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-indigo-200 text-xs font-bold text-brand-indigo uppercase tracking-widest mb-6 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />Free to get started
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-slate-900 mb-4">
              Ready to explore<br />the world with AI?
            </h2>
            <p className="text-slate-500 mb-8 max-w-lg mx-auto">
              Create your account free. Upload your first booking document and get your AI itinerary in under a minute.
            </p>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-10 py-4 text-base">
              <Plane className="h-4 w-4" /> Get Started — It's Free
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Compass className="h-4 w-4 text-brand-indigo" />
          <span className="font-display font-bold text-slate-500">TripCraft AI</span>
        </div>
        <p>© {new Date().getFullYear()} TripCraft AI — All rights reserved.</p>
      </footer>
    </div>
  );
}
