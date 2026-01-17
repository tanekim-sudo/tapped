import React, { useState, useEffect } from 'react';
import { NetworkConnection, User } from '../types';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

interface MessagesViewProps {
  connections: NetworkConnection[];
  incomingRequests: NetworkConnection[];
  currentUserId: string;
  discoveryUsers: User[];
  onSelectChat: (connection: NetworkConnection) => void;
  onAcceptRequest: (requestId: string, userId: string) => Promise<void>;
  onDeclineRequest: (requestId: string, userId: string) => Promise<void>;
  selectedChat: NetworkConnection | null;
  onSendMessage: (message: string) => Promise<void>;
  currentUser?: User; // For profile filtering
  activeProfileId?: string; // For profile filtering
}

const MessagesView: React.FC<MessagesViewProps> = ({
  connections,
  incomingRequests,
  currentUserId,
  discoveryUsers,
  onSelectChat,
  onAcceptRequest,
  onDeclineRequest,
  selectedChat,
  currentUser,
  activeProfileId
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'requests' | 'chats'>('all');
  const [profileFilter, setProfileFilter] = useState<string>('all'); // 'all' or profile id
  
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
        const profile = currentUser?.profiles.find(p => p.id === profileFilter);
        if (profile && c.privateNotes?.includes(profile.type)) {
          return true;
        }
        return false;
      });

  // Parse messages from privateNotes
  const parseMessages = (notes: string): Message[] => {
    if (!notes) return [];
    
    // Messages are stored as: "Initial intro: "message"\n\nNew message: "message2""
    const messages: Message[] = [];
    const lines = notes.split('\n\n');
    
    lines.forEach((line, index) => {
      if (line.includes('Initial intro:') || line.includes('New message:')) {
        const match = line.match(/: "([^"]+)"/);
        if (match) {
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
  };

  // Get active chats (ACTIVE connections)
  const activeChats = connections.filter(c => c.status === 'ACTIVE');

  // Get user info for a connection
  const getUserForConnection = (conn: NetworkConnection): User | null => {
    const userId = conn.connectedUserId || conn.userId;
    return discoveryUsers.find(u => u.id === userId) || null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-300px)] min-h-[500px]">
      {/* Chat List */}
      <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-100 pb-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${
              activeFilter === 'all' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            All
          </button>
          {incomingRequests.length > 0 && (
            <button
              onClick={() => setActiveFilter('requests')}
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 relative ${
                activeFilter === 'requests' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Requests
              <span className="absolute -top-1 -right-1 bg-[#ff4d00] text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {incomingRequests.length}
              </span>
            </button>
          )}
          <button
            onClick={() => setActiveFilter('chats')}
            className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 ${
              activeFilter === 'chats' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Chats ({activeChats.length})
          </button>
        </div>

        {/* Chat/Request List */}
        <div className="flex-grow overflow-y-auto space-y-2">
          {/* Incoming Requests */}
          {(activeFilter === 'all' || activeFilter === 'requests') && incomingRequests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                Connection Requests
              </h3>
              {incomingRequests.map(request => {
                const requestUser = getUserForConnection(request);
                const initials = requestUser?.name.split(' ').map(n => n[0]).join('') || request.name.split(' ').map(n => n[0]).join('');
                
                return (
                  <div
                    key={request.id}
                    className={`brutal-card p-3 mb-2 cursor-pointer transition-all ${
                      selectedChat?.id === request.id ? 'border-[#ff4d00] !shadow-[4px_4px_0px_0px_#ff4d00]' : 'border-gray-100'
                    }`}
                    onClick={() => onSelectChat(request)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-black flex items-center justify-center font-black text-xs bg-white rounded-full flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-xs uppercase truncate">{request.name}</h4>
                          <span className="text-[8px] font-black text-[#ff4d00] bg-[#ff4d00]/10 px-1.5 py-0.5 rounded">
                            NEW
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-500 truncate">{request.tagline || 'Connection request'}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAcceptRequest(request.id, request.userId);
                            }}
                            className="text-[8px] font-bold uppercase bg-black text-white px-2 py-1 hover:bg-[#ff4d00]"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeclineRequest(request.id, request.userId);
                            }}
                            className="text-[8px] font-bold uppercase border border-gray-300 px-2 py-1 hover:border-gray-400"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Chats */}
          {(activeFilter === 'all' || activeFilter === 'chats') && (
            <div>
              {activeFilter === 'all' && filteredChats.length > 0 && (
                <h3 className="text-[9px] font-black uppercase text-gray-400 mb-2 tracking-widest">
                  Active Chats
                </h3>
              )}
              {filteredChats.length > 0 ? (
                filteredChats.map(chat => {
                  const chatUser = getUserForConnection(chat);
                  const initials = chatUser?.name.split(' ').map(n => n[0]).join('') || chat.name.split(' ').map(n => n[0]).join('');
                  const messages = parseMessages(chat.privateNotes);
                  const lastMessage = messages[messages.length - 1];
                  
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
                              {chat.lastInteraction.toLocaleDateString()}
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
                    {activeFilter === 'chats' ? 'No active chats yet. Connect with someone to start chatting.' : 'No chats available.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {activeFilter === 'all' && incomingRequests.length === 0 && activeChats.length === 0 && (
            <div className="brutal-card p-8 text-center bg-gray-50">
              <p className="text-sm font-bold text-gray-400 italic">
                No messages or requests yet. Connect with someone to start chatting.
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
            discoveryUsers={discoveryUsers}
            currentUser={currentUser}
            onClose={() => onSelectChat(null as any)}
            onSendMessage={onSendMessage}
          />
        </div>
      )}

      {/* No Chat Selected */}
      {!selectedChat && (
        <div className="hidden lg:flex flex-grow items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-black uppercase mb-2">Select a chat</p>
            <p className="text-sm text-gray-500">
              Choose a connection request or active chat to start messaging
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface ChatViewProps {
  connection: NetworkConnection;
  currentUserId: string;
  discoveryUsers: User[];
  onClose: () => void;
  onSendMessage: (message: string) => Promise<void>;
}

const ChatView: React.FC<ChatViewProps> = ({
  connection,
  currentUserId,
  discoveryUsers,
  onClose,
  onSendMessage,
  currentUser
}) => {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const chatUser = discoveryUsers.find(u => u.id === (connection.connectedUserId || connection.userId));
  const initials = chatUser?.name.split(' ').map(n => n[0]).join('') || connection.name.split(' ').map(n => n[0]).join('');

  // Re-parse messages when connection updates
  const parseMessages = (notes: string): Message[] => {
    if (!notes) return [];
    
    const messages: Message[] = [];
    const lines = notes.split('\n\n');
    
    lines.forEach((line, index) => {
      if (line.includes('Initial intro:') || line.includes('New message:')) {
        const match = line.match(/: "([^"]+)"/);
        if (match) {
          // Determine sender: if it's the initial intro, sender is the connection initiator
          // Otherwise, it's the current user (since we're adding messages)
          const senderId = line.includes('Initial intro:') 
            ? (connection.isInitiator ? connection.userId : (connection.connectedUserId || connection.userId))
            : currentUserId;
          
          messages.push({
            id: `msg_${index}`,
            text: match[1],
            senderId: senderId,
            timestamp: new Date()
          });
        }
      }
    });
    
    return messages;
  };

  const messages = parseMessages(connection.privateNotes || '');

  // Auto-scroll to bottom when new messages arrive
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b border-gray-100 p-4 flex items-center justify-between">
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
            <p className="text-[9px] text-gray-500">{connection.tagline || chatUser?.profiles[0]?.activeSignal || chatUser?.profiles[0]?.industry || ''}</p>
            {connection.profileId && currentUser && (() => {
              const profile = currentUser.profiles.find(p => p.id === connection.profileId);
              return profile ? (
                <p className="text-[7px] font-black uppercase text-[#ff4d00] mt-1">Connected as {profile.type}</p>
              ) : null;
            })()}
          </div>
        </div>
        {connection.status === 'PENDING' && (
          <span className="text-[8px] font-black uppercase text-[#ff4d00] bg-[#ff4d00]/10 px-2 py-1 rounded">
            Pending Request
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div
                key={`${msg.id}_${idx}`}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 brutal-card ${
                    isOwn ? 'bg-black text-white border-black' : 'bg-white border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  <p className={`text-[8px] mt-1 ${isOwn ? 'text-gray-300' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-gray-400 italic">
              {connection.status === 'PENDING' 
                ? 'Accept this connection request to start messaging'
                : 'No messages yet. Start the conversation!'}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {connection.status === 'ACTIVE' && (
        <div className="border-t border-gray-100 p-4 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
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
      )}
    </div>
  );
};

export default MessagesView;
