import { createClient } from '@supabase/supabase-js';
import { User, ContextProfile, NetworkConnection } from '../types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using localStorage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database service using Supabase
export const dbService = {
  // Users
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, profiles(*)');
      
      if (error) throw error;
      
      return (data || []).map((u: any) => ({
        ...u,
        profiles: u.profiles || [],
        stats: u.stats || {
          conversationsCompleted: 0,
          peopleHelped: 0,
          followThroughRate: 100
        }
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async getUserById(userId: string): Promise<User | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, profiles(*)')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        profiles: data.profiles || [],
        stats: data.stats || {
          conversationsCompleted: 0,
          peopleHelped: 0,
          followThroughRate: 100
        }
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async createUser(user: User): Promise<User | null> {
    if (!supabase) return null;
    
    try {
      const { profiles, ...userData } = user;
      
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Insert profiles separately
      if (profiles && profiles.length > 0) {
        const profilesToInsert = profiles.map(p => ({
          ...p,
          user_id: user.id
        }));
        
        const { error: profilesError } = await supabase
          .from('profiles')
          .insert(profilesToInsert);
        
        if (profilesError) throw profilesError;
      }
      
      return {
        ...data,
        profiles: profiles || [],
        stats: data.stats || {
          conversationsCompleted: 0,
          peopleHelped: 0,
          followThroughRate: 100
        }
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    if (!supabase) return null;
    
    try {
      const { profiles, ...userData } = updates;
      
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update profiles if provided
      if (profiles) {
        // Delete existing profiles
        await supabase
          .from('profiles')
          .delete()
          .eq('user_id', userId);
        
        // Insert new profiles
        if (profiles.length > 0) {
          const profilesToInsert = profiles.map(p => ({
            ...p,
            user_id: userId
          }));
          
          const { error: profilesError } = await supabase
            .from('profiles')
            .insert(profilesToInsert);
          
          if (profilesError) throw profilesError;
        }
      }
      
      const updatedUser = await this.getUserById(userId);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  // Connections
  async getConnections(userId: string): Promise<NetworkConnection[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('user_id', userId)
        .order('last_interaction', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        tagline: c.tagline,
        lastInteraction: new Date(c.last_interaction),
        privateNotes: c.private_notes,
        status: c.status,
        timeCommitment: c.time_commitment,
        introducedBy: c.introduced_by
      }));
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  },

  async createConnection(userId: string, connection: NetworkConnection): Promise<NetworkConnection | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert([{
          id: connection.id,
          user_id: userId,
          name: connection.name,
          tagline: connection.tagline,
          last_interaction: connection.lastInteraction.toISOString(),
          private_notes: connection.privateNotes,
          status: connection.status,
          time_commitment: connection.timeCommitment,
          introduced_by: connection.introducedBy
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        tagline: data.tagline,
        lastInteraction: new Date(data.last_interaction),
        privateNotes: data.private_notes,
        status: data.status,
        timeCommitment: data.time_commitment,
        introducedBy: data.introduced_by
      };
    } catch (error) {
      console.error('Error creating connection:', error);
      return null;
    }
  },

  async updateConnection(userId: string, connectionId: string, updates: Partial<NetworkConnection>): Promise<NetworkConnection | null> {
    if (!supabase) return null;
    
    try {
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.tagline) updateData.tagline = updates.tagline;
      if (updates.lastInteraction) updateData.last_interaction = updates.lastInteraction.toISOString();
      if (updates.privateNotes !== undefined) updateData.private_notes = updates.privateNotes;
      if (updates.status) updateData.status = updates.status;
      if (updates.timeCommitment) updateData.time_commitment = updates.timeCommitment;
      if (updates.introducedBy !== undefined) updateData.introduced_by = updates.introducedBy;
      
      const { data, error } = await supabase
        .from('connections')
        .update(updateData)
        .eq('id', connectionId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        tagline: data.tagline,
        lastInteraction: new Date(data.last_interaction),
        privateNotes: data.private_notes,
        status: data.status,
        timeCommitment: data.time_commitment,
        introducedBy: data.introduced_by
      };
    } catch (error) {
      console.error('Error updating connection:', error);
      return null;
    }
  },

  async deleteConnection(userId: string, connectionId: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting connection:', error);
      return false;
    }
  },

  // Discovery - get all users except current
  async getDiscoveryUsers(currentUserId: string): Promise<User[]> {
    if (!supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, profiles(*)')
        .neq('id', currentUserId);
      
      if (error) throw error;
      
      return (data || []).map((u: any) => ({
        ...u,
        profiles: u.profiles || [],
        stats: u.stats || {
          conversationsCompleted: 0,
          peopleHelped: 0,
          followThroughRate: 100
        }
      }));
    } catch (error) {
      console.error('Error fetching discovery users:', error);
      return [];
    }
  }
};
