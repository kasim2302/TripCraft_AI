import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import itineraryService from '../services/itineraryService';
import {
  Plane, Compass, Share2, ListChecks, Plus, Loader2, Upload,
  FileText, Check, Send, AlertCircle, Copy, ArrowRight,
  Eye, Search, SlidersHorizontal, Sparkles, MapPin,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

const DEST_IMAGES = {
  default: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=75',
  japan:   'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=75',
  bali:    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=75',
  greece:  'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=75',
  paris:   'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=75',
  london:  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=75',
};

function getDestImage(dest = '') {
  const d = dest.toLowerCase();
  for (const key of Object.keys(DEST_IMAGES)) {
    if (d.includes(key)) return DEST_IMAGES[key];
  }
  return DEST_IMAGES.default;
}

function StatCard({ title, value, icon: Icon, bg, iconCls, accent, description }) {
  return (
    <div className={`rounded-2xl p-5 border ${bg} hover:-translate-y-0.5 transition-transform duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`font-display text-2xl font-black ${accent}`}>{value}</span>
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileType, setUploadedFileType] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [activeShareId, setActiveShareId] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        setLoading(true);
        const data = await itineraryService.getItineraries();
        setItineraries(data);
        if (data.length > 0) setActiveShareId(data[0].shareId);
      } catch { setError('Failed to load travel history.'); }
      finally { setLoading(false); }
    };
    fetchItineraries();
  }, []);

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); setUploadError(''); if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]); };
  const handleFileSelect = (e) => { setUploadError(''); if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]); };

  const validateAndSetFile = (file) => {
    if (!['application/pdf','image/png','image/jpeg','image/jpg'].includes(file.type)) { setUploadError('Invalid format. Use PDF, PNG, or JPEG.'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('File exceeds 10MB limit.'); return; }
    setSelectedFile(file); setExtractedData(null); setUploadedFileUrl('');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault(); if (!selectedFile) return;
    setIsUploading(true); setUploadProgress(0); setUploadError('');
    const formData = new FormData(); formData.append('file', selectedFile);
    try {
      const result = await itineraryService.uploadBooking(formData, (pe) => setUploadProgress(Math.round((pe.loaded * 100) / pe.total)));
      setUploadedFileUrl(result.fileUrl); setUploadedFileType(result.fileType); setExtractedData(result.extractedData); setSelectedFile(null);
    } catch (err) { setUploadError(err.response?.data?.message || 'Upload failed.'); }
    finally { setIsUploading(false); }
  };

  const handleGenerateItinerary = async () => {
    if (!extractedData) return; setIsGenerating(true);
    try {
      const bookingInfo = {
        departure: extractedData.departure || 'San Francisco',
        arrival: extractedData.arrival || extractedData.destination || 'Tokyo, Japan',
        hotel: extractedData.hotel || 'Grand Resort',
        checkIn: extractedData.checkIn || extractedData.date || new Date().toISOString().split('T')[0],
        checkOut: extractedData.checkOut || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      };
      const newItinerary = await itineraryService.generateItineraryFromBooking(bookingInfo);
      navigate(`/share/${newItinerary.shareId}`);
    } catch { alert('Itinerary generation failed.'); }
    finally { setIsGenerating(false); }
  };

  const getShareLink = () => `${window.location.origin}/share/${activeShareId}`;
  const handleCopyLink = () => { if (!activeShareId) return; navigator.clipboard.writeText(getShareLink()); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleSendEmail = (e) => {
    e.preventDefault(); if (!inviteEmail || !activeShareId) return;
    setSendingEmail(true);
    setTimeout(() => { setSendingEmail(false); setEmailSent(true); setInviteEmail(''); setTimeout(() => setEmailSent(false), 3000); }, 1200);
  };

  const filteredItineraries = itineraries
    .filter((it) => it.destination.toLowerCase().includes(searchQuery.toLowerCase()) || it.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortBy === 'title' ? a.title.localeCompare(b.title) : new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-indigo mb-1">Welcome back 👋</p>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900">AI Travel Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Upload bookings, generate itineraries, and share your adventures.</p>
        </div>
        <Link to="/create-trip" className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm shrink-0">
          <Plus className="h-4 w-4" /> Plan Custom Trip
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Planned Trips"      value={itineraries.length}                                         icon={Plane}      bg="bg-indigo-50 border-indigo-100"   iconCls="bg-indigo-100"   accent="text-brand-indigo"   description="Total itineraries" />
        <StatCard title="Latest Destination" value={itineraries.length > 0 ? itineraries[0].destination : '—'} icon={MapPin}      bg="bg-teal-50 border-teal-100"       iconCls="bg-teal-100"     accent="text-brand-teal"     description="Most recent trip" />
        <StatCard title="Shareable Plans"    value={itineraries.length}                                         icon={Share2}     bg="bg-violet-50 border-violet-100"   iconCls="bg-violet-100"   accent="text-brand-violet"   description="Public sharing on" />
        <StatCard title="OCR Engine"         value="Online"                                                     icon={ListChecks} bg="bg-emerald-50 border-emerald-100" iconCls="bg-emerald-100"  accent="text-brand-emerald"  description="Booking scanner ready" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

        {/* Left: History */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="font-display text-xl font-bold text-slate-900">Itinerary History</h2>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input type="text" placeholder="Search..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-dark w-40 pl-8 pr-3 py-2 rounded-xl text-xs" />
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs shadow-sm">
                <SlidersHorizontal className="h-3.5 w-3.5 text-brand-indigo" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-slate-600 font-semibold cursor-pointer text-xs">
                  <option value="newest">Latest</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          </div>

          {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 border-2 border-indigo-200 border-t-brand-indigo rounded-full animate-spin" />
            </div>
          ) : filteredItineraries.length === 0 ? (
            <div className="bg-white rounded-3xl p-14 text-center border border-slate-100 shadow-sm">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-brand-indigo mb-4">
                <Compass className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 mb-2">No Itineraries Yet</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                {searchQuery ? 'No match for your search.' : 'Upload a booking document to generate your first AI itinerary.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {filteredItineraries.map((it) => (
                <div key={it._id} className="group relative rounded-3xl overflow-hidden border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 bg-white shadow-sm">
                  <div className="absolute inset-0">
                    <img src={getDestImage(it.destination)} alt={it.destination}
                      className="w-full h-full object-cover opacity-15 group-hover:opacity-25 group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-white/60" />
                  </div>
                  <div className="relative p-5 flex flex-col h-48">
                    <div>
                      <span className="pill-indigo text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        {formatDate(it.createdAt)}
                      </span>
                      <h3 className="font-display text-base font-bold text-slate-900 mt-2 line-clamp-1 group-hover:text-brand-indigo transition-colors">
                        {it.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                        <MapPin className="h-3 w-3 text-brand-indigo shrink-0" />{it.destination}
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs text-slate-400 font-medium">{it.itinerary?.length || 0} day schedule</span>
                      <Link to={`/share/${it.shareId}`}
                        className="flex items-center gap-1 text-xs font-bold text-brand-indigo hover:text-brand-indigo-dark transition-colors">
                        View <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Upload + Share */}
        <div className="space-y-6">

          {/* Upload Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-indigo">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">Upload Booking</h3>
                <p className="text-[10px] text-slate-400">PDF, PNG, JPG · Max 10MB</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag}
                onDragOver={handleDrag} onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                  dragActive ? 'border-brand-indigo bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center gap-2.5">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${dragActive ? 'bg-indigo-100 text-brand-indigo' : 'bg-slate-100 text-slate-400'}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedFile ? selectedFile.name : 'Drop file or click to browse'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF · PNG · JPG · JPEG</p>
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{uploadError}
                </div>
              )}

              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-500"><span>Uploading…</span><span>{uploadProgress}%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-indigo to-brand-violet rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {selectedFile && !isUploading && (
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs cursor-pointer">
                  <Upload className="h-3.5 w-3.5" /> Upload & Scan
                </button>
              )}
            </form>

            {uploadedFileUrl && (
              <div className="border-t border-slate-100 pt-4 space-y-3 animate-slide-up">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-emerald block">✓ Document Scanned</span>
                {uploadedFileType.startsWith('image/') ? (
                  <div className="rounded-xl overflow-hidden border border-slate-100 h-24 bg-slate-50 flex items-center justify-center">
                    <img src={uploadedFileUrl} alt="Preview" className="object-contain max-h-full max-w-full" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">PDF Document</p>
                      <p className="text-[10px] text-slate-400">Booking receipt</p>
                    </div>
                    <a href={uploadedFileUrl} target="_blank" rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {extractedData && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div><span className="text-slate-400">Type:</span> <span className="font-bold text-slate-800 capitalize">{extractedData.type}</span></div>
                      {extractedData.type === 'flight' ? (
                        <>
                          <div><span className="text-slate-400">Airline:</span> <span className="font-bold text-slate-800">{extractedData.airline || '—'}</span></div>
                          <div className="col-span-2"><span className="text-slate-400">Route:</span> <span className="font-bold text-slate-800">{extractedData.departure || '—'} → {extractedData.arrival || '—'}</span></div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-2"><span className="text-slate-400">Hotel:</span> <span className="font-bold text-slate-800">{extractedData.hotel || '—'}</span></div>
                          <div><span className="text-slate-400">In:</span> <span className="font-bold text-slate-800">{extractedData.checkIn || '—'}</span></div>
                          <div><span className="text-slate-400">Out:</span> <span className="font-bold text-slate-800">{extractedData.checkOut || '—'}</span></div>
                        </>
                      )}
                    </div>
                    <button onClick={handleGenerateItinerary} disabled={isGenerating}
                      className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs cursor-pointer disabled:opacity-50">
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5" />Generate Full Itinerary</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Share Card */}
          {itineraries.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-brand-violet">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">Share Itinerary</h3>
                  <p className="text-[10px] text-slate-400">Public link · No login needed</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Select Itinerary</label>
                  <select value={activeShareId} onChange={(e) => { setActiveShareId(e.target.value); setCopied(false); }}
                    className="input-dark w-full rounded-xl px-3 py-2.5 text-xs">
                    {itineraries.map((it) => (
                      <option key={it._id} value={it.shareId}>{it.destination} — {it.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Share Link</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={getShareLink()} className="input-dark flex-1 rounded-xl px-3 py-2.5 text-[10px] truncate" />
                    <button onClick={handleCopyLink}
                      className={`px-3 rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all text-xs ${copied ? 'bg-emerald-50 border border-emerald-200 text-brand-emerald' : 'btn-primary'}`}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  {copied && <p className="text-[10px] text-brand-emerald mt-1">Link copied!</p>}
                </div>

                <form onSubmit={handleSendEmail} className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Email Invite</label>
                  <div className="flex gap-2">
                    <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="friend@travel.com" className="input-dark flex-1 rounded-xl px-3 py-2.5 text-xs" />
                    <button type="submit" disabled={sendingEmail}
                      className="btn-violet px-3 rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-50">
                      {sendingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {emailSent && <div className="flex items-center gap-1.5 text-[10px] text-brand-emerald"><Check className="h-3 w-3" />Invite sent!</div>}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
