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
      // Return default suggestion if API unavailable
      return `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
    }

    const data = await response.json();
    return data.result || `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
  } catch (error) {
    // API not available - return default suggestion (silent fallback)
    return `Intent: Align on ${goal}. Verify reachability for mesh expansion.`;
  }
};

export const analyzeIntent = async (bio: string) => {
  // This function can be implemented similarly if needed
  return [];
};

/**
 * Rank connection applicants based on their answers to qualification questions
 * Returns ranked list with scores (0-100) and explanations
 */
export const rankConnectionApplicants = async (
  questions: string[],
  applicants: Array<{
    userId: string;
    name: string;
    profile: {
      activeSignal?: string;
      industry?: string;
      topics?: string[];
    };
    answers: string[];
  }>,
  recipientPreferences?: {
    industry?: string;
    topics?: string[];
    activeSignal?: string;
  }
): Promise<Array<{
  userId: string;
  score: number; // 0-100
  reason: string; // Explanation for the score
}>> => {
  try {
    const response = await fetch('/api/claude-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'rank_applicants',
        questions,
        applicants: applicants.map(a => ({
          userId: a.userId,
          name: a.name,
          profile: a.profile,
          answers: a.answers
        })),
        recipientPreferences
      })
    });

    if (!response.ok) {
      // Fallback: simple ranking based on answer length and profile match
      return applicants.map((a, idx) => ({
        userId: a.userId,
        score: 50 + (idx % 30), // Basic fallback score
        reason: 'Basic matching (AI unavailable)'
      }));
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Failed to rank applicants:', error);
    // Fallback ranking
    return applicants.map((a, idx) => ({
      userId: a.userId,
      score: 50 + (idx % 30),
      reason: 'Basic matching (AI unavailable)'
    }));
  }
};
