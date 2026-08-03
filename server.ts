import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const SYSTEM_INSTRUCTION = `
### SYSTEM ROLE
You are the AcademiaQuest Academic Assistant. Your goal is to provide concise, helpful, and accurate answers to student questions about their studies, productivity, and academic subjects.

### GUIDELINES
- Be brief and direct.
- Focus on academic support.
- Do not use complex formatting; plain text or simple markdown is preferred.
- Prioritize speed and accuracy.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Main Chat API Route using Local Ollama (llama3.2)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      const rawOllamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
      const ollamaBaseUrl = rawOllamaUrl.replace(/\/$/, ""); 

      // Prepare messages array for Ollama
      const messages = [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...(history || []),
        { role: "user", content: message }
      ];

      const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "AcademiaQuest/1.0",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          model: "llama3.2",
          messages,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const data = await response.json();
      const content = data.message?.content;

      if (!content) {
        throw new Error("No response content received from Ollama");
      }

      res.json({ reply: content });
    } catch (error: any) {
      console.error("Ollama Local AI Error:", error);
      res.status(500).json({ 
        error: "Failed to connect to local Ollama. Ensure your server and ngrok are active." 
      });
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