'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, GraduationCap, Loader2, Sparkles, MapPin, Building2, TerminalSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Uh oh, seems like my brain crashed mid-semester. Try again in a minute." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col bg-neutral-900">
      {/* Clear Campus Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[60s] ease-linear scale-105"
          style={{ backgroundImage: "url('/AskAu/aucampus.avif')" }}
        />
        {/* Very light overlay to preserve image visibility while allowing text to be read */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-md bg-black/50 border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg">
            <img src="/AskAu/aulogo.png" alt="AU Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">AskAu</h1>
            <p className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-widest mt-0.5 text-[#DB96A1]">
              <TerminalSquare className="w-3.5 h-3.5 text-[#C41E3A]" /> System Online
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <span className="px-4 py-1.5 rounded-full bg-black/60 border border-white/20 text-xs font-semibold text-white flex items-center gap-2 shadow-inner"><MapPin className="w-3.5 h-3.5 text-[#C41E3A]"/> Ghatkesar, Hyd</span>
          <span className="px-4 py-1.5 rounded-full bg-black/60 border border-white/20 text-xs font-semibold text-white flex items-center gap-2 shadow-inner"><Building2 className="w-3.5 h-3.5 text-[#DB96A1]"/> Engineering</span>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto relative z-10 flex flex-col p-4 md:p-6 pb-32 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex w-full mb-6 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-6 shadow-2xl ${
                m.role === 'user' 
                  ? 'bg-[#1F3A5F] text-white rounded-br-sm border border-[#1F3A5F]/50' // Cello
                  : 'bg-black/80 text-white rounded-bl-sm border border-white/10 backdrop-blur-sm'
              }`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-3">
                    <div className="bg-[#C41E3A]/20 p-1.5 rounded-lg border border-[#C41E3A]/30">
                      <GraduationCap className="w-4 h-4 text-[#C41E3A]" />
                    </div>
                    <span className="text-xs font-bold text-[#DB96A1] uppercase tracking-widest">AU Senior</span>
                  </div>
                )}
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[15px] prose-li:text-[15px] prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/20 prose-strong:text-[#DB96A1]">
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
                <Loader2 className="w-5 h-5 animate-spin text-[#C41E3A]" />
                <span className="text-sm font-medium animate-pulse text-[#DB96A1]">Rifling through the official docs...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-24 pb-6 px-4 md:px-0 z-20">
        <div className="max-w-4xl mx-auto relative group">
          <form 
            onSubmit={handleSubmit}
            className="relative bg-[#1F3A5F]/90 backdrop-blur-md border border-white/20 rounded-3xl flex items-center p-2.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AIML curriculum, mess food, or campus fests..."
              className="flex-1 bg-transparent border-none text-white placeholder-white/50 px-6 py-4 outline-none text-sm md:text-base font-semibold"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#C41E3A] hover:bg-[#A31830] text-white rounded-2xl p-4 transition-all disabled:opacity-50 disabled:hover:bg-[#C41E3A] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(196,30,58,0.4)] hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-white/50 mt-5 font-bold tracking-wide flex items-center justify-center gap-2 drop-shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#DB96A1]" /> Powered by Groq, Gemini & Kaggle
        </p>
      </div>

      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1F3A5F; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #354D73; }
      `}} />
    </main>
  );
}
