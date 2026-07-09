'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, GraduationCap, Loader2, Sparkles, MapPin, Building2, TerminalSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hey there! I'm AnuragBot, your resident senior. Need help navigating the AIML curriculum, finding the best spot in the library, or surviving those brutal lab externals? Hit me up." }
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
    <main className="min-h-screen bg-neutral-950 text-white font-sans relative overflow-hidden flex flex-col">
      {/* Background with blur and image overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/AskAu/aucampus.avif')] bg-cover bg-center opacity-20 filter blur-sm mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-indigo-950/50"></div>
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} 
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[128px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }} 
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-violet-600/20 rounded-full blur-[128px]"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 p-2 overflow-hidden shadow-2xl">
            <img src="/AskAu/aulogo.png" alt="AU Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white/90">AnuragBot</h1>
            <p className="text-xs font-medium text-indigo-300 flex items-center gap-1">
              <TerminalSquare className="w-3 h-3" /> System Online
            </p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 flex items-center gap-2"><MapPin className="w-3 h-3"/> Ghatkesar, Hyd</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 flex items-center gap-2"><Building2 className="w-3 h-3"/> Engineering</span>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto relative z-10 flex flex-col p-4 md:p-6 pb-32 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full mb-6 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 ${
                m.role === 'user' 
                  ? 'bg-indigo-600/90 text-white rounded-br-sm shadow-[0_0_20px_rgba(79,70,229,0.3)] backdrop-blur-md'
                  : 'bg-white/10 text-white/90 rounded-bl-sm border border-white/10 backdrop-blur-xl shadow-xl'
              }`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">AU Senior</span>
                  </div>
                )}
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start w-full mb-6"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 text-white/90 rounded-3xl rounded-bl-sm p-5 shadow-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                <span className="text-sm font-medium animate-pulse text-indigo-200">Checking the official docs...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent pt-20 pb-6 px-4 md:px-0 z-20">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <form 
            onSubmit={handleSubmit}
            className="relative bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center p-2 shadow-2xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about AI curriculum, mess food, or campus fests..."
              className="flex-1 bg-transparent border-none text-white/90 placeholder-white/40 px-6 py-4 outline-none text-sm md:text-base font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl p-4 transition-all disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-white/30 mt-4 font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" /> Powered by Groq, Gemini & Kaggle
        </p>
      </div>

      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </main>
  );
}
