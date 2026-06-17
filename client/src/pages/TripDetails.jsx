import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import tripService from '../services/tripService';
import MapView from '../components/MapView';
import ChatAssistant from '../components/ChatAssistant';
import {
  Calendar, Users, DollarSign, ListChecks, Compass, ArrowLeft,
  ChevronRight, Plus, Trash2, CheckSquare, Square, Utensils,
  MapPin, Car, Home, Tag, Loader2, AlertCircle, HelpCircle,
  CloudSun, Coins, Printer, Sparkles
} from 'lucide-react';
import { formatDate, formatCurrency, getDaysCount } from '../utils/formatters';
import { exportToICS } from '../utils/calendarGenerator';

const CATEGORY_META = {
  Sightseeing: { icon: Compass,    pill: 'pill-cyan',    dot: '#0891b2', color: 'bg-cyan-500' },
  Food:        { icon: Utensils,   pill: 'pill-amber',   dot: '#d97706', color: 'bg-amber-500' },
  Transport:   { icon: Car,        pill: 'pill-violet',  dot: '#7c3aed', color: 'bg-violet-500' },
  Lodging:     { icon: Home,       pill: 'pill-emerald', dot: '#059669', color: 'bg-emerald-500' },
  Activities:  { icon: Tag,        pill: 'pill-teal',    dot: '#0d9488', color: 'bg-teal-500' },
  Other:       { icon: HelpCircle, pill: 'pill-gray',    dot: '#64748b', color: 'bg-slate-500' },
};

const TripDetails = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('itinerary');
  const [selectedDay, setSelectedDay] = useState(1);
  const [budgetTitle, setBudgetTitle] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('Activities');
  const [budgetDate, setBudgetDate] = useState('');
  const [addingBudget, setAddingBudget] = useState(false);

  // Live Weather States
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [weatherAlerts, setWeatherAlerts] = useState([]);

  // Live Currency Conversion States
  const [rates, setRates] = useState({ USD: 1 });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Group Splitter States
  const [newMemberName, setNewMemberName] = useState('');
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseSplitWith, setExpenseSplitWith] = useState([]);

  // Booklet Customizer States
  const [bookletCoverPhoto, setBookletCoverPhoto] = useState('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80');
  const [bookletTheme, setBookletTheme] = useState('minimal'); // 'minimal', 'adventure', 'retro', 'sleek-dark'
  const [showNotes, setShowNotes] = useState(true);
  const [showBudget, setShowBudget] = useState(true);
  const [showPacking, setShowPacking] = useState(true);
  const [personalNotes, setPersonalNotes] = useState('');

  const COVER_PHOTOS = [
    { name: 'Ocean/Travel', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80' },
    { name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80' },
    { name: 'Kyoto Alley', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80' },
    { name: 'Retro Train', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80' }
  ];

  const getThemeClass = () => {
    switch (bookletTheme) {
      case 'adventure':
        return 'font-sans bg-emerald-50/20 text-emerald-950 border border-emerald-300 p-8 max-w-4xl mx-auto rounded-3xl';
      case 'retro':
        return 'font-mono bg-amber-50/15 text-amber-950 border border-amber-300 p-8 max-w-4xl mx-auto rounded-3xl';
      case 'sleek-dark':
        return 'font-sans bg-slate-900 text-slate-100 border border-slate-700 p-8 max-w-4xl mx-auto rounded-3xl';
      default:
        return 'font-serif bg-white text-slate-900 border border-slate-200 p-8 max-w-4xl mx-auto rounded-3xl shadow-sm';
    }
  };

  const getHeadingThemeClass = () => {
    switch (bookletTheme) {
      case 'adventure': return 'text-emerald-700 border-emerald-300';
      case 'retro': return 'text-amber-800 border-dashed border-amber-300';
      case 'sleek-dark': return 'text-indigo-400 border-slate-700';
      default: return 'text-slate-800 border-slate-300';
    }
  };

  const getGroupBalances = () => {
    const members = trip?.groupMembers || [];
    if (members.length === 0) return [];

    // Initialize net balances (positive means you are owed money, negative means you owe money)
    const netBalances = {};
    members.forEach(m => { netBalances[m] = 0; });

    trip.budgetLedger?.forEach(item => {
      if (!item.paidBy || !item.splitWith || item.splitWith.length === 0) return;
      const payer = item.paidBy;
      const sharers = item.splitWith;
      const shareAmount = item.amount / sharers.length;

      // The payer gets back the share of everyone else
      if (netBalances[payer] !== undefined) {
        netBalances[payer] += item.amount;
      }
      
      // Each sharer owes their share
      sharers.forEach(s => {
        if (netBalances[s] !== undefined) {
          netBalances[s] -= shareAmount;
        }
      });
    });

    // Simplify debts (Greedy algorithm)
    const debtors = [];
    const creditors = [];

    Object.entries(netBalances).forEach(([name, bal]) => {
      const rounded = Math.round(bal * 100) / 100;
      if (rounded < -0.01) {
        debtors.push({ name, amount: -rounded });
      } else if (rounded > 0.01) {
        creditors.push({ name, amount: rounded });
      }
    });

    const transfers = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const amountToTransfer = Math.min(debtor.amount, creditor.amount);

      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: amountToTransfer
      });

      debtor.amount -= amountToTransfer;
      creditor.amount -= amountToTransfer;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    return transfers;
  };

  // Fetch Trip Details
  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        const data = await tripService.getTripById(id);
        setTrip(data);
        if (data.startDate) setBudgetDate(data.startDate.split('T')[0]);
      } catch { setError('Failed to load trip details.'); }
      finally { setLoading(false); }
    };
    fetchTripDetails();
  }, [id]);

  // Fetch Destination Weather
  useEffect(() => {
    if (!trip?.destination) return;
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(false);
      try {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(trip.destination)}?format=j1`);
        if (res.ok) {
          const data = await res.json();
          setWeatherData(data);

          // Weather Packing Advisor Alerts
          const desc = data.current_condition?.[0]?.weatherDesc?.[0]?.value?.toLowerCase() || '';
          const temp = parseFloat(data.current_condition?.[0]?.temp_C) || 20;
          const alerts = [];

          if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle') || desc.includes('snow') || desc.includes('thunder')) {
            alerts.push('🌧️ Rain forecast: Umbrella and waterproof jacket recommended.');
          }
          if (temp > 28) {
            alerts.push('☀️ High temperature advisor: Pack breathable garments, swimwear, and sunscreen (SPF 50).');
          }
          if (temp < 12) {
            alerts.push('❄️ Cold forecast: Layered winter wear, a thermal jacket, and gloves recommended.');
          }
          setWeatherAlerts(alerts);
        } else {
          setWeatherError(true);
        }
      } catch {
        setWeatherError(true);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [trip?.destination]);

  // Fetch Exchange Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data.rates) {
            setRates(data.rates);
          }
        }
      } catch (err) {
        console.error('Failed to load live exchange rates:', err);
      }
    };
    fetchRates();
  }, []);

  const handleTogglePacking = async (itemId) => {
    try {
      const updated = trip.packingList.map((item) => item._id === itemId ? { ...item, packed: !item.packed } : item);
      setTrip({ ...trip, packingList: updated });
      await tripService.togglePackingItem(trip._id, itemId);
    } catch { alert('Failed to update packing checklist'); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault(); if (!budgetTitle || !budgetAmount) return;
    try {
      setAddingBudget(true);
      const updatedTrip = await tripService.addBudgetItem(trip._id, { 
        title: budgetTitle, 
        amount: Number(budgetAmount), 
        category: budgetCategory, 
        date: budgetDate,
        paidBy: expensePaidBy || undefined,
        splitWith: expenseSplitWith.length > 0 ? expenseSplitWith : undefined
      });
      setTrip(updatedTrip); setBudgetTitle(''); setBudgetAmount('');
      setExpensePaidBy(''); setExpenseSplitWith([]);
    } catch { alert('Failed to add expense'); }
    finally { setAddingBudget(false); }
  };

  const handleRemoveExpense = async (itemId) => {
    try { const updatedTrip = await tripService.deleteBudgetItem(trip._id, itemId); setTrip(updatedTrip); }
    catch { alert('Failed to delete expense'); }
  };

  // Weather Advisor - Append Suggestion to Packing List
  const handleAddSuggestedItem = async (itemName) => {
    if (!trip) return;
    // Check if item already exists
    if (trip.packingList.some(i => i.item.toLowerCase() === itemName.toLowerCase())) {
      alert(`"${itemName}" is already in your checklist.`);
      return;
    }
    try {
      const updatedTrip = await tripService.updateTrip(trip._id, {
        packingList: [...trip.packingList, { item: itemName, packed: false }]
      });
      setTrip(updatedTrip);
      alert(`Added "${itemName}" to packing list!`);
    } catch {
      alert('Failed to add suggested item to packing list.');
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-10 w-10 border-2 border-indigo-200 border-t-brand-indigo rounded-full animate-spin" />
    </div>
  );

  if (error || !trip) return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
      <h2 className="font-display text-xl font-bold text-slate-900">Something went wrong</h2>
      <p className="text-slate-400 text-sm">{error || 'Trip not found.'}</p>
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-brand-indigo hover:underline text-sm font-semibold">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
    </div>
  );

  const duration = getDaysCount(trip.startDate, trip.endDate);
  const ledgerSum = trip.budgetLedger?.reduce((s, i) => s + i.amount, 0) || 0;
  const activitiesSum = trip.itinerary?.reduce((s, day) => s + (day.activities?.reduce((ds, a) => ds + a.cost, 0) || 0), 0) || 0;
  const totalCostUSD = ledgerSum + activitiesSum;

  // Currency Converter Helpers
  const convertCost = (usdVal) => {
    const rate = rates[selectedCurrency] || 1;
    return usdVal * rate;
  };

  const getCurrencySymbol = () => {
    switch (selectedCurrency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'INR': return '₹';
      case 'CAD': return 'C$';
      default: return '$';
    }
  };

  const formattedCost = (usdVal) => {
    const converted = convertCost(usdVal);
    const symbol = getCurrencySymbol();
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const percentSpent = trip.budgetLimit > 0 ? (totalCostUSD / trip.budgetLimit) * 100 : 0;
  const isOverBudget = totalCostUSD > trip.budgetLimit && trip.budgetLimit > 0;
  const totalPackingItems = trip.packingList?.length || 0;
  const packedItemsCount = trip.packingList?.filter((i) => i.packed).length || 0;
  const packingPercentage = totalPackingItems > 0 ? Math.round((packedItemsCount / totalPackingItems) * 100) : 0;
  const currentDayData = trip.itinerary?.find((day) => day.dayNumber === selectedDay);

  // Compute category expenditure totals for Expense Analytics
  const getCategorySpends = () => {
    const breakdown = {
      Sightseeing: 0,
      Food: 0,
      Transport: 0,
      Lodging: 0,
      Activities: 0,
      Other: 0
    };

    trip.budgetLedger?.forEach(item => {
      const cat = item.category || 'Other';
      if (breakdown[cat] !== undefined) breakdown[cat] += item.amount;
      else breakdown.Other += item.amount;
    });

    trip.itinerary?.forEach(day => {
      day.activities?.forEach(act => {
        const cat = act.category || 'Sightseeing';
        if (breakdown[cat] !== undefined) breakdown[cat] += act.cost;
        else breakdown.Other += act.cost;
      });
    });

    return breakdown;
  };

  const categorySpends = getCategorySpends();
  const maxCategorySpend = Math.max(...Object.values(categorySpends), 1);

  const TABS = [
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'budget',    label: 'Budget & Analytics' },
    { id: 'packing',   label: `Packing & Weather (${packingPercentage}%)` },
  ];

  return (
    <div className="space-y-7 animate-fade-in max-w-6xl mx-auto pb-16">
      
      {/* Printable Booklet (hidden on screen, visible on print) */}
      <div className={`hidden print:block space-y-8 ${getThemeClass()}`}>
        {/* Cover Page */}
        <div className={`border-b-2 pb-5 text-center break-after-page ${getHeadingThemeClass()}`}>
          <div className="h-64 w-full rounded-2xl overflow-hidden mb-6 border">
            <img src={bookletCoverPhoto} alt="Cover" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-4xl font-black">{trip.destination}</h1>
          <p className="font-bold uppercase tracking-widest text-xs mt-2 opacity-80">Personal Travel Booklet · TripCraft AI</p>
          <div className="flex justify-center gap-6 text-sm mt-3 font-semibold opacity-95">
            <span>📅 {formatDate(trip.startDate)} – {formatDate(trip.endDate)} ({duration} days)</span>
            <span className="capitalize">👥 {trip.companion} Trip</span>
            <span>💰 Total Budget: {formatCurrency(trip.budgetLimit)}</span>
          </div>
        </div>

        {/* Print Timeline */}
        <div className="space-y-8 mt-8">
          <h2 className={`text-xl font-bold border-b pb-2 ${getHeadingThemeClass()}`}>Daily Travel Schedule</h2>
          {trip.itinerary?.map((day) => (
            <div key={day.dayNumber} className="space-y-3 break-inside-avoid pt-2">
              <h3 className="font-display font-bold text-base bg-slate-50/10 px-3 py-1.5 rounded-lg border border-slate-200/20">
                Day {day.dayNumber} — {formatDate(day.date)}
              </h3>
              <div className="divide-y divide-slate-100/20 pl-4 space-y-3">
                {day.activities?.map((act, idx) => (
                  <div key={idx} className="flex justify-between gap-4 pt-3 first:pt-1">
                    <div className="space-y-1">
                      <p className="text-sm font-bold">
                        <span className="font-mono mr-2">[{act.time}]</span>
                        {act.title}
                      </p>
                      <p className="text-xs opacity-75 leading-relaxed max-w-2xl">{act.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold bg-slate-100/10 px-2 py-0.5 rounded-sm">{act.category}</span>
                      <p className="text-xs font-bold mt-1">{act.cost > 0 ? formatCurrency(act.cost) : 'Free'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Print Packing & Budget */}
        <div className={`grid grid-cols-2 gap-8 break-inside-avoid pt-10 border-t ${getHeadingThemeClass()}`}>
          {showPacking && (
            <div>
              <h2 className="text-base font-bold border-b pb-2">Packing Checklist</h2>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                {trip.packingList?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 border rounded-sm inline-block shrink-0 border-current" />
                    <span className={item.packed ? 'line-through opacity-50' : ''}>{item.item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {showBudget && (
            <div>
              <h2 className="text-base font-bold border-b pb-2">Expense Summary</h2>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between"><span>Itinerary Activities:</span><span className="font-bold">{formatCurrency(activitiesSum)}</span></div>
                {trip.budgetLedger?.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.title} {item.paidBy ? `(Paid by ${item.paidBy})` : ''}:</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total Expenses Spent:</span>
                  <span>{formatCurrency(totalCostUSD)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personal Notes (Printed if toggled) */}
        {showNotes && personalNotes && (
          <div className={`space-y-3 pt-8 border-t break-inside-avoid ${getHeadingThemeClass()}`}>
            <h2 className="text-base font-bold pb-2">Traveler Notes</h2>
            <p className="text-xs opacity-80 whitespace-pre-line leading-relaxed">{personalNotes}</p>
          </div>
        )}
      </div>

      {/* Screen Interface (hidden on print) */}
      <div className="print:hidden space-y-7">
        <div className="flex justify-between items-center">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => exportToICS(trip)}
              className="btn-indigo inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5" /> Export to Calendar
            </button>
            <button
              onClick={() => window.print()}
              className="btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" /> Print Booklet / PDF
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="relative bg-white rounded-3xl p-6 sm:p-8 overflow-hidden border border-slate-200 shadow-sm">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-50/50 rounded-full pointer-events-none" />
          <div className="relative flex flex-col md:flex-row justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-indigo mb-1">AI-Crafted Itinerary</p>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900">{trip.destination}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-brand-indigo" />{formatDate(trip.startDate)} – {formatDate(trip.endDate)} <span className="text-slate-400">({duration} days)</span></span>
                <span className="flex items-center gap-1.5 capitalize"><Users className="h-4 w-4 text-brand-indigo" />{trip.companion} Trip</span>
              </div>
            </div>
            
            {/* Expense Overview Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 min-w-[220px] shrink-0">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-slate-400">Total Expenses</p>
                {/* Live Currency Selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px] shadow-2xs">
                  <Coins className="h-3 w-3 text-brand-indigo" />
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="bg-transparent border-none focus:outline-none font-bold text-slate-600 cursor-pointer"
                  >
                    {['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD'].map(cur => (
                      <option key={cur} value={cur}>{cur}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-black text-slate-900">{formattedCost(totalCostUSD)}</span>
                {trip.budgetLimit > 0 && <span className="text-xs text-slate-400">/ {formattedCost(trip.budgetLimit)}</span>}
              </div>
              {trip.budgetLimit > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-indigo to-brand-violet'}`}
                      style={{ width: `${Math.min(percentSpent, 100)}%` }} />
                  </div>
                  <p className={`text-[10px] font-bold ${isOverBudget ? 'text-rose-500' : 'text-slate-400'}`}>
                    {isOverBudget ? '⚠ Over Budget' : `${Math.round(percentSpent)}% spent`}
                  </p>
                </div>
              )}
            </div>
          </div>
          {trip.interests?.length > 0 && (
            <div className="relative flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100">
              {trip.interests.map((interest, i) => (
                <span key={i} className="pill-indigo text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">{interest}</span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-slate-200 shadow-sm w-fit">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === id ? 'nav-link-active' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab 1: Itinerary */}
        {activeTab === 'itinerary' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Days Left Bar Selector */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm self-start">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 mb-3">Days</p>
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
                {trip.itinerary?.map((day) => {
                  const active = selectedDay === day.dayNumber;
                  return (
                    <button key={day.dayNumber} onClick={() => setSelectedDay(day.dayNumber)}
                      className={`shrink-0 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex justify-between items-center cursor-pointer transition-all ${active ? 'nav-link-active' : 'nav-link'}`}>
                      <span>Day {day.dayNumber}</span>
                      {active && <ChevronRight className="h-3.5 w-3.5 hidden lg:block text-brand-indigo" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Middle Schedule Timeline */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-indigo" /> Day {selectedDay} — Schedule
                </h2>
                {currentDayData?.date && <span className="text-xs text-slate-400">{formatDate(currentDayData.date)}</span>}
              </div>

              {!currentDayData?.activities?.length ? (
                <div className="bg-white rounded-2xl p-10 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">No activities planned.</div>
              ) : (
                <div className="relative pl-6 ml-2 space-y-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                  {currentDayData.activities.map((act, idx) => {
                    const meta = CATEGORY_META[act.category] || CATEGORY_META.Other;
                    const Icon = meta.icon;
                    return (
                      <div key={act._id || idx} className="relative group animate-slide-up">
                        <div className="absolute -left-[28px] top-4 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs"
                          style={{ background: meta.dot }} />
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all flex gap-4">
                          <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${meta.pill}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-brand-indigo transition-colors">{act.title}</h3>
                              <span className="text-xs font-bold text-brand-indigo shrink-0">{act.cost > 0 ? formattedCost(act.cost) : 'Free'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                              <span>{act.time}</span><span>·</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${meta.pill}`}>{act.category}</span>
                            </div>
                            {act.description && <p className="text-xs text-slate-500 leading-relaxed mt-2">{act.description}</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Leaflet Map Visualizer */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-indigo" /> Daily Map Route
              </h2>
              <MapView destination={trip.destination} activities={currentDayData?.activities || []} />
            </div>
          </div>
        )}

        {/* Tab 2: Budget & Expense Analytics */}
        {activeTab === 'budget' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-start">
            
            {/* Ledger Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-brand-indigo" /> Expense Ledger ({selectedCurrency})
                </h2>
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-5 py-3.5">Description</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Amount</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {activitiesSum > 0 && (
                        <tr className="hover:bg-slate-50">
                          <td className="px-5 py-4"><p className="font-bold text-slate-900">Daily Activities</p><p className="text-xs text-slate-400">Auto-aggregated</p></td>
                          <td className="px-5 py-4"><span className="pill-indigo text-[10px] font-bold px-2.5 py-1 rounded-full">Activities</span></td>
                          <td className="px-5 py-4 font-bold text-slate-900">{formattedCost(activitiesSum)}</td>
                          <td className="px-5 py-4 text-right text-xs text-slate-300 italic">locked</td>
                        </tr>
                      )}
                      {!trip.budgetLedger?.length && activitiesSum === 0 ? (
                        <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-400 text-sm">No expenses logged yet.</td></tr>
                      ) : (
                        trip.budgetLedger?.map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">{item.title}</p>
                              {item.paidBy && <p className="text-[10px] text-brand-indigo font-bold mt-0.5">Paid by {item.paidBy}</p>}
                              {item.date && <p className="text-xs text-slate-400">{formatDate(item.date)}</p>}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${(CATEGORY_META[item.category] || CATEGORY_META.Other).pill}`}>
                                {item.category}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-900">{formattedCost(item.amount)}</td>
                            <td className="px-5 py-4 text-right">
                              <button onClick={() => handleRemoveExpense(item._id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {totalCostUSD > 0 && (
                      <tfoot className="border-t border-slate-200 bg-slate-50">
                        <tr>
                          <td colSpan="2" className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase">Total</td>
                          <td className="px-5 py-3.5 font-display font-black text-brand-indigo">{formattedCost(totalCostUSD)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Cost Category Analytics */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-display text-sm font-bold text-slate-900">Expense Category Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(categorySpends).map(([cat, amount]) => {
                    const percentage = totalCostUSD > 0 ? (amount / totalCostUSD) * 100 : 0;
                    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                            {cat}
                          </span>
                          <span>{formattedCost(amount)} ({Math.round(percentage)}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${meta.color} transition-all duration-500`}
                            style={{ width: `${(amount / maxCategorySpend) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Add Expense Form and Group Setup */}
            <div className="space-y-6">
              {/* Group Co-Travelers Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-indigo" /> Group Co-Travelers
                </h3>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Alice"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="input-dark flex-1 rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newMemberName.trim()) return;
                      if (trip.groupMembers?.includes(newMemberName.trim())) {
                        alert('Member already added.');
                        return;
                      }
                      const updatedMembers = [...(trip.groupMembers || []), newMemberName.trim()];
                      try {
                        const updated = await tripService.updateTrip(trip._id, { groupMembers: updatedMembers });
                        setTrip(updated);
                        setNewMemberName('');
                      } catch {
                        alert('Failed to add member.');
                      }
                    }}
                    className="btn-primary rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {trip.groupMembers?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {trip.groupMembers.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={async () => {
                            const updatedMembers = trip.groupMembers.filter(member => member !== m);
                            try {
                              const updated = await tripService.updateTrip(trip._id, { groupMembers: updatedMembers });
                              setTrip(updated);
                            } catch {
                              alert('Failed to remove member.');
                            }
                          }}
                          className="text-slate-400 hover:text-rose-500 font-bold ml-1 text-[10px] cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">No group members added. Add co-travelers to split expenses.</p>
                )}
              </div>

              {/* Add Expense Form */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2"><Plus className="h-4 w-4 text-brand-indigo" />Add Expense</h3>
                <form onSubmit={handleAddExpense} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Description</label>
                    <input type="text" required value={budgetTitle} onChange={(e) => setBudgetTitle(e.target.value)}
                      placeholder="e.g. Flight Tickets" className="input-dark w-full rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Amount (USD)</label>
                    <input type="number" required value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="e.g. 350" className="input-dark w-full rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Category</label>
                      <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} className="input-dark w-full rounded-xl px-3 py-2.5 text-xs">
                        {['Lodging','Transport','Food','Activities','Other'].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Date</label>
                      <input type="date" value={budgetDate} onChange={(e) => setBudgetDate(e.target.value)} className="input-dark w-full rounded-xl px-3 py-2.5 text-xs" />
                    </div>
                  </div>

                  {trip.groupMembers?.length > 0 && (
                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Paid By</label>
                        <select
                          value={expensePaidBy}
                          onChange={(e) => setExpensePaidBy(e.target.value)}
                          className="input-dark w-full rounded-xl px-3 py-2.5 text-xs"
                        >
                          <option value="">Select payer...</option>
                          {trip.groupMembers.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Split With</label>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                          {trip.groupMembers.map(m => {
                            const checked = expenseSplitWith.includes(m);
                            return (
                              <label key={m} className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    if (checked) {
                                      setExpenseSplitWith(prev => prev.filter(item => item !== m));
                                    } else {
                                      setExpenseSplitWith(prev => [...prev, m]);
                                    }
                                  }}
                                />
                                {m}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={addingBudget}
                    className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm cursor-pointer disabled:opacity-50 mt-1">
                    {addingBudget ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" />Log Expense</>}
                  </button>
                </form>
              </div>

              {/* Debt Balances Card */}
              {trip.groupMembers?.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-brand-violet" /> Simplified Group Balances
                  </h3>
                  
                  {getGroupBalances().length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {getGroupBalances().map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 text-xs font-semibold">
                          <span className="text-slate-600">
                            <span className="font-bold text-slate-800">{t.from}</span> owes <span className="font-bold text-slate-800">{t.to}</span>
                          </span>
                          <span className="text-brand-indigo font-bold bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">
                            {formattedCost(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">All debts settled or no group expenses logged.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Packing Assistant & Live Weather Advisor */}
        {activeTab === 'packing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-start">
            
            {/* Checklist */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-brand-indigo" /> Packing Assistant
                </h2>
                <span className="font-display text-sm font-bold text-brand-indigo">{packedItemsCount}/{totalPackingItems} packed</span>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
                <div className="flex justify-between text-xs text-slate-400"><span>Progress</span><span className="text-brand-indigo font-bold">{packingPercentage}%</span></div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-violet transition-all duration-500" style={{ width: `${packingPercentage}%` }} />
                </div>
              </div>
              {!totalPackingItems ? (
                <div className="bg-white rounded-2xl p-10 text-center text-slate-400 text-sm border border-slate-100">No packing items compiled.</div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm divide-y divide-slate-50">
                  {trip.packingList?.map((item) => (
                    <button key={item._id} onClick={() => handleTogglePacking(item._id)}
                      className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                      {item.packed
                        ? <CheckSquare className="h-5 w-5 text-brand-indigo shrink-0" />
                        : <Square className="h-5 w-5 text-slate-300 shrink-0 group-hover:text-brand-indigo transition-colors" />
                      }
                      <span className={`text-sm transition-colors ${item.packed ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{item.item}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Weather Advisor & Live Feed */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CloudSun className="h-4 w-4 text-brand-indigo animate-pulse" /> Live Weather Feed
                </h3>

                {weatherLoading ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 text-brand-indigo animate-spin mb-2" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Querying weather...</span>
                  </div>
                ) : weatherError || !weatherData ? (
                  <p className="text-xs text-slate-400">Weather data unavailable for this location.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Current Condition */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <p className="font-display text-2xl font-black text-slate-800">
                          {weatherData.current_condition?.[0]?.temp_C}°C
                        </p>
                        <p className="text-xs text-slate-400 capitalize mt-0.5">
                          {weatherData.current_condition?.[0]?.weatherDesc?.[0]?.value || 'Partly Cloudy'}
                        </p>
                      </div>
                      <div className="text-right text-[10px] text-slate-400">
                        <p>Wind: {weatherData.current_condition?.[0]?.windspeedKmph} km/h</p>
                        <p>Humidity: {weatherData.current_condition?.[0]?.humidity}%</p>
                      </div>
                    </div>

                    {/* 3-day Forecast */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3-Day Forecast</p>
                      {weatherData.weather?.slice(0, 3).map((w, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-600">
                          <span className="font-semibold">{w.date}</span>
                          <span>
                            {w.mintempC}°C – <span className="font-bold text-slate-800">{w.maxtempC}°C</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Weather Advisor Packing Suggestions */}
              {weatherAlerts.length > 0 && (
                <div className="bg-brand-indigo/5 border border-brand-indigo/15 rounded-3xl p-5 space-y-3">
                  <h4 className="font-display text-xs font-bold text-brand-indigo flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Packing Suggestions
                  </h4>
                  <div className="space-y-3">
                    {weatherAlerts.map((alertText, idx) => {
                      // Extract recommended item name dynamically
                      let itemToSuggest = 'Umbrella';
                      if (alertText.toLowerCase().includes('sunscreen')) itemToSuggest = 'Sunscreen';
                      if (alertText.toLowerCase().includes('jacket')) itemToSuggest = 'Winter Jacket';

                      return (
                        <div key={idx} className="text-xs text-slate-600 space-y-1.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                          <p>{alertText}</p>
                          <button
                            onClick={() => handleAddSuggestedItem(itemToSuggest)}
                            className="text-[10px] text-brand-indigo font-bold hover:underline cursor-pointer flex items-center gap-1 mt-1"
                          >
                            + Add {itemToSuggest} to Packing Checklist
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booklet Designer Options (Screen Only) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-indigo">
            <Printer className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">Booklet Designer & Customizer</h3>
            <p className="text-[10px] text-slate-400">Configure theme, cover photo, and print settings for PDF export</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Booklet Theme</label>
            <select value={bookletTheme} onChange={(e) => setBookletTheme(e.target.value)}
              className="input-dark w-full rounded-xl px-3 py-2.5 text-xs">
              <option value="minimal">Minimalist Classic</option>
              <option value="adventure">Outdoor Adventure</option>
              <option value="retro">Vintage Retro</option>
              <option value="sleek-dark">Sleek Dark Mode</option>
            </select>
          </div>

          {/* Sections Toggles */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Print Sections</label>
            <div className="flex flex-col gap-2 pt-1 font-semibold text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showPacking} onChange={() => setShowPacking(!showPacking)} /> Packing Checklist</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showBudget} onChange={() => setShowBudget(!showBudget)} /> Expense Summary</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showNotes} onChange={() => setShowNotes(!showNotes)} /> Personal Travel Notes</label>
            </div>
          </div>

          {/* Cover Selector */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Cover Background</label>
            <div className="grid grid-cols-2 gap-2">
              {COVER_PHOTOS.map((pic, idx) => (
                <button key={idx} type="button" onClick={() => setBookletCoverPhoto(pic.url)}
                  className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all truncate ${bookletCoverPhoto === pic.url ? 'border-brand-indigo bg-indigo-50/50 text-brand-indigo' : 'border-slate-200 hover:border-slate-300'}`}>
                  {pic.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Notes */}
          <div className="md:col-span-4 space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Personal Travel Notes (Printed inside booklet)</label>
            <textarea value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)}
              placeholder="Write flight numbers, hotel reservation confirmations, emergency contacts, or packing checklist notes to print..."
              rows="3" className="input-dark w-full rounded-xl px-3 py-2.5 text-xs" />
          </div>
        </div>
      </div>

      {/* Floating AI Chat Assistant */}
      <ChatAssistant tripId={trip._id} onTripUpdated={(updatedTrip) => setTrip(updatedTrip)} />
    </div>
  );
};

export default TripDetails;
