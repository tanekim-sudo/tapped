import React, { useState } from 'react';
import { User, NetworkVaultContact } from '../types';

interface MakeIntroModalProps {
  requester: User;
  networkVault: NetworkVaultContact[];
  discoveryUsers: User[];
  onMakeIntro: (personA: User, personB: User | NetworkVaultContact, context: string, timeCommitment: string) => Promise<void>;
  onClose: () => void;
}

const MakeIntroModal: React.FC<MakeIntroModalProps> = ({
  requester,
  networkVault,
  discoveryUsers,
  onMakeIntro,
  onClose
}) => {
  const [searchSource, setSearchSource] = useState<'vault' | 'discovery'>('vault');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersonB, setSelectedPersonB] = useState<User | NetworkVaultContact | null>(null);
  const [context, setContext] = useState('');
  const [timeCommitment, setTimeCommitment] = useState<string>('15min');
  const [isSending, setIsSending] = useState(false);

  // Filter vault contacts
  const filteredVault = networkVault.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.goodFor.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter discovery users
  const filteredDiscovery = discoveryUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profiles[0]?.activeSignal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.profiles[0]?.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedPersonB || !context.trim()) return;

    setIsSending(true);
    try {
      await onMakeIntro(requester, selectedPersonB, context.trim(), timeCommitment);
      onClose();
    } catch (error) {
      console.error('Failed to make intro:', error);
      alert('Failed to make intro. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/95 flex items-center justify-center z-[100] p-4 fade-in backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl p-8 md:p-12 brutal-card max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Make Intro</h2>
          <p className="text-sm text-gray-500">
            Select Person B from your network vault or discovery, add context, and send.
          </p>
        </div>

        {/* Person A (Requester) - Display Only */}
        <div className="mb-6 p-4 bg-gray-50 border-2 border-gray-200">
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
            Person A (Requester)
          </label>
          <p className="text-sm font-bold uppercase">{requester.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {requester.profiles[0]?.activeSignal || requester.profiles[0]?.industry || requester.tagline || ''}
          </p>
        </div>

        {/* Search Source Toggle */}
        <div className="mb-4 flex gap-3">
          <button
            onClick={() => {
              setSearchSource('vault');
              setSearchQuery('');
              setSelectedPersonB(null);
            }}
            className={`btn-brutal flex-1 ${searchSource === 'vault' ? '!bg-black !text-white' : ''}`}
          >
            Network Vault
          </button>
          <button
            onClick={() => {
              setSearchSource('discovery');
              setSearchQuery('');
              setSelectedPersonB(null);
            }}
            className={`btn-brutal flex-1 ${searchSource === 'discovery' ? '!bg-black !text-white' : ''}`}
          >
            Discovery
          </button>
        </div>

        {/* Search for Person B */}
        <div className="mb-4">
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
            Search for Person B
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchSource === 'vault' ? 'Search vault contacts...' : 'Search discovery users...'}
            className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm"
          />
        </div>

        {/* Results */}
        {!selectedPersonB && (
          <div className="mb-6 max-h-48 overflow-y-auto border-2 border-gray-200">
            {searchSource === 'vault' ? (
              filteredVault.length > 0 ? (
                filteredVault.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedPersonB(contact)}
                    className="w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm uppercase">{contact.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {contact.goodFor.join(', ')}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[8px] font-bold uppercase bg-gray-200 px-2 py-1">
                            {contact.context}
                          </span>
                          <span className="text-[8px] font-bold uppercase bg-gray-200 px-2 py-1">
                            {contact.strength}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  {searchQuery ? 'No contacts found' : 'Start typing to search vault contacts'}
                </div>
              )
            ) : (
              filteredDiscovery.length > 0 ? (
                filteredDiscovery.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedPersonB(user)}
                    className="w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm uppercase">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {user.profiles[0]?.activeSignal || user.profiles[0]?.industry || user.tagline || ''}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">
                  {searchQuery ? 'No users found' : 'Start typing to search discovery users'}
                </div>
              )
            )}
          </div>
        )}

        {/* Selected Person B Display */}
        {selectedPersonB && (
          <div className="mb-6 p-4 bg-[#ff4d00]/10 border-2 border-[#ff4d00]/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-[#ff4d00]">
                Person B (Selected)
              </label>
              <button
                onClick={() => setSelectedPersonB(null)}
                className="text-xs text-gray-400 hover:text-[#ff4d00]"
              >
                Change
              </button>
            </div>
            <p className="text-sm font-bold uppercase">
              {'name' in selectedPersonB ? selectedPersonB.name : selectedPersonB.name}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {'goodFor' in selectedPersonB 
                ? selectedPersonB.goodFor.join(', ')
                : selectedPersonB.profiles[0]?.activeSignal || selectedPersonB.profiles[0]?.industry || selectedPersonB.tagline || ''}
            </p>
          </div>
        )}

        {/* One-Line Context */}
        <div className="mb-4">
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
            One-Line Context
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., Looking for AI startup advice..."
            className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm"
            maxLength={200}
          />
        </div>

        {/* Time Commitment */}
        <div className="mb-6">
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
            Time Commitment
          </label>
          <select
            value={timeCommitment}
            onChange={(e) => setTimeCommitment(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm font-bold uppercase"
          >
            <option value="15min">15 minutes</option>
            <option value="30min">30 minutes</option>
            <option value="1hour">1 hour</option>
            <option value="coffee">Coffee chat</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-brutal flex-1 border-2 border-gray-300 hover:border-gray-400"
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedPersonB || !context.trim() || isSending}
            className="btn-brutal flex-1 !bg-[#ff4d00] !text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send Intro'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MakeIntroModal;
