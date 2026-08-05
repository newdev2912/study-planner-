import React, { useRef, useEffect, useState } from 'react';
import { Brain, X, Terminal, CornerDownLeft, PawPrint, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export type AIThemeKey = 'emerald' | 'cyan' | 'amber' | 'rose' | 'violet' | 'slate';

export interface AITheme {
  name: string;
  dotBg: string;
  textColor: string;
  accentBg: string;
  badgeBg: string;
  borderColor: string;
  glowShadow: string;
  buttonBg: string;
  aiText: string;
}

export const AI_THEMES: Record<AIThemeKey, AITheme> = {
  emerald: {
    name: 'Matrix Green',
    dotBg: 'bg-emerald-400',
    textColor: 'text-emerald-400',
    accentBg: 'bg-emerald-500/20',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    borderColor: 'border-emerald-500/40',
    glowShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    buttonBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
    aiText: 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]',
  },
  cyan: {
    name: 'Cyber Blue',
    dotBg: 'bg-blue-400',
    textColor: 'text-blue-400',
    accentBg: 'bg-blue-500/20',
    badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    borderColor: 'border-blue-500/40',
    glowShadow: 'shadow-[0_0_20px_rgba(59,130,246,0.35)]',
    buttonBg: 'bg-blue-500 hover:bg-blue-400 text-slate-950 font-black',
    aiText: 'text-blue-400 font-bold drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]',
  },
  amber: {
    name: 'Solar Orange',
    dotBg: 'bg-amber-400',
    textColor: 'text-amber-400',
    accentBg: 'bg-amber-500/20',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    borderColor: 'border-amber-500/40',
    glowShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    buttonBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black',
    aiText: 'text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]',
  },
  rose: {
    name: 'Crimson Red',
    dotBg: 'bg-red-400',
    textColor: 'text-red-400',
    accentBg: 'bg-red-500/20',
    badgeBg: 'bg-red-500/10 border-red-500/30 text-red-400',
    borderColor: 'border-red-500/40',
    glowShadow: 'shadow-[0_0_20px_rgba(239,68,68,0.35)]',
    buttonBg: 'bg-red-500 hover:bg-red-400 text-slate-950 font-black',
    aiText: 'text-red-400 font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]',
  },
  violet: {
    name: 'Neon Purple',
    dotBg: 'bg-purple-400',
    textColor: 'text-purple-400',
    accentBg: 'bg-purple-500/20',
    badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    borderColor: 'border-purple-500/40',
    glowShadow: 'shadow-[0_0_20px_rgba(168,85,247,0.35)]',
    buttonBg: 'bg-purple-500 hover:bg-purple-400 text-slate-950 font-black',
    aiText: 'text-purple-400 font-bold drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]',
  },
  slate: {
    name: 'Steel Grey',
    dotBg: 'bg-slate-300',
    textColor: 'text-slate-300',
    accentBg: 'bg-slate-500/20',
    badgeBg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
    borderColor: 'border-slate-500/40',
    glowShadow: 'shadow-[0_0_20px_rgba(148,163,184,0.25)]',
    buttonBg: 'bg-slate-200 hover:bg-white text-slate-950 font-black',
    aiText: 'text-slate-300 font-bold drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]',
  },
};

// Typewriter Text Component for AI Responses
const TypewriterText = ({ text, speed = 12 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <div className="inline-block text-left">
      <ReactMarkdown components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)] text-left">{children}</p>,
        code: ({ children }) => <code className="bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-300 border border-emerald-500/30">{children}</code>
      }}>
        {displayedText}
      </ReactMarkdown>
      {currentIndex < text.length && (
        <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse ml-1 align-middle" />
      )}
    </div>
  );
};

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
  const [themeKey, setThemeKey] = useState<AIThemeKey>('emerald');
  const [showPawMenu, setShowPawMenu] = useState<boolean>(false);

  const activeTheme = AI_THEMES[themeKey];

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
          className={cn(
            "fixed bottom-8 right-8 z-[60] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border",
            activeTheme.buttonBg,
            activeTheme.glowShadow,
            "border-white/20"
          )}
          title="Open AI Navigator"
        >
          <Brain className="w-6 h-6" />
        </button>
      )}

      {/* Dockable Right Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-screen z-[70] transition-all duration-500 ease-in-out border-l backdrop-blur-2xl bg-slate-950/95 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]",
        activeTheme.borderColor,
        isOpen ? "w-[440px]" : "w-0 overflow-hidden border-none"
      )}>
        {/* Header */}
        <div className={cn(
          "h-16 px-5 border-b flex items-center justify-between relative shrink-0",
          activeTheme.borderColor,
          activeTheme.accentBg
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner", activeTheme.badgeBg)}>
              <Terminal className={cn("w-4 h-4", activeTheme.textColor)} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="block text-xs font-black uppercase tracking-widest text-slate-100 font-jakarta">AI Navigator</span>
                <Sparkles className={cn("w-3 h-3 animate-pulse", activeTheme.textColor)} />
              </div>
              <span className={cn("text-[9.5px] font-mono font-bold tracking-wider opacity-80", activeTheme.textColor)}>
                LLAMA_3.2_CORE
              </span>
            </div>
          </div>

          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all active:scale-95"
            title="Close Panel"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Chat Messages Body: User = RIGHT Aligned, AI = LEFT Aligned */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 font-mono scroll-smooth no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isLatestAi = !isUser && i === messages.length - 1;

            return (
              <div 
                key={i} 
                className={cn(
                  "flex flex-col space-y-1 animate-in fade-in duration-300",
                  isUser ? "items-end text-right" : "items-start text-left"
                )}
              >
                {/* Message Header Label */}
                <div className={cn(
                  "flex items-center gap-2 opacity-70 mb-1",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest font-mono",
                    isUser ? "text-slate-400" : activeTheme.textColor
                  )}>
                    {isUser ? 'USER_PROMPT' : 'NAVIGATOR_CORE'}
                  </span>
                  <div className="w-8 h-[1px] bg-slate-800" />
                </div>

                {/* Message Text Body */}
                <div className={cn(
                  "text-xs leading-relaxed font-mono max-w-[92%]",
                  isUser ? "text-slate-200 text-right" : "text-left"
                )}>
                  {isUser ? (
                    <div className="flex items-start justify-end gap-2">
                      <p className="whitespace-pre-wrap text-slate-200">{msg.text}</p>
                      <span className={cn("font-black select-none shrink-0", activeTheme.textColor)}>{'<'}</span>
                    </div>
                  ) : isLatestAi ? (
                    <TypewriterText text={msg.text} />
                  ) : (
                    <div className="inline-block text-left">
                      <ReactMarkdown components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.35)] text-left">{children}</p>,
                        code: ({ children }) => <code className="bg-slate-900 px-1.5 py-0.5 rounded text-[11px] font-mono text-emerald-300 border border-emerald-500/30">{children}</code>
                      }}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {isGenerating && (
            <div className="flex flex-col items-start space-y-1 font-mono">
              <div className="flex items-center gap-2 opacity-70 flex-row mb-1">
                <span className={cn("text-[9px] font-black uppercase tracking-widest font-mono", activeTheme.textColor)}>
                  NAVIGATOR_CORE
                </span>
                <div className="w-8 h-[1px] bg-slate-800" />
              </div>
              <div className="flex items-center gap-2 text-left">
                <div className={cn("w-2 h-2 rounded-full animate-ping", activeTheme.dotBg)} />
                <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest animate-pulse", activeTheme.textColor)}>
                  SYSTEM_THINKING...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Terminal Line with Paw Theme Picker on the Right of Send Button */}
        <div className={cn("p-5 bg-slate-950/95 border-t shrink-0 relative", activeTheme.borderColor)}>
          <form 
            onSubmit={onSendMessage}
            className="flex items-center gap-2.5 px-2 py-1.5 font-mono border-b border-slate-800 focus-within:border-slate-500 transition-colors"
          >
            <span className={cn("font-black text-sm select-none shrink-0", activeTheme.textColor)}>{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Execute command..."
              className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-xs text-slate-100 placeholder:text-slate-600 font-mono tracking-wide"
            />
            
            {/* Terminal Action Controls Group */}
            <div className="flex items-center gap-2 shrink-0 relative">
              {/* Send Button labeled 'SEND' */}
              <button 
                type="submit"
                disabled={isGenerating || !input.trim()}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all duration-200 disabled:opacity-30 active:scale-95 flex items-center gap-1.5",
                  input.trim() 
                    ? activeTheme.buttonBg 
                    : "bg-slate-900 text-slate-500 border border-slate-800"
                )}
                title="Send Message"
              >
                <span>SEND</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>

              {/* Paw Theme Selector Right of Send Button */}
              <div className="relative flex items-center">
                {showPawMenu && (
                  <div className="absolute right-0 bottom-full mb-3 flex items-center gap-2 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md z-30 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">THEME:</span>
                    {(Object.keys(AI_THEMES) as AIThemeKey[]).map((key) => {
                      const t = AI_THEMES[key];
                      const isSelected = themeKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setThemeKey(key);
                            setShowPawMenu(false);
                          }}
                          className={cn(
                            "w-4.5 h-4.5 rounded-full transition-all transform hover:scale-125 focus:outline-none",
                            t.dotBg,
                            isSelected
                              ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110"
                              : "opacity-70 hover:opacity-100"
                          )}
                          title={`Set ${t.name} Theme`}
                        />
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowPawMenu(!showPawMenu)}
                  className={cn(
                    "p-1.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg transition-all active:scale-95 group relative",
                    showPawMenu && "bg-slate-800 border-slate-700"
                  )}
                  title="Customize AI Panel Theme"
                >
                  <PawPrint className={cn("w-4 h-4 transition-transform duration-200 group-hover:scale-110", activeTheme.textColor)} />
                </button>
              </div>
            </div>
          </form>
          
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">SECURE LINK: ACTIVE</span>
            </div>
            <span className="text-[8.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">LATENCY: 14MS</span>
          </div>
        </div>
      </div>
    </>
  );
};
