export enum ContextType {
  PROFESSIONAL = 'Professional',
  BUILDER = 'Builder',
  LEARNER = 'Learner',
  ANONYMOUS = 'Anonymous',
  LOCAL = 'Local'
}

export interface UserStats {
  conversationsCompleted: number;
  peopleHelped: number;
  followThroughRate: number; // 0-100, tracks if they actually follow through on commitments
  introducedBy?: string; // User ID of who introduced them
}

export interface ContextProfile {
  id: string;
  type: ContextType;
  bio: string;
  industry: string; // e.g., "Tech", "VC", "Education"
  topics: string[]; // e.g., ["Startups", "AI", "Networking"]
  availabilityRules: string; // Meeting types (e.g., "Coffee chats, Video calls, In-person")
  location: string; // Where you are located / where you can meet
  openTo: string[];
  isActive: boolean;
  photo?: string; // URL or base64 data URL for profile photo
}

export interface NetworkConnection {
  id: string;
  userId: string;
  name: string;
  tagline: string;
  lastInteraction: Date;
  privateNotes: string;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED' | 'DECLINED';
  timeCommitment?: '10min' | '15min' | 'async' | 'custom';
  introducedBy?: string; // User ID of who introduced them
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  stats: UserStats;
  profiles: ContextProfile[];
}