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

export interface SignalResponse {
  userId: string;
  userName: string;
  respondedAt: Date;
  status: 'ACCEPTED' | 'DECLINED' | 'PENDING';
}

export interface Signal {
  id: string;
  userId: string;
  userName: string;
  profileId: string; // Tied to specific profile
  contextType: ContextType;
  content: string;
  expiresAt: Date;
  type: 'OFFER' | 'ASK';
  responses: SignalResponse[]; // Track who responded
  createdAt: Date;
}

export interface NetworkConnection {
  id: string;
  userId: string;
  name: string;
  tagline: string;
  lastInteraction: Date;
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