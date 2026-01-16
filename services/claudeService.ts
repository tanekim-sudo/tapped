// Secure client-side service that calls backend API instead of Anthropic directly

export const getIntroSuggestion = async (senderBio: string, receiverBio: string, goal: string) => {
  try {
    const response = await fetch('/api/claude-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'intro',
        senderBio,
        receiverBio,
        goal
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.result || `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
  } catch (error) {
    console.error("Claude API Error:", error);
    return `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
  }
};

export const analyzeIntent = async (bio: string) => {
  // This function can be implemented similarly if needed
  return [];
};
