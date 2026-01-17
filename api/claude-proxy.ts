import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from server-side environment (not exposed to client)
  // IMPORTANT: API keys must NEVER be in client-side code - this proxy keeps it secure
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not found in environment variables');
    return res.status(500).json({ 
      error: 'API key not configured',
      message: 'Please set ANTHROPIC_API_KEY in your Vercel environment variables'
    });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const { type, ...params } = req.body;

    if (type === 'intro') {
      // Generate intro message
      const { senderBio, receiverBio, goal } = params;
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

      const textContent = message.content.find(block => block.type === 'text');
      return res.status(200).json({ 
        result: textContent?.type === 'text' ? textContent.text : `Intent: Align on ${goal}. Verify reachability for mesh expansion.`
      });
    }

    if (type === 'search') {
      // Enhanced search with location-based ranking
      const { query, usersData, filters, currentUserLocation } = params;
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: `You are a networking platform search engine. Analyze this search query and match it to the most relevant users, considering location proximity when available.

Search Query: "${query}"
${filters ? `Filters: ${JSON.stringify(filters)}` : ''}
${currentUserLocation ? `Current User Location: ${currentUserLocation.location || 'N/A'} (${currentUserLocation.latitude || 'N/A'}, ${currentUserLocation.longitude || 'N/A'})` : ''}

Available Users:
${JSON.stringify(usersData, null, 2)}

Your task:
1. Understand the search intent (industry, topic, role, interest, location proximity, etc.)
2. Rank ALL users by relevance (0-100 score) - never return empty results
3. Consider location proximity if coordinates are available (closer users get higher scores)
4. Explain why each match is relevant
5. Suggest the best connection type (e.g., "Mentorship", "Collaboration", "Advice", "Introduction", "Local Meetup")

Ranking factors:
- Query match (industry, topics, active signal)
- Location proximity (if coordinates available, prioritize nearby users)
- Profile alignment with current user's interests
- User quality metrics (followThroughRate, peopleHelped)
- Mutual value potential

Return a JSON array of matches with this structure:
[
  {
    "userId": "user_id",
    "relevanceScore": 85,
    "matchReasons": ["Reason 1", "Reason 2"],
    "suggestedConnectionType": "Mentorship"
  }
]

IMPORTANT: Rank ALL users, even if query is empty or vague. Minimum score should be 20. Sort by relevanceScore descending.`
        }]
      });

      const textContent = message.content.find(block => block.type === 'text');
      if (textContent?.type === 'text') {
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return res.status(200).json({ result: JSON.parse(jsonMatch[0]) });
        }
      }
      return res.status(200).json({ result: [] });
    }

    if (type === 'recommendations') {
      // Get recommendations
      const { currentUser, usersData } = params;
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        temperature: 0.4,
        messages: [{
          role: 'user',
          content: `You are a networking recommendation engine. Based on this user's profile, recommend the most valuable connections.

Current User:
- Bio: ${currentUser.bio || 'N/A'}
- Industry: ${currentUser.industry || 'N/A'}
- Topics: ${currentUser.topics?.join(', ') || 'N/A'}
- Open To: ${currentUser.openTo?.join(', ') || 'N/A'}

Available Users:
${JSON.stringify(usersData, null, 2)}

Recommend 5-10 users who would be most valuable connections. Consider:
1. Complementary skills/interests
2. Mutual value exchange potential
3. Industry alignment
4. Topic overlap
5. High-quality connectors (peopleHelped, followThroughRate)

Return JSON array:
[
  {
    "userId": "user_id",
    "relevanceScore": 85,
    "matchReasons": ["Reason 1", "Reason 2"],
    "suggestedConnectionType": "Collaboration"
  }
]`
        }]
      });

      const textContent = message.content.find(block => block.type === 'text');
      if (textContent?.type === 'text') {
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return res.status(200).json({ result: JSON.parse(jsonMatch[0]) });
        }
      }
      return res.status(200).json({ result: [] });
    }

    if (type === 'suggestions') {
      // Search suggestions
      const { partialQuery, industries, topics } = params;
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.5,
        messages: [{
          role: 'user',
          content: `User typed: "${partialQuery}"

Available industries: ${industries.join(', ')}
Available topics: ${topics.join(', ')}

Generate 5-8 search suggestions that:
1. Complete or expand on the partial query
2. Use available industries/topics
3. Are relevant for a professional networking platform
4. Include variations and related terms

Return as JSON array of strings: ["suggestion1", "suggestion2", ...]`
        }]
      });

      const textContent = message.content.find(block => block.type === 'text');
      if (textContent?.type === 'text') {
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return res.status(200).json({ result: JSON.parse(jsonMatch[0]) });
        }
      }
      return res.status(200).json({ result: [] });
    }

    if (type === 'rank_applicants') {
      // Rank connection applicants
      const { questions, applicants, recipientPreferences } = params;
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: `You are a connection filtering system for a high-bandwidth networking platform. A user has set qualification questions and received connection applications. Your job is to rank applicants based on how well their answers align with the recipient's preferences.

Qualification Questions:
${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Recipient Preferences:
- Industry: ${recipientPreferences?.industry || 'Not specified'}
- Topics: ${recipientPreferences?.topics?.join(', ') || 'Not specified'}
- Active Signal: ${recipientPreferences?.activeSignal || 'Not specified'}

Applicants and Their Answers:
${applicants.map((app: any) => `
Applicant: ${app.name}
Profile: ${app.profile.activeSignal || app.profile.industry || 'N/A'}
Industry: ${app.profile.industry || 'N/A'}
Topics: ${app.profile.topics?.join(', ') || 'N/A'}
Answers:
${questions.map((q: string, i: number) => `  Q${i + 1}: ${app.answers[i] || 'No answer'}`).join('\n')}
`).join('\n---\n')}

Your task:
1. Evaluate each applicant's answers for quality, relevance, and alignment with recipient preferences
2. Consider profile match (industry, topics, active signal)
3. Score each applicant 0-100 based on:
   - Answer quality and thoughtfulness
   - Relevance to recipient's needs/preferences
   - Profile alignment
   - Potential for valuable connection
4. Provide a brief explanation (1-2 sentences) for each score

Return JSON array:
[
  {
    "userId": "user_id",
    "score": 85,
    "reason": "Strong alignment with recipient's industry focus. Answers demonstrate clear value proposition and mutual benefit potential."
  }
]

Sort by score descending. Be selective - only high-quality matches should score above 70.`
        }]
      });

      const textContent = message.content.find(block => block.type === 'text');
      if (textContent?.type === 'text') {
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            return res.status(200).json({ result: JSON.parse(jsonMatch[0]) });
          } catch (e) {
            console.error('Failed to parse ranking JSON:', e);
          }
        }
      }
      return res.status(200).json({ result: [] });
    }

    if (type === 'infer_matches') {
      // AI-powered inference for matches when profiles are incomplete
      const { currentUser, candidates } = params;
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.2, // Lower temperature for more consistent ranking
        messages: [{
          role: 'user',
          content: `You are an advanced networking inference engine for a high-bandwidth professional networking platform. Your task is to intelligently rank potential connections based on available signals, even when profile data is incomplete.

Current User:
- Name: ${currentUser.name}
- Tagline: ${currentUser.tagline || 'N/A'}
- Stats: ${JSON.stringify(currentUser.stats)}
${currentUser.profile ? `
- Industry: ${currentUser.profile.industry || 'N/A'}
- Topics: ${currentUser.profile.topics?.join(', ') || 'N/A'}
- Active Signal: ${currentUser.profile.activeSignal || 'N/A'}
- Location: ${currentUser.profile.location || 'N/A'}
- Open To: ${currentUser.profile.openTo?.join(', ') || 'N/A'}
` : '- Profile: Incomplete or not available'}

Candidates to Rank:
${candidates.map((c: any) => `
Candidate: ${c.name}
- Tagline: ${c.tagline || 'N/A'}
- Stats: ${JSON.stringify(c.stats)}
${c.profile ? `
- Industry: ${c.profile.industry || 'N/A'}
- Topics: ${c.profile.topics?.join(', ') || 'N/A'}
- Active Signal: ${c.profile.activeSignal || 'N/A'}
- Location: ${c.profile.location || 'N/A'}
- Open To: ${c.profile.openTo?.join(', ') || 'N/A'}
- Type: ${c.profile.type || 'N/A'}
` : '- Profile: Incomplete'}
`).join('\n---\n')}

Your sophisticated ranking should consider:

1. **Quality Signals** (30% weight):
   - Follow-through rate (reliability indicator)
   - People helped (network value)
   - Conversation completion rate

2. **Profile Alignment** (35% weight):
   - Industry overlap
   - Topic/interest similarity
   - Active signal alignment
   - Role complementarity (Founder ↔ VC, Builder ↔ Professional, etc.)

3. **Location Proximity** (15% weight):
   - Geographic distance (if available)
   - Regional clustering

4. **Intent Match** (10% weight):
   - Open to preferences alignment
   - Mutual value potential

5. **Profile Completeness** (10% weight):
   - More complete profiles = higher confidence
   - Rich signals = better matches

6. **Inference from Limited Data**:
   - Infer industry from tagline/bio if not explicit
   - Infer interests from name/context
   - Use network patterns to predict value

Return a JSON array with sophisticated rankings:
[
  {
    "userId": "user_id",
    "score": 87,  // 0-100, be selective - only truly good matches above 70
    "reasons": ["Reason 1", "Reason 2", "Reason 3"],  // 2-4 specific reasons
    "confidence": 0.85  // 0-1, how confident you are in this match
  }
]

Be sophisticated and nuanced:
- Don't give everyone the same score
- Create meaningful differentiation (top matches 80-95, good matches 65-79, potential 50-64, weak 30-49)
- Consider subtle signals and patterns
- Think about mutual value exchange potential
- Consider network effects and connector quality

Sort by score descending. Minimum score should be 25.`
        }]
      });

      const textContent = message.content.find(block => block.type === 'text');
      if (textContent?.type === 'text') {
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            return res.status(200).json({ result: JSON.parse(jsonMatch[0]) });
          } catch (e) {
            console.error('Failed to parse inference JSON:', e);
          }
        }
      }
      return res.status(200).json({ result: [] });
    }

    return res.status(400).json({ error: 'Invalid request type' });
  } catch (error: any) {
    console.error('Claude API Error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      type: error.type
    });
    return res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
