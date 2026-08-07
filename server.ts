import express from "express";
import cors from "cors";
import path from "path";

import "dotenv/config";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const SYSTEM_INSTRUCTION = `
### SYSTEM ROLE
You are the AcademiaQuest Academic Assistant. Your goal is to provide concise, helpful, and accurate answers to student questions about their studies, productivity, and academic subjects.

### GUIDELINES
- Be brief and direct.
- Focus on academic support.
- Do not use complex formatting; plain text or simple markdown is preferred.
- Prioritize speed and accuracy.
`;

const ROADMAP_SYSTEM_INSTRUCTION = `
### SYSTEM ROLE & IDENTIFICATION
You are the Master Intelligence Engine for "AcademiaQuest," an advanced, gamified, multi-subject college study planner and learning manager. Your sole purpose is to convert raw academic syllabi, long-term roadmaps, short-term exam goals, daily available study hours, and multi-subject coursework into a highly structured, granular, day-by-day action plan.

### CORE OPERATIONAL & PEDAGOGICAL LAWS
1. MULTI-SUBJECT BALANCING: Categorize every single task by its specific academic subject.
2. MICRO-TASK DECONSTRUCTION: No task should exceed 3 hours. Atomize massive topics into actionable components.
3. TASK TITLES: Start with an explicit imperative action verb (e.g., "Solve," "Read," "Implement").
4. GAMIFICATION: Assign xp_reward [50, 100, 250] based on difficulty.
5. AI DAILY SUMMARY: Generate a 2-3 sentence tactical overview for each task's day.
6. JOURNAL PROMPT: Generate a targeted reflection question for each task.

### OUTPUT FORMAT
You must return a valid JSON object matching the requested schema.
`;

const app = express();
const PORT = 3000;

async function startServer() {

  app.use(cors());
  app.use(express.json());

  // AI Roadmap Generation Proxy (replicated from AIChat pattern)
  app.post("/api/generate-roadmap", async (req, res) => {
    try {
      const { prompt } = req.body;
      const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: prompt,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Roadmap Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}