import React, { useState, useRef, useEffect } from 'react';
import tripService from '../services/tripService';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  'What should I pack for this trip?',
  'Suggest some good local restaurants.',
  'What is the tipping culture here?',
  'Any interesting travel tips?'
];

const ChatAssistant = ({ tripId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hi! I'm your AI Travel Guide. Ask me anything about your scheduled itinerary, local dining, dress code, weather, or custom activities!"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll messages list to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || message;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setLoading(true);

    try {
      const data = await tripService.sendChat(tripId, text);

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data?.reply || "I couldn't generate advice right now. Please try again."
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: "Sorry, I had trouble connecting to the travel advice engine. Please verify your internet connection or API keys."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-brand-indigo text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
        >
          <MessageSquare className="h-6 w-6 group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-[350px] sm:w-[380px] h-[500px] flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-indigo to-brand-violet text-white px-5 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <div>
                <h3 className="font-display font-bold text-sm">TripCraft Assistant</h3>
                <p className="text-[10px] opacity-75">Local Concierge active</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50"
          >
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isAssistant
                        ? 'bg-white border border-slate-100 text-slate-700 shadow-sm'
                        : 'bg-brand-indigo text-white shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 text-slate-400 rounded-2xl px-4 py-3 text-xs flex items-center gap-1.5 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-indigo" />
                  <span>Thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-1 hover:border-brand-indigo hover:text-brand-indigo transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Panel */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-100 p-3 bg-white flex gap-2 items-center"
          >
            <input
              type="text"
              required
              disabled={loading}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything about your trip..."
              className="input-dark flex-1 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-brand-indigo/50"
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="h-9 w-9 rounded-xl bg-brand-indigo text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
