import { motion } from 'motion/react';
import { Wand2, AlertCircle, Timer } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  syllabusInput: string;
  userInput: string;
  isGenerating: boolean;
  progressLog?: string;
  onSyllabusChange: (val: string) => void;
  onUserInputChange: (val: string) => void;
  onSubmit: () => void;
}

const TypewriterText = ({ text, onUpdate }: { text: string; onUpdate?: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index));
      index++;
      if (index > text.length) {
        clearInterval(interval);
      }
      onUpdate?.();
    }, 12);
    return () => clearInterval(interval);
  }, [text, onUpdate]);

  return <>{displayedText}</>;
};

export const ChatInterface = ({
  messages,
  syllabusInput,
  userInput,
  isGenerating,
  progressLog,
  onSyllabusChange,
  onUserInputChange,
  onSubmit
}: ChatInterfaceProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating, progressLog]);

  return (
    <div className="flex flex-col h-[500px]">
      {/* Minimalist Status Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isGenerating ? "bg-emerald-400 animate-pulse" : "bg-slate-700")} />
          <span className={cn("uppercase tracking-widest font-bold", isGenerating ? "text-emerald-400" : "text-slate-500")}>
            OLLAMA TERMINAL :: MISTRAL ANALYSIS ENGINE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-mono">MODEL: mistral</span>
          {isGenerating && (
            <span className="flex items-center gap-1 text-blue-400/60 font-mono">
              <Timer className="w-3 h-3" />
              {elapsedTime}s
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0 bg-slate-950/90 rounded-xl p-4 shadow-inner border border-slate-800/50">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-2 font-mono text-[11px] leading-relaxed custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="space-y-3 opacity-50">
              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">❯</span>
                  <span className="animate-pulse">Awaiting input...</span>
                </div>
              </div>
              <textarea 
                value={syllabusInput}
                onChange={(e) => onSyllabusChange(e.target.value)}
                placeholder="Paste syllabus or academic context here for deep analysis..."
                className="w-full bg-transparent border-none p-0 text-slate-300 focus:ring-0 focus:outline-none resize-none h-32 scrollbar-hide text-[10px]"
              />
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-2 animate-in fade-in duration-300">
              {msg.role === 'user' ? (
                <>
                  <span className="text-cyan-400 font-bold mt-0.5 shrink-0">❯</span>
                  <span className="text-white break-words">{msg.content}</span>
                </>
              ) : (
                <div className="text-emerald-400 font-semibold break-words w-full">
                  {idx === messages.length - 1 ? (
                    <TypewriterText text={msg.content} onUpdate={scrollToBottom} />
                  ) : (
                    <span>{msg.content}</span>
                  )}
                  {idx === messages.length - 1 && (
                    <span className="animate-pulse bg-emerald-400 inline-block w-1.5 h-3 ml-1 align-middle" />
                  )}
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="space-y-2 mt-4">
              {progressLog && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-slate-500 italic"
                >
                  <span className="w-1 h-1 bg-slate-500 rounded-full animate-pulse" />
                  <span>{progressLog}</span>
                </motion.div>
              )}
              {elapsedTime > 30 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber-500/80">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-tighter font-bold">
                      {elapsedTime > 120 
                        ? "Generation timed out after 120s. For very long inputs, ensure local GPU/RAM is free or break down modules into smaller sections."
                        : "Parsing large syllabus... Inference exceeding normal bounds..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Integrated Command Input */}
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center gap-3">
          <span className="text-cyan-400 font-bold font-mono">❯</span>
          <input 
            type="text"
            value={userInput}
            onChange={(e) => onUserInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder={messages.length === 0 ? "Paste context above first..." : "Ask Mistral anything..."}
            disabled={isGenerating}
            className="flex-1 bg-transparent border-none p-0 text-white font-mono text-[11px] focus:ring-0 focus:outline-none placeholder:text-slate-700"
          />
          <button 
            onClick={onSubmit}
            disabled={isGenerating || (messages.length === 0 ? !syllabusInput.trim() : !userInput.trim())}
            className={cn(
              "p-2 rounded-lg transition-all",
              isGenerating ? "text-slate-800" : "text-emerald-400 hover:bg-emerald-500/10 shadow-lg shadow-emerald-500/5"
            )}
          >
            <Wand2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
