import { User, ContextProfile } from '../types';
import { dbService } from './supabaseService';

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
 * Enhanced semantic search using Claude API via secure backend
 */
export const enhancedSearch = async (
  query: string,
  currentUserId: string,
  filters?: SearchFilters
): Promise<SearchResult[]> => {
  try {
    // Get all discovery users
    const allUsers = await dbService.getDiscoveryUsers(currentUserId);
    
    if (allUsers.length === 0) return [];

    // Prepare user data for Claude analysis
    const usersData = allUsers.map(u => ({
      id: u.id,
      name: u.name,
      tagline: u.tagline,
      activeSignal: u.profiles[0]?.activeSignal || '',
      industry: u.profiles[0]?.industry || '',
      topics: u.profiles[0]?.topics || [],
      location: u.profiles[0]?.location || '',
      openTo: u.profiles[0]?.openTo || [],
      followThroughRate: u.stats.followThroughRate || 0,
      introducedBy: u.stats.introducedBy,
      peopleHelped: u.stats.peopleHelped || 0
    }));

    // Call secure backend API (optional - falls back to basic search if unavailable)
    try {
      const response = await fetch('/api/claude-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'search',
          query,
          usersData,
          filters
        })
      });

      if (!response.ok) {
        // Fallback to basic search
        return basicSearch(query, currentUserId, filters);
      }

      const data = await response.json();
      const matches = data.result || [];
      
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
    } catch (fetchError) {
      // API not available - use basic search (silent fallback)
      return basicSearch(query, currentUserId, filters);
    }
  } catch (error) {
    // Outer catch for any other errors
    return basicSearch(query, currentUserId, filters);
  }
};

/**
 * Basic keyword-based search fallback
 */
const basicSearch = async (
  query: string,
  currentUserId: string,
  filters?: SearchFilters,
  allUsersOverride?: any[] // Allow passing users directly
): Promise<SearchResult[]> => {
  const allUsers = allUsersOverride || await dbService.getDiscoveryUsers(currentUserId);
  const queryLower = query.toLowerCase();
  
  const results: SearchResult[] = allUsers
    .map(user => {
      const profile = user.profiles[0];
      if (!profile) return null;
      
      let score = 0;
      const reasons: string[] = [];
      
      // Check activeSignal (replaces bio)
      if (profile.activeSignal?.toLowerCase().includes(queryLower)) {
        score += 30;
        reasons.push('Active signal matches query');
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
 * Get personalized recommendations using Claude via secure backend
 */
export const getRecommendations = async (
  currentUserId: string,
  currentUser: User
): Promise<SearchResult[]> => {
  try {
    const allUsers = await dbService.getDiscoveryUsers(currentUserId);
    
    if (allUsers.length === 0) return [];
    
    const currentProfile = currentUser.profiles[0];
    const usersData = allUsers.map(u => ({
      id: u.id,
      name: u.name,
      activeSignal: u.profiles[0]?.activeSignal || '',
      industry: u.profiles[0]?.industry || '',
      topics: u.profiles[0]?.topics || [],
      openTo: u.profiles[0]?.openTo || [],
      followThroughRate: u.stats.followThroughRate || 0,
      peopleHelped: u.stats.peopleHelped || 0
    }));
    
    // Try AI recommendations (optional - returns empty array if unavailable)
    try {
      const response = await fetch('/api/claude-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'recommendations',
          currentUser: {
            activeSignal: currentProfile?.activeSignal || '',
            industry: currentProfile?.industry || '',
            topics: currentProfile?.topics || [],
            openTo: currentProfile?.openTo || []
          },
          usersData
        })
      });
      
      if (!response.ok) {
        return []; // Return empty recommendations if API unavailable
      }

      const data = await response.json();
      const matches = data.result || [];
      
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
    } catch (fetchError) {
      // API not available - return empty array (silent fallback)
      return [];
    }
  } catch (error) {
    // Outer catch for any other errors
    return [];
  }
};

/**
 * Generate search suggestions based on partial query via secure backend
 */
export const getSearchSuggestions = async (
  partialQuery: string,
  currentUserId: string
): Promise<string[]> => {
  if (partialQuery.length < 2) return [];
  
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
    
    // Try AI suggestions (optional - returns empty array if unavailable)
    try {
      const response = await fetch('/api/claude-proxy', {
        method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'suggestions',
        partialQuery,
        industries: Array.from(industries),
        topics: Array.from(topics)
      })
    });
    
    if (!response.ok) {
      return [];
    }

      const data = await response.json();
      return data.result || [];
    } catch (fetchError) {
      // API not available - return empty array (silent fallback)
      return [];
    }
  } catch (error) {
    // Outer catch for any other errors
    return [];
  }
};
