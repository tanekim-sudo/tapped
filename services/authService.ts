import { User, UserStats, ContextProfile, ContextType } from '../types';

export interface AuthUser {
  email: string;
  password: string;
  name: string;
}

// Simple localStorage-based auth (replace with real backend later)
const STORAGE_KEY = 'tapped_auth';
const USERS_KEY = 'tapped_users';

export const authService = {
  // Sign up
  signUp: async (email: string, password: string, name: string): Promise<User> => {
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
        responseRate: 100,
        medianReplyTime: '0m',
        conversationsCompleted: 0,
        peopleHelped: 0,
        reciprocityCredits: 5 // Starting credits
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
    const users = getStoredUsers();
    const userData = users.find(u => u.email === email && u.password === password);
    
    if (!userData) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, userId: userData.user.id }));
    return userData.user;
  },

  // Get current user
  getCurrentUser: (): User | null => {
    const auth = localStorage.getItem(STORAGE_KEY);
    if (!auth) return null;

    const { userId } = JSON.parse(auth);
    const users = getStoredUsers();
    const userData = users.find(u => u.user.id === userId);
    
    return userData ? userData.user : null;
  },

  // Sign out
  signOut: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Update user
  updateUser: (userId: string, updates: Partial<User>): User | null => {
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
