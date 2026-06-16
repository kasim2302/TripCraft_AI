import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import tripService from '../services/tripService';
import { Sparkles, MapPin, Calendar, DollarSign, Users, Award, Loader2, Plane } from 'lucide-react';

const COMPANIONS = [
  { id: 'solo',    label: 'Solo Traveler',  desc: 'Just me and the open road', emoji: '🎒' },
  { id: 'couple',  label: 'Couple',         desc: 'A romantic getaway for two', emoji: '💑' },
  { id: 'family',  label: 'Family',         desc: 'Fun for all ages and kids',  emoji: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends Group',  desc: 'Group adventure with mates', emoji: '🤝' },
];

const INTERESTS = [
  { id: 'adventure',  label: 'Adventure',    icon: '⛰️' },
  { id: 'food',       label: 'Food & Dining', icon: '🍳' },
  { id: 'culture',    label: 'Art & Culture', icon: '🏛️' },
  { id: 'relaxation', label: 'Relaxation',    icon: '🏖️' },
];

const LOADING_STEPS = [
  'Analyzing destination data…',
  'Crafting your day-by-day timeline…',
  'Finding best restaurants & activities…',
  'Checking optimal weather windows…',
  'Finalizing your packing list…',
];

const CreateTrip = () => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [companion, setCompanion] = useState('solo');
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleInterest = (id) =>
    setInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const startLoadingCycle = () => {
    setLoading(true); setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => { if (prev < LOADING_STEPS.length - 1) return prev + 1; clearInterval(interval); return prev; });
    }, 2000);
    return interval;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!destination || !startDate || !endDate) { setError('Please fill in destination and travel dates.'); return; }
    if (new Date(startDate) > new Date(endDate)) { setError('Start date cannot be after end date.'); return; }
    const intervalId = startLoadingCycle();
    try {
      const newTrip = await tripService.createTrip({ destination, startDate, endDate, budgetLimit: budgetLimit ? Number(budgetLimit) : 0, companion, interests });
      clearInterval(intervalId); navigate(`/trips/${newTrip._id}`);
    } catch (err) {
      clearInterval(intervalId); setLoading(false);
      setError(err.response?.data?.message || 'Failed to generate trip. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[72vh] items-center justify-center space-y-8 text-center animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full border border-indigo-100 animate-spin-slow" />
          <div className="absolute h-20 w-20 rounded-full border border-indigo-200 animate-spin" style={{animationDuration:'2s',animationDirection:'reverse'}} />
          <div className="absolute h-12 w-12 rounded-full bg-indigo-50" />
          <Loader2 className="h-8 w-8 animate-spin text-brand-indigo relative z-10" />
        </div>
        <div className="space-y-2 max-w-xs">
          <h3 className="font-display text-2xl font-black text-slate-900">Crafting Your Itinerary</h3>
          <p className="text-brand-indigo text-sm font-semibold">{LOADING_STEPS[loadingStep]}</p>
          <p className="text-slate-400 text-xs">This may take up to 15 seconds…</p>
        </div>
        <div className="flex gap-2">
          {LOADING_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= loadingStep ? 'w-5 bg-brand-indigo' : 'w-1.5 bg-slate-200'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-7 animate-fade-in">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-indigo mb-1">AI Trip Planner</p>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900">Craft a New Journey</h1>
        <p className="text-slate-400 text-sm mt-2">Tell us your travel details and AI will build a full day-by-day itinerary.</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Travel Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <h2 className="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Travel Details</h2>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
              <MapPin className="h-3.5 w-3.5 text-brand-indigo" /> Destination
            </label>
            <input type="text" required value={destination} onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Kyoto, Japan or Amalfi Coast, Italy"
              className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <Calendar className="h-3.5 w-3.5 text-brand-indigo" /> Start Date
              </label>
              <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                <Calendar className="h-3.5 w-3.5 text-brand-indigo" /> End Date
              </label>
              <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
              <DollarSign className="h-3.5 w-3.5 text-brand-amber" /> Budget Limit
              <span className="normal-case text-slate-400 font-normal">(optional)</span>
            </label>
            <input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)}
              placeholder="e.g. 1500 (leave blank for unlimited)"
              className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
          </div>
        </div>

        {/* Companion */}
        <div className="space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-indigo" /> Who are you traveling with?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COMPANIONS.map(({ id, label, desc, emoji }) => {
              const selected = companion === id;
              return (
                <button key={id} type="button" onClick={() => setCompanion(id)}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    selected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                  }`}>
                  <span className="text-2xl block mb-2">{emoji}</span>
                  <span className={`text-sm font-bold block ${selected ? 'text-brand-indigo' : 'text-slate-800'}`}>{label}</span>
                  <span className="text-xs text-slate-400">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="h-4 w-4 text-brand-violet" /> Travel interests
            <span className="text-xs font-normal text-slate-400">(select all that apply)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INTERESTS.map(({ id, label, icon }) => {
              const selected = interests.includes(id);
              return (
                <button key={id} type="button" onClick={() => toggleInterest(id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2.5 ${
                    selected ? 'bg-violet-50 border-violet-200 shadow-sm' : 'bg-white border-slate-200 hover:border-violet-200 hover:bg-violet-50/30'
                  }`}>
                  <span className="text-3xl">{icon}</span>
                  <span className={`text-xs font-bold ${selected ? 'text-brand-violet' : 'text-slate-500'}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit"
          className="btn-primary w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base cursor-pointer">
          <Plane className="h-5 w-5" /> Craft Trip with AI <Sparkles className="h-4 w-4 animate-pulse" />
        </button>
      </form>
    </div>
  );
};

export default CreateTrip;
