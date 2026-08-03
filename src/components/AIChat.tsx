import React from 'react';
import { Brain, X, ChevronRight, ChevronLeft } from 'lucide-react';
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
  return (
    <div className={cn(
      "fixed bottom-8 left-8 z-[60] transition-all duration-500 ease-in-out",
      isOpen ? "w-[400px]" : "w-14"
    )}>
      <div className={cn(
        "bg-slate-900/80 backdrop-blur-2xl border border-slate-800 shadow-[0_0_50px_rgba(99,102,241,0.15)] rounded-3xl overflow-hidden flex flex-col transition-all duration-500",
        isOpen ? "h-[500px]" : "h-14"
      )}>
        {/* Chat Header */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-14 w-full px-4 flex items-center justify-between transition-colors",
            isOpen ? "bg-indigo-600 text-white" : "bg-slate-900/50 text-indigo-400 hover:bg-slate-800"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              isOpen ? "bg-white/20" : "bg-indigo-500/20"
            )}>
              <Brain className="w-5 h-5" />
            </div>
            {isOpen && (
              <div className="text-left">
                <span className="block text-xs font-black uppercase tracking-widest leading-none">AI Navigator</span>
                <span className="text-[10px] opacity-80 leading-none">Neural Core v2.0</span>
              </div>
            )}
          </div>
          {isOpen ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* Chat Body */}
        {isOpen && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-950/30">
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-none"
                  )}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex items-center gap-2 text-indigo-400">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Processing...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={onSendMessage} className="p-4 bg-slate-900/50 border-t border-slate-800">
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-2xl border border-slate-800 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Sync roadmap instructions..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-1 text-slate-200"
                />
                <button 
                  disabled={isGenerating || !input.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
