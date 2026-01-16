import Anthropic from '@anthropic-ai/sdk';
import { User, ContextProfile } from '../types';
import { dbService } from './supabaseService';

const apiKey = (import.meta.env?.VITE_ANTHROPIC_API_KEY || 
                import.meta.env?.ANTHROPIC_API_KEY ||
                (typeof process !== 'undefined' && process.env ? (process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY) : '') || 
                '');

const anthropic = apiKey ? new Anthropic({ 
  apiKey,
  dangerouslyAllowBrowser: true // Required for client-side usage. API key is in env vars, not hardcoded.
}) : null;

interface SearchResult {
  user: User;
  relevanceScore: number;
  matchReasons: string[];
  suggestedConnectionType?: string;
}

interface SearchFilters {
  industry?: string;
  topic?: string;
  location?: string;
  openTo?: string[];
  minFollowThroughRate?: number;
  hasVouch?: boolean;
}

/**
 * Enhanced semantic search using Claude API
 * Understands intent, context, and provides intelligent matching
 */
export const enhancedSearch = async (
  query: string,
  currentUserId: string,
  filters?: SearchFilters
): Promise<SearchResult[]> => {
  if (!anthropic) {
    // Fallback to basic search
    return basicSearch(query, currentUserId, filters);
  }

  try {
    // Get all discovery users
    const allUsers = await dbService.getDiscoveryUsers(currentUserId);
    
    if (allUsers.length === 0) return [];

    // Prepare user data for Claude analysis
    const usersData = allUsers.map(u => ({
      id: u.id,
      name: u.name,
      tagline: u.tagline,
      bio: u.profiles[0]?.bio || '',
      industry: u.profiles[0]?.industry || '',
      topics: u.profiles[0]?.topics || [],
      location: u.profiles[0]?.location || '',
      openTo: u.profiles[0]?.openTo || [],
      followThroughRate: u.stats.followThroughRate || 0,
      introducedBy: u.stats.introducedBy,
      peopleHelped: u.stats.peopleHelped || 0
    }));

    // Use Claude to understand search intent and match users
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: `You are a networking platform search engine. Analyze this search query and match it to the most relevant users.

Search Query: "${query}"
${filters ? `Filters: ${JSON.stringify(filters)}` : ''}

Available Users:
${JSON.stringify(usersData, null, 2)}

Your task:
1. Understand the search intent (industry, topic, role, interest, etc.)
2. Rank users by relevance (0-100 score)
3. Explain why each match is relevant
4. Suggest the best connection type (e.g., "Mentorship", "Collaboration", "Advice", "Introduction")

Return a JSON array of matches with this structure:
[
  {
    "userId": "user_id",
    "relevanceScore": 85,
    "matchReasons": ["Reason 1", "Reason 2"],
    "suggestedConnectionType": "Mentorship"
  }
]

Only include users with relevanceScore >= 30. Sort by relevanceScore descending.`
      }]
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (textContent?.type === 'text') {
      // Extract JSON from response
      const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const matches = JSON.parse(jsonMatch[0]);
        
        return matches
          .map((match: any) => {
            const user = allUsers.find(u => u.id === match.userId);
            if (!user) return null;
            
            return {
              user,
              relevanceScore: match.relevanceScore || 0,
              matchReasons: match.matchReasons || [],
              suggestedConnectionType: match.suggestedConnectionType
            };
          })
          .filter((r: any) => r !== null)
          .sort((a: SearchResult, b: SearchResult) => b.relevanceScore - a.relevanceScore);
      }
    }
    
    // Fallback to basic search
    return basicSearch(query, currentUserId, filters);
  } catch (error) {
    console.error('Enhanced search error:', error);
    return basicSearch(query, currentUserId, filters);
  }
};

/**
 * Basic keyword-based search fallback
 */
const basicSearch = async (
  query: string,
  currentUserId: string,
  filters?: SearchFilters
): Promise<SearchResult[]> => {
  const allUsers = await dbService.getDiscoveryUsers(currentUserId);
  const queryLower = query.toLowerCase();
  
  const results: SearchResult[] = allUsers
    .map(user => {
      const profile = user.profiles[0];
      if (!profile) return null;
      
      let score = 0;
      const reasons: string[] = [];
      
      // Check bio
      if (profile.bio.toLowerCase().includes(queryLower)) {
        score += 30;
        reasons.push('Bio matches query');
      }
      
      // Check industry
      if (filters?.industry && profile.industry?.toLowerCase().includes(filters.industry.toLowerCase())) {
        score += 40;
        reasons.push(`Industry: ${profile.industry}`);
      } else if (profile.industry?.toLowerCase().includes(queryLower)) {
        score += 30;
        reasons.push(`Industry: ${profile.industry}`);
      }
      
      // Check topics
      const matchingTopics = profile.topics?.filter(t => 
        t.toLowerCase().includes(queryLower) || 
        queryLower.includes(t.toLowerCase())
      ) || [];
      if (matchingTopics.length > 0) {
        score += matchingTopics.length * 20;
        reasons.push(`Topics: ${matchingTopics.join(', ')}`);
      }
      
      // Check location
      if (filters?.location && profile.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        score += 20;
        reasons.push(`Location: ${profile.location}`);
      }
      
      // Boost for high follow-through
      if (user.stats.followThroughRate >= 80) {
        score += 10;
        reasons.push('High follow-through rate');
      }
      
      // Boost for vouched users
      if (user.stats.introducedBy) {
        score += 15;
        reasons.push('Vouched by trusted connector');
      }
      
      if (score === 0) return null;
      
      return {
        user,
        relevanceScore: Math.min(score, 100),
        matchReasons: reasons
      };
    })
    .filter((r): r is SearchResult => r !== null)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return results;
};

/**
 * Get personalized recommendations using Claude
 */
export const getRecommendations = async (
  currentUserId: string,
  currentUser: User
): Promise<SearchResult[]> => {
  if (!anthropic) return [];
  
  try {
    const allUsers = await dbService.getDiscoveryUsers(currentUserId);
    
    if (allUsers.length === 0) return [];
    
    const currentProfile = currentUser.profiles[0];
    const usersData = allUsers.map(u => ({
      id: u.id,
      name: u.name,
      bio: u.profiles[0]?.bio || '',
      industry: u.profiles[0]?.industry || '',
      topics: u.profiles[0]?.topics || [],
      openTo: u.profiles[0]?.openTo || [],
      followThroughRate: u.stats.followThroughRate || 0,
      peopleHelped: u.stats.peopleHelped || 0
    }));
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.4,
      messages: [{
        role: 'user',
        content: `You are a networking recommendation engine. Based on this user's profile, recommend the most valuable connections.

Current User:
- Bio: ${currentProfile?.bio || 'N/A'}
- Industry: ${currentProfile?.industry || 'N/A'}
- Topics: ${currentProfile?.topics?.join(', ') || 'N/A'}
- Open To: ${currentProfile?.openTo?.join(', ') || 'N/A'}

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
        const matches = JSON.parse(jsonMatch[0]);
        
        return matches
          .map((match: any) => {
            const user = allUsers.find(u => u.id === match.userId);
            if (!user) return null;
            
            return {
              user,
              relevanceScore: match.relevanceScore || 0,
              matchReasons: match.matchReasons || [],
              suggestedConnectionType: match.suggestedConnectionType
            };
          })
          .filter((r: any) => r !== null)
          .sort((a: SearchResult, b: SearchResult) => b.relevanceScore - a.relevanceScore);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Recommendations error:', error);
    return [];
  }
};

/**
 * Generate search suggestions based on partial query
 */
export const getSearchSuggestions = async (
  partialQuery: string,
  currentUserId: string
): Promise<string[]> => {
  if (!anthropic || partialQuery.length < 2) return [];
  
  try {
    const allUsers = await dbService.getDiscoveryUsers(currentUserId);
    
    const industries = new Set<string>();
    const topics = new Set<string>();
    
    allUsers.forEach(user => {
      user.profiles.forEach(profile => {
        if (profile.industry) industries.add(profile.industry);
        profile.topics?.forEach(t => topics.add(t));
      });
    });
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: `User typed: "${partialQuery}"

Available industries: ${Array.from(industries).join(', ')}
Available topics: ${Array.from(topics).join(', ')}

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
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Search suggestions error:', error);
    return [];
  }
};
