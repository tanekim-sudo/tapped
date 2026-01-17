export enum ContextType {
  FOUNDER = 'Founder',
  PERSONAL = 'Personal',
  ANONYMOUS = 'Anonymous',
  PROFESSIONAL = 'Professional', // Keep for backward compatibility
  BUILDER = 'Builder', // Keep for backward compatibility
  LEARNER = 'Learner', // Keep for backward compatibility
  LOCAL = 'Local' // Keep for backward compatibility
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
  userId: string; // The user who owns this connection record
  connectedUserId: string; // The other user in this connection
  name: string;
  tagline: string;
  lastInteraction: Date;
  privateNotes: string;
  status: 'ACTIVE' | 'PENDING' | 'CLOSED' | 'DECLINED';
  timeCommitment?: '10min' | '15min' | 'async' | 'custom';
  introducedBy?: string; // User ID of who introduced them
  isInitiator: boolean; // true if this user sent the request
}

export interface NetworkVaultContact {
  id: string;
  name: string;
  email?: string;
  linkedInUrl?: string;
  context: 'founder' | 'investor' | 'operator' | 'friend' | 'other';
  strength: 'strong' | 'medium' | 'loose';
  goodFor: string[]; // What they're good for (e.g., ["AI advice", "VC intros", "Engineering"])
  notes?: string;
  importedFrom?: 'linkedin' | 'contacts' | 'manual';
  userId: string; // Owner of this vault contact
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  stats: UserStats;
  profiles: ContextProfile[];
  networkVault?: NetworkVaultContact[]; // Private network vault
}