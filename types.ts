export enum ContextType {
  PROFESSIONAL = 'Professional',
  BUILDER = 'Builder',
  LEARNER = 'Learner',
  ANONYMOUS = 'Anonymous',
  LOCAL = 'Local'
}

export interface UserStats {
  responseRate: number; // 0-100
  medianReplyTime: string; // e.g., "3h"
  conversationsCompleted: number;
  peopleHelped: number;
  reciprocityCredits: number; // 0-100
}

export interface ContextProfile {
  id: string;
  type: ContextType;
  bio: string;
  goals: string[];
  availabilityRules: string;
  openTo: string[];
  isActive: boolean;
  photo?: string; // URL or base64 data URL for profile photo
}

export interface Signal {
  id: string;
  userId: string;
  userName: string;
  contextType: ContextType;
  content: string;
  expiresAt: Date;
  type: 'OFFER' | 'ASK';
}

export interface NetworkConnection {
  id: string;
  userId: string;
  name: string;
  tagline: string;
  lastInteraction: Date;
  ranking: number; // 1-5
  privateNotes: string;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED';
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  stats: UserStats;
  profiles: ContextProfile[];
}