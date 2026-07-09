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
      {/* High-Fidelity Blurred Campus Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[60s] ease-linear scale-110"
          style={{ backgroundImage: "url('/AskAu/aucampus.avif')" }}
        />
        <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-[12px] mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 via-transparent to-violet-950/40" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-xl bg-black/20 border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 p-2 overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <img src="/AskAu/aulogo.png" alt="AU Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">AskAu</h1>
            <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 uppercase tracking-widest mt-0.5">
              <TerminalSquare className="w-3.5 h-3.5" /> System Online
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 flex items-center gap-2 backdrop-blur-md shadow-inner"><MapPin className="w-3.5 h-3.5 text-indigo-400"/> Ghatkesar, Hyd</span>
          <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 flex items-center gap-2 backdrop-blur-md shadow-inner"><Building2 className="w-3.5 h-3.5 text-violet-400"/> Engineering</span>
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
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-6 ${
                m.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600/90 to-violet-700/90 text-white rounded-br-sm shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] backdrop-blur-md border border-indigo-400/20'
                  : 'bg-black/40 text-white/95 rounded-bl-sm border border-white/10 backdrop-blur-xl shadow-2xl'
              }`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                    <div className="bg-indigo-500/20 p-1.5 rounded-lg border border-indigo-500/30">
                      <GraduationCap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">AU Senior</span>
                  </div>
                )}
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[15px] prose-li:text-[15px] prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-pre:shadow-inner prose-strong:text-indigo-200">
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
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 text-white/90 rounded-3xl rounded-bl-sm p-5 shadow-2xl flex items-center gap-4">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-sm font-medium animate-pulse text-indigo-200">Rifling through the official docs...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent pt-24 pb-6 px-4 md:px-0 z-20">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-3xl blur-md opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <form 
            onSubmit={handleSubmit}
            className="relative bg-black/60 backdrop-blur-2xl border border-white/20 rounded-3xl flex items-center p-2.5 shadow-2xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AIML curriculum, mess food, or campus fests..."
              className="flex-1 bg-transparent border-none text-white/95 placeholder-white/40 px-6 py-4 outline-none text-sm md:text-base font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl p-4 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-white/40 mt-5 font-semibold tracking-wide flex items-center justify-center gap-2 drop-shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Powered by Groq, Gemini & Kaggle
        </p>
      </div>

      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; border: 1px solid rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}} />
    </main>
  );
}
