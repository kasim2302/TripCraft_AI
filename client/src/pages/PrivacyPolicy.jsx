import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Globe } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-indigo shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-black text-slate-900">Privacy Policy</h1>
            <p className="text-slate-400 text-xs mt-1">Last Updated: June 17, 2026</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8 text-slate-600 leading-relaxed text-sm">
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand-indigo" /> 1. Introduction
          </h2>
          <p>
            Welcome to TripCraft AI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, upload booking documents, or use our AI-powered travel planning services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-indigo" /> 2. Information We Collect
          </h2>
          <p>We collect information you provide directly to us when using our services:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500">
            <li><strong>Account Information:</strong> Name, email address, password, and profile preferences when you register.</li>
            <li><strong>Travel Booking Documents:</strong> PDFs, PNGs, and JPEGs of travel confirmations (e.g. flight tickets, hotel reservations) that you upload for OCR scanning.</li>
            <li><strong>Trip Information:</strong> Destinations, dates, budgets, companion specifications, travel interests, custom itinerary activities, and expense entries.</li>
            <li><strong>Chat Assistant Interactions:</strong> Conversational dialogue entries between you and our AI Travel Guide.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye className="h-4 w-4 text-brand-indigo" /> 3. How We Process Your Data
          </h2>
          <p>
            To provide automated travel itinerary parsing and conversational assistance, we use advanced machine learning models:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500">
            <li><strong>OCR Extraction:</strong> Local extraction tools (like Tesseract OCR and PDF-parse) scan your uploaded documents to translate image text into readable content.</li>
            <li><strong>AI Parsing:</strong> Text extracted from documents is sent securely to the **Google Gemini API** to generate structured itinerary elements.</li>
            <li><strong>Conversational Chat:</strong> Your chat messages and trip contexts are processed by the **Google Gemini API** to reply with concierge recommendations and execute timeline edits.</li>
          </ul>
          <p className="text-xs text-slate-400 italic">
            Note: We do not sell your personal details or travel documents to third-party brokers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="h-4 w-4 text-brand-indigo" /> 4. Security & Storage
          </h2>
          <p>
            Your account passwords are cryptographically hashed using industry-standard bcrypt algorithms on our servers. Uploaded document files are securely hosted on cloud storage (e.g. AWS S3 or protected local paths) and can be deleted by you at any time from your Dashboard, which instantly wipes the files from cloud nodes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
            5. Contact Us
          </h2>
          <p>
            If you have any questions or feedback about this Privacy Policy, please contact us at:
            <br />
            <span className="font-bold text-brand-indigo mt-1.5 block">privacy@tripcraft.ai</span>
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
