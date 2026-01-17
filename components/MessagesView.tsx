import React, { useState, useEffect } from 'react';
import { NetworkConnection, User } from '../types';
import ChatView from './ChatView';

interface MessagesViewProps {
  connections: NetworkConnection[];
  currentUserId: string;
  discoveryUsers: User[];
  onSelectChat: (connection: NetworkConnection) => void;
  selectedChat: NetworkConnection | null;
  onSendMessage: (message: string) => Promise<void>;
  currentUser?: User; // For profile filtering
  activeProfileId?: string; // For profile filtering
}

const MessagesView: React.FC<MessagesViewProps> = ({
  connections = [],
  currentUserId,
  discoveryUsers = [],
  onSelectChat,
  selectedChat,
  currentUser,
  activeProfileId
}) => {
  // Removed request filter - direct messaging only
  const [profileFilter, setProfileFilter] = useState<string>('all'); // 'all' or profile id
  
  // Safety check - ensure we have valid data
  const safeConnections = Array.isArray(connections) ? connections.filter(c => c) : [];
  const safeDiscoveryUsers = Array.isArray(discoveryUsers) ? discoveryUsers.filter(u => u) : [];
  
  // Get active chats (ACTIVE connections - all connections are active in direct messaging)
  const activeChats = safeConnections.filter(c => c.status === 'ACTIVE');
  
  // Filter chats by profile if selected
  const filteredChats = profileFilter === 'all' 
    ? activeChats 
    : activeChats.filter(c => {
        // Filter by which profile was used to create the connection
        // Check if connection notes mention the profile or use profileId if available
        if (c.profileId) {
          return c.profileId === profileFilter;
        }
        // Fallback: check notes for profile type mention
        if (currentUser && c.privateNotes) {
          const profile = currentUser.profiles.find(p => p.id === profileFilter);
          if (profile && c.privateNotes.includes(profile.type)) {
            return true;
          }
        }
        return false;
      });

  // Parse messages from privateNotes
  type Message = {
    id: string;
    text: string;
    senderId: string;
    timestamp: Date;
  };
  const parseMessages = (notes: string | undefined): Message[] => {
    if (!notes || typeof notes !== 'string') return [];
    
    try {
      // Messages are stored as: "Initial intro: "message"\n\nNew message: "message2""
      const messages: Message[] = [];
      const lines = notes.split('\n\n');
      
      lines.forEach((line, index) => {
        if (line && (line.includes('Initial intro:') || line.includes('New message:'))) {
          const match = line.match(/: "([^"]+)"/);
          if (match && match[1]) {
            messages.push({
              id: `msg_${index}`,
              text: match[1],
              senderId: line.includes('Initial intro:') ? currentUserId : currentUserId, // Simplified
              timestamp: new Date()
            });
          }
        }
      });
      
      return messages;
    } catch (err) {
      console.warn('Failed to parse messages:', err);
      return [];
    }
  };

  // Get user info for a connection
  const getUserForConnection = (conn: NetworkConnection): User | null => {
    if (!conn) return null;
    try {
      const userId = conn.connectedUserId || conn.userId;
      return safeDiscoveryUsers.find(u => u && u.id === userId) || null;
    } catch (err) {
      console.warn('Error getting user for connection:', err);
      return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-300px)] min-h-[500px]">
      {/* Chat List */}
      <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
        {/* Profile Filter */}
        {currentUser && currentUser.profiles && currentUser.profiles.length > 1 && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              View Messages By Profile
            </label>
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="w-full p-2 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-xs font-bold uppercase"
            >
              <option value="all">All Profiles</option>
              {currentUser.profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.type} Profile
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-grow overflow-y-auto space-y-2">
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => {
                  if (!chat) return null;
                  const chatUser = getUserForConnection(chat);
                  const initials = chatUser?.name?.split(' ').map(n => n[0]).join('') || chat.name?.split(' ').map(n => n[0]).join('') || '?';
                  const messages = parseMessages(chat.privateNotes);
                  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
                  
                  return (
                    <div
                      key={chat.id}
                      className={`brutal-card p-3 mb-2 cursor-pointer transition-all ${
                        selectedChat?.id === chat.id ? 'border-[#ff4d00] !shadow-[4px_4px_0px_0px_#ff4d00]' : 'border-gray-100 hover:bg-gray-50/50'
                      }`}
                      onClick={() => onSelectChat(chat)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-black flex items-center justify-center font-black text-xs bg-white rounded-full flex-shrink-0">
                          {initials}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs uppercase truncate">{chat.name}</h4>
                              {chat.profileId && currentUser && (() => {
                                const profile = currentUser.profiles.find(p => p.id === chat.profileId);
                                return profile ? (
                                  <span className="text-[7px] font-black uppercase text-[#ff4d00] bg-[#ff4d00]/10 px-1.5 py-0.5">
                                    {profile.type}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <span className="text-[8px] text-gray-400">
                              {chat.lastInteraction ? new Date(chat.lastInteraction).toLocaleDateString() : ''}
                            </span>
                          </div>
                          {lastMessage && (
                            <p className="text-[9px] text-gray-500 truncate italic">
                              {lastMessage.text}
                            </p>
                          )}
                          {!lastMessage && (
                            <p className="text-[9px] text-gray-400 italic">No messages yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
          ) : (
            <div className="brutal-card p-8 text-center bg-gray-50">
              <p className="text-sm font-bold text-gray-400 italic">
                No active chats yet. Connect with someone to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      {selectedChat && (
        <div className="flex-grow flex flex-col min-w-0">
          <ChatView
            connection={selectedChat}
            currentUserId={currentUserId}
            discoveryUsers={safeDiscoveryUsers}
            currentUser={currentUser}
            onClose={() => onSelectChat(null as any)}
            onSendMessage={onSendMessage || (async () => {})}
          />
        </div>
      )}

      {/* No Chat Selected */}
      {!selectedChat && (
        <div className="hidden lg:flex flex-grow items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-black uppercase mb-2">Select a chat</p>
            <p className="text-sm text-gray-500">
              Choose a chat to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ChatView component moved to separate file: components/ChatView.tsx

export default MessagesView;
