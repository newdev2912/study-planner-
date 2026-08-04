import React, { useRef, useEffect } from 'react';
import { Brain, X, ChevronRight, Terminal, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface AIChatProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  input: string;
  setInput: (input: string) => void;
  messages: { role: 'user' | 'ai', text: string }[];
  isGenerating: boolean;
  onSendMessage: (e?: React.FormEvent) => void;
}

export const AIChat = ({ isOpen, setIsOpen, input, setInput, messages, isGenerating, onSendMessage }: AIChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, isOpen]);

  return (
    <>
      {/* Floating Toggle Button (Visible when closed) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-[60] w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400/30 hover:scale-110 transition-all duration-300"
        >
          <Brain className="w-6 h-6" />
        </button>
      )}

      {/* Dockable Right Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-screen z-[70] transition-all duration-500 ease-in-out border-l border-indigo-500/30 backdrop-blur-xl bg-slate-950/95 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]",
        isOpen ? "w-[400px]" : "w-0 overflow-hidden border-none"
      )}>
        {/* Header */}
        <div className="h-16 px-6 border-b border-indigo-500/20 flex items-center justify-between bg-indigo-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Terminal className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="block text-xs font-black uppercase tracking-widest text-indigo-100">AI Navigator</span>
              <span className="text-[10px] text-indigo-400/60 font-mono">LLAMA_3.2_CORE</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Body */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 font-mono scroll-smooth no-scrollbar"
        >
          {messages.map((msg, i) => (
            <div key={i} className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 opacity-50">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  msg.role === 'user' ? "text-white" : "text-indigo-400"
                )}>
                  {msg.role === 'user' ? 'USER_PROMPT' : 'NAVIGATOR_CORE'}
                </span>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>
              <div className={cn(
                "text-xs leading-relaxed",
                msg.role === 'user' ? "text-white/90" : "text-indigo-300 font-bold drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]"
              )}>
                {msg.role === 'user' && <span className="text-indigo-500 mr-2">{'>'}</span>}
                <ReactMarkdown components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
                }}>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex items-center gap-3 text-indigo-400/50 font-mono">
              <span className="text-[10px] animate-pulse">SYSTEM_THINKING...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-slate-900/30 border-t border-indigo-500/20">
          <form 
            onSubmit={onSendMessage}
            className="flex items-center gap-3 p-3 bg-slate-950 border border-indigo-500/20 rounded-xl focus-within:border-indigo-500/50 focus-within:shadow-[0_0_15px_rgba(79,70,229,0.1)] transition-all"
          >
            <span className="text-indigo-500 font-mono text-sm ml-1">{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Execute command..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-xs text-indigo-100 placeholder:text-indigo-900 font-mono"
            />
            <button 
              disabled={isGenerating || !input.trim()}
              className="p-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-4 flex items-center justify-between opacity-30">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Secure Link: Active</span>
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">LATENCY: 14MS</span>
          </div>
        </div>
      </div>
    </>
  );
};
