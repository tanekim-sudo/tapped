import Anthropic from '@anthropic-ai/sdk';

// Vite uses import.meta.env for client-side, process.env for server-side/build
// Vercel exposes env vars as both, but we prioritize VITE_ prefix for Vite
const apiKey = (import.meta.env?.VITE_ANTHROPIC_API_KEY || 
                import.meta.env?.ANTHROPIC_API_KEY ||
                (typeof process !== 'undefined' && process.env ? (process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY) : '') || 
                '');

const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

export const getIntroSuggestion = async (senderBio: string, receiverBio: string, goal: string) => {
  if (!anthropic) {
    // Fallback if API key not configured
    return `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
  }
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      temperature: 0.8,
      messages: [{
        role: 'user',
        content: `You are drafting a high-bandwidth connection request for "Tapped", a raw networking protocol for high-intelligence builders.
      
Sender Context: ${senderBio}
Receiver Context: ${receiverBio}
Sync Goal: ${goal}

The vibe is "Founder Brain": 
- Direct, punchy, no social pleasantries. 
- Professional but raw (no "I hope this finds you well").
- Establish intellectual alignment immediately.
- Why should they care about you? Why should you care about them?

Keep it under 180 characters. Output only the message text.`
      }]
    });

    // Extract text from Claude's response
    const textContent = message.content.find(block => block.type === 'text');
    return textContent?.type === 'text' ? textContent.text : `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
  } catch (error) {
    console.error("Claude API Error:", error);
    return `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
  }
};

export const analyzeIntent = async (bio: string) => {
  if (!anthropic) {
    return [];
  }
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `Categorize this node bio for a networking registry: "${bio}".
Identify 3 high-bandwidth "Intents" (e.g., Builder, Catalyst, Learner, Architect).

Return a JSON array with objects containing "intent" and "reason" fields.`
      }]
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (textContent?.type === 'text') {
      // Try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    return [];
  } catch (error) {
    console.error("Claude API Error:", error);
    return [];
  }
};
