import { User, ContextProfile } from '../types';

export interface InferredMatch {
  userId: string;
  score: number; // 0-100
  reasons: string[];
  confidence: number; // 0-1
}

/**
 * AI-Powered Inference Service
 * Uses Claude to infer matches even when profiles are incomplete
 */
export const inferMatches = async (
  currentUser: User,
  candidateUsers: User[]
): Promise<InferredMatch[]> => {
  try {
    // If current user has profiles, use them for better inference
    const currentProfile = currentUser.profiles?.[0];
    
    const response = await fetch('/api/claude-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'infer_matches',
        currentUser: {
          name: currentUser.name,
          tagline: currentUser.tagline,
          stats: currentUser.stats,
          profile: currentProfile ? {
            industry: currentProfile.industry,
            topics: currentProfile.topics || [],
            activeSignal: currentProfile.activeSignal,
            location: currentProfile.location,
            openTo: currentProfile.openTo || []
          } : null
        },
        candidates: candidateUsers.map(u => ({
          userId: u.id,
          name: u.name,
          tagline: u.tagline,
          stats: u.stats,
          profile: u.profiles?.[0] ? {
            industry: u.profiles[0].industry,
            topics: u.profiles[0].topics || [],
            activeSignal: u.profiles[0].activeSignal,
            location: u.profiles[0].location,
            openTo: u.profiles[0].openTo || [],
            type: u.profiles[0].type
          } : null
        }))
      })
    });

    if (!response.ok) {
      console.warn('Inference API unavailable, using fallback');
      return fallbackInference(currentUser, candidateUsers);
    }

    const data = await response.json();
    return data.result || fallbackInference(currentUser, candidateUsers);
  } catch (error) {
    console.error('Inference error:', error);
    return fallbackInference(currentUser, candidateUsers);
  }
};

/**
 * Sophisticated fallback inference using multiple signals
 */
const fallbackInference = (
  currentUser: User,
  candidateUsers: User[]
): InferredMatch[] => {
  return candidateUsers.map(candidate => {
    const candidateProfile = candidate.profiles?.[0];
    const currentProfile = currentUser.profiles?.[0];
    
    let score = 30; // Base score
    const reasons: string[] = [];
    let confidence = 0.5;

    // Signal 1: Quality metrics (high follow-through = better match)
    if (candidate.stats.followThroughRate >= 90) {
      score += 15;
      reasons.push('High reliability');
      confidence += 0.1;
    } else if (candidate.stats.followThroughRate >= 80) {
      score += 10;
      reasons.push('Good reliability');
    }

    // Signal 2: Network value (people helped = connector quality)
    if (candidate.stats.peopleHelped >= 50) {
      score += 12;
      reasons.push('Active connector');
      confidence += 0.1;
    } else if (candidate.stats.peopleHelped >= 20) {
      score += 8;
      reasons.push('Engaged networker');
    }

    // Signal 3: Industry alignment (if profiles exist)
    if (currentProfile?.industry && candidateProfile?.industry) {
      const industriesMatch = currentProfile.industry.toLowerCase() === candidateProfile.industry.toLowerCase() ||
        currentProfile.industry.toLowerCase().includes(candidateProfile.industry.toLowerCase()) ||
        candidateProfile.industry.toLowerCase().includes(currentProfile.industry.toLowerCase());
      
      if (industriesMatch) {
        score += 20;
        reasons.push(`Same industry: ${candidateProfile.industry}`);
        confidence += 0.15;
      }
    }

    // Signal 4: Topic overlap
    if (currentProfile?.topics && candidateProfile?.topics) {
      const commonTopics = currentProfile.topics.filter(t =>
        candidateProfile.topics?.some(ct =>
          ct.toLowerCase().includes(t.toLowerCase()) ||
          t.toLowerCase().includes(ct.toLowerCase())
        )
      );
      
      if (commonTopics.length > 0) {
        score += commonTopics.length * 8;
        reasons.push(`Shared interests: ${commonTopics.join(', ')}`);
        confidence += 0.1;
      }
    }

    // Signal 5: Active signal alignment
    if (currentProfile?.activeSignal && candidateProfile?.activeSignal) {
      const signalOverlap = currentProfile.activeSignal.toLowerCase().includes(candidateProfile.activeSignal.toLowerCase()) ||
        candidateProfile.activeSignal.toLowerCase().includes(currentProfile.activeSignal.toLowerCase());
      
      if (signalOverlap) {
        score += 15;
        reasons.push('Aligned signals');
        confidence += 0.1;
      }
    }

    // Signal 6: Location proximity (if available)
    if (currentProfile?.latitude && currentProfile?.longitude &&
        candidateProfile?.latitude && candidateProfile?.longitude) {
      const distance = calculateDistance(
        currentProfile.latitude,
        currentProfile.longitude,
        candidateProfile.latitude,
        candidateProfile.longitude
      );
      
      if (distance < 10) {
        score += 10;
        reasons.push(`Nearby (${Math.round(distance)}km)`);
        confidence += 0.05;
      } else if (distance < 50) {
        score += 5;
        reasons.push(`Same region (${Math.round(distance)}km)`);
      }
    }

    // Signal 7: Open to alignment
    if (currentProfile?.openTo && candidateProfile?.openTo) {
      const openToMatch = currentProfile.openTo.some(ot =>
        candidateProfile.openTo?.some(cot =>
          cot.toLowerCase().includes(ot.toLowerCase()) ||
          ot.toLowerCase().includes(cot.toLowerCase())
        )
      );
      
      if (openToMatch) {
        score += 8;
        reasons.push('Mutual interests');
        confidence += 0.05;
      }
    }

    // Signal 8: Profile completeness (more complete = better)
    if (candidateProfile) {
      let completeness = 0;
      if (candidateProfile.industry) completeness += 0.2;
      if (candidateProfile.topics && candidateProfile.topics.length > 0) completeness += 0.3;
      if (candidateProfile.activeSignal) completeness += 0.2;
      if (candidateProfile.location) completeness += 0.2;
      if (candidateProfile.openTo && candidateProfile.openTo.length > 0) completeness += 0.1;
      
      score += completeness * 10;
      if (completeness > 0.7) {
        reasons.push('Complete profile');
      }
    }

    // Normalize score to 0-100
    score = Math.min(100, Math.max(20, score));
    confidence = Math.min(1, confidence);

    return {
      userId: candidate.id,
      score: Math.round(score),
      reasons: reasons.length > 0 ? reasons : ['Potential match'],
      confidence
    };
  }).sort((a, b) => b.score - a.score);
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
