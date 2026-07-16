'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Paperclip, Mic } from 'lucide-react';
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

  // Helper function to auto-bold "Anurag University" in user text
  const formatUserMessage = (text: string) => {
    const parts = text.split(/(Anurag University)/i);
    return parts.map((part, i) => 
      part.toLowerCase() === 'anurag university' ? <strong key={i} className="font-bold">{part}</strong> : part
    );
  };

  return (
    <main className="h-screen w-full font-sans relative overflow-hidden flex flex-col bg-neutral-900">
      {/* 1. Global Container & Blurred Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/AskAu/aucampus.avif')" }}
        />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-md" />
      </div>

      {/* 2. Header Component Redesign */}
      <header className="relative z-10 w-full shrink-0 p-4 md:px-8 flex justify-between items-center bg-gradient-to-b from-gray-200/95 to-gray-200/40 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-2 shadow-sm shrink-0">
            <img src="/AskAu/aulogo.png" alt="AU Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-base font-bold text-[#0B1C4D] tracking-wide uppercase leading-tight">
              Anurag University
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-2xl font-extrabold text-[#0B1C4D] tracking-tight">AskAu</span>
              <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-white/50 border border-[#4CAF50]/30 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
                <span className="text-[10px] font-bold text-[#4CAF50] uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/80 rounded-full p-1 border border-[#0B1C4D]/10 shadow-sm">
            <UserButton />
          </div>
        </div>
      </header>

      {/* 3. Chat Messages Area */}
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
              {m.role === 'assistant' ? (
                <div className="flex gap-3 max-w-[90%] md:max-w-[80%] items-end">
                  <div className="w-8 h-8 rounded-full bg-white shrink-0 shadow-md border border-gray-200 overflow-hidden flex items-center justify-center p-1 mb-1">
                    <img src="/AskAu/aulogo.png" alt="AU Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="bg-[#A01D38] text-white rounded-[20px] rounded-bl-sm p-4 md:p-5 shadow-lg border border-[#A01D38]/80">
                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[15px] prose-li:text-[15px]">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F5F5F5] text-[#0B1C4D] rounded-[15px] rounded-br-sm p-4 md:p-5 shadow-[0_4px_10px_rgba(0,0,0,0.1)] max-w-[90%] md:max-w-[75%] border border-gray-200">
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {formatUserMessage(m.content)}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start w-full mb-6"
            >
              <div className="flex gap-3 max-w-[80%] items-end">
                <div className="w-8 h-8 rounded-full bg-white shrink-0 shadow-md border border-gray-200 overflow-hidden flex items-center justify-center p-1 mb-1">
                  <img src="/AskAu/aulogo.png" alt="AU" className="w-full h-full object-contain grayscale opacity-50" />
                </div>
                <div className="bg-white/90 border border-gray-200 text-[#0B1C4D] rounded-[20px] rounded-bl-sm p-4 shadow-lg flex items-center gap-3 backdrop-blur-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#A01D38]" />
                  <span className="text-sm font-medium animate-pulse">Typing...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4 shrink-0" />
      </div>

      {/* 4. Composite Chat Input Pill & Footer */}
      <div className="w-full shrink-0 z-20 pb-6 pt-2 px-4 relative">
        <div className="max-w-3xl mx-auto w-full relative">
          <form 
            onSubmit={handleSubmit}
            className="relative bg-[#F5F5F5] rounded-[50px] flex items-center p-2 shadow-[0_10px_40px_rgba(0,0,0,0.15)] transition-all border border-gray-300 focus-within:border-[#0B1C4D]/50 focus-within:shadow-[0_10px_40px_rgba(11,28,77,0.2)]"
          >
            <button type="button" className="p-3 text-[#0B1C4D] hover:text-[#A01D38] transition-colors shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about campus life, academics, or events..."
              className="flex-1 bg-transparent border-none text-[#0B1C4D] placeholder-[#0B1C4D]/40 px-2 py-3 outline-none text-[15px] font-medium w-full focus:ring-0"
              disabled={isLoading}
            />
            
            <div className="flex items-center gap-1 shrink-0 pr-1">
              <button type="button" className="p-3 text-[#0B1C4D] hover:text-[#A01D38] transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#0B1C4D] hover:bg-[#152c6a] text-white rounded-full p-3.5 transition-all disabled:opacity-50 disabled:hover:bg-[#0B1C4D] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 ml-1"
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
        
        {/* 5. Footer */}
        <div className="absolute bottom-2 right-4 md:right-6">
          <p className="text-[10px] font-semibold text-[#0B1C4D]/60 tracking-wider">
            Designed by AskAu Team
          </p>
        </div>
      </div>

      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(11, 28, 77, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(11, 28, 77, 0.4); }
      `}} />
    </main>
  );
}
