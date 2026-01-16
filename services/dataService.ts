import { User, NetworkConnection } from '../types';
import { dbService } from './supabaseService';

const CONNECTIONS_KEY = 'tapped_connections';
const DISCOVERY_USERS_KEY = 'tapped_discovery_users';

// Check if Supabase is configured
const useDatabase = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(supabaseUrl && supabaseKey);
};

export const dataService = {
  // Connections
  getConnections: async (userId: string): Promise<NetworkConnection[]> => {
    if (useDatabase()) {
      return await dbService.getConnections(userId);
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(`${CONNECTIONS_KEY}_${userId}`);
    if (!stored) return [];
    
    const connections = JSON.parse(stored);
    return connections.map((c: any) => ({
      ...c,
      connectedUserId: c.connectedUserId || c.userId, // Backward compatibility
      lastInteraction: new Date(c.lastInteraction),
      isInitiator: c.isInitiator !== undefined ? c.isInitiator : true
    }));
  },

  saveConnection: async (userId: string, connection: NetworkConnection): Promise<void> => {
    if (useDatabase()) {
      const existing = await dbService.getConnections(userId);
      const exists = existing.some(c => c.id === connection.id);
      
      if (exists) {
        await dbService.updateConnection(userId, connection.id, connection);
      } else {
        await dbService.createConnection(userId, connection);
      }
      return;
    }
    
    // Fallback to localStorage
    const connections = await dataService.getConnections(userId);
    const existingIndex = connections.findIndex(c => c.id === connection.id);
    
    if (existingIndex >= 0) {
      connections[existingIndex] = {
        ...connection,
        connectedUserId: connection.connectedUserId || connection.userId
      };
    } else {
      connections.push({
        ...connection,
        connectedUserId: connection.connectedUserId || connection.userId
      });
    }
    
    localStorage.setItem(`${CONNECTIONS_KEY}_${userId}`, JSON.stringify(connections));
  },

  deleteConnection: async (userId: string, connectionId: string): Promise<void> => {
    if (useDatabase()) {
      await dbService.deleteConnection(userId, connectionId);
      return;
    }
    
    // Fallback to localStorage
    const connections = (await dataService.getConnections(userId)).filter(c => c.id !== connectionId);
    localStorage.setItem(`${CONNECTIONS_KEY}_${userId}`, JSON.stringify(connections));
  },

  // Discovery users (all users except current)
  getDiscoveryUsers: async (currentUserId: string): Promise<User[]> => {
    if (useDatabase()) {
      return await dbService.getDiscoveryUsers(currentUserId);
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(DISCOVERY_USERS_KEY);
    if (!stored) return [];
    
    try {
      const allUsers = JSON.parse(stored);
      return Array.isArray(allUsers) ? allUsers.filter((u: User) => u.id !== currentUserId) : [];
    } catch {
      return [];
    }
  },

  // Add user to discovery (called when they sign up or update)
  addDiscoveryUser: async (user: User): Promise<void> => {
    if (useDatabase()) {
      // In database mode, users are automatically available via getDiscoveryUsers
      // Just ensure the user exists in the database
      const existing = await dbService.getUserById(user.id);
      if (!existing) {
        await dbService.createUser(user);
      } else {
        await dbService.updateUser(user.id, user);
      }
      return;
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(DISCOVERY_USERS_KEY);
    let users: User[] = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(users)) users = [];
    
    const existingIndex = users.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    localStorage.setItem(DISCOVERY_USERS_KEY, JSON.stringify(users));
  }
};
