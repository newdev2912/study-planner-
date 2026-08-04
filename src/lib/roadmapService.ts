
export const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

export const MISTRAL_ANALYSIS_PROMPT = `
YOU ARE A HIGH-SPEED CURRICULUM & ACADEMIC ANALYSIS ASSISTANT.
YOUR GOAL IS TO HELP USERS ANALYZE, BREAK DOWN, AND OPTIMIZE SYLLABI OR LEARNING CONCEPTS.

RULES:
1. Provide concise, clear, and direct answers.
2. When given a syllabus or topic list, provide actionable academic insights (e.g., key concepts, difficulty level, prerequisites, or suggested breakdown).
3. Do NOT engage in recursive confirmation loops ("Would you like me to proceed?"). Answer directly.
4. Maintain a sleek, technical tone suitable for a developer/academic dashboard terminal.
`;

export interface LLMResponsePayload {
  rawResponse: string;
  cleanText: string;
  detectedMarker: null;
}

export const extractPhaseMarker = (response: string): LLMResponsePayload => {
  return {
    rawResponse: response,
    cleanText: response.trim(),
    detectedMarker: null
  };
};

export interface RoadmapGenerationParams {
  syllabusInput: string;
  currentInput: string;
  onProgress?: (status: string) => void;
}

export const generateRoadmapStep = async ({ 
  syllabusInput, 
  currentInput,
  onProgress 
}: RoadmapGenerationParams): Promise<LLMResponsePayload> => {
  onProgress?.("Context optimized...");
  
  const prompt = `${MISTRAL_ANALYSIS_PROMPT}

CONTEXT/SYLLABUS: ${syllabusInput}

USER QUERY: ${currentInput}
ASSISTANT:`;

  onProgress?.("Initiating analysis...");

  const response = await fetch('/api/generate-roadmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120000), // 120 seconds timeout
    body: JSON.stringify({ 
      model: "mistral",
      prompt,
      options: {
        num_predict: 500,
        temperature: 0.3,
        top_k: 20,
        top_p: 0.9,
        num_ctx: 2048,
        stop: ["USER QUERY:", "ASSISTANT:"]
      }
    })
  });

  if (!response.ok) {
    onProgress?.("Connection failed.");
    throw new Error(`API returned status ${response.status}`);
  }

  onProgress?.("Mistral inference active...");
  const result = await response.json();
  const rawResponse = result.response || "";
  
  if (!rawResponse) throw new Error("Empty response");

  onProgress?.("Analysis complete.");
  return extractPhaseMarker(rawResponse);
};


