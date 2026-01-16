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
      
      // Map profiles from database format to app format
      const mappedProfiles = (data.profiles || []).map((p: any) => ({
        id: p.id,
        type: p.type,
        bio: p.bio,
        industry: p.industry || '',
        topics: p.topics || [],
        availabilityRules: p.availability_rules || '',
        location: p.location || '',
        openTo: p.open_to || [],
        photo: p.photo,
        isActive: p.is_active !== undefined ? p.is_active : true
      }));
      
      return {
        ...data,
        profiles: mappedProfiles,
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
          id: p.id,
          user_id: user.id,
          type: p.type,
          bio: p.bio,
          industry: p.industry || null,
          topics: p.topics || [],
          availability_rules: p.availabilityRules || null,
          location: p.location || null,
          open_to: p.openTo || [],
          photo: p.photo || null,
          is_active: p.isActive !== undefined ? p.isActive : true
        }));
        
        const { error: profilesError } = await supabase
          .from('profiles')
          .insert(profilesToInsert);
        
        if (profilesError) {
          console.error('Error inserting profiles:', profilesError);
          throw profilesError;
        }
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
            id: p.id,
            user_id: userId,
            type: p.type,
            bio: p.bio,
            industry: p.industry || null,
            topics: p.topics || [],
            availability_rules: p.availabilityRules || null,
            location: p.location || null,
            open_to: p.openTo || [],
            photo: p.photo || null,
            is_active: p.isActive !== undefined ? p.isActive : true
          }));
          
          const { error: profilesError } = await supabase
            .from('profiles')
            .insert(profilesToInsert);
          
          if (profilesError) {
            console.error('Error inserting profiles:', profilesError);
            throw profilesError;
          }
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
          tagline: connection.tagline || null,
          last_interaction: connection.lastInteraction.toISOString(),
          private_notes: connection.privateNotes || null,
          status: connection.status,
          time_commitment: connection.timeCommitment || null,
          introduced_by: connection.introducedBy || null
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating connection:', error);
        throw error;
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        tagline: data.tagline || '',
        lastInteraction: new Date(data.last_interaction),
        privateNotes: data.private_notes || '',
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
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.tagline !== undefined) updateData.tagline = updates.tagline || null;
      if (updates.lastInteraction) updateData.last_interaction = updates.lastInteraction.toISOString();
      if (updates.privateNotes !== undefined) updateData.private_notes = updates.privateNotes || null;
      if (updates.status) updateData.status = updates.status;
      if (updates.timeCommitment !== undefined) updateData.time_commitment = updates.timeCommitment || null;
      if (updates.introducedBy !== undefined) updateData.introduced_by = updates.introducedBy || null;
      
      const { data, error } = await supabase
        .from('connections')
        .update(updateData)
        .eq('id', connectionId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating connection:', error);
        throw error;
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        tagline: data.tagline || '',
        lastInteraction: new Date(data.last_interaction),
        privateNotes: data.private_notes || '',
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
