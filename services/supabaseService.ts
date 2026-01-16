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
        connectedUserId: c.connected_user_id || c.user_id, // Fallback for old schema
        name: c.name || '',
        tagline: c.tagline || '',
        lastInteraction: new Date(c.last_interaction || c.created_at || Date.now()),
        privateNotes: c.private_notes || '',
        status: c.status || 'PENDING',
        timeCommitment: c.time_commitment,
        introducedBy: c.introduced_by,
        isInitiator: c.is_initiator !== undefined ? c.is_initiator : true
      }));
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  },

  // Get incoming connection requests (pending requests sent TO this user)
  async getIncomingRequests(userId: string): Promise<NetworkConnection[]> {
    if (!supabase) return [];
    
    try {
      // Check if connected_user_id column exists (for backward compatibility)
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('connected_user_id', userId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      
      if (error) {
        // If column doesn't exist, return empty array (old schema)
        if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('connected_user_id column not found, using old schema');
          return [];
        }
        throw error;
      }
      
      return (data || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id, // The person who sent the request
        connectedUserId: c.connected_user_id || c.user_id, // Fallback for old schema
        name: c.name || '',
        tagline: c.tagline || '',
        lastInteraction: new Date(c.last_interaction || c.created_at || Date.now()),
        privateNotes: c.private_notes || '',
        status: c.status,
        timeCommitment: c.time_commitment,
        introducedBy: c.introduced_by,
        isInitiator: false // Recipient is never the initiator
      }));
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      return [];
    }
  },

  // Get connection status between two users
  async getConnectionStatus(userId: string, otherUserId: string): Promise<'CONNECTED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NOT_CONNECTED' | null> {
    if (!supabase) return 'NOT_CONNECTED';
    
    try {
      // Check if user sent a request
      const { data: sent, error: sentError } = await supabase
        .from('connections')
        .select('status')
        .eq('user_id', userId)
        .eq('connected_user_id', otherUserId)
        .maybeSingle();
      
      if (sentError && sentError.code !== 'PGRST116') {
        console.warn('Error checking sent connection:', sentError);
        return 'NOT_CONNECTED';
      }
      
      if (sent) {
        if (sent.status === 'ACTIVE') return 'CONNECTED';
        if (sent.status === 'PENDING') return 'PENDING_SENT';
      }
      
      // Check if other user sent a request
      const { data: received, error: receivedError } = await supabase
        .from('connections')
        .select('status')
        .eq('user_id', otherUserId)
        .eq('connected_user_id', userId)
        .maybeSingle();
      
      if (receivedError && receivedError.code !== 'PGRST116') {
        console.warn('Error checking received connection:', receivedError);
        return 'NOT_CONNECTED';
      }
      
      if (received) {
        if (received.status === 'ACTIVE') return 'CONNECTED';
        if (received.status === 'PENDING') return 'PENDING_RECEIVED';
      }
      
      return 'NOT_CONNECTED';
    } catch (error) {
      console.error('Error getting connection status:', error);
      return 'NOT_CONNECTED'; // Return default instead of null
    }
  },

  async createConnection(userId: string, connection: NetworkConnection): Promise<NetworkConnection | null> {
    if (!supabase) return null;
    
    try {
      // Check if connected_user_id column exists (for backward compatibility)
      const connectionData: any = {
        id: connection.id,
        user_id: userId,
        name: connection.name,
        tagline: connection.tagline || null,
        last_interaction: connection.lastInteraction.toISOString(),
        private_notes: connection.privateNotes || null,
        status: connection.status,
        time_commitment: connection.timeCommitment || null,
        introduced_by: connection.introducedBy || null
      };
      
      // Only add new fields if they exist in schema
      if (connection.connectedUserId) {
        connectionData.connected_user_id = connection.connectedUserId;
        connectionData.is_initiator = true;
      }
      
      const { data, error } = await supabase
        .from('connections')
        .insert([connectionData])
        .select()
        .single();
      
      if (error) {
        // If connected_user_id doesn't exist, try without it (old schema)
        if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('Using old schema - connected_user_id not found');
          const { data: oldData, error: oldError } = await supabase
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
          
          if (oldError) {
            console.error('Error creating connection:', oldError);
            throw oldError;
          }
          
          return {
            id: oldData.id,
            userId: oldData.user_id,
            connectedUserId: connection.connectedUserId || oldData.user_id,
            name: oldData.name || '',
            tagline: oldData.tagline || '',
            lastInteraction: new Date(oldData.last_interaction),
            privateNotes: oldData.private_notes || '',
            status: oldData.status,
            timeCommitment: oldData.time_commitment,
            introducedBy: oldData.introduced_by,
            isInitiator: true
          };
        }
        console.error('Error creating connection:', error);
        throw error;
      }
      
      // If status is PENDING and new schema, also create a record for the recipient
      if (connection.status === 'PENDING' && connection.connectedUserId) {
        try {
          // Get sender's info for recipient's view
          const sender = await this.getUserById(userId);
          
          if (sender) {
            const recipientConnectionId = `conn_${connection.connectedUserId}_${userId}_${Date.now()}`;
            
            await supabase
              .from('connections')
              .insert([{
                id: recipientConnectionId,
                user_id: connection.connectedUserId,
                connected_user_id: userId,
                name: sender.name,
                tagline: sender.tagline || sender.profiles[0]?.bio || null,
                last_interaction: connection.lastInteraction.toISOString(),
                private_notes: connection.privateNotes || null,
                status: 'PENDING',
                time_commitment: connection.timeCommitment || null,
                introduced_by: connection.introducedBy || null,
                is_initiator: false
              }]);
          }
        } catch (err) {
          console.warn('Failed to create reciprocal connection:', err);
          // Continue even if this fails
        }
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        connectedUserId: data.connected_user_id,
        name: data.name,
        tagline: data.tagline || '',
        lastInteraction: new Date(data.last_interaction),
        privateNotes: data.private_notes || '',
        status: data.status,
        timeCommitment: data.time_commitment,
        introducedBy: data.introduced_by,
        isInitiator: data.is_initiator || false
      };
    } catch (error) {
      console.error('Error creating connection:', error);
      return null;
    }
  },

  async updateConnection(userId: string, connectionId: string, updates: Partial<NetworkConnection>): Promise<NetworkConnection | null> {
    if (!supabase) return null;
    
    try {
      // First get the connection to find the other user
      const { data: existingConn, error: fetchError } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.tagline !== undefined) updateData.tagline = updates.tagline || null;
      if (updates.lastInteraction) updateData.last_interaction = updates.lastInteraction.toISOString();
      if (updates.privateNotes !== undefined) updateData.private_notes = updates.privateNotes || null;
      if (updates.status) updateData.status = updates.status;
      if (updates.timeCommitment !== undefined) updateData.time_commitment = updates.timeCommitment || null;
      if (updates.introducedBy !== undefined) updateData.introduced_by = updates.introducedBy || null;
      
      // Update this user's connection
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
      
      // If accepting a connection, also update the other user's connection to ACTIVE
      if (updates.status === 'ACTIVE' && existingConn.status === 'PENDING') {
        try {
          // Check if connected_user_id exists (new schema)
          if (existingConn.connected_user_id) {
            // Find the reciprocal connection (the one from the other user's perspective)
            const { data: reciprocalConn } = await supabase
              .from('connections')
              .select('id, user_id')
              .eq('user_id', existingConn.connected_user_id)
              .eq('connected_user_id', userId)
              .maybeSingle();
            
            if (reciprocalConn) {
              // Update recipient's connection to ACTIVE and fill in their info
              const recipient = await this.getUserById(existingConn.connected_user_id);
              await supabase
                .from('connections')
                .update({
                  status: 'ACTIVE',
                  name: recipient?.name || '',
                  tagline: recipient?.tagline || recipient?.profiles[0]?.bio || '',
                  last_interaction: new Date().toISOString()
                })
                .eq('id', reciprocalConn.id);
            } else {
              // Create reciprocal connection if it doesn't exist
              const recipient = await this.getUserById(existingConn.connected_user_id);
              const sender = await this.getUserById(userId);
              
              if (recipient && sender) {
                await supabase
                  .from('connections')
                  .insert([{
                    id: `conn_${existingConn.connected_user_id}_${userId}_${Date.now()}`,
                    user_id: existingConn.connected_user_id,
                    connected_user_id: userId,
                    name: sender.name,
                    tagline: sender.tagline || sender.profiles[0]?.bio || '',
                    last_interaction: new Date().toISOString(),
                    private_notes: '',
                    status: 'ACTIVE',
                    time_commitment: null,
                    introduced_by: null,
                    is_initiator: false
                  }]);
              }
            }
          }
        } catch (err) {
          console.warn('Failed to update reciprocal connection:', err);
          // Continue even if this fails
        }
      }
      
      return {
        id: data.id,
        userId: data.user_id,
        connectedUserId: data.connected_user_id,
        name: data.name,
        tagline: data.tagline || '',
        lastInteraction: new Date(data.last_interaction),
        privateNotes: data.private_notes || '',
        status: data.status,
        timeCommitment: data.time_commitment,
        introducedBy: data.introduced_by,
        isInitiator: data.is_initiator || false
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
