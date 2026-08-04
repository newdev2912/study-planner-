import { BookOpen, ChevronRight, Wand2, Sparkles, X, ServerCrash, Brain, Clock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlowCard } from './Shared';
import { cn } from '../lib/utils';
import { StudyJourney, SubjectData } from '../types';

interface RoadmapGeneratorProps {
  onGenerateJourney: (journey: StudyJourney) => void;
  onGenerateMastery: (mastery: SubjectData[]) => void;
  currentMastery: SubjectData[];
}

export const RoadmapGenerator = ({ onGenerateJourney, onGenerateMastery, currentMastery }: RoadmapGeneratorProps) => {
  const [syllabusInput, setSyllabusInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("Computer Science");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedData, setGeneratedData] = useState<StudyJourney | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleGenerateRoadmap = async () => {
    if (!syllabusInput.trim()) return;
    setIsGenerating(true);
    setConnectionError(null);
    
    try {
      const prompt = `You are an academic roadmap planner for AcademiaQuest. Convert the following syllabus into a structured study plan.
Subject: ${selectedSubject}
Syllabus:
${syllabusInput}

Return ONLY valid JSON matching this exact structure (no commentary or markdown wrapping):
{
  "journey_title": "Mastery Path for ${selectedSubject}",
  "current_milestone": "Core Foundations",
  "total_estimated_days": 7,
  "daily_tasks": [
    {
      "day_number": 1,
      "task_title": "Short imperative title",
      "description": "Step-by-step instructions",
      "category": "Theory",
      "estimated_minutes": 45,
      "xp_reward": 50,
      "ai_daily_summary": "2-sentence tactical overview",
      "journal_prompt": "Reflection question"
    }
  ]
}

Rules:
- xp_reward must be strictly 50, 100, or 250.
- category must be 'Theory', 'Practical Application', 'Review Day', or 'Boss Battle Project'.`;

      // Direct fetch from browser to local Ollama (localhost)
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const rawData = await response.json();
      const data = JSON.parse(rawData.response);
      
      const processedData: StudyJourney = {
        ...data,
        daily_tasks: data.daily_tasks.map((t: any, i: number) => ({
          ...t,
          id: `task-ai-${Date.now()}-${i}`,
          subject: selectedSubject,
          completed: false,
          priority: 'medium',
          tags: [selectedSubject]
        }))
      };

      setGeneratedData(processedData);
      setShowPreview(true);
    } catch (error: any) {
      console.error("Ollama Error:", error);
      setConnectionError(
        error.name === 'TypeError' 
          ? "Connection Blocked. This is likely due to browser security (Mixed Content) or CORS."
          : error.message || "Could not connect to Ollama instance."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const applyRoadmap = () => {
    if (!generatedData) return;

    onGenerateJourney(generatedData);

    const existingSubject = currentMastery.find(s => s.name === selectedSubject);
    
    const modulesMap = new Map<string, string[]>();
    generatedData.daily_tasks.forEach(t => {
      const category = t.category || 'General';
      if (!modulesMap.has(category)) modulesMap.set(category, []);
      modulesMap.get(category)!.push(t.task_title);
    });

    const newModules = Array.from(modulesMap.entries()).map(([name, topics], idx) => ({
      id: `mod-ai-${Date.now()}-${idx}`,
      name,
      topics: topics.map((title, tIdx) => ({
        id: `top-ai-${Date.now()}-${idx}-${tIdx}`,
        title,
        completed: false
      }))
    }));

    if (existingSubject) {
      onGenerateMastery(currentMastery.map(s => 
        s.id === existingSubject.id ? { ...s, modules: [...s.modules, ...newModules] } : s
      ));
    } else {
      const newSubject: SubjectData = {
        id: `subject-ai-${Date.now()}`,
        name: selectedSubject,
        modules: newModules
      };
      onGenerateMastery([...currentMastery, newSubject]);
    }

    setShowPreview(false);
    setSyllabusInput("");
    alert("Neural Roadmap integrated successfully!");
  };

  return (
    <>
      <GlowCard glowColor="blue" className="h-full border-blue-500/20 bg-blue-500/[0.01]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-blue-100">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Neural Syllabus Processor
          </h2>
          <div className="flex gap-2">
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option>Computer Science</option>
              <option>Calculus</option>
              <option>Biology</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Economics</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <textarea 
            value={syllabusInput}
            onChange={(e) => setSyllabusInput(e.target.value)}
            placeholder="Paste your syllabus or course outline here. Your local Ollama model will atomize it..."
            className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/50 focus:outline-none resize-none no-scrollbar"
          />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Brain className="w-3 h-3 text-blue-400" />
                Ollama (llama3.2) Enabled
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Processing locally on http://localhost:11434
              </p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateRoadmap}
              disabled={isGenerating || !syllabusInput.trim()}
              className={cn(
                "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                isGenerating ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              )}
            >
              {isGenerating ? "Atomizing..." : "Initialize Roadmap"}
              <Wand2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {connectionError && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <ServerCrash className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Local Connection Failed</p>
                  <p className="text-[11px] text-slate-400 leading-normal font-medium">
                    {connectionError}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">How to fix:</p>
                <ol className="text-[10px] text-slate-400 space-y-1 list-decimal ml-4 font-medium">
                  <li>
                    <span className="text-slate-200">Enable CORS:</span> Run Ollama with <code className="text-blue-400">OLLAMA_ORIGINS="*"</code>
                  </li>
                  <li>
                    <span className="text-slate-200">Allow Mixed Content:</span> Since this app is HTTPS, click the lock icon in your URL bar → <span className="text-slate-200 italic">Site Settings</span> → <span className="text-slate-200 italic">Insecure Content</span> → <span className="text-slate-200 italic">Allow</span>.
                  </li>
                  <li>Ensure <code className="text-blue-400">llama3.2</code> is pulled locally.</li>
                </ol>
              </div>
            </motion.div>
          )}
        </div>
      </GlowCard>

      {/* Pop-up Preview Modal */}
      <AnimatePresence>
        {showPreview && generatedData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">{generatedData.journey_title}</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{selectedSubject} Roadmap Preview</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 no-scrollbar space-y-6">
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Milestone</p>
                    <p className="text-sm font-medium text-slate-200">{generatedData.current_milestone}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Duration</p>
                    <p className="text-sm font-black text-white">{generatedData.total_estimated_days} Days</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-blue-500" />
                    Hierarchical Module Breakdown
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Group by category/module */}
                    {Object.entries(
                      generatedData.daily_tasks.reduce((acc: any, task) => {
                        const cat = task.category || 'General Foundations';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(task);
                        return acc;
                      }, {})
                    ).map(([category, tasks]: [string, any], idx) => (
                      <div key={category} className="group">
                        <div className="flex items-center gap-3 mb-2 px-1">
                          <span className="text-[10px] font-black text-slate-600">0{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{category}</span>
                          <div className="flex-1 h-px bg-slate-800/50" />
                        </div>
                        <div className="space-y-1.5 ml-7">
                          {tasks.map((task: any, tIdx: number) => (
                            <div key={tIdx} className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                                D{task.day_number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-200 truncate">{task.task_title}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="flex items-center gap-1 text-[9px] text-slate-500 font-bold uppercase">
                                    <Clock className="w-2.5 h-2.5" />
                                    {task.estimated_minutes}m
                                  </span>
                                  <span className="flex items-center gap-1 text-[9px] text-blue-500/80 font-bold uppercase">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    {task.xp_reward} XP
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex gap-4">
                <button 
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={applyRoadmap}
                  className="flex-[2] px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Confirm & Apply Roadmap
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
