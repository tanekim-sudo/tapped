import { User, UserStats, ContextProfile, ContextType } from '../types';
import { dbService } from './supabaseService';

export interface AuthUser {
  email: string;
  password: string;
  name: string;
}

// Simple localStorage-based auth (with database fallback)
const STORAGE_KEY = 'tapped_auth';
const USERS_KEY = 'tapped_users';

// Check if Supabase is configured
const useDatabase = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(supabaseUrl && supabaseKey);
};

// Simple password hashing (in production, use proper hashing)
const hashPassword = (password: string): string => {
  // Simple hash for demo - in production use bcrypt or similar
  return btoa(password);
};

export const authService = {
  // Sign up
  signUp: async (email: string, password: string, name: string): Promise<User> => {
    if (useDatabase()) {
      // Check if user exists (case-insensitive)
      const existingUser = await dbService.getUserByEmail(email.toLowerCase().trim());
      if (existingUser) {
        throw new Error('User already exists');
      }

      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        tagline: '',
        stats: {
          conversationsCompleted: 0,
          peopleHelped: 0,
          followThroughRate: 100
        },
        profiles: []
      };

      // Add email and password to user object for database
      const userWithAuth = {
        ...newUser,
        email: email.toLowerCase().trim(), // Normalize email
        password_hash: hashPassword(password)
      } as any;

      const created = await dbService.createUser(userWithAuth);
      if (!created) throw new Error('Failed to create user');
      
      // Auto login
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, userId: newUser.id }));
      
      return newUser;
    }

    // Fallback to localStorage
    const users = getStoredUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      tagline: '',
      stats: {
        conversationsCompleted: 0,
        peopleHelped: 0,
        followThroughRate: 100
      },
      profiles: []
    };

    users.push({ email, password, name, user: newUser });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, userId: newUser.id }));
    
    return newUser;
  },

  // Sign in
  signIn: async (email: string, password: string): Promise<User> => {
    if (useDatabase()) {
      // Query directly for the user by email (case-insensitive)
      const userData = await dbService.getUserByEmail(email.toLowerCase().trim());
      
      if (!userData) {
        throw new Error('Invalid email or password');
      }
      
      // Get password hash from database
      const passwordHash = await dbService.getUserPasswordHash(userData.id);
      
      if (!passwordHash || passwordHash !== hashPassword(password)) {
        throw new Error('Invalid email or password');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email.toLowerCase().trim(), userId: userData.id }));
      return userData;
    }

    // Fallback to localStorage
    const users = getStoredUsers();
    const userData = users.find(u => u.email === email && u.password === password);
    
    if (!userData) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, userId: userData.user.id }));
    return userData.user;
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const auth = localStorage.getItem(STORAGE_KEY);
    if (!auth) return null;

    const { userId } = JSON.parse(auth);
    
    if (useDatabase()) {
      return await dbService.getUserById(userId);
    }
    
    // Fallback to localStorage
    const users = getStoredUsers();
    const userData = users.find(u => u.user.id === userId);
    
    return userData ? userData.user : null;
  },

  // Sign out
  signOut: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Update user
  updateUser: async (userId: string, updates: Partial<User>): Promise<User | null> => {
    if (useDatabase()) {
      return await dbService.updateUser(userId, updates);
    }
    
    // Fallback to localStorage
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.user.id === userId);
    
    if (userIndex === -1) return null;

    users[userIndex].user = { ...users[userIndex].user, ...updates };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return users[userIndex].user;
  }
};

interface StoredUser {
  email: string;
  password: string;
  name: string;
  user: User;
}

function getStoredUsers(): StoredUser[] {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}
