import React, { useState, useEffect } from 'react';
import { User, ContextProfile, NetworkConnection, ContextType } from './types';
import ProfileCard from './components/ProfileCard';
import NetworkView from './components/NetworkView';
import ProfileView from './components/ProfileView';
import GroundRules from './components/GroundRules';
import LoginModal from './components/LoginModal';
import OnboardingModal from './components/OnboardingModal';
import Walkthrough from './components/Walkthrough';
import ProfileEditModal from './components/ProfileEditModal';
import DatabaseStatus from './components/DatabaseStatus';
import { getIntroSuggestion } from './services/claudeService';
import { enhancedSearch, getRecommendations, getSearchSuggestions } from './services/enhancedSearchService';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { dbService } from './services/supabaseService';
import { onboardingService } from './services/onboardingService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'NOTES'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'industry' | 'topic'>('industry');
  const [searchResults, setSearchResults] = useState<Array<{ user: User; relevanceScore: number; matchReasons: string[]; suggestedConnectionType?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ user: User; relevanceScore: number; matchReasons: string[]; suggestedConnectionType?: string }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [discoveryUsers, setDiscoveryUsers] = useState<User[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ user: User, profile?: ContextProfile } | null>(null);
  const [introText, setIntroText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeCommitment, setTimeCommitment] = useState<'10min' | '15min' | 'async' | 'custom'>('15min');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [decliningConnection, setDecliningConnection] = useState<NetworkConnection | null>(null);
  const [boardFilter, setBoardFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [networkStatusFilter, setNetworkStatusFilter] = useState<'All Syncs' | 'Pending' | 'Archived'>('All Syncs');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ContextProfile | null>(null);

  // Initialize user and data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          if (currentUser.profiles.length > 0) {
            setActiveProfileId(currentUser.profiles[0].id);
          }
          
        // Load data
        try {
          const userConnections = await dataService.getConnections(currentUser.id);
          const discovery = await dataService.getDiscoveryUsers(currentUser.id);
          
          setConnections(userConnections);
          setDiscoveryUsers(discovery);
          
          // Load incoming connection requests
          if (import.meta.env.VITE_SUPABASE_URL) {
            const incoming = await dbService.getIncomingRequests(currentUser.id);
            setIncomingRequests(incoming);
            
            // Load connection statuses for all discovery users
            const statuses: Record<string, 'CONNECTED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NOT_CONNECTED'> = {};
            for (const otherUser of discovery) {
              const status = await dbService.getConnectionStatus(currentUser.id, otherUser.id);
              if (status) {
                statuses[otherUser.id] = status;
              }
            }
            setConnectionStatuses(statuses);
          }

            // Load recommendations (don't block if it fails)
            try {
              const recs = await getRecommendations(currentUser.id, currentUser);
              setRecommendations(recs);
            } catch (err) {
              console.warn('Failed to load recommendations:', err);
            }
          } catch (err) {
            console.error('Failed to load data:', err);
            // Set empty arrays as fallback
            setConnections([]);
            setDiscoveryUsers([]);
          }

          // Check if onboarding needed
          if (currentUser.profiles.length === 0 || !onboardingService.isOnboardingComplete()) {
            setShowOnboarding(true);
          } else if (!onboardingService.isWalkthroughComplete()) {
            // Show walkthrough after a short delay
            setTimeout(() => {
              setShowWalkthrough(true);
            }, 1000);
          }
        } else {
          setShowLoginModal(true);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Still show login modal even if there's an error
        setShowLoginModal(true);
      }
    };
    
    loadData();
  }, []);

  // Save user when it changes
  useEffect(() => {
    const saveUser = async () => {
      if (user) {
        const updated = await authService.updateUser(user.id, user);
        if (updated) {
          await dataService.addDiscoveryUser(updated);
        }
      }
    };
    saveUser();
  }, [user]);

  // Save connections when they change
  useEffect(() => {
    const saveConnections = async () => {
      if (user && connections.length >= 0) {
        for (const conn of connections) {
          await dataService.saveConnection(user.id, conn);
        }
      }
    };
    saveConnections();
  }, [connections, user]);

  // Enhanced search with Claude
  useEffect(() => {
    const performSearch = async () => {
      if (!user || !searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await enhancedSearch(searchQuery, user.id, {
          industry: searchFilter === 'industry' ? searchQuery : undefined,
          topic: searchFilter === 'topic' ? searchQuery : undefined
        });
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchFilter, user]);

  // Get search suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!user || searchQuery.length < 2) {
        setSearchSuggestions([]);
        return;
      }

      try {
        const suggestions = await getSearchSuggestions(searchQuery, user.id);
        setSearchSuggestions(suggestions);
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    };

    const debounceTimer = setTimeout(loadSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user]);


  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-black mb-4">Tapped.</h1>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="btn-brutal !bg-black !text-white"
            >
              Get Started
            </button>
          </div>
        </div>
        {showLoginModal && (
          <LoginModal
            onSignIn={async (email, password) => {
              const signedInUser = await authService.signIn(email, password);
              setUser(signedInUser);
              if (signedInUser.profiles.length > 0) {
                setActiveProfileId(signedInUser.profiles[0].id);
              }
              const userConnections = await dataService.getConnections(signedInUser.id);
              const discovery = await dataService.getDiscoveryUsers(signedInUser.id);
              setConnections(userConnections);
              setDiscoveryUsers(discovery);
              
              // Load incoming requests and connection statuses
              if (import.meta.env.VITE_SUPABASE_URL) {
                const incoming = await dbService.getIncomingRequests(signedInUser.id);
                setIncomingRequests(incoming);
                
                const statuses: Record<string, 'CONNECTED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NOT_CONNECTED'> = {};
                for (const otherUser of discovery) {
                  const status = await dbService.getConnectionStatus(signedInUser.id, otherUser.id);
                  if (status) {
                    statuses[otherUser.id] = status;
                  }
                }
                setConnectionStatuses(statuses);
              }
              
              // Load recommendations
              const recs = await getRecommendations(signedInUser.id, signedInUser);
              setRecommendations(recs);
              
              setShowLoginModal(false);
            }}
            onSignUp={async (email, password, name) => {
              const newUser = await authService.signUp(email, password, name);
              setUser(newUser);
              dataService.addDiscoveryUser(newUser);
              setShowLoginModal(false);
              // Show onboarding for new users
              setShowOnboarding(true);
            }}
            onClose={() => {
              if (user) setShowLoginModal(false);
            }}
          />
        )}
      </>
    );
  }

  const activeProfile = user.profiles.find(p => p.id === activeProfileId) || (user.profiles[0] || null);
  // Filter discovery users
  const filteredDiscoveryUsers = discoveryUsers.filter(u => 
    !boardFilter || 
    u.name.toLowerCase().includes(boardFilter.toLowerCase()) ||
    u.profiles[0]?.bio.toLowerCase().includes(boardFilter.toLowerCase()) ||
    u.profiles[0]?.type.toLowerCase().includes(boardFilter.toLowerCase())
  );
  
  // Filter connections (only show ACTIVE connections, not pending/declined)
  const filteredConnections = connections.filter(c => {
    const matchesStatus = networkStatusFilter === 'All Syncs' || 
      (networkStatusFilter === 'Pending' && c.status === 'PENDING') ||
      (networkStatusFilter === 'Archived' && (c.status === 'CLOSED' || c.status === 'DECLINED'));
    const matchesFilter = !networkFilter || 
      c.name.toLowerCase().includes(networkFilter.toLowerCase()) ||
      c.tagline.toLowerCase().includes(networkFilter.toLowerCase()) ||
      c.privateNotes.toLowerCase().includes(networkFilter.toLowerCase());
    return matchesStatus && matchesFilter;
  });

  const handleConnectRequest = (target: any) => {
    setSelectedRecipient(target);
    setShowIntroModal(true);
    setIntroText('');
  };


  const generateAIIntro = async () => {
    if (!selectedRecipient || !activeProfile) return;
    setIsGenerating(true);
    try {
      const suggestion = await getIntroSuggestion(
        activeProfile.bio,
        selectedRecipient.profile?.bio || '',
        'Networking'
      );
      setIntroText(suggestion || '');
    } catch (error) {
      console.error('Failed to generate intro:', error);
      setIntroText('Looking to connect and network.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendIntro = async () => {
    if (!selectedRecipient || !introText.trim() || !user) return;
    
    // Check if connection already exists
    const existingConnection = connections.find(c => c.connectedUserId === selectedRecipient.user.id);
    const connectionStatus = connectionStatuses[selectedRecipient.user.id];
    
    // If already connected, just update notes
    if (connectionStatus === 'CONNECTED' && existingConnection) {
      const updated = {
        ...existingConnection,
        lastInteraction: new Date(),
        privateNotes: existingConnection.privateNotes + `\n\nNew message: "${introText}"`
      };
      await updateConnection(existingConnection.id, updated);
      await dataService.saveConnection(user.id, updated);
      setShowIntroModal(false);
      setSelectedRecipient(null);
      setIntroText('');
      setTimeCommitment('15min');
      return;
    }
    
    // Create new connection request
    if (!existingConnection || connectionStatus === 'NOT_CONNECTED') {
      const newConnection: NetworkConnection = {
        id: `conn_${user.id}_${selectedRecipient.user.id}_${Date.now()}`,
        userId: user.id,
        connectedUserId: selectedRecipient.user.id,
        name: selectedRecipient.user.name,
        tagline: selectedRecipient.user.tagline || selectedRecipient.user.profiles[0]?.bio || '',
        lastInteraction: new Date(),
        privateNotes: `Initial intro: "${introText}"`,
        status: 'PENDING',
        timeCommitment,
        introducedBy: user.id,
        isInitiator: true
      };
      
      // Update recipient's stats to track introduction
      if (selectedRecipient.user.stats.introducedBy !== user.id) {
        const updatedRecipient = {
          ...selectedRecipient.user,
          stats: {
            ...selectedRecipient.user.stats,
            introducedBy: user.id
          }
        };
        await authService.updateUser(selectedRecipient.user.id, updatedRecipient);
        await dataService.addDiscoveryUser(updatedRecipient);
      }
      
      setConnections(prev => [...prev, newConnection]);
      await dataService.saveConnection(user.id, newConnection);
      
      // Update connection status
      setConnectionStatuses(prev => ({
        ...prev,
        [selectedRecipient.user.id]: 'PENDING_SENT'
      }));
    }
    
    setShowIntroModal(false);
    setSelectedRecipient(null);
    setIntroText('');
    setTimeCommitment('15min');
  };

  const handleQuickDecline = async (connectionId: string, reason: string) => {
    await updateConnection(connectionId, { 
      status: 'DECLINED',
      privateNotes: (connections.find(c => c.id === connectionId)?.privateNotes || '') + `\n\nDeclined: ${reason}`
    });
    setShowDeclineModal(false);
    setDecliningConnection(null);
  };

  const updateConnection = async (id: string, updates: Partial<NetworkConnection>) => {
    if (!user) return;
    const connection = connections.find(c => c.id === id);
    if (!connection) return;
    
    const updated = { ...connection, ...updates };
    const updatedList = connections.map(c => c.id === id ? updated : c);
    setConnections(updatedList);
    
    // If accepting, update status for both users
    if (updates.status === 'ACTIVE') {
      setConnectionStatuses(prev => ({
        ...prev,
        [connection.connectedUserId]: 'CONNECTED'
      }));
      
      // Remove from incoming requests if it was there
      setIncomingRequests(prev => prev.filter(r => r.id !== id));
      
      // Reload connections to get the updated reciprocal connection
      const refreshed = await dataService.getConnections(user.id);
      setConnections(refreshed);
    }
    
    if (updates.status === 'DECLINED') {
      setConnectionStatuses(prev => ({
        ...prev,
        [connection.connectedUserId]: 'NOT_CONNECTED'
      }));
      setIncomingRequests(prev => prev.filter(r => r.id !== id));
    }
    
    await dataService.saveConnection(user.id, updated);
  };

  const handleOnboardingComplete = (profile: ContextProfile) => {
    if (!user) return;
    
    const updated = {
      ...user,
      profiles: [...user.profiles, profile]
    };
    setUser(updated);
    setActiveProfileId(profile.id);
    authService.updateUser(user.id, updated);
    dataService.addDiscoveryUser(updated);
    onboardingService.setOnboardingComplete();
    setShowOnboarding(false);
    
    // Show walkthrough after onboarding
    setTimeout(() => {
      setShowWalkthrough(true);
    }, 500);
  };

  const handleCreateProfile = () => {
    const newProfile: ContextProfile = {
      id: `profile_${Date.now()}`,
      type: ContextType.PROFESSIONAL,
      bio: '',
      industry: '',
      topics: [],
      availabilityRules: '',
      location: '',
      openTo: [],
      isActive: false,
      photo: undefined
    };
    setUser(prev => ({
      ...prev,
      profiles: [...prev.profiles, newProfile]
    }));
    setActiveProfileId(newProfile.id);
    setShowProfileModal(true);
  };

  const handleUpdateProfile = (profileId: string, updates: Partial<ContextProfile>) => {
    if (!user) return;
    const updated = {
      ...user,
      profiles: user.profiles.map(p => p.id === profileId ? { ...p, ...updates } : p)
    };
    setUser(updated);
    authService.updateUser(user.id, updated);
  };


  const handleTerminateConnection = async (connectionId: string) => {
    if (window.confirm('Terminate this connection? This action cannot be undone.')) {
      await updateConnection(connectionId, { status: 'CLOSED' });
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#000000] flex flex-col lg:flex-row selection:bg-[#ff4d00] selection:text-white">
      
      {/* Navigation: Compressed & Professional */}
      <nav id="nav-main" className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-gray-100 p-8 lg:p-8 lg:sticky lg:top-0 lg:h-screen flex flex-col z-40 bg-white">
        <div className="mb-12">
          <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Tapped.</h1>
        </div>

        <div id="nav-tabs" className="flex lg:flex-col gap-4 lg:gap-6 flex-wrap lg:flex-grow">
          {[
            { id: 'SEARCH', label: 'Search' },
            { id: 'NOTES', label: 'Notes', badge: incomingRequests.length > 0 ? incomingRequests.length : undefined },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id.toLowerCase()}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-left font-black tracking-widest uppercase text-[10px] transition-all py-2 relative ${
                activeTab === tab.id 
                  ? 'text-[#ff4d00] border-b-2 border-[#ff4d00]' 
                  : 'text-gray-400 hover:text-black'
              }`}
            >
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#ff4d00] text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-auto hidden lg:flex flex-col gap-4 pt-8 border-t border-gray-50">
          <div className="flex items-center gap-3">
            {activeProfile?.photo ? (
              <img 
                src={activeProfile.photo} 
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-black"
              />
            ) : (
              <div className="w-7 h-7 border border-black flex items-center justify-center font-black bg-white text-[9px] rounded-full">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-[8px] font-black uppercase truncate">{user.name}</p>
              <p className="text-[8px] text-[#ff4d00] font-black uppercase tracking-tighter">{activeProfile?.type || 'No profile'} identity</p>
            </div>
          </div>
          
          <div className="p-3 text-center border bg-gray-50 border-gray-200">
            <p className="text-xs font-black uppercase mb-1">Trust-Based</p>
            <p className="text-[9px] font-medium text-gray-600">
              Networking from goodwill
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShowWalkthrough(true);
                onboardingService.reset();
              }}
              className="text-[8px] font-bold text-gray-400 hover:text-[#ff4d00] uppercase tracking-widest text-center"
            >
              Take Tour
            </button>
            <button
              onClick={() => {
                authService.signOut();
                setUser(null);
                setShowLoginModal(true);
              }}
              className="text-[8px] font-bold text-gray-400 hover:text-[#ff4d00] uppercase tracking-widest text-center"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow p-6 md:p-12 lg:p-16 max-w-5xl mx-auto w-full fade-in">
        
        {/* Database Status Indicator */}
        {user && (
          <div className="mb-4">
            <DatabaseStatus />
          </div>
        )}
        
        <header className="mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">
            {activeTab === 'SEARCH' && 'Search'}
            {activeTab === 'NOTES' && 'Notes'}
          </h2>

          <p className="text-sm font-medium max-w-xl text-gray-500">
            {activeTab === 'SEARCH' && 'Find people by industry or topic.'}
            {activeTab === 'NOTES' && 'Your connections and incoming requests.'}
          </p>
        </header>


        <section id="search-view" className="min-h-[50vh]">
          {activeTab === 'NOTES' && user && (
            <div className="space-y-8">
              {/* Incoming Connection Requests */}
              {incomingRequests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black uppercase">
                      Connection Requests ({incomingRequests.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {incomingRequests.map(request => {
                      const requestUser = discoveryUsers.find(u => u.id === request.userId) || {
                        id: request.userId,
                        name: request.name,
                        profiles: [{
                          id: '',
                          type: 'Professional' as any,
                          bio: request.tagline,
                          industry: '',
                          topics: [],
                          availabilityRules: '',
                          location: '',
                          openTo: [],
                          isActive: true
                        }],
                        stats: { conversationsCompleted: 0, peopleHelped: 0, followThroughRate: 100 },
                        avatar: '',
                        tagline: request.tagline
                      };
                      return (
                        <ProfileCard
                          key={request.id}
                          user={requestUser}
                          onConnect={() => {}}
                          discoveryUsers={discoveryUsers}
                          connectionStatus="PENDING_RECEIVED"
                          onAcceptRequest={async () => {
                            await updateConnection(request.id, { status: 'ACTIVE', lastInteraction: new Date() });
                            setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
                            const refreshed = await dataService.getConnections(user.id);
                            setConnections(refreshed);
                            setConnectionStatuses(prev => ({ ...prev, [request.userId]: 'CONNECTED' }));
                          }}
                          onDeclineRequest={async () => {
                            await updateConnection(request.id, { status: 'DECLINED' });
                            setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
                            setConnectionStatuses(prev => ({ ...prev, [request.userId]: 'NOT_CONNECTED' }));
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Your Connections */}
              <div>
                <h3 className="text-lg font-black uppercase mb-4">Your Connections</h3>
                <NetworkView
                  connections={filteredConnections}
                  onUpdate={updateConnection}
                  filter={networkFilter}
                  onFilterChange={setNetworkFilter}
                  statusFilter={networkStatusFilter}
                  onStatusFilterChange={setNetworkStatusFilter}
                  onTerminate={handleTerminateConnection}
                  onQuickDecline={(conn) => {
                    setDecliningConnection(conn);
                    setShowDeclineModal(true);
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'SEARCH' && user && (
            <div>
              <div className="mb-6 space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setSearchFilter('industry')}
                    className={`btn-brutal flex-1 ${searchFilter === 'industry' ? '!bg-black !text-white' : ''}`}
                  >
                    Industry
                  </button>
                  <button
                    onClick={() => setSearchFilter('topic')}
                    className={`btn-brutal flex-1 ${searchFilter === 'topic' ? '!bg-black !text-white' : ''}`}
                  >
                    Topic
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={searchFilter === 'industry' ? 'Search by industry (e.g., Tech, VC, Education)...' : 'Search by topic (e.g., Startups, AI, Networking)...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm"
                  />
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      Searching...
                    </div>
                  )}
                  {searchSuggestions.length > 0 && searchQuery.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 z-10 max-h-48 overflow-y-auto">
                      {searchSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSearchQuery(suggestion)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 text-sm"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {searchQuery.trim() ? (
                <div className="space-y-3">
                  {isSearching ? (
                    <div className="brutal-card p-12 text-center bg-gray-50">
                      <p className="text-sm font-bold text-gray-400 italic">Searching with AI...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(result => (
                      <div key={result.user.id} className="relative">
                        <ProfileCard 
                          user={result.user} 
                          onConnect={(usr, prof) => handleConnectRequest({ user: usr, profile: prof })} 
                          canAfford={true}
                          discoveryUsers={discoveryUsers}
                          connectionStatus={connectionStatuses[result.user.id] || 'NOT_CONNECTED'}
                          onAcceptRequest={async (userId) => {
                            const request = incomingRequests.find(r => r.userId === userId);
                            if (request) {
                              await updateConnection(request.id, { status: 'ACTIVE', lastInteraction: new Date() });
                              setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
                              setConnectionStatuses(prev => ({ ...prev, [userId]: 'CONNECTED' }));
                              const refreshed = await dataService.getConnections(user!.id);
                              setConnections(refreshed);
                            }
                          }}
                          onDeclineRequest={async (userId) => {
                            const request = incomingRequests.find(r => r.userId === userId);
                            if (request) {
                              await updateConnection(request.id, { status: 'DECLINED' });
                              setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
                              setConnectionStatuses(prev => ({ ...prev, [userId]: 'NOT_CONNECTED' }));
                            }
                          }}
                        />
                        {result.matchReasons.length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 border-l-2 border-[#ff4d00] text-xs">
                            <p className="font-bold text-gray-600 mb-1">Why this match:</p>
                            <ul className="list-disc list-inside text-gray-500 space-y-1">
                              {result.matchReasons.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                            {result.suggestedConnectionType && (
                              <p className="mt-2 text-[#ff4d00] font-bold">
                                Suggested: {result.suggestedConnectionType}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="brutal-card p-12 text-center bg-gray-50">
                      <p className="text-sm font-bold text-gray-400 italic">No matches found. Try a different search term.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {recommendations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black uppercase mb-4 text-gray-600">Recommended for You</h3>
                      <div className="space-y-3">
                        {recommendations.slice(0, 5).map(result => (
                          <div key={result.user.id} className="relative">
                            <ProfileCard 
                              user={result.user} 
                              onConnect={(usr, prof) => handleConnectRequest({ user: usr, profile: prof })} 
                              canAfford={true}
                              discoveryUsers={discoveryUsers}
                            />
                            {result.matchReasons.length > 0 && (
                              <div className="mt-2 p-2 bg-gray-50 border-l-2 border-[#ff4d00] text-xs">
                                <p className="font-bold text-gray-600 mb-1">Why recommended:</p>
                                <ul className="list-disc list-inside text-gray-500 space-y-1">
                                  {result.matchReasons.slice(0, 2).map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="brutal-card p-12 text-center bg-gray-50">
                    <p className="text-sm font-bold text-gray-400 italic">Enter a search term to find people by {searchFilter}.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile management */}
          {user && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <ProfileView 
                user={user} 
                activeProfileId={activeProfileId || (user.profiles[0]?.id || '')} 
                onSelectProfile={setActiveProfileId}
                onCreateProfile={handleCreateProfile}
                onUpdateProfile={handleUpdateProfile}
                onEditProfile={(profile) => setEditingProfile(profile)}
              />
            </div>
          )}

          {activeTab === 'RULES' && (
            <GroundRules />
          )}
        </section>

        </main>

      {/* Intro Modal */}
      {showIntroModal && selectedRecipient && (
        <div 
          className="fixed inset-0 bg-white/95 flex items-center justify-center z-[100] p-4 fade-in backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowIntroModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowIntroModal(false)}
        >
          <div className="bg-white w-full max-w-2xl p-8 md:p-12 brutal-card !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 border border-black flex items-center justify-center text-xl font-black">
                  {selectedRecipient.user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">{selectedRecipient.user.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#ff4d00]">
                      From: {activeProfile?.type || 'No profile'} identity
                    </span>
                    <span className="text-[9px] text-gray-200">|</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setShowIntroModal(false); setSelectedRecipient(null); setIntroText(''); }} 
                className="text-4xl font-light hover:text-[#ff4d00] leading-none"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-10">
              <div>
                <label className="handwritten text-xl block mb-3 text-[#ff4d00]">Quick Time Commitment:</label>
                <div className="flex gap-2 mb-4">
                  {(['10min', '15min', 'async'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setTimeCommitment(option)}
                      className={`btn-brutal flex-1 ${timeCommitment === option ? '!bg-black !text-white' : ''}`}
                    >
                      {option === 'async' ? 'Async Voice' : option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="handwritten text-xl block mb-3 text-[#ff4d00]">Message:</label>
                <textarea 
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  placeholder="Brief message..."
                  className="w-full text-xl font-bold leading-tight border-none p-0 focus:ring-0 italic h-24 resize-none placeholder-gray-100"
                  maxLength={200}
                />
                <p className="text-[8px] text-gray-300 mt-2">{introText.length}/200</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={generateAIIntro}
                  disabled={isGenerating}
                  className="btn-brutal !bg-gray-50 !text-gray-400 !border-gray-200 flex-1 disabled:opacity-50"
                >
                  {isGenerating ? 'Synthesizing...' : 'AI Draft'}
                </button>
                <button 
                  onClick={handleSendIntro}
                  disabled={!introText.trim()}
                  className="btn-brutal flex-1 !bg-black !text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send ({timeCommitment === 'async' ? 'Async' : timeCommitment})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Decline Modal */}
      {showDeclineModal && decliningConnection && (
        <div 
          className="fixed inset-0 bg-white/95 flex items-center justify-center z-[100] p-4 fade-in backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && (setShowDeclineModal(false), setDecliningConnection(null))}
        >
          <div className="bg-white w-full max-w-md p-6 brutal-card">
            <h3 className="text-xl font-black mb-4 uppercase">Quick Decline</h3>
            <div className="space-y-2 mb-6">
              {[
                'Not a fit, but try X',
                'Can intro you to someone better',
                'Heads down right now',
                'Not available'
              ].map(reason => (
                <button
                  key={reason}
                  onClick={() => handleQuickDecline(decliningConnection.id, reason)}
                  className="btn-brutal w-full text-left !py-3"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowDeclineModal(false);
                setDecliningConnection(null);
              }}
              className="btn-brutal w-full !bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <OnboardingModal
          userName={user.name}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Profile Edit Modal */}
      {editingProfile && user && (
        <ProfileEditModal
          profile={editingProfile}
          onSave={(updates) => {
            handleUpdateProfile(editingProfile.id, updates);
            setEditingProfile(null);
          }}
          onClose={() => setEditingProfile(null)}
        />
      )}

      {/* Walkthrough */}
      {showWalkthrough && user && (
        <Walkthrough
          steps={[
            {
              id: 'welcome',
              title: 'Welcome to Tapped',
              content: 'Tapped is a networking protocol for high-bandwidth individuals. Let\'s take a quick tour of the key features.',
              position: 'center'
            },
            {
              id: 'navigation',
              title: 'Navigation',
              content: 'Use these tabs to navigate: Search (find people), Notes (your connections), Nodes (your profiles), and Norms (the protocol rules).',
              target: '#nav-tabs',
              position: 'right'
            },
            {
              id: 'search',
              title: 'Search',
              content: 'Search for people by industry or topic. Everyone here is networking from a place of goodwill.',
              target: '#search-view',
              position: 'top',
              action: () => setActiveTab('SEARCH')
            },
            {
              id: 'profile',
              title: 'Multiple Context Profiles',
              content: 'You can have multiple profiles for different contexts: Professional, Builder, Learner, Anonymous, Local. Each operates independently.',
              target: '#profile-view',
              position: 'left'
            },
            {
              id: 'complete',
              title: 'You\'re Ready!',
              content: 'This is a trust-based networking platform. Search for people and connect. No obligations, just goodwill.',
              position: 'center'
            }
          ]}
          onComplete={() => {
            setShowWalkthrough(false);
            onboardingService.setWalkthroughComplete();
          }}
          onSkip={() => {
            setShowWalkthrough(false);
            onboardingService.setWalkthroughComplete();
          }}
        />
      )}
    </div>
  );
};

export default App;