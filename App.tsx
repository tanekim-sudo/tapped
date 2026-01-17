import React, { useState, useEffect } from 'react';
import { User, ContextProfile, NetworkConnection, ContextType, NetworkVaultContact } from './types';
import ProfileCard from './components/ProfileCard';
import NetworkView from './components/NetworkView';
import ProfileView from './components/ProfileView';
import GroundRules from './components/GroundRules';
import LoginModal from './components/LoginModal';
import OnboardingModal from './components/OnboardingModal';
import Walkthrough from './components/Walkthrough';
import ProfileEditModal from './components/ProfileEditModal';
import DatabaseStatus from './components/DatabaseStatus';
import MessagesView from './components/MessagesView';
import NetworkVault from './components/NetworkVault';
import RankedApplicantsView from './components/RankedApplicantsView';
import ConnectionApplicationModal from './components/ConnectionApplicationModal';
import { enhancedSearch, getRecommendations, getSearchSuggestions } from './services/enhancedSearchService';
import { applicationService } from './services/applicationService';
import { ConnectionApplication } from './types';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { dbService } from './services/supabaseService';
import { onboardingService } from './services/onboardingService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'NOTES' | 'MESSAGES' | 'RULES'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<{
    industry?: string;
    topics?: string[];
    openTo?: string[];
    availability?: boolean;
  }>({});
  const [searchResults, setSearchResults] = useState<Array<{ user: User; relevanceScore: number; matchReasons: string[]; suggestedConnectionType?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ user: User; relevanceScore: number; matchReasons: string[]; suggestedConnectionType?: string }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [networkVault, setNetworkVault] = useState<NetworkVaultContact[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [discoveryUsers, setDiscoveryUsers] = useState<User[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, 'CONNECTED' | 'NOT_CONNECTED'>>({});
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [selectedChat, setSelectedChat] = useState<NetworkConnection | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [boardFilter, setBoardFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ContextProfile | null>(null);
  // Connection application system
  const [connectionApplications, setConnectionApplications] = useState<ConnectionApplication[]>([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationRecipient, setApplicationRecipient] = useState<{ user: User; profile: ContextProfile } | null>(null);
  const [weeklyCreditsUsed, setWeeklyCreditsUsed] = useState<number>(0);

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
          
          // Load network vault (non-blocking)
          try {
            // TODO: Load from database when implemented
            const storedVault = localStorage.getItem(`network_vault_${currentUser.id}`);
            if (storedVault) {
              setNetworkVault(JSON.parse(storedVault));
            }
          } catch (err) {
            console.warn('Failed to load network vault:', err);
          }
          
          // Load connection applications for active profile
          if (currentUser.profiles.length > 0) {
            const activeProfileIdToUse = activeProfileId || currentUser.profiles[0].id;
            const activeProfile = currentUser.profiles.find(p => p.id === activeProfileIdToUse) || currentUser.profiles[0];
            if (activeProfile) {
              const applications = applicationService.getApplicationsForProfile(currentUser.id, activeProfile.id);
              setConnectionApplications(applications);
              
              // Load weekly credits used
              const creditsUsed = applicationService.getWeeklyCreditsUsed(currentUser.id);
              setWeeklyCreditsUsed(creditsUsed);
            }
          }
          
          // Load connection statuses for all discovery users (non-blocking)
          if (import.meta.env.VITE_SUPABASE_URL) {
            try {
              const statuses: Record<string, 'CONNECTED' | 'NOT_CONNECTED'> = {};
              const usersToCheck = discovery.slice(0, 20);
              await Promise.allSettled(
                usersToCheck.map(async (otherUser) => {
                  try {
                    const status = await dbService.getConnectionStatus(currentUser.id, otherUser.id);
                    if (status === 'CONNECTED' || status === 'ACTIVE') {
                      statuses[otherUser.id] = 'CONNECTED';
                    } else {
                      statuses[otherUser.id] = 'NOT_CONNECTED';
                    }
                  } catch (err) {
                    // Silently fail - don't block UI
                    console.warn('Failed to get connection status for', otherUser.id, err);
                  }
                })
              );
              setConnectionStatuses(statuses);
            } catch (err) {
              console.warn('Failed to load connection statuses:', err);
            }
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

          // Check if onboarding needed - require at least one profile
          if (currentUser.profiles.length === 0) {
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

  // Reload applications when active profile changes
  useEffect(() => {
    if (user && activeProfileId) {
      const activeProfile = user.profiles.find(p => p.id === activeProfileId);
      if (activeProfile) {
        const applications = applicationService.getApplicationsForProfile(user.id, activeProfile.id);
        setConnectionApplications(applications);
        const creditsUsed = applicationService.getWeeklyCreditsUsed(user.id);
        setWeeklyCreditsUsed(creditsUsed);
      }
    }
  }, [activeProfileId, user]);

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

  // Enhanced unified search with comprehensive ranking algorithm
  useEffect(() => {
    const performSearch = async () => {
      if (!user || !user.profiles || user.profiles.length === 0) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const activeProfile = user.profiles.find(p => p.id === activeProfileId) || user.profiles[0];
        
        // Always use ranking algorithm - even with no query, rank all users
        const results = await enhancedSearch(
          searchQuery || '', 
          user.id, 
          {
            industry: searchFilters.industry,
            topic: searchFilters.topics?.join(' ') || searchQuery || undefined,
            openTo: searchFilters.openTo,
          }, 
          activeProfile // Required for ranking algorithm
        );
        
        // Always return results - never empty if users exist
        setSearchResults(results.length > 0 ? results : []);
      } catch (error) {
        console.error('Search error:', error);
        // On error, still try to get ranked results
        try {
          const activeProfile = user.profiles.find(p => p.id === activeProfileId) || user.profiles[0];
          const allUsers = await dbService.getDiscoveryUsers(user.id);
          if (allUsers.length > 0 && activeProfile) {
            const { rankSearchResults } = await import('./services/searchRankingService');
            const ranked = rankSearchResults(allUsers, activeProfile);
            setSearchResults(ranked.map(r => ({
              user: r.user,
              relevanceScore: Math.round(r.totalScore * 100),
              matchReasons: r.matchReasons,
              totalScore: r.totalScore,
              locationScore: r.locationScore,
              relevanceScoreDetailed: r.relevanceScore,
              availabilityScore: r.availabilityScore,
              glowTier: r.glowTier
            })));
          }
        } catch (fallbackError) {
          console.error('Fallback ranking error:', fallbackError);
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchFilters, user, activeProfileId]);

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
              try {
                const signedInUser = await authService.signIn(email, password);
                
                if (!signedInUser) {
                  throw new Error('Failed to sign in. Please try again.');
                }
                
                // Set user first to ensure app renders
                setUser(signedInUser);
                setConnections([]);
                setDiscoveryUsers([]);
                setIncomingRequests([]);
                setConnectionStatuses({});
                setRecommendations([]);
                
                if (signedInUser.profiles.length > 0) {
                  setActiveProfileId(signedInUser.profiles[0].id);
                }
                
                // Close modal immediately for better UX
                setShowLoginModal(false);
                
                // Load data asynchronously (non-blocking) - don't await, let it happen in background
                (async () => {
                  try {
                    const [userConnections, discovery] = await Promise.all([
                      dataService.getConnections(signedInUser.id).catch(() => []),
                      dataService.getDiscoveryUsers(signedInUser.id).catch(() => [])
                    ]);
                    
                    setConnections(userConnections);
                    setDiscoveryUsers(discovery);
                    
                    // Load incoming requests and connection statuses (non-blocking)
                    if (import.meta.env.VITE_SUPABASE_URL) {
                      // Load connection statuses for first 20 users only (to avoid blocking)
                      try {
                        const statuses: Record<string, 'CONNECTED' | 'NOT_CONNECTED'> = {};
                        const usersToCheck = discovery.slice(0, 20);
                        await Promise.allSettled(
                          usersToCheck.map(async (otherUser) => {
                            try {
                              const status = await dbService.getConnectionStatus(signedInUser.id, otherUser.id);
                              if (status === 'CONNECTED' || status === 'ACTIVE') {
                                statuses[otherUser.id] = 'CONNECTED';
                              } else {
                                statuses[otherUser.id] = 'NOT_CONNECTED';
                              }
                            } catch (err) {
                              // Silently fail - don't block UI
                              console.warn('Failed to get connection status for', otherUser.id, err);
                            }
                          })
                        );
                        setConnectionStatuses(statuses);
                      } catch (err) {
                        console.warn('Failed to load connection statuses:', err);
                        setConnectionStatuses({});
                      }
                    }
                    
                    // Load recommendations (non-blocking)
                    try {
                      const recs = await getRecommendations(signedInUser.id, signedInUser);
                      setRecommendations(recs);
                    } catch (err) {
                      console.warn('Failed to load recommendations:', err);
                      setRecommendations([]);
                    }
                  } catch (err) {
                    console.error('Failed to load user data:', err);
                    // App should still work even if data loading fails
                  }
                })();
              } catch (error: any) {
                console.error('Sign in error:', error);
                throw error; // Re-throw to show in modal
              }
            }}
            onSignUp={async (email, password, name) => {
              try {
                const newUser = await authService.signUp(email, password, name);
                setUser(newUser);
                await dataService.addDiscoveryUser(newUser);
                setConnections([]);
                setDiscoveryUsers([]);
                setIncomingRequests([]);
                setConnectionStatuses({});
                setShowLoginModal(false);
                // Show onboarding for new users
                setShowOnboarding(true);
              } catch (error: any) {
                console.error('Sign up error:', error);
                throw error; // Re-throw to show in modal
              }
            }}
            onClose={() => {
              if (user) setShowLoginModal(false);
            }}
          />
        )}
      </>
    );
  }

  const activeProfile = user?.profiles?.find(p => p.id === activeProfileId) || (user?.profiles?.[0] || null);
  // Filter discovery users
  const filteredDiscoveryUsers = discoveryUsers.filter(u => 
    !boardFilter || 
    u.name.toLowerCase().includes(boardFilter.toLowerCase()) ||
    (primaryProfile?.activeSignal && primaryProfile.activeSignal.toLowerCase().includes(boardFilter.toLowerCase())) ||
    u.profiles[0]?.type.toLowerCase().includes(boardFilter.toLowerCase())
  );
  
  // Filter connections (only show ACTIVE connections)
  const filteredConnections = connections
    .filter(c => c.status === 'ACTIVE')
    .filter(c => !networkFilter || 
      c.name.toLowerCase().includes(networkFilter.toLowerCase()) ||
      c.tagline.toLowerCase().includes(networkFilter.toLowerCase()) ||
      c.privateNotes.toLowerCase().includes(networkFilter.toLowerCase()));

  const handleConnectRequest = async (target: any) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // Ensure user has at least one profile
    if (!user.profiles || user.profiles.length === 0) {
      setShowOnboarding(true);
      return;
    }
    
    // Ensure active profile is set
    if (!activeProfile) {
      // Auto-select first profile if none selected
      if (user.profiles.length > 0) {
        setActiveProfileId(user.profiles[0].id);
      } else {
        setShowOnboarding(true);
        return;
      }
    }
    
    // Double-check activeProfile after potential auto-selection
    const currentActiveProfile = user.profiles.find(p => p.id === activeProfileId) || user.profiles[0];
    if (!currentActiveProfile) {
      setShowOnboarding(true);
      return;
    }
    
    // Check if recipient has qualification questions set
    const recipientProfile = target.profile || target.user.profiles[0];
    if (recipientProfile?.qualificationQuestions && recipientProfile.qualificationQuestions.length > 0) {
      // Show application modal instead of direct connection
      setApplicationRecipient({ user: target.user, profile: recipientProfile });
      setShowApplicationModal(true);
      return;
    }
    
    // Check weekly credits if recipient has connection limit
    if (recipientProfile?.connectionLimit && recipientProfile.connectionLimit > 0) {
      const remainingCredits = applicationService.getRemainingCredits(user.id, activeProfile);
      if (remainingCredits <= 0) {
        alert(`You've used all your weekly connection credits (${activeProfile.weeklyCredits || activeProfile.connectionLimit}). Credits reset weekly.`);
        return;
      }
    }
    
    // Create ACTIVE connection immediately (no qualification questions)
    const existingConnection = connections.find(c => {
      if (c.connectedUserId) {
        return c.connectedUserId === target.user.id;
      }
      return c.userId === target.user.id;
    });
    
    if (existingConnection) {
      // Already connected, open chat
      setSelectedChat(existingConnection);
      setActiveTab('MESSAGES');
      return;
    }
    
    // Create new ACTIVE connection
    const newConnection: NetworkConnection = {
      id: `conn_${user.id}_${target.user.id}_${Date.now()}`,
      userId: user.id,
      connectedUserId: target.user.id,
      name: target.user.name,
      tagline: target.user.tagline || target.user.profiles[0]?.activeSignal || target.user.profiles[0]?.industry || '',
      lastInteraction: new Date(),
      privateNotes: `Connected via ${activeProfile?.privateName || activeProfile?.type || 'default'} profile`,
      status: 'ACTIVE',
      isInitiator: true,
      profileId: activeProfileId || user.profiles[0]?.id
    };
    
    setConnections(prev => [...prev, newConnection]);
    await dataService.saveConnection(user.id, newConnection);
    setConnectionStatuses(prev => ({
      ...prev,
      [target.user.id]: 'CONNECTED'
    }));
    
    // Track credit usage
    if (activeProfile.weeklyCredits || activeProfile.connectionLimit) {
      applicationService.useCredit(user.id);
      setWeeklyCreditsUsed(prev => prev + 1);
    }
    
    // Open chat with new connection
    setSelectedChat(newConnection);
    setActiveTab('MESSAGES');
  };

  const handleOpenChat = (target: any) => {
    // Find the connection for this user
    const connection = connections.find(c => {
      const otherUserId = c.connectedUserId || c.userId;
      return otherUserId === target.user.id || c.userId === target.user.id;
    });
    
    if (connection) {
      setSelectedChat(connection);
      setActiveTab('MESSAGES');
    } else {
      // If no connection exists, open connect modal
      handleConnectRequest(target);
    }
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
      const otherUserId = connection.connectedUserId || connection.userId;
      if (otherUserId) {
        setConnectionStatuses(prev => ({
          ...prev,
          [otherUserId]: 'CONNECTED'
        }));
      }
      
      // Remove from incoming requests if it was there
      setIncomingRequests(prev => prev.filter(r => r.id !== id));
      
      // Reload connections to get the updated reciprocal connection
      try {
        const refreshed = await dataService.getConnections(user.id);
        setConnections(refreshed);
      } catch (error) {
        console.error('Failed to refresh connections:', error);
      }
    }
    
    if (updates.status === 'DECLINED') {
      const otherUserId = connection.connectedUserId || connection.userId;
      if (otherUserId) {
        setConnectionStatuses(prev => ({
          ...prev,
          [otherUserId]: 'NOT_CONNECTED'
        }));
      }
      setIncomingRequests(prev => prev.filter(r => r.id !== id));
    }
    
    await dataService.saveConnection(user.id, updated);
  };

  const handleOnboardingComplete = async (profile: ContextProfile) => {
    if (!user) return;
    
    try {
      const updated = {
        ...user,
        profiles: [...user.profiles, profile]
      };
      setUser(updated);
      setActiveProfileId(profile.id);
      
      // Save to database
      await authService.updateUser(user.id, updated);
      await dataService.addDiscoveryUser(updated);
      
      // Mark onboarding as complete
      onboardingService.setOnboardingComplete();
      setShowOnboarding(false);
      
      // Show walkthrough after onboarding
      setTimeout(() => {
        setShowWalkthrough(true);
      }, 500);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still close onboarding even if save fails
      // Mark as complete since profile was created
      onboardingService.setOnboardingComplete();
      setShowOnboarding(false);
    }
  };

  const handleCreateProfile = () => {
    const newProfile: ContextProfile = {
      id: `profile_${Date.now()}`,
      type: ContextType.FOUNDER,
      industry: '',
      topics: [],
      availabilityRules: '',
      location: '',
      openTo: ['advice', 'intros', 'chats'],
      responseReliability: 100,
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

  const handleUpdateProfile = async (profileId: string, updates: Partial<ContextProfile>) => {
    if (!user) return;
    const updated = {
      ...user,
      profiles: user.profiles.map(p => p.id === profileId ? { ...p, ...updates } : p)
    };
    setUser(updated);
    try {
      await authService.updateUser(user.id, updated);
      await dataService.addDiscoveryUser(updated);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
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
          <button 
            onClick={() => setActiveTab('SEARCH')}
            className="text-xl font-black italic tracking-tighter uppercase leading-none hover:text-[#ff4d00] transition-colors cursor-pointer"
          >
            Tapped.
          </button>
          {user && activeProfile && (activeProfile.weeklyCredits || activeProfile.connectionLimit) && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200">
              <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Weekly Credits</p>
              <p className="text-lg font-black text-[#ff4d00]">
                {applicationService.getRemainingCredits(user.id, activeProfile)}/{activeProfile.weeklyCredits || activeProfile.connectionLimit}
              </p>
              <p className="text-[7px] text-gray-400 mt-1">Credits reset weekly</p>
            </div>
          )}
        </div>

        <div id="nav-tabs" className="flex lg:flex-col gap-4 lg:gap-6 flex-wrap lg:flex-grow">
          {[
            { id: 'SEARCH', label: 'Search' },
            { id: 'MESSAGES', label: 'Messages' },
            { id: 'NOTES', label: 'Notes' },
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
              <p className="text-[8px] text-[#ff4d00] font-black uppercase tracking-tighter">{activeProfile?.privateName || activeProfile?.type || 'No profile'} identity</p>
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
        
        {/* Profile Switcher - Prominent at top */}
        {user && user.profiles && user.profiles.length > 0 && (
          <div className="mb-6 p-4 bg-[#ff4d00]/5 border-2 border-[#ff4d00]/20 brutal-card">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Active Profile:</span>
                <div className="flex items-center gap-2">
                  {activeProfile?.photo ? (
                    <img 
                      src={activeProfile.photo} 
                      alt={activeProfile.privateName || activeProfile.type}
                      className="w-8 h-8 rounded-full object-cover border-2 border-[#ff4d00]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-[#ff4d00] flex items-center justify-center bg-white">
                      <span className="text-xs font-black text-[#ff4d00]">{(activeProfile?.privateName || activeProfile?.type || '?')[0]}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-black uppercase text-[#ff4d00]">{activeProfile?.privateName || activeProfile?.type || 'No Profile'}</p>
                    {activeProfile?.activeSignal && (
                      <p className="text-[9px] text-gray-600 font-bold">{activeProfile.activeSignal}</p>
                    )}
                  </div>
                </div>
              </div>
              {user.profiles.length > 1 && (
                <div className="flex gap-2">
                  {user.profiles.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => setActiveProfileId(profile.id)}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase border-2 transition-all ${
                        activeProfileId === profile.id
                          ? 'bg-[#ff4d00] text-white border-[#ff4d00] !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-[#ff4d00]'
                      }`}
                    >
                      {profile.type}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[8px] text-gray-500 mt-2 italic">
              All connections and messages are made using this profile identity
            </p>
          </div>
        )}

        <header className="mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">
            {activeTab === 'SEARCH' && 'Search'}
            {activeTab === 'MESSAGES' && 'Messages'}
            {activeTab === 'NOTES' && 'Notes'}
            {activeTab === 'RULES' && 'Ground Rules'}
          </h2>

          <p className="text-sm font-medium max-w-xl text-gray-500">
            {activeTab === 'SEARCH' && `Find people by industry or topic${activeProfile ? ` as ${activeProfile.privateName || activeProfile.type}` : ''}.`}
            {activeTab === 'MESSAGES' && `Chat with your connections${activeProfile ? ` as ${activeProfile.privateName || activeProfile.type}` : ''}.`}
            {activeTab === 'NOTES' && 'Your connections and incoming requests.'}
            {activeTab === 'RULES' && 'The principles that guide networking on this platform.'}
          </p>
        </header>


        <section id="search-view" className="min-h-[50vh]">
          {/* No Profile Placeholder */}
          {user && (!user.profiles || user.profiles.length === 0) && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
              <h2 className="text-2xl md:text-3xl font-black uppercase mb-4">Create Your First Profile</h2>
              <p className="text-sm md:text-base text-gray-600 mb-6 max-w-md">
                You need to create a profile before you can start connecting with others.
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="btn-brutal !bg-black !text-white px-8 py-4 text-base md:text-lg"
              >
                Create Profile
              </button>
            </div>
          )}

          {activeTab === 'MESSAGES' && user && user.profiles && user.profiles.length > 0 && (
            <MessagesView
              connections={connections || []}
              currentUserId={user.id}
              discoveryUsers={discoveryUsers || []}
              currentUser={user}
              activeProfileId={activeProfileId}
              onSelectChat={setSelectedChat}
              selectedChat={selectedChat}
              onSendMessage={async (message: string) => {
                // Legacy callback - ChatView now uses chatService directly
                // This is kept for backward compatibility
                if (!selectedChat || !user) return;
                try {
                  const updated = {
                    ...selectedChat,
                    lastInteraction: new Date(),
                    privateNotes: (selectedChat.privateNotes || '') + `\n\nNew message: "${message}"`
                  };
                  // Update local state immediately for instant feedback
                  setConnections(prev => prev.map(c => c.id === selectedChat.id ? updated : c));
                  setSelectedChat(updated);
                  // Then persist to database
                  await updateConnection(selectedChat.id, updated);
                  await dataService.saveConnection(user.id, updated);
                  // Refresh to ensure sync
                  const refreshed = await dataService.getConnections(user.id);
                  setConnections(refreshed);
                  const updatedChat = refreshed.find(c => c.id === selectedChat.id);
                  if (updatedChat) {
                    setSelectedChat(updatedChat);
                  }
                } catch (error) {
                  console.error('Failed to send message:', error);
                  // Revert on error
                  const refreshed = await dataService.getConnections(user.id);
                  setConnections(refreshed);
                  const revertedChat = refreshed.find(c => c.id === selectedChat.id);
                  if (revertedChat) setSelectedChat(revertedChat);
                  throw error;
                }
              }}
            />
          )}

          {activeTab === 'NOTES' && user && (
            <div className="space-y-8">
              {/* Connection Applications (if profile has qualification questions) */}
              {activeProfile && activeProfile.qualificationQuestions && activeProfile.qualificationQuestions.length > 0 && connectionApplications.length > 0 && (
                <div>
                  <div className="mb-4 p-4 bg-[#ff4d00]/5 border-l-4 border-[#ff4d00]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-black uppercase mb-1">
                          Connection Applications
                        </h3>
                        <p className="text-sm text-gray-600">
                          AI-ranked applicants based on your qualification questions
                        </p>
                      </div>
                      {activeProfile.connectionLimit && activeProfile.connectionLimit > 0 && (
                        <div className="text-right">
                          <p className="text-xs font-black uppercase text-gray-400">Weekly Credits</p>
                          <p className="text-2xl font-black text-[#ff4d00]">
                            {applicationService.getRemainingCredits(user.id, activeProfile)}/{activeProfile.connectionLimit}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <RankedApplicantsView
                    applications={connectionApplications}
                    applicants={discoveryUsers.filter(u => 
                      connectionApplications.some(app => app.applicantId === u.id)
                    )}
                    recipientProfile={activeProfile}
                    recipientUser={user}
                    remainingCredits={applicationService.getRemainingCredits(user.id, activeProfile)}
                    onAccept={async (applicationId, applicantUserId) => {
                      const application = connectionApplications.find(app => app.id === applicationId);
                      if (!application) return;
                      
                      // Create ACTIVE connection
                      const applicant = discoveryUsers.find(u => u.id === applicantUserId);
                      if (!applicant) return;
                      
                      const newConnection: NetworkConnection = {
                        id: `conn_${user.id}_${applicantUserId}_${Date.now()}`,
                        userId: user.id,
                        connectedUserId: applicantUserId,
                        name: applicant.name,
                        tagline: applicant.tagline || applicant.profiles[0]?.activeSignal || applicant.profiles[0]?.industry || '',
                        lastInteraction: new Date(),
                        privateNotes: `Accepted from application. Answers: ${application.answers.join(' | ')}`,
                        status: 'ACTIVE',
                        isInitiator: false,
                        profileId: activeProfileId,
                        applicationId: application.id
                      };
                      
                      // Update application status
                      applicationService.updateApplication(applicationId, { status: 'ACCEPTED' });
                      
                      // Remove from applications list
                      setConnectionApplications(prev => prev.filter(app => app.id !== applicationId));
                      
                      // Add to connections
                      setConnections(prev => [...prev, newConnection]);
                      await dataService.saveConnection(user.id, newConnection);
                      
                      // Track credit usage
                      if (activeProfile.connectionLimit && activeProfile.connectionLimit > 0) {
                        applicationService.useCredit(user.id);
                        setWeeklyCreditsUsed(prev => prev + 1);
                      }
                      
                      setConnectionStatuses(prev => ({ ...prev, [applicantUserId]: 'CONNECTED' }));
                    }}
                    onReject={async (applicationId, applicantUserId) => {
                      applicationService.updateApplication(applicationId, { status: 'REJECTED' });
                      setConnectionApplications(prev => prev.filter(app => app.id !== applicationId));
                      setConnectionStatuses(prev => ({ ...prev, [applicantUserId]: 'NOT_CONNECTED' }));
                    }}
                  />
                </div>
              )}

              {/* Regular Incoming Requests (no qualification questions) */}

              {/* Your Connections */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black uppercase">Your Connections</h3>
                </div>
                <NetworkView
                  connections={filteredConnections}
                  onUpdate={updateConnection}
                  filter={networkFilter}
                  onFilterChange={setNetworkFilter}
                  onTerminate={handleTerminateConnection}
                />
              </div>

              {/* Network Vault */}
              <div className="border-t border-gray-100 pt-8 mt-12">
                <NetworkVault
                  contacts={networkVault}
                  currentUserId={user.id}
                  onAddContact={async (contact) => {
                    const newContact: NetworkVaultContact = {
                      ...contact,
                      id: `vault_${user.id}_${Date.now()}`,
                      userId: user.id
                    };
                    setNetworkVault(prev => [...prev, newContact]);
                    // Save to localStorage for now
                    localStorage.setItem(`network_vault_${user.id}`, JSON.stringify([...networkVault, newContact]));
                  }}
                  onUpdateContact={(id, updates) => {
                    const updated = networkVault.map(c => c.id === id ? { ...c, ...updates } : c);
                    setNetworkVault(updated);
                    localStorage.setItem(`network_vault_${user.id}`, JSON.stringify(updated));
                  }}
                  onDeleteContact={(id) => {
                    const filtered = networkVault.filter(c => c.id !== id);
                    setNetworkVault(filtered);
                    localStorage.setItem(`network_vault_${user.id}`, JSON.stringify(filtered));
                  }}
                  onSelectForIntro={(contact) => {
                    // Feature removed - vault contacts are now part of unified network
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'SEARCH' && user && (
            <div>
              {/* Network Routing: Show relevant vault contacts when viewing users with active signals */}
              {searchResults.length > 0 && searchResults.some(r => r.user.profiles[0]?.activeSignal) && networkVault.length > 0 && (
                <div className="mb-6 p-4 bg-[#ff4d00]/5 border-l-4 border-[#ff4d00]">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#ff4d00] mb-2">
                    Network Routing
                  </h3>
                  <p className="text-[10px] text-gray-600 mb-3">
                    These contacts in your vault could help with the signals below:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchResults
                      .filter(r => r.user.profiles[0]?.activeSignal)
                      .flatMap(result => {
                        const signal = result.user.profiles[0]?.activeSignal?.toLowerCase() || '';
                        return networkVault
                          .filter(contact => 
                            contact.goodFor.some(g => signal.includes(g.toLowerCase()) || g.toLowerCase().includes(signal)) ||
                            contact.context === 'investor' || contact.context === 'founder'
                          )
                          .slice(0, 3) // Limit to top 3 per signal
                          .map(contact => ({ contact, signal: result.user.profiles[0]?.activeSignal, user: result.user }));
                      })
                      .slice(0, 5) // Max 5 total suggestions
                      .map(({ contact, signal, user: signalUser }) => (
                        <button
                          key={`${contact.id}-${signalUser.id}`}
                          onClick={() => {
                            handleConnectRequest({ user: signalUser });
                          }}
                          className="text-[8px] font-bold uppercase bg-white border-2 border-[#ff4d00] px-2 py-1 hover:bg-[#ff4d00] hover:text-white transition-colors"
                          title={`Connect ${signalUser.name} via ${contact.name}`}
                        >
                          {contact.name} → {signalUser.name.split(' ')[0]}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="mb-6 space-y-4">
                {/* Unified Search Bar with Filters */}
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, industry, topic, or signal..."
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

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Filters:</span>
                    
                    {/* Industry Filter */}
                    <div className="relative">
                      <select
                        value={searchFilters.industry || ''}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, industry: e.target.value || undefined }))}
                        className="p-2 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-xs font-bold uppercase"
                      >
                        <option value="">All Industries</option>
                        <option value="Tech">Tech</option>
                        <option value="VC">VC</option>
                        <option value="Education">Education</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Design">Design</option>
                        <option value="Media">Media</option>
                      </select>
                    </div>

                    {/* Open To Filter */}
                    <div className="relative">
                      <select
                        value={searchFilters.openTo?.join(',') || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchFilters(prev => ({
                            ...prev,
                            openTo: val ? val.split(',').filter(Boolean) : undefined
                          }));
                        }}
                        className="p-2 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-xs font-bold uppercase"
                      >
                        <option value="">All Open To</option>
                        <option value="advice">Advice</option>
                        <option value="intros">Intros</option>
                        <option value="chats">Chats</option>
                        <option value="advice,intros">Advice + Intros</option>
                      </select>
                    </div>

                    {/* Clear Filters */}
                    {(searchFilters.industry || searchFilters.openTo?.length) && (
                      <button
                        onClick={() => setSearchFilters({})}
                        className="text-[8px] font-bold uppercase text-gray-400 hover:text-[#ff4d00] px-2"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
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
                          onConnect={(usr, prof) => handleConnectRequest({ user: usr, profile: activeProfile || prof })} 
                          canAfford={true}
                          discoveryUsers={discoveryUsers}
                          connectionStatus={connectionStatuses[result.user.id] || 'NOT_CONNECTED'}
                          activeProfile={activeProfile}
                          glowTier={result.glowTier}
                          totalScore={result.totalScore}
                        />
                        {/* Match Score Display */}
                        {result.totalScore !== undefined && (
                          <div className="mt-2 p-2 bg-gray-50 border-l-2 border-[#ff4d00] text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-gray-600">Match Score: {Math.round(result.totalScore * 100)}%</p>
                              {result.glowTier && (
                                <span className={`text-[8px] font-black uppercase px-2 py-1 ${
                                  result.glowTier === 'S' ? 'bg-[#ff4d00] text-white' :
                                  result.glowTier === 'A' ? 'bg-[#ff6d33] text-white' :
                                  result.glowTier === 'B' ? 'bg-[#ff8c66] text-white' :
                                  result.glowTier === 'C' ? 'bg-[#ffaa99] text-white' :
                                  'bg-gray-300 text-gray-600'
                                }`}>
                                  Tier {result.glowTier}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[9px] mb-2">
                              {result.locationScore !== undefined && (
                                <div>
                                  <span className="text-gray-500">Location:</span>
                                  <span className="font-bold ml-1">{Math.round(result.locationScore * 100)}%</span>
                                </div>
                              )}
                              {result.relevanceScoreDetailed !== undefined && (
                                <div>
                                  <span className="text-gray-500">Relevance:</span>
                                  <span className="font-bold ml-1">{Math.round(result.relevanceScoreDetailed * 100)}%</span>
                                </div>
                              )}
                              {result.availabilityScore !== undefined && (
                                <div>
                                  <span className="text-gray-500">Available:</span>
                                  <span className="font-bold ml-1">{Math.round(result.availabilityScore * 100)}%</span>
                                </div>
                              )}
                            </div>
                            {result.matchReasons.length > 0 && (
                              <div>
                                <p className="font-bold text-gray-600 mb-1 text-[9px]">Why this match:</p>
                                <ul className="list-disc list-inside text-gray-500 space-y-0.5 text-[9px]">
                                  {result.matchReasons.slice(0, 3).map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="brutal-card p-12 text-center bg-gray-50">
                      <p className="text-sm font-bold text-gray-400 italic">
                        {searchResults.length === 0 
                          ? 'Searching and ranking all available users...' 
                          : 'No matches found. Try a different search term.'}
                      </p>
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
                              onConnect={(usr, prof) => {
                                const status = connectionStatuses[result.user.id] || 'NOT_CONNECTED';
                                if (status === 'CONNECTED') {
                                  handleOpenChat({ user: usr, profile: activeProfile || prof });
                                } else {
                                  handleConnectRequest({ user: usr, profile: activeProfile || prof });
                                }
                              }}
                              canAfford={true}
                              discoveryUsers={discoveryUsers}
                              connectionStatus={connectionStatuses[result.user.id] || 'NOT_CONNECTED'}
                              activeProfile={activeProfile}
                              glowTier={result.glowTier}
                              totalScore={result.totalScore}
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
                    <p className="text-sm font-bold text-gray-400 italic">Enter a search term or use filters to find people.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile management */}
          {user && user.profiles && user.profiles.length > 0 && (
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
            // Reload applications if profile changed
            if (editingProfile.id === activeProfileId) {
              const updatedProfile = { ...editingProfile, ...updates };
              const applications = applicationService.getApplicationsForProfile(user.id, updatedProfile.id);
              setConnectionApplications(applications);
            }
          }}
          onClose={() => setEditingProfile(null)}
        />
      )}

      {/* Connection Application Modal */}
      {showApplicationModal && applicationRecipient && user && activeProfile && (
        <ConnectionApplicationModal
          recipient={applicationRecipient.user}
          recipientProfile={applicationRecipient.profile}
          currentUser={user}
          onApply={async (answers) => {
            // Create application
            const application: ConnectionApplication = {
              id: `app_${user.id}_${applicationRecipient.user.id}_${Date.now()}`,
              applicantId: user.id,
              recipientId: applicationRecipient.user.id,
              profileId: applicationRecipient.profile.id,
              answers,
              createdAt: new Date(),
              status: 'PENDING'
            };
            
            applicationService.createApplication(application);
            
            // If recipient is viewing, refresh their applications (in a real app, this would be real-time)
            // For now, just show success
            alert('Application submitted! The recipient will review it and you\'ll be notified if accepted.');
          }}
          onClose={() => {
            setShowApplicationModal(false);
            setApplicationRecipient(null);
          }}
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