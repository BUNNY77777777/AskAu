'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, GraduationCap, Loader2, Sparkles, MapPin, Building2, TerminalSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserButton } from '@clerk/nextjs';

export default function Home() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hey there! I'm AskAu, your resident senior. Need help navigating the AIML curriculum, finding the best spot in the library, or surviving those brutal lab externals? Hit me up." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Uh oh, seems like my brain crashed mid-semester. Try again in a minute." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen w-full text-white font-sans relative overflow-hidden flex flex-col bg-neutral-900">
      {/* Clear Campus Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[60s] ease-linear scale-105"
          style={{ backgroundImage: "url('/AskAu/aucampus.avif')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full shrink-0 p-4 md:p-6 flex justify-between items-center backdrop-blur-md bg-cello/90 border-b border-cardinal shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg shrink-0">
            <img src="/AskAu/aulogo.png" alt="AU Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">AskAu</h1>
            <p className="text-[10px] md:text-xs font-bold flex items-center gap-1.5 uppercase tracking-widest mt-0.5 text-orchid">
              <TerminalSquare className="w-3 h-3 text-cardinal" /> System Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-3 shrink-0 mr-4">
            <span className="px-3 md:px-4 py-1.5 rounded-full bg-black/40 border border-white/20 text-xs font-semibold text-white flex items-center gap-2 shadow-inner"><MapPin className="w-3.5 h-3.5 text-cardinal"/> Ghatkesar, Hyd</span>
            <span className="px-3 md:px-4 py-1.5 rounded-full bg-black/40 border border-white/20 text-xs font-semibold text-white flex items-center gap-2 shadow-inner"><Building2 className="w-3.5 h-3.5 text-orchid"/> Engineering</span>
          </div>
          {/* Clerk User Profile */}
          <div className="bg-black/20 rounded-full p-1 border border-white/10">
            <UserButton />
          </div>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 w-full max-w-4xl mx-auto relative z-10 flex flex-col p-4 md:p-6 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex w-full mb-6 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[90%] md:max-w-[75%] rounded-3xl p-5 md:p-6 shadow-2xl ${
                m.role === 'user' 
                  ? 'bg-cello text-white rounded-br-sm border border-cello/50' 
                  : 'bg-black/80 text-white rounded-bl-sm border border-white/10 backdrop-blur-sm'
              }`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-3">
                    <div className="bg-cardinal/20 p-1.5 rounded-lg border border-cardinal/30">
                      <GraduationCap className="w-4 h-4 text-cardinal" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-orchid uppercase tracking-widest">AU Senior</span>
                  </div>
                )}
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-sm md:prose-p:text-[15px] prose-li:text-sm md:prose-li:text-[15px] prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/20 prose-strong:text-orchid">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start w-full mb-6"
            >
              <div className="bg-black/80 border border-white/10 text-white rounded-3xl rounded-bl-sm p-5 shadow-2xl flex items-center gap-4 backdrop-blur-sm">
                <Loader2 className="w-5 h-5 animate-spin text-cardinal" />
                <span className="text-sm font-medium animate-pulse text-orchid">Rifling through the official docs...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4 shrink-0" />
      </div>

      {/* Input Area */}
      <div className="w-full shrink-0 z-20 bg-white/5 backdrop-blur-xl border-t border-cardinal p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto w-full relative group">
          <form 
            onSubmit={handleSubmit}
            className="relative bg-cello/90 border border-cardinal/50 rounded-3xl flex items-center p-2 shadow-2xl transition-all focus-within:border-cardinal focus-within:bg-cello"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AIML curriculum, mess food, or campus fests..."
              className="flex-1 bg-transparent border-none text-white placeholder-white/50 px-4 md:px-6 py-3 md:py-4 outline-none text-sm md:text-base font-semibold w-full focus:ring-0"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-cardinal hover:bg-[#A31830] text-white rounded-2xl p-3 md:p-4 transition-all disabled:opacity-50 disabled:hover:bg-cardinal flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(196,30,58,0.4)] hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-[10px] md:text-xs text-white/50 mt-3 font-bold tracking-wide flex items-center justify-center gap-2 drop-shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-orchid" /> Powered by Groq, Gemini & Supabase Vector DB
          </p>
        </div>
      </div>

      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2F4F7F; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #354D73; }
      `}} />
    </main>
  );
}
