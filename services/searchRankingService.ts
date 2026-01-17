import { User, ContextProfile, ContextType } from '../types';

export interface RankedSearchResult {
  user: User;
  totalScore: number; // 0-1
  locationScore: number; // 0-1
  relevanceScore: number; // 0-1
  availabilityScore: number; // 0-1
  matchReasons: string[];
  glowTier: 'S' | 'A' | 'B' | 'C' | 'D';
}

/**
 * Calculate Haversine distance between two coordinates in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

/**
 * Location Score (0-1)
 * Formula: 1 / (1 + (distanceKm / R)^p)
 * R = 5km baseline, p = 1.6 decay exponent
 */
export const calculateLocationScore = (
  searcherLat: number | undefined,
  searcherLon: number | undefined,
  candidateLat: number | undefined,
  candidateLon: number | undefined,
  effectiveRadius: number = 5 // Can be increased for fallback
): number => {
  // Unknown location gets default score
  if (!searcherLat || !searcherLon || !candidateLat || !candidateLon) {
    return 0.25; // Default for unknown location
  }

  const distanceKm = calculateDistance(searcherLat, searcherLon, candidateLat, candidateLon);
  const R = effectiveRadius; // Baseline radius in km
  const p = 1.6; // Decay exponent

  // Formula: 1 / (1 + (distanceKm / R)^p)
  const score = 1 / (1 + Math.pow(distanceKm / R, p));
  
  return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
};

/**
 * Sector Overlap (Jaccard similarity)
 * Returns 0-1 based on industry/sector overlap
 */
const calculateSectorOverlap = (
  searcherIndustry: string | undefined,
  candidateIndustry: string | undefined
): number => {
  if (!searcherIndustry || !candidateIndustry) return 0.3; // Partial match if one missing

  const searcherSectors = searcherIndustry.toLowerCase().split(/[,\s]+/).filter(Boolean);
  const candidateSectors = candidateIndustry.toLowerCase().split(/[,\s]+/).filter(Boolean);

  if (searcherSectors.length === 0 || candidateSectors.length === 0) return 0.3;

  // Exact match
  if (searcherIndustry.toLowerCase() === candidateIndustry.toLowerCase()) return 1.0;

  // Check for any overlap
  const intersection = searcherSectors.filter(s => 
    candidateSectors.some(c => c.includes(s) || s.includes(c))
  );
  const union = [...new Set([...searcherSectors, ...candidateSectors])];

  return intersection.length / union.length;
};

/**
 * Topic Similarity (0-1)
 * Based on tag/topic overlap
 */
const calculateTopicSimilarity = (
  searcherTopics: string[],
  candidateTopics: string[]
): number => {
  if (searcherTopics.length === 0 && candidateTopics.length === 0) return 0.5;
  if (searcherTopics.length === 0 || candidateTopics.length === 0) return 0.2;

  const searcherLower = searcherTopics.map(t => t.toLowerCase());
  const candidateLower = candidateTopics.map(t => t.toLowerCase());

  // Count matches (case-insensitive, partial matches count)
  let matches = 0;
  searcherLower.forEach(st => {
    if (candidateLower.some(ct => ct.includes(st) || st.includes(ct))) {
      matches++;
    }
  });

  // Jaccard-like similarity
  const union = new Set([...searcherLower, ...candidateLower]);
  return matches / union.size;
};

/**
 * Role Complementarity (0-1)
 * Founder ↔ VC = 1.0, Founder ↔ Operator = 0.8, etc.
 */
const calculateRoleComplementarity = (
  searcherType: ContextType,
  candidateType: ContextType
): number => {
  // High complementarity pairs
  const highPairs: [ContextType, ContextType][] = [
    [ContextType.FOUNDER, ContextType.PROFESSIONAL], // Founder ↔ VC/Professional
    [ContextType.PROFESSIONAL, ContextType.FOUNDER],
    [ContextType.BUILDER, ContextType.PROFESSIONAL],
    [ContextType.PROFESSIONAL, ContextType.BUILDER],
  ];

  // Check if it's a high complementarity pair
  if (highPairs.some(([a, b]) => 
    (a === searcherType && b === candidateType) || 
    (a === candidateType && b === searcherType)
  )) {
    return 1.0;
  }

  // Medium complementarity (same type but different roles)
  if (searcherType === candidateType) {
    return 0.6; // Peer same type
  }

  // Operator-like relationships
  if (
    (searcherType === ContextType.FOUNDER && candidateType === ContextType.BUILDER) ||
    (searcherType === ContextType.BUILDER && candidateType === ContextType.FOUNDER)
  ) {
    return 0.8;
  }

  // Default
  return 0.4;
};

/**
 * Intent Match (0-1)
 * Based on openTo preferences
 */
const calculateIntentMatch = (
  searcherOpenTo: string[],
  candidateOpenTo: string[]
): number => {
  if (candidateOpenTo.length === 0) return 0.5; // Ambiguous if not specified

  // If searcher wants something specific, check if candidate is open to it
  if (searcherOpenTo.length > 0) {
    const hasMatch = searcherOpenTo.some(intent =>
      candidateOpenTo.some(cIntent => 
        cIntent.toLowerCase().includes(intent.toLowerCase()) ||
        intent.toLowerCase().includes(cIntent.toLowerCase())
      )
    );
    return hasMatch ? 1.0 : 0.0;
  }

  // If searcher hasn't specified, assume they're open to anything
  return 0.5;
};

/**
 * Relevance Score (0-1)
 * Combines: Sector (30%) + Topic (30%) + Role (25%) + Intent (15%)
 */
export const calculateRelevanceScore = (
  searcherProfile: ContextProfile,
  candidateProfile: ContextProfile
): { score: number; reasons: string[] } => {
  const sectorOverlap = calculateSectorOverlap(searcherProfile.industry, candidateProfile.industry);
  const topicSimilarity = calculateTopicSimilarity(
    searcherProfile.topics || [],
    candidateProfile.topics || []
  );
  const roleFit = calculateRoleComplementarity(searcherProfile.type, candidateProfile.type);
  const intentMatch = calculateIntentMatch(
    searcherProfile.openTo || [],
    candidateProfile.openTo || []
  );

  // Weighted combination
  const relevanceScore = 
    (0.30 * sectorOverlap) +
    (0.30 * topicSimilarity) +
    (0.25 * roleFit) +
    (0.15 * intentMatch);

  // Build reasons
  const reasons: string[] = [];
  if (sectorOverlap > 0.7) reasons.push(`Same industry: ${candidateProfile.industry}`);
  if (topicSimilarity > 0.5) {
    const commonTopics = (searcherProfile.topics || []).filter(st =>
      (candidateProfile.topics || []).some(ct => 
        ct.toLowerCase().includes(st.toLowerCase()) || 
        st.toLowerCase().includes(ct.toLowerCase())
      )
    );
    if (commonTopics.length > 0) {
      reasons.push(`Shared topics: ${commonTopics.join(', ')}`);
    }
  }
  if (roleFit > 0.7) reasons.push('Complementary roles');
  if (intentMatch === 1.0) reasons.push('Open to your interests');

  return { score: Math.max(0, Math.min(1, relevanceScore)), reasons };
};

/**
 * Availability Score (0-1)
 * Based on isAvailable flag and connection limits
 */
export const calculateAvailabilityScore = (profile: ContextProfile): number => {
  // If explicitly unavailable
  if (profile.isAvailable === false) return 0.0;

  // If available but has limits
  if (profile.connectionLimit && profile.connectionLimit > 0) {
    const slotsFactor = Math.min(profile.connectionLimit / 3, 1);
    return 0.7 + (0.3 * slotsFactor);
  }

  // If explicitly available
  if (profile.isAvailable === true) return 1.0;

  // Unknown - default to 0.5
  return 0.5;
};

/**
 * Get Glow Tier based on total score
 */
export const getGlowTier = (totalScore: number): 'S' | 'A' | 'B' | 'C' | 'D' => {
  if (totalScore >= 0.82) return 'S';
  if (totalScore >= 0.70) return 'A';
  if (totalScore >= 0.55) return 'B';
  if (totalScore >= 0.40) return 'C';
  return 'D';
};

/**
 * Get CSS classes for glow effect based on tier
 */
export const getGlowClasses = (tier: 'S' | 'A' | 'B' | 'C' | 'D'): string => {
  switch (tier) {
    case 'S':
      return 'border-[#ff4d00] shadow-[0_0_20px_rgba(255,77,0,0.6)] bg-gradient-to-br from-orange-50 to-orange-100';
    case 'A':
      return 'border-[#ff6d33] shadow-[0_0_15px_rgba(255,77,0,0.4)] bg-gradient-to-br from-orange-50/80 to-white';
    case 'B':
      return 'border-[#ff8c66] shadow-[0_0_10px_rgba(255,77,0,0.3)] bg-orange-50/50';
    case 'C':
      return 'border-[#ffaa99] shadow-[0_0_5px_rgba(255,77,0,0.2)] bg-orange-50/30';
    case 'D':
      return 'border-gray-200 bg-white';
    default:
      return 'border-gray-200 bg-white';
  }
};

/**
 * Main Search Ranking Algorithm
 * Always returns results - never empty if users exist
 */
export const rankSearchResults = (
  allUsers: User[],
  searcherProfile: ContextProfile,
  effectiveRadius: number = 5 // Can be increased for fallback
): RankedSearchResult[] => {
  if (allUsers.length === 0) return [];

  const searcherLat = searcherProfile.latitude;
  const searcherLon = searcherProfile.longitude;

  // Calculate scores for all candidates
  console.log(`Ranking ${allUsers.length} users with searcher profile:`, searcherProfile.id);
  const ranked: RankedSearchResult[] = allUsers
    .map(candidate => {
      const candidateProfile = candidate.profiles?.[0];
      if (!candidateProfile) {
        console.warn(`User ${candidate.id} (${candidate.name}) has no profiles, skipping`);
        return null;
      }
      
      console.log(`Ranking user ${candidate.id} (${candidate.name}) with profile:`, candidateProfile.id);

      // Location Score (48% weight)
      const locationScore = calculateLocationScore(
        searcherLat,
        searcherLon,
        candidateProfile.latitude,
        candidateProfile.longitude,
        effectiveRadius
      );

      // Relevance Score (46% weight)
      const { score: relevanceScore, reasons } = calculateRelevanceScore(
        searcherProfile,
        candidateProfile
      );

      // Availability Score (6% weight)
      const availabilityScore = calculateAvailabilityScore(candidateProfile);

      // Enhanced Total Score with sophisticated weighting
      // Location (40%) + Relevance (45%) + Availability (5%) + Quality Boost (10%)
      
      // Quality boost based on user stats
      let qualityBoost = 0;
      if (candidate.stats.followThroughRate >= 95) qualityBoost += 0.05;
      else if (candidate.stats.followThroughRate >= 85) qualityBoost += 0.03;
      
      if (candidate.stats.peopleHelped >= 50) qualityBoost += 0.03;
      else if (candidate.stats.peopleHelped >= 20) qualityBoost += 0.02;
      
      if (candidate.stats.conversationsCompleted >= 100) qualityBoost += 0.02;
      
      // Profile completeness boost
      let completeness = 0;
      if (candidateProfile.industry) completeness += 0.15;
      if (candidateProfile.topics && candidateProfile.topics.length >= 3) completeness += 0.15;
      if (candidateProfile.activeSignal) completeness += 0.10;
      if (candidateProfile.location && candidateProfile.latitude) completeness += 0.10;
      qualityBoost += Math.min(completeness, 0.05);
      
      const totalScore = 
        (0.40 * locationScore) +
        (0.45 * relevanceScore) +
        (0.05 * availabilityScore) +
        Math.min(qualityBoost, 0.10); // Cap quality boost at 10%

      // Add location reason if significant
      const allReasons = [...reasons];
      if (locationScore > 0.5) {
        if (candidateProfile.latitude && candidateProfile.longitude) {
          const distance = calculateDistance(
            searcherLat || 0,
            searcherLon || 0,
            candidateProfile.latitude,
            candidateProfile.longitude
          );
          allReasons.push(`Nearby (${Math.round(distance)}km)`);
        }
      }
      
      // Add quality signals to reasons
      if (candidate.stats.followThroughRate >= 95) {
        allReasons.push('Exceptional reliability');
      } else if (candidate.stats.followThroughRate >= 85) {
        allReasons.push('High reliability');
      }
      
      if (candidate.stats.peopleHelped >= 50) {
        allReasons.push('Active connector');
      } else if (candidate.stats.peopleHelped >= 20) {
        allReasons.push('Engaged networker');
      }
      
      // Profile completeness indicator
      const profileCompleteness = [
        candidateProfile.industry,
        candidateProfile.topics?.length,
        candidateProfile.activeSignal,
        candidateProfile.location
      ].filter(Boolean).length;
      
      if (profileCompleteness >= 4) {
        allReasons.push('Complete profile');
      }

      return {
        user: candidate,
        totalScore,
        locationScore,
        relevanceScore,
        availabilityScore,
        matchReasons: allReasons.length > 0 ? allReasons : ['Potential match'],
        glowTier: getGlowTier(totalScore)
      };
    })
    .filter((r): r is RankedSearchResult => r !== null)
    .sort((a, b) => b.totalScore - a.totalScore); // Sort descending

  // Fallback: If we have very few results, relax constraints
  if (ranked.length < 20 && effectiveRadius < 50) {
    // Recursively call with larger radius
    return rankSearchResults(allUsers, searcherProfile, effectiveRadius * 2);
  }

  return ranked;
};
