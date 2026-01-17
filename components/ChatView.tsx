import React, { useState, useEffect, useRef } from 'react';
import { NetworkConnection, User, Message, TypingIndicator } from '../types';
import { chatService } from '../services/chatService';

interface ChatViewProps {
  connection: NetworkConnection;
  currentUserId: string;
  discoveryUsers: User[];
  currentUser?: User;
  onClose: () => void;
  onSendMessage?: (message: string) => Promise<void>; // Legacy callback (optional)
}

const ChatView: React.FC<ChatViewProps> = ({
  connection,
  currentUserId,
  discoveryUsers,
  currentUser,
  onClose,
  onSendMessage
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const receiverId = connection.connectedUserId || connection.userId;

  const chatUser = discoveryUsers.find(u => u.id === receiverId);
  const initials = chatUser?.name?.split(' ').map(n => n[0]).join('') || connection.name?.split(' ').map(n => n[0]).join('') || '?';

  // Load messages and subscribe to real-time updates
  useEffect(() => {
    if (!connection?.id) {
      // If connection is missing, set empty messages and return
      setMessages([]);
      return;
    }

    // Load initial messages
    const loadMessages = async () => {
      try {
        const loadedMessages = await chatService.getMessages(connection.id);
        setMessages(loadedMessages || []);
        
        // Mark messages as read
        try {
          await chatService.markAsRead(connection.id, currentUserId);
        } catch (readError) {
          console.warn('Failed to mark messages as read:', readError);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        setMessages([]);
      }
    };

    loadMessages();

    // Subscribe to real-time messages
    const unsubscribe = chatService.subscribeToMessages(
      connection.id,
      (newMessage: Message) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMessage.id)) {
            return prev.map(m => m.id === newMessage.id ? newMessage : m);
          }
          return [...prev, newMessage];
        });
        
        // Mark as read if it's a message to current user
        if (newMessage.receiverId === currentUserId && !newMessage.isRead) {
          chatService.markAsRead(connection.id, currentUserId);
        }
      },
      (typing: TypingIndicator) => {
        if (typing.userId !== currentUserId) {
          setTypingIndicator(typing.isTyping ? typing : null);
        }
      }
    );


    return () => {
      try {
        unsubscribe();
        // Stop typing indicator when leaving
        if (connection?.id) {
          chatService.setTyping(connection.id, currentUserId, false);
        }
      } catch (error) {
        console.warn('Error cleaning up chat subscriptions:', error);
      }
    };
  }, [connection?.id, currentUserId, connection?.status]);


  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Handle typing indicator
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping && connection?.id) {
      chatService.setTyping(connection.id, currentUserId, true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (connection?.id) {
          chatService.setTyping(connection.id, currentUserId, false);
        }
      }, 3000);
    } else if (connection?.id) {
      chatService.setTyping(connection.id, currentUserId, false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, connection?.id, currentUserId]);

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    setIsTyping(false);

    try {
      if (!connection?.id || !receiverId) {
        console.error('Cannot send message: missing connection ID or receiver ID');
        setIsSending(false);
        return;
      }

      // Use new chat service
      const sent = await chatService.sendMessage(
        connection.id,
        currentUserId,
        receiverId,
        messageText.trim(),
        'text'
      );

      if (sent) {
        setMessageText('');
      } else {
        // If message sending failed, show error but don't clear input
        console.warn('Message sending failed: Supabase not configured');
        alert('Unable to send message. Please check your connection and try again.');
        setIsSending(false);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (e.target.value && !isTyping) {
      setIsTyping(true);
    }
  };


  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-100 p-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="lg:hidden text-2xl font-light hover:text-[#ff4d00]"
          >
            ←
          </button>
          <div className="w-10 h-10 border border-black flex items-center justify-center font-black text-xs bg-white rounded-full">
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase">{connection.name}</h3>
            <p className="text-[9px] text-gray-500">
              {connection.tagline || chatUser?.profiles[0]?.activeSignal || chatUser?.profiles[0]?.industry || ''}
            </p>
            {connection.profileId && currentUser && (() => {
              const profile = currentUser.profiles.find(p => p.id === connection.profileId);
              return profile ? (
                <p className="text-[7px] font-black uppercase text-[#ff4d00] mt-1">
                  Connected as {profile.type}
                </p>
              ) : null;
            })()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {connection.status === 'PENDING' && (
            <span className="text-[8px] font-black uppercase text-[#ff4d00] bg-[#ff4d00]/10 px-2 py-1 rounded">
              Pending Request
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            const isSystem = msg.messageType === 'system';
            
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="text-[9px] text-gray-500 italic px-3 py-1 bg-gray-200 rounded">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 brutal-card ${
                    isOwn ? 'bg-black text-white border-black' : 'bg-white border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  <p className={`text-[8px] mt-1 ${isOwn ? 'text-gray-300' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isOwn && msg.isRead && ' ✓✓'}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-gray-400 italic">
              No messages yet. Start the conversation!
            </p>
          </div>
        )}
        
        {/* Typing Indicator */}
        {typingIndicator && typingIndicator.isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-100 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-grow p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className="btn-brutal !bg-black !text-white disabled:opacity-50 disabled:cursor-not-allowed px-6 whitespace-nowrap"
          >
            {isSending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
