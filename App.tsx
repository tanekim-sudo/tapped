import React, { useState, useEffect } from 'react';
import { User, ContextProfile, Signal, NetworkConnection, ContextType } from './types';
import ProfileCard from './components/ProfileCard';
import SignalCard from './components/SignalCard';
import NetworkView from './components/NetworkView';
import ProfileView from './components/ProfileView';
import GroundRules from './components/GroundRules';
import LoginModal from './components/LoginModal';
import { getIntroSuggestion } from './services/claudeService';
import { authService } from './services/authService';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BOARD' | 'NETWORK' | 'PROFILE' | 'RULES'>('BOARD');
  const [user, setUser] = useState<User | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [discoveryUsers, setDiscoveryUsers] = useState<User[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ user: User, profile?: ContextProfile, signal?: Signal } | null>(null);
  const [introText, setIntroText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [boardFilter, setBoardFilter] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [networkStatusFilter, setNetworkStatusFilter] = useState<'All Syncs' | 'Pending' | 'Archived'>('All Syncs');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [editingSignal, setEditingSignal] = useState<{ content: string; type: 'OFFER' | 'ASK' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize user and data on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.profiles.length > 0) {
        setActiveProfileId(currentUser.profiles[0].id);
      }
      
      // Load data
      const userSignals = dataService.getSignals();
      const userConnections = dataService.getConnections(currentUser.id);
      const discovery = dataService.getDiscoveryUsers(currentUser.id);
      
      setSignals(userSignals);
      setConnections(userConnections);
      setDiscoveryUsers(discovery);
    } else {
      setShowLoginModal(true);
    }
  }, []);

  // Save user when it changes
  useEffect(() => {
    if (user) {
      const updated = authService.updateUser(user.id, user);
      if (updated) {
        dataService.addDiscoveryUser(updated);
      }
    }
  }, [user]);

  // Save signals when they change
  useEffect(() => {
    if (user && signals.length >= 0) {
      signals.forEach(signal => {
        if (signal.userId === user.id) {
          dataService.saveSignal(signal);
        }
      });
    }
  }, [signals, user]);

  // Save connections when they change
  useEffect(() => {
    if (user && connections.length >= 0) {
      connections.forEach(conn => {
        dataService.saveConnection(user.id, conn);
      });
    }
  }, [connections, user]);

  // Load public signals
  useEffect(() => {
    if (user) {
      const publicSignals = dataService.getPublicSignals(user.id);
      const userSignals = dataService.getSignals().filter(s => s.userId === user.id);
      setSignals([...userSignals, ...publicSignals]);
    }
  }, [user, discoveryUsers]);

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-black mb-4">Tapped.</h1>
            <p className="text-gray-400 mb-8">Networking Protocol</p>
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
              const userSignals = dataService.getSignals();
              const userConnections = dataService.getConnections(signedInUser.id);
              const discovery = dataService.getDiscoveryUsers(signedInUser.id);
              setSignals(userSignals);
              setConnections(userConnections);
              setDiscoveryUsers(discovery);
              setShowLoginModal(false);
            }}
            onSignUp={async (email, password, name) => {
              const newUser = await authService.signUp(email, password, name);
              setUser(newUser);
              dataService.addDiscoveryUser(newUser);
              setShowLoginModal(false);
            }}
            onClose={() => {
              if (user) setShowLoginModal(false);
            }}
          />
        )}
      </>
    );
  }

  const canAfford = user.stats.reciprocityCredits > 0;
  const activeProfile = user.profiles.find(p => p.id === activeProfileId) || (user.profiles[0] || null);
  const activeSignal = signals.find(s => s.userId === user.id && new Date(s.expiresAt) > new Date());
  
  // Filter signals (exclude expired)
  const activeSignals = signals.filter(s => new Date(s.expiresAt) > new Date());
  
  // Filter discovery users
  const filteredDiscoveryUsers = discoveryUsers.filter(u => 
    !boardFilter || 
    u.name.toLowerCase().includes(boardFilter.toLowerCase()) ||
    u.profiles[0]?.bio.toLowerCase().includes(boardFilter.toLowerCase()) ||
    u.profiles[0]?.type.toLowerCase().includes(boardFilter.toLowerCase())
  );
  
  // Filter connections
  const filteredConnections = connections.filter(c => {
    const matchesStatus = networkStatusFilter === 'All Syncs' || 
      (networkStatusFilter === 'Pending' && c.status === 'PENDING') ||
      (networkStatusFilter === 'Archived' && c.status === 'CLOSED');
    const matchesFilter = !networkFilter || 
      c.name.toLowerCase().includes(networkFilter.toLowerCase()) ||
      c.tagline.toLowerCase().includes(networkFilter.toLowerCase()) ||
      c.privateNotes.toLowerCase().includes(networkFilter.toLowerCase());
    return matchesStatus && matchesFilter;
  });

  const handleConnectRequest = (target: any) => {
    if (!canAfford) {
      alert('You need at least 1 reciprocity credit to send a connection request. Respond to messages to earn credits.');
      return;
    }
    setSelectedRecipient(target);
    setShowIntroModal(true);
    setIntroText('');
  };

  const handleSignalResponse = (signal: Signal) => {
    const targetUser = discoveryUsers.find(u => u.id === signal.userId) || { 
      name: signal.userName, 
      id: signal.userId, 
      stats: { responseRate: 90 },
      profiles: []
    } as any;
    handleConnectRequest({ user: targetUser, signal });
  };

  const generateAIIntro = async () => {
    if (!selectedRecipient || !activeProfile) return;
    setIsGenerating(true);
    try {
      const suggestion = await getIntroSuggestion(
        activeProfile.bio,
        selectedRecipient.signal?.content || selectedRecipient.profile?.bio || '',
        selectedRecipient.profile?.goals[0] || 'Sync'
      );
      setIntroText(suggestion || '');
    } catch (error) {
      console.error('Failed to generate intro:', error);
      setIntroText('Intent: Align on ' + (selectedRecipient.profile?.goals[0] || 'Sync') + '. Verify reachability for mesh expansion.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendIntro = () => {
    if (!selectedRecipient || !introText.trim() || !user) return;
    
    // Create connection if it doesn't exist
    const existingConnection = connections.find(c => c.userId === selectedRecipient.user.id);
    if (!existingConnection) {
      const newConnection: NetworkConnection = {
        id: `conn_${Date.now()}`,
        userId: selectedRecipient.user.id,
        name: selectedRecipient.user.name,
        tagline: selectedRecipient.user.tagline || selectedRecipient.user.profiles[0]?.bio || '',
        lastInteraction: new Date(),
        ranking: 3,
        privateNotes: `Initial intro: "${introText}"`,
        status: 'PENDING'
      };
      setConnections(prev => [...prev, newConnection]);
      dataService.saveConnection(user.id, newConnection);
    } else {
      // Update existing connection
      const updated = {
        ...existingConnection,
        lastInteraction: new Date(),
        status: 'ACTIVE' as const,
        privateNotes: existingConnection.privateNotes + `\n\nNew intro: "${introText}"`
      };
      updateConnection(existingConnection.id, updated);
      dataService.saveConnection(user.id, updated);
    }
    
    setShowIntroModal(false);
    setSelectedRecipient(null);
    setIntroText('');
    const updatedUser = {
      ...user,
      stats: { ...user.stats, reciprocityCredits: Math.max(0, user.stats.reciprocityCredits - 1) }
    };
    setUser(updatedUser);
    authService.updateUser(user.id, updatedUser);
  };

  const updateConnection = (id: string, updates: Partial<NetworkConnection>) => {
    if (!user) return;
    const updated = connections.map(c => c.id === id ? { ...c, ...updates } : c);
    setConnections(updated);
    const connection = updated.find(c => c.id === id);
    if (connection) {
      dataService.saveConnection(user.id, connection);
    }
  };

  const handleCreateProfile = () => {
    const newProfile: ContextProfile = {
      id: `profile_${Date.now()}`,
      type: ContextType.PROFESSIONAL,
      bio: '',
      goals: [],
      availabilityRules: '',
      openTo: [],
      isActive: false
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

  const handleCreateSignal = (content: string, type: 'OFFER' | 'ASK') => {
    if (!activeProfile) return;
    
    if (activeSignal) {
      // Update existing signal
      const updated = { ...activeSignal, content, type };
      setSignals(prev => prev.map(s => s.id === activeSignal.id ? updated : s));
      dataService.saveSignal(updated);
    } else {
      // Remove existing active signal for this profile
      const expiredSignals = signals.filter(s => s.userId === user.id && new Date(s.expiresAt) > new Date());
      expiredSignals.forEach(s => dataService.deleteSignal(s.id));
      setSignals(prev => prev.filter(s => !(s.userId === user.id && new Date(s.expiresAt) > new Date())));
      
      const newSignal: Signal = {
        id: `signal_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        contextType: activeProfile?.type || ContextType.PROFESSIONAL,
        content,
        type,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48) // 48 hours
      };
      setSignals(prev => [...prev, newSignal]);
      dataService.saveSignal(newSignal);
    }
    setShowSignalModal(false);
    setEditingSignal(null);
  };

  const handleDeleteSignal = (signalId: string) => {
    setSignals(prev => prev.filter(s => s.id !== signalId));
    dataService.deleteSignal(signalId);
  };

  const handleTerminateConnection = (connectionId: string) => {
    if (window.confirm('Terminate this connection? This action cannot be undone.')) {
      updateConnection(connectionId, { status: 'CLOSED' });
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#000000] flex flex-col lg:flex-row selection:bg-[#ff4d00] selection:text-white">
      
      {/* Navigation: Compressed & Professional */}
      <nav className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-gray-100 p-8 lg:p-8 lg:sticky lg:top-0 lg:h-screen flex flex-col z-40 bg-white">
        <div className="mb-12">
          <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Tapped.</h1>
          <p className="text-[9px] font-bold text-[#ff4d00] uppercase tracking-[0.2em] mt-2">Protocol 0.5</p>
        </div>

        <div className="flex lg:flex-col gap-4 lg:gap-6 flex-wrap lg:flex-grow">
          {[
            { id: 'BOARD', label: 'Board' },
            { id: 'NETWORK', label: 'Notes' },
            { id: 'PROFILE', label: 'Nodes' },
            { id: 'RULES', label: 'Norms' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-left font-black tracking-widest uppercase text-[9px] transition-all py-1 ${
                activeTab === tab.id 
                  ? 'text-[#ff4d00] border-b border-[#ff4d00]' 
                  : 'text-gray-300 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-auto hidden lg:flex flex-col gap-4 pt-8 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-black flex items-center justify-center font-black bg-white text-[9px]">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <p className="text-[8px] font-black uppercase truncate">{user.name}</p>
              <p className="text-[8px] text-[#ff4d00] font-black uppercase tracking-tighter">{activeProfile?.type || 'No profile'} identity</p>
            </div>
          </div>
          <div className={`p-2 text-[8px] font-black uppercase text-center tracking-widest ${
            user.stats.reciprocityCredits === 0 
              ? 'bg-red-50 text-red-400' 
              : user.stats.reciprocityCredits < 3 
              ? 'bg-yellow-50 text-yellow-600' 
              : 'bg-gray-50 text-gray-400'
          }`}>
            {user.stats.reciprocityCredits} Credits Available
            {user.stats.reciprocityCredits === 0 && ' — Respond to earn'}
          </div>
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
      </nav>

      {/* Main Container */}
      <main className="flex-grow p-6 md:p-12 lg:p-16 max-w-5xl mx-auto w-full fade-in">
        
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-[#ff4d00]"></div>
            <span className="handwritten text-lg text-gray-400">
              {activeTab === 'BOARD' && 'Registry and Live Intents.'}
              {activeTab === 'NETWORK' && 'Private Network Ledger.'}
              {activeTab === 'PROFILE' && 'Operating Context Identities.'}
              {activeTab === 'RULES' && 'Operating Procedures.'}
            </span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-none tracking-tighter uppercase">
            {activeTab === 'BOARD' && 'The Board'}
            {activeTab === 'NETWORK' && 'Private Notes'}
            {activeTab === 'PROFILE' && 'Nodes'}
            {activeTab === 'RULES' && 'The Protocol'}
          </h2>

          <p className="text-md font-bold max-w-xl text-gray-500 leading-snug">
            {activeTab === 'BOARD' && 'Synchronize with live signals or find reachable nodes in the directory.'}
            {activeTab === 'NETWORK' && 'Established mesh connections. Review private context and rankings.'}
            {activeTab === 'PROFILE' && 'Manage your multiple operating identities and your active broadcast.'}
            {activeTab === 'RULES' && 'The 9 laws of Tapped. Failure to comply leads to signal degradation.'}
          </p>
        </header>

        <section className="min-h-[50vh]">
          {activeTab === 'BOARD' && (
            <div className="space-y-12">
              <div>
                <div className="flex justify-between items-baseline mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Signals</h4>
                  <p className="text-[8px] font-bold text-gray-200">Refreshes every 24h</p>
                </div>
                {activeSignals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSignals.map(s => (
                      <SignalCard key={s.id} signal={s} onRespond={handleSignalResponse} />
                    ))}
                  </div>
                ) : (
                  <div className="brutal-card p-12 text-center bg-gray-50">
                    <p className="text-sm font-bold text-gray-400 italic">No active signals. Check back later.</p>
                  </div>
                )}
              </div>

              <div className="pt-12 border-t border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Node Directory</h4>
                  <div className="w-40">
                    <input 
                      type="text" 
                      placeholder="FILTER..." 
                      value={boardFilter}
                      onChange={(e) => setBoardFilter(e.target.value)}
                      className="!p-1 text-[8px] border-none border-b border-gray-100" 
                    />
                  </div>
                </div>
                {filteredDiscoveryUsers.length > 0 ? (
                  filteredDiscoveryUsers.map(u => (
                  <ProfileCard 
                    key={u.id} 
                    user={u} 
                    onConnect={(usr, prof) => handleConnectRequest({ user: usr, profile: prof })} 
                    canAfford={canAfford}
                  />
                  ))
                ) : (
                  <div className="brutal-card p-12 text-center bg-gray-50">
                    <p className="text-sm font-bold text-gray-400 italic">No nodes match your filter.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'NETWORK' && (
            <NetworkView 
              connections={filteredConnections} 
              onUpdate={updateConnection}
              filter={networkFilter}
              onFilterChange={setNetworkFilter}
              statusFilter={networkStatusFilter}
              onStatusFilterChange={setNetworkStatusFilter}
              onTerminate={handleTerminateConnection}
            />
          )}

          {activeTab === 'PROFILE' && user && (
            <ProfileView 
              user={user} 
              activeProfileId={activeProfileId || (user.profiles[0]?.id || '')} 
              onSelectProfile={setActiveProfileId}
              onCreateProfile={handleCreateProfile}
              onUpdateProfile={handleUpdateProfile}
              activeSignal={activeSignal}
              onCreateSignal={() => {
                setEditingSignal(null);
                setShowSignalModal(true);
              }}
              onEditSignal={() => {
                if (activeSignal) {
                  setEditingSignal({ content: activeSignal.content, type: activeSignal.type });
                  setShowSignalModal(true);
                }
              }}
              onDeleteSignal={() => {
                if (activeSignal && window.confirm('Delete this signal? It will be removed immediately.')) {
                  handleDeleteSignal(activeSignal.id);
                }
              }}
            />
          )}

          {activeTab === 'RULES' && (
            <GroundRules />
          )}
        </section>

        <footer className="mt-32 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase text-gray-200 tracking-[0.3em]">Tapped Protocol // 2025</p>
            <p className="handwritten text-lg text-gray-300 italic">&quot;Resolution &gt; Conversation.&quot;</p>
          </div>
          <div className="flex gap-8 handwritten text-lg text-[#ff4d00] items-end">
            <span className="cursor-pointer hover:underline opacity-50 hover:opacity-100">Whitepaper</span>
            <span className="cursor-pointer hover:underline opacity-50 hover:opacity-100">Manifesto</span>
          </div>
        </footer>
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
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">standing: {selectedRecipient.user.stats.responseRate}%</span>
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
              {selectedRecipient.signal && (
                <div className="p-4 bg-gray-50 border-l border-[#ff4d00]">
                  <p className="text-[8px] font-black uppercase text-gray-300 mb-1">Intent Alignment:</p>
                  <p className="text-xs font-bold italic text-gray-600">"{selectedRecipient.signal.content}"</p>
                </div>
              )}

              <div>
                <label className="handwritten text-xl block mb-3 text-[#ff4d00]">Dispatch Short Intent:</label>
                <textarea 
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  placeholder="3 sentences max. Direct value prop."
                  className="w-full text-xl font-bold leading-tight border-none p-0 focus:ring-0 italic h-32 resize-none placeholder-gray-100"
                  maxLength={300}
                />
                <p className="text-[8px] text-gray-300 mt-2">{introText.length}/300</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={generateAIIntro}
                  disabled={isGenerating}
                  className="btn-brutal !bg-gray-50 !text-gray-400 !border-gray-200 flex-1 disabled:opacity-50"
                >
                  {isGenerating ? 'Synthesizing...' : 'AI Context Draft'}
                </button>
                <button 
                  onClick={handleSendIntro}
                  disabled={!introText.trim() || !canAfford}
                  className="btn-brutal flex-1 !bg-black !text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!canAfford ? 'Insufficient Credits' : `Dispatch Sync Signal (-1 Credits)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signal Modal */}
      {showSignalModal && (
        <div 
          className="fixed inset-0 bg-white/95 flex items-center justify-center z-[100] p-4 fade-in backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && (setShowSignalModal(false), setEditingSignal(null))}
          onKeyDown={(e) => e.key === 'Escape' && (setShowSignalModal(false), setEditingSignal(null))}
        >
          <div className="bg-white w-full max-w-2xl p-8 md:p-12 brutal-card !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-10">
              <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">
                {activeSignal ? 'Modify Signal' : 'Broadcast Signal'}
              </h3>
              <button 
                onClick={() => { setShowSignalModal(false); setEditingSignal(null); }} 
                className="text-4xl font-light hover:text-[#ff4d00] leading-none"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Signal Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const currentContent = editingSignal?.content ?? activeSignal?.content ?? '';
                      setEditingSignal({ content: currentContent, type: 'ASK' });
                    }}
                    className={`btn-brutal flex-1 ${(editingSignal?.type ?? activeSignal?.type ?? 'ASK') === 'ASK' ? '!bg-black !text-white' : ''}`}
                  >
                    ASK
                  </button>
                  <button
                    onClick={() => {
                      const currentContent = editingSignal?.content ?? activeSignal?.content ?? '';
                      setEditingSignal({ content: currentContent, type: 'OFFER' });
                    }}
                    className={`btn-brutal flex-1 ${(editingSignal?.type ?? activeSignal?.type ?? 'ASK') === 'OFFER' ? '!bg-black !text-white' : ''}`}
                  >
                    OFFER
                  </button>
                </div>
              </div>

              <div>
                <label className="handwritten text-xl block mb-3 text-[#ff4d00]">Intent (1-2 lines max)</label>
                <textarea 
                  value={editingSignal?.content ?? activeSignal?.content ?? ''}
                  onChange={(e) => {
                    const currentType = editingSignal?.type ?? activeSignal?.type ?? 'ASK';
                    setEditingSignal({ content: e.target.value, type: currentType });
                  }}
                  placeholder="e.g., Looking for warm intro to infra-focused seed VCs this week."
                  className="w-full text-lg font-bold leading-tight border border-gray-200 p-4 focus:ring-0 italic h-32 resize-none placeholder-gray-200"
                  maxLength={200}
                  autoFocus
                />
                <p className="text-[8px] text-gray-300 mt-2">{(editingSignal?.content ?? activeSignal?.content ?? '').length}/200</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const content = editingSignal?.content ?? activeSignal?.content ?? '';
                    const type = editingSignal?.type ?? activeSignal?.type ?? 'ASK';
                    if (content.trim() && type) {
                      handleCreateSignal(content, type);
                    }
                  }}
                  disabled={!(editingSignal?.content ?? activeSignal?.content ?? '').trim() || !(editingSignal?.type ?? activeSignal?.type)}
                  className="btn-brutal flex-1 !bg-black !text-white disabled:opacity-50"
                >
                  {activeSignal ? 'Update Signal' : 'Broadcast'}
                </button>
                {activeSignal && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Delete this signal? It will be removed immediately.')) {
                        handleDeleteSignal(activeSignal.id);
                        setShowSignalModal(false);
                        setEditingSignal(null);
                      }
                    }}
                    className="btn-brutal !bg-white !text-red-500 !border-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;