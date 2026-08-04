import { PenTool, Download } from 'lucide-react';
import { useState } from 'react';
import { DashboardPanel } from './DashboardPanel';

interface LearningJournalProps {
  prompt: string;
  downloadJournal: () => void;
}

export const LearningJournal = ({ prompt, downloadJournal }: LearningJournalProps) => {
  const [journalContent, setJournalContent] = useState("");

  return (
    <DashboardPanel 
      title="Meta-Cognition Log" 
      icon={<PenTool />} 
      accentColor="fuchsia"
      headerAction={
        <button onClick={downloadJournal} className="flex items-center gap-2 text-[10px] font-black text-fuchsia-400 uppercase tracking-widest hover:underline">
          <Download className="w-3.5 h-3.5" />
          Export MD
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-xl">
            <p className="text-[9px] font-black text-fuchsia-400 uppercase mb-2 tracking-widest">End-of-Session Prompt</p>
            <p className="text-sm text-slate-200 italic leading-relaxed">
              "{prompt || "How did your understanding of these concepts evolve today?"}"
            </p>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            * Journaling triggers meta-cognition, reinforcing neural pathways for long-term retention.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <textarea 
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            placeholder="Synthesize today's breakthroughs..."
            className="w-full flex-1 min-h-[120px] bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:ring-1 focus:ring-fuchsia-500/30 focus:border-fuchsia-500/50 focus:outline-none resize-none no-scrollbar"
          />
          <button 
            onClick={() => {
              console.log("Journal entry synced.");
              setJournalContent("");
            }}
            className="w-full py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-fuchsia-700 transition-all shadow-xl shadow-fuchsia-500/10"
          >
            Sync Daily Entry
          </button>
        </div>
      </div>
    </DashboardPanel>
  );
};
