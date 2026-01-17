import React, { useState } from 'react';
import { NetworkVaultContact } from '../types';

interface NetworkVaultProps {
  contacts: NetworkVaultContact[];
  currentUserId: string;
  onAddContact: (contact: Omit<NetworkVaultContact, 'id' | 'userId'>) => void;
  onUpdateContact: (id: string, updates: Partial<NetworkVaultContact>) => void;
  onDeleteContact: (id: string) => void;
  onSelectForIntro?: (contact: NetworkVaultContact) => void;
}

const NetworkVault: React.FC<NetworkVaultProps> = ({
  contacts,
  currentUserId,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onSelectForIntro
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterContext, setFilterContext] = useState<string>('all');
  const [filterStrength, setFilterStrength] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(c => {
    const matchesContext = filterContext === 'all' || c.context === filterContext;
    const matchesStrength = filterStrength === 'all' || c.strength === filterStrength;
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.goodFor.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesContext && matchesStrength && matchesSearch;
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Network Vault</h3>
          <p className="text-sm text-gray-500">
            Your private network. All contacts live here.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-brutal !bg-black !text-white"
        >
          + Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts..."
          className="flex-1 min-w-[200px] p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
        />
        <select
          value={filterContext}
          onChange={(e) => setFilterContext(e.target.value)}
          className="p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
        >
          <option value="all">All Contexts</option>
          <option value="founder">Founder</option>
          <option value="investor">Investor</option>
          <option value="operator">Operator</option>
          <option value="friend">Friend</option>
          <option value="other">Other</option>
        </select>
        <select
          value={filterStrength}
          onChange={(e) => setFilterStrength(e.target.value)}
          className="p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
        >
          <option value="all">All Strengths</option>
          <option value="strong">Strong</option>
          <option value="medium">Medium</option>
          <option value="loose">Loose</option>
        </select>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map(contact => (
          <div key={contact.id} className="brutal-card p-6 bg-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-lg mb-1">{contact.name}</h4>
                <div className="flex gap-2 mb-2">
                  <span className="text-[8px] font-black uppercase px-2 py-1 bg-gray-100 text-gray-600">
                    {contact.context}
                  </span>
                  <span className={`text-[8px] font-black uppercase px-2 py-1 ${
                    contact.strength === 'strong' ? 'bg-green-100 text-green-700' :
                    contact.strength === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {contact.strength}
                  </span>
                </div>
              </div>
              {onSelectForIntro && (
                <button
                  onClick={() => onSelectForIntro(contact)}
                  className="btn-brutal !bg-[#ff4d00] !text-white text-xs px-3 py-1"
                >
                  Use for Intro
                </button>
              )}
            </div>

            {contact.goodFor.length > 0 && (
              <div className="mb-3">
                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Good For:</p>
                <div className="flex flex-wrap gap-1">
                  {contact.goodFor.map(item => (
                    <span key={item} className="text-[8px] font-bold px-2 py-0.5 bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {contact.notes && (
              <p className="text-xs text-gray-600 mb-3">{contact.notes}</p>
            )}

            {contact.email && (
              <p className="text-[9px] text-gray-500 mb-1">{contact.email}</p>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  const newContext = prompt('Update context (founder/investor/operator/friend/other):', contact.context);
                  if (newContext && ['founder', 'investor', 'operator', 'friend', 'other'].includes(newContext)) {
                    onUpdateContact(contact.id, { context: newContext as any });
                  }
                }}
                className="text-[8px] font-bold text-gray-400 hover:text-[#ff4d00] uppercase"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteContact(contact.id)}
                className="text-[8px] font-bold text-red-400 hover:text-red-600 uppercase ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No contacts found</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-brutal !bg-black !text-white"
          >
            Add Your First Contact
          </button>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onSave={(contact) => {
            onAddContact(contact);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

interface AddContactModalProps {
  onSave: (contact: Omit<NetworkVaultContact, 'id' | 'userId'>) => void;
  onClose: () => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [context, setContext] = useState<'founder' | 'investor' | 'operator' | 'friend' | 'other'>('friend');
  const [strength, setStrength] = useState<'strong' | 'medium' | 'loose'>('medium');
  const [goodFor, setGoodFor] = useState<string[]>([]);
  const [goodForInput, setGoodForInput] = useState('');
  const [notes, setNotes] = useState('');
  const [importedFrom, setImportedFrom] = useState<'linkedin' | 'contacts' | 'manual'>('manual');

  const handleAddGoodFor = () => {
    if (goodForInput.trim() && !goodFor.includes(goodForInput.trim())) {
      setGoodFor([...goodFor, goodForInput.trim()]);
      setGoodForInput('');
    }
  };

  const handleRemoveGoodFor = (item: string) => {
    setGoodFor(goodFor.filter(g => g !== item));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      email: email.trim() || undefined,
      linkedInUrl: linkedInUrl.trim() || undefined,
      context,
      strength,
      goodFor,
      notes: notes.trim() || undefined,
      importedFrom
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-white/95 flex items-center justify-center z-[100] p-4 fade-in backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl p-8 md:p-12 brutal-card !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">
            Add Contact to Vault
          </h3>
          <button 
            onClick={onClose}
            className="text-4xl font-light hover:text-[#ff4d00] leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
              placeholder="Contact name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
                placeholder="linkedin.com/in/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Context
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value as any)}
                className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
              >
                <option value="founder">Founder</option>
                <option value="investor">Investor</option>
                <option value="operator">Operator</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Strength
              </label>
              <select
                value={strength}
                onChange={(e) => setStrength(e.target.value as any)}
                className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
              >
                <option value="strong">Strong</option>
                <option value="medium">Medium</option>
                <option value="loose">Loose</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              What They're Good For
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={goodForInput}
                onChange={(e) => setGoodForInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddGoodFor()}
                placeholder="e.g., AI advice, VC intros, Engineering"
                className="flex-1 p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
              />
              <button
                onClick={handleAddGoodFor}
                className="btn-brutal !bg-black !text-white px-4"
              >
                Add
              </button>
            </div>
            {goodFor.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {goodFor.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20 text-xs"
                  >
                    {item}
                    <button
                      onClick={() => handleRemoveGoodFor(item)}
                      className="text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none h-24 resize-none"
              placeholder="How you know them, context, etc."
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Imported From
            </label>
            <select
              value={importedFrom}
              onChange={(e) => setImportedFrom(e.target.value as any)}
              className="w-full p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none"
            >
              <option value="manual">Manual Entry</option>
              <option value="linkedin">LinkedIn</option>
              <option value="contacts">Contacts</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="btn-brutal flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="btn-brutal flex-1 !bg-black !text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Add to Vault
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkVault;
