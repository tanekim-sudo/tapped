import { User, Signal, NetworkConnection } from '../types';

const SIGNALS_KEY = 'tapped_signals';
const CONNECTIONS_KEY = 'tapped_connections';
const DISCOVERY_USERS_KEY = 'tapped_discovery_users';

export const dataService = {
  // Signals
  getSignals: (): Signal[] => {
    const stored = localStorage.getItem(SIGNALS_KEY);
    if (!stored) return [];
    
    const signals = JSON.parse(stored);
    // Convert Date strings back to Date objects
    return signals.map((s: any) => ({
      ...s,
      expiresAt: new Date(s.expiresAt),
      createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      responses: (s.responses || []).map((r: any) => ({
        ...r,
        respondedAt: new Date(r.respondedAt)
      }))
    }));
  },

  saveSignal: (signal: Signal): void => {
    const signals = dataService.getSignals();
    const existingIndex = signals.findIndex(s => s.id === signal.id);
    
    if (existingIndex >= 0) {
      signals[existingIndex] = signal;
    } else {
      signals.push(signal);
    }
    
    localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals));
  },

  deleteSignal: (signalId: string): void => {
    const signals = dataService.getSignals().filter(s => s.id !== signalId);
    localStorage.setItem(SIGNALS_KEY, JSON.stringify(signals));
  },

  getPublicSignals: (currentUserId: string): Signal[] => {
    return dataService.getSignals().filter(
      s => s.userId !== currentUserId && new Date(s.expiresAt) > new Date()
    );
  },

  // Connections
  getConnections: (userId: string): NetworkConnection[] => {
    const stored = localStorage.getItem(`${CONNECTIONS_KEY}_${userId}`);
    if (!stored) return [];
    
    const connections = JSON.parse(stored);
    return connections.map((c: NetworkConnection) => ({
      ...c,
      lastInteraction: new Date(c.lastInteraction)
    }));
  },

  saveConnection: (userId: string, connection: NetworkConnection): void => {
    const connections = dataService.getConnections(userId);
    const existingIndex = connections.findIndex(c => c.id === connection.id);
    
    if (existingIndex >= 0) {
      connections[existingIndex] = connection;
    } else {
      connections.push(connection);
    }
    
    localStorage.setItem(`${CONNECTIONS_KEY}_${userId}`, JSON.stringify(connections));
  },

  deleteConnection: (userId: string, connectionId: string): void => {
    const connections = dataService.getConnections(userId).filter(c => c.id !== connectionId);
    localStorage.setItem(`${CONNECTIONS_KEY}_${userId}`, JSON.stringify(connections));
  },

  // Discovery users (all users except current)
  getDiscoveryUsers: (currentUserId: string): User[] => {
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
  addDiscoveryUser: (user: User): void => {
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
