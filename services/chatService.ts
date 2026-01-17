import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Message, TypingIndicator } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface MessageCallback {
  (message: Message): void;
}

interface TypingCallback {
  (typing: TypingIndicator): void;
}

class ChatService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private typingChannels: Map<string, RealtimeChannel> = new Map();
  private messageCallbacks: Map<string, Set<MessageCallback>> = new Map();
  private typingCallbacks: Map<string, Set<TypingCallback>> = new Map();

  // Subscribe to messages for a connection
  subscribeToMessages(
    connectionId: string,
    onMessage: MessageCallback,
    onTyping?: TypingCallback
  ): () => void {
    if (!supabase) {
      console.warn('Supabase not configured');
      return () => {};
    }

    // Register callbacks
    if (!this.messageCallbacks.has(connectionId)) {
      this.messageCallbacks.set(connectionId, new Set());
    }
    this.messageCallbacks.get(connectionId)!.add(onMessage);

    if (onTyping) {
      if (!this.typingCallbacks.has(connectionId)) {
        this.typingCallbacks.set(connectionId, new Set());
      }
      this.typingCallbacks.get(connectionId)!.add(onTyping);
    }

    // Subscribe to messages channel
    if (!this.channels.has(connectionId)) {
      const channel = supabase
        .channel(`messages:${connectionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `connection_id=eq.${connectionId}`
          },
          (payload) => {
            const message = this.mapMessage(payload.new as any);
            this.messageCallbacks.get(connectionId)?.forEach(cb => cb(message));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `connection_id=eq.${connectionId}`
          },
          (payload) => {
            const message = this.mapMessage(payload.new as any);
            this.messageCallbacks.get(connectionId)?.forEach(cb => cb(message));
          }
        )
        .subscribe();

      this.channels.set(connectionId, channel);
    }

    // Subscribe to typing indicators
    if (onTyping && !this.typingChannels.has(connectionId)) {
      const typingChannel = supabase
        .channel(`typing:${connectionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators',
            filter: `connection_id=eq.${connectionId}`
          },
          (payload) => {
            const typing = this.mapTypingIndicator(payload.new as any);
            this.typingCallbacks.get(connectionId)?.forEach(cb => cb(typing));
          }
        )
        .subscribe();

      this.typingChannels.set(connectionId, typingChannel);
    }

    // Return unsubscribe function
    return () => {
      this.messageCallbacks.get(connectionId)?.delete(onMessage);
      if (onTyping) {
        this.typingCallbacks.get(connectionId)?.delete(onTyping);
      }

      // Clean up if no more callbacks
      if (this.messageCallbacks.get(connectionId)?.size === 0) {
        this.channels.get(connectionId)?.unsubscribe();
        this.channels.delete(connectionId);
        this.messageCallbacks.delete(connectionId);
      }

      if (this.typingCallbacks.get(connectionId)?.size === 0) {
        this.typingChannels.get(connectionId)?.unsubscribe();
        this.typingChannels.delete(connectionId);
        this.typingCallbacks.delete(connectionId);
      }
    };
  }

  // Send a message
  async sendMessage(
    connectionId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: 'text' | 'system' = 'text'
  ): Promise<Message | null> {
    if (!supabase) {
      console.error('Supabase not configured');
      return null;
    }

    try {
      const message: any = {
        connection_id: connectionId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        message_type: messageType,
        is_read: false,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return this.mapMessage(data);
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Get messages for a connection
  async getMessages(connectionId: string, limit: number = 100): Promise<Message[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []).map(msg => this.mapMessage(msg)).reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  // Mark messages as read
  async markAsRead(connectionId: string, userId: string): Promise<void> {
    if (!supabase) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('connection_id', connectionId)
        .eq('receiver_id', userId)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Set typing indicator
  async setTyping(connectionId: string, userId: string, isTyping: boolean): Promise<void> {
    if (!supabase) return;

    try {
      if (isTyping) {
        await supabase
          .from('typing_indicators')
          .upsert({
            connection_id: connectionId,
            user_id: userId,
            is_typing: true,
            updated_at: new Date().toISOString()
          });
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('connection_id', connectionId)
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }

  // Map database message to Message interface
  private mapMessage(data: any): Message {
    return {
      id: data.id,
      connectionId: data.connection_id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      content: data.content,
      messageType: data.message_type || 'text',
      isRead: data.is_read || false,
      readAt: data.read_at ? new Date(data.read_at) : undefined,
      createdAt: new Date(data.created_at || data.created_at),
      updatedAt: new Date(data.updated_at || data.updated_at)
    };
  }

  // Map database typing indicator to TypingIndicator interface
  private mapTypingIndicator(data: any): TypingIndicator {
    return {
      connectionId: data.connection_id,
      userId: data.user_id,
      isTyping: data.is_typing || false,
      updatedAt: new Date(data.updated_at || data.updated_at)
    };
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.channels.forEach(channel => channel.unsubscribe());
    this.typingChannels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.typingChannels.clear();
    this.messageCallbacks.clear();
    this.typingCallbacks.clear();
  }
}

export const chatService = new ChatService();
