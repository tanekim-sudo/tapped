import { GoogleGenAI, Type } from "@google/genai";

// Vite uses import.meta.env for client-side, process.env for server-side/build
// Vercel exposes env vars as both, but we prioritize VITE_ prefix for Vite
const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY || 
                import.meta.env?.GEMINI_API_KEY ||
                (typeof process !== 'undefined' && process.env ? (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY) : '') || 
                '');

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getIntroSuggestion = async (senderBio: string, receiverBio: string, goal: string) => {
  if (!ai) {
    // Fallback if API key not configured
    return `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are drafting a high-bandwidth connection request for "Tapped", a raw networking protocol for high-intelligence builders.
      
      Sender Context: ${senderBio}
      Receiver Context: ${receiverBio}
      Sync Goal: ${goal}

      The vibe is "Founder Brain": 
      - Direct, punchy, no social pleasantries. 
      - Professional but raw (no "I hope this finds you well").
      - Establish intellectual alignment immediately.
      - Why should they care about you? Why should you care about them?
      
      Keep it under 180 characters. Output only the message text.`,
      config: {
        temperature: 0.8,
        topP: 0.9
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Intent: Align on " + goal + ". Verify reachability for mesh expansion.";
  }
};

export const analyzeIntent = async (bio: string) => {
  if (!ai) {
    return [];
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Categorize this node bio for a networking registry: "${bio}".
      Identify 3 high-bandwidth "Intents" (e.g., Builder, Catalyst, Learner, Architect).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["intent", "reason"]
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    return [];
  }
};