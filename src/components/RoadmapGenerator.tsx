import { BookOpen, X } from 'lucide-react';
import { useState } from 'react';
import { GlowCard } from './Shared';
import { SubjectData, StudyJourney } from '../types';
import { generateRoadmapStep, OLLAMA_URL } from '../lib/roadmapService';
import { ChatInterface } from './roadmap/ChatInterface';

interface RoadmapGeneratorProps {
  onGenerateJourney: (journey: StudyJourney) => void;
  onGenerateMastery: (mastery: SubjectData[]) => void;
  currentMastery: SubjectData[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const RoadmapGenerator = ({ onGenerateJourney, onGenerateMastery, currentMastery }: RoadmapGeneratorProps) => {
  const [syllabusInput, setSyllabusInput] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [progressLog, setProgressLog] = useState<string>("");

  const resetGenerator = () => {
    setMessages([]);
    setSyllabusInput("");
    setUserInput("");
    setConnectionError(null);
    setProgressLog("");
  };

  const handleStepSubmit = async () => {
    const isFirstMessage = messages.length === 0;
    const currentInput = isFirstMessage ? "Analyze this syllabus and provide structural insights." : userInput;
    
    if (isFirstMessage && !syllabusInput.trim()) return;
    if (!isFirstMessage && !userInput.trim()) return;

    setIsGenerating(true);
    setConnectionError(null);
    setProgressLog("Initializing Mistral...");

    const userDisplayMessage = isFirstMessage ? "Analyzing Academic Context..." : currentInput;
    const newMessages = [...messages, { role: 'user' as const, content: userDisplayMessage }];
    setMessages(newMessages);
    setUserInput("");

    // Timeout mechanism
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Local model inference timed out after 120s. Please check Ollama status.")), 120000)
    );

    try {
      const generationPromise = generateRoadmapStep({
        syllabusInput,
        currentInput: currentInput,
        onProgress: (status) => setProgressLog(status)
      });

      const payload = await Promise.race([generationPromise, timeoutPromise]) as any;
      const { cleanText } = payload;
      
      setMessages([...newMessages, { role: 'assistant', content: cleanText }]);

    } catch (error: any) {
      console.error("Analysis Error:", error);
      setConnectionError(`Analysis failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setProgressLog("");
    }
  };

  return (
    <>
      <GlowCard glowColor="blue" className="h-full border-blue-500/20 bg-blue-500/[0.01]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-blue-100">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Mistral Analysis Terminal
          </h2>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button 
                onClick={resetGenerator}
                className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
        
        <ChatInterface 
          messages={messages}
          syllabusInput={syllabusInput}
          userInput={userInput}
          isGenerating={isGenerating}
          progressLog={progressLog}
          onSyllabusChange={setSyllabusInput}
          onUserInputChange={setUserInput}
          onSubmit={handleStepSubmit}
        />

        {connectionError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Processing Error</p>
            <p className="text-[11px] text-red-300 leading-relaxed">{connectionError}</p>
            <div className="mt-2 space-y-2">
              <p className="text-[9px] text-slate-500 italic">Troubleshooting steps:</p>
              <ol className="text-[9px] text-slate-500 list-decimal list-inside space-y-1">
                <li>Ensure Ollama is running locally.</li>
                <li>Verify <code className="text-blue-400">mistral</code> is pulled.</li>
                <li>Processing URL: <code className="text-blue-400">{OLLAMA_URL}</code></li>
              </ol>
            </div>
          </div>
        )}
      </GlowCard>
    </>
  );
};
