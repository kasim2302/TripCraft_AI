import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import itineraryService from '../services/itineraryService';
import MapView from '../components/MapView';
import {
  Calendar, Compass, ChevronRight, Utensils, Car, Home,
  Tag, HelpCircle, Loader2, Copy, Check, MapPin, Plane, Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const CATEGORY_META = {
  Sightseeing: { icon: Compass,    pill: 'pill-cyan',    dot: '#0891b2' },
  Food:        { icon: Utensils,   pill: 'pill-amber',   dot: '#d97706' },
  Transport:   { icon: Car,        pill: 'pill-violet',  dot: '#7c3aed' },
  Lodging:     { icon: Home,       pill: 'pill-emerald', dot: '#059669' },
  Activities:  { icon: Tag,        pill: 'pill-teal',    dot: '#0d9488' },
  Other:       { icon: HelpCircle, pill: 'pill-gray',    dot: '#64748b' },
};

const DEST_IMAGES = {
  default: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  japan:   'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
  bali:    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
  greece:  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80',
  paris:   'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
  london:  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
};

function getDestImage(d = '') {
  const l = d.toLowerCase();
  for (const key of Object.keys(DEST_IMAGES)) { if (l.includes(key)) return DEST_IMAGES[key]; }
  return DEST_IMAGES.default;
}

const ShareItinerary = () => {
  const { shareId } = useParams();
  const [itineraryData, setItineraryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await itineraryService.getPublicSharedItinerary(shareId);
        setItineraryData(data);
      } catch { setError('Shared itinerary not found or has expired.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [shareId]);

  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-bg-base">
      <div className="h-10 w-10 border-2 border-indigo-200 border-t-brand-indigo rounded-full animate-spin" />
    </div>
  );

  if (error || !itineraryData) return (
    <div className="flex h-screen flex-col items-center justify-center bg-bg-base text-center space-y-5 px-4">
      <div className="font-display text-7xl font-black text-gradient">404</div>
      <h2 className="font-display text-2xl font-bold text-slate-900">Itinerary Not Found</h2>
      <p className="text-slate-400 text-sm max-w-xs">{error || 'This travel plan is no longer shared.'}</p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm">
        <Plane className="h-4 w-4" /> Back to Home
      </Link>
    </div>
  );

  const daysList = itineraryData.itinerary || [];
  const currentDayData = daysList.find((d) => d.day === selectedDay) || daysList[0];
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=000000&bgcolor=ffffff&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="min-h-screen bg-bg-base text-slate-800">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[340px] overflow-hidden">
        <img src={getDestImage(itineraryData.destination)} alt={itineraryData.destination} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/40 to-slate-900/80" />

        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 sm:px-8 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm border border-white/30">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-sm font-bold text-white hidden sm:block">TripCraft AI</span>
          </Link>
          <span className="pill-indigo text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/20 border-white/30 text-white backdrop-blur-sm">
            Public Share
          </span>
        </div>

        <div className="absolute bottom-0 inset-x-0 px-5 sm:px-8 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2">
            <Sparkles className="h-3 w-3 inline mr-1" />AI-Generated Itinerary
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2">{itineraryData.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-indigo-300" /><span className="font-semibold">{itineraryData.destination}</span></div>
            <span className="text-slate-500">·</span>
            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-indigo-300" /><span>{daysList.length} days</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Share bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white p-1">
              <img src={qrUrl} alt="QR Code" className="h-16 w-16" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-900 text-sm">Share this itinerary</p>
              <p className="text-xs text-slate-400 mt-0.5">Anyone with the link can view — no login required.</p>
            </div>
          </div>
          <button onClick={handleCopyLink}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all cursor-pointer shrink-0 ${copied ? 'bg-emerald-50 border border-emerald-200 text-brand-emerald' : 'btn-primary'}`}>
            {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy Link</>}
          </button>
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Days Left Bar Selector */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm self-start">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 mb-3">Days</p>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
              {daysList.map((day) => {
                const active = selectedDay === day.day;
                return (
                  <button key={day.day} onClick={() => setSelectedDay(day.day)}
                    className={`shrink-0 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex justify-between items-center cursor-pointer transition-all ${active ? 'nav-link-active' : 'nav-link'}`}>
                    <span>Day {day.day}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 hidden lg:block text-brand-indigo" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Middle Schedule Timeline */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-indigo" /> Day {selectedDay} — Schedule
            </h2>
            {!currentDayData?.activities?.length ? (
              <div className="bg-white rounded-2xl p-10 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">No activities planned.</div>
            ) : (
              <div className="relative pl-6 ml-2 space-y-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {currentDayData.activities.map((act, idx) => {
                  const meta = CATEGORY_META[act.category] || CATEGORY_META.Other;
                  const Icon = meta.icon;
                  return (
                    <div key={idx} className="relative group animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="absolute -left-[28px] top-4 h-3.5 w-3.5 rounded-full border-2 border-bg-base"
                        style={{ background: meta.dot }} />
                      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all flex gap-4">
                        <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${meta.pill}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <h3 className="font-display font-bold text-slate-900 group-hover:text-brand-indigo transition-colors">{act.title}</h3>
                            {act.cost > 0 && <span className="text-sm font-bold text-brand-indigo shrink-0">{formatCurrency(act.cost)}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span>{act.time || 'All Day'}</span><span>·</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.pill}`}>{act.category}</span>
                          </div>
                          {act.description && <p className="text-sm text-slate-500 leading-relaxed mt-2">{act.description}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Map Visualizer */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-indigo" /> Daily Map Route
            </h2>
            <MapView destination={itineraryData.destination} activities={currentDayData?.activities || []} />
          </div>
        </div>

        {/* CTA */}
        <div className="border-t border-slate-100 pt-8 text-center space-y-4">
          <p className="text-slate-400 text-sm">Want to plan your own AI-powered trip?</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm">
            <Sparkles className="h-4 w-4" /> Create Your Free Account
          </Link>
          <p className="text-xs text-slate-300 mt-2">Made with <span className="text-brand-indigo font-bold">TripCraft AI</span></p>
        </div>
      </div>
    </div>
  );
};

export default ShareItinerary;
