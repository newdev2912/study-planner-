import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Main Chat API Route using Local Ollama (llama3.2)
  app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message prompt is required." });
    }

    const rawOllamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    const ollamaBaseUrl = rawOllamaUrl.replace(/\/$/, "");

    const messages = [
      { role: "system", content: SYSTEM_INSTRUCTION },
      ...(history || []),
      { role: "user", content: message }
    ];

    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        model: "llama3.2",
        messages: messages,
        stream: true, // Enable streaming from Ollama!
        options: {
          temperature: 0.7,
          num_predict: 512,
        }
      })
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      throw new Error(`Ollama status ${response.status}: ${errorText}`);
    }

    // Set SSE headers so client knows text is streaming live
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const content = parsed.message?.content || "";
          if (content) {
            // Send each token chunk as an SSE event line
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch (e) {
          // Skip invalid chunk boundaries
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Ollama Streaming Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream from local Ollama model." });
    } else {
      res.end();
    }
  }
});

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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

startServer();