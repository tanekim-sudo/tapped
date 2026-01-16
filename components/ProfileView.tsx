import React from 'react';
import { User, ContextProfile, Signal } from '../types';

interface ProfileViewProps {
  user: User;
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onCreateProfile: () => void;
  onUpdateProfile: (id: string, updates: Partial<ContextProfile>) => void;
  onEditProfile: (profile: ContextProfile) => void;
  activeOfferSignal: Signal | undefined;
  activeAskSignal: Signal | undefined;
  onCreateSignal: (type: 'OFFER' | 'ASK') => void;
  onEditSignal: (signal: Signal) => void;
  onDeleteSignal: (signalId: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  activeProfileId, 
  onSelectProfile,
  onCreateProfile,
  onEditProfile,
  activeOfferSignal,
  activeAskSignal,
  onCreateSignal,
  onEditSignal,
  onDeleteSignal
}) => {
  const getHoursLeft = (signal: Signal | undefined) => 
    signal ? Math.max(0, Math.floor((new Date(signal.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))) : 0;
  
  const getHitRate = (signal: Signal | undefined) => {
    if (!signal || !signal.responses || signal.responses.length === 0) return 0;
    const accepted = signal.responses.filter(r => r.status === 'ACCEPTED').length;
    return Math.round((accepted / signal.responses.length) * 100);
  };
  return (
    <div className="space-y-12 fade-in">
      {/* Operating Contexts / Nodes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-black uppercase">Profiles</h4>
          <button 
            onClick={onCreateProfile}
            className="text-xs font-bold text-[#ff4d00] uppercase hover:underline"
          >
            + Add Profile
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.profiles.map((p) => (
            <div 
              key={p.id} 
              onClick={() => onSelectProfile(p.id)}
              className={`brutal-card p-6 cursor-pointer transition-all ${activeProfileId === p.id ? 'border-[#ff4d00] !shadow-[4px_4px_0px_0px_#ff4d00]' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
            >
              <div className="flex items-start gap-4 mb-4">
                {p.photo ? (
                  <img 
                    src={p.photo} 
                    alt={p.type}
                    className="w-16 h-16 rounded-full object-cover border-2 border-black flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50 flex-shrink-0">
                    <span className="text-lg font-black text-gray-400">
                      {p.type[0]}
                    </span>
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${activeProfileId === p.id ? 'text-[#ff4d00]' : 'text-gray-400'}`}>
                      {p.type} Node {activeProfileId === p.id && '(Active)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditProfile(p);
                        }}
                        className="text-[8px] font-bold text-gray-400 hover:text-[#ff4d00] uppercase"
                      >
                        Edit
                      </button>
                      <div className={`w-2 h-2 ${activeProfileId === p.id ? 'bg-[#ff4d00]' : 'bg-gray-200'}`}></div>
                    </div>
                  </div>
                  <p className="text-sm font-bold italic text-gray-800 leading-relaxed mb-2">"{p.bio}"</p>
                  {p.industry && (
                    <p className="text-[9px] font-bold text-gray-600 mb-1">
                      <span className="text-gray-400">Industry: </span>{p.industry}
                    </p>
                  )}
                  {p.topics && p.topics.length > 0 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {p.topics.map(topic => (
                          <span key={topic} className="text-[8px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(p.availabilityRules || p.location) && (
                    <div className="space-y-1 mt-2">
                      {p.availabilityRules && (
                        <p className="text-[9px] font-bold text-gray-600">
                          <span className="text-gray-400">Meetings: </span>{p.availabilityRules}
                        </p>
                      )}
                      {p.location && (
                        <p className="text-[9px] font-bold text-gray-600">
                          <span className="text-gray-400">Location: </span>{p.location}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {p.openTo.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-gray-50">
                  {p.openTo.map(o => (
                    <span key={o} className="text-[8px] font-bold uppercase px-2 py-0.5 bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20">
                      {o}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Broadcast Signals - Separate OFFER and ASK */}
      <section className="space-y-6">
        <h4 className="text-sm font-black uppercase mb-4">Signals</h4>
        
        {/* OFFER Signal */}
        <div className="brutal-card p-6 bg-white border-black">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-black uppercase px-2 py-1 bg-[#ff4d00] text-white border border-[#ff4d00]">
                OFFER
              </span>
              {activeOfferSignal && (
                <span className="text-xs font-bold text-gray-400">
                  {getHoursLeft(activeOfferSignal)}h left
                </span>
              )}
            </div>
            {activeOfferSignal && (
              <span className="text-[9px] font-bold text-gray-600">
                {getHitRate(activeOfferSignal)}% hit rate ({activeOfferSignal.responses?.length || 0} responses)
              </span>
            )}
          </div>
          {activeOfferSignal ? (
            <>
              <p className="text-lg font-bold tracking-tight italic text-gray-900 leading-snug mb-4">
                &quot;{activeOfferSignal.content}&quot;
              </p>
              {activeOfferSignal.responses && activeOfferSignal.responses.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 border-l-2 border-[#ff4d00]">
                  <p className="text-[8px] font-black uppercase text-gray-400 mb-2">Accepted by:</p>
                  <div className="space-y-1">
                    {activeOfferSignal.responses.filter(r => r.status === 'ACCEPTED').map((r, idx) => (
                      <p key={idx} className="text-xs font-bold text-gray-700">{r.userName}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={() => onEditSignal(activeOfferSignal)} className="btn-brutal">Modify</button>
                <button 
                  onClick={() => onDeleteSignal(activeOfferSignal.id)}
                  className="text-[9px] font-bold text-gray-300 hover:text-red-500 uppercase tracking-widest ml-auto"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => onCreateSignal('OFFER')} className="btn-brutal w-full">
              Create OFFER Signal
            </button>
          )}
        </div>

        {/* ASK Signal */}
        <div className="brutal-card p-6 bg-white border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-black uppercase px-2 py-1 bg-white border border-black">
                ASK
              </span>
              {activeAskSignal && (
                <span className="text-xs font-bold text-gray-400">
                  {getHoursLeft(activeAskSignal)}h left
                </span>
              )}
            </div>
            {activeAskSignal && (
              <span className="text-[9px] font-bold text-gray-600">
                {getHitRate(activeAskSignal)}% hit rate ({activeAskSignal.responses?.length || 0} responses)
              </span>
            )}
          </div>
          {activeAskSignal ? (
            <>
              <p className="text-lg font-bold tracking-tight italic text-gray-900 leading-snug mb-4">
                &quot;{activeAskSignal.content}&quot;
              </p>
              {activeAskSignal.responses && activeAskSignal.responses.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 border-l-2 border-[#ff4d00]">
                  <p className="text-[8px] font-black uppercase text-gray-400 mb-2">Accepted by:</p>
                  <div className="space-y-1">
                    {activeAskSignal.responses.filter(r => r.status === 'ACCEPTED').map((r, idx) => (
                      <p key={idx} className="text-xs font-bold text-gray-700">{r.userName}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={() => onEditSignal(activeAskSignal)} className="btn-brutal">Modify</button>
                <button 
                  onClick={() => onDeleteSignal(activeAskSignal.id)}
                  className="text-[9px] font-bold text-gray-300 hover:text-red-500 uppercase tracking-widest ml-auto"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <button 
              onClick={() => onCreateSignal('ASK')} 
              className="btn-brutal w-full"
              disabled={!activeOfferSignal}
              title={!activeOfferSignal ? 'You must create an OFFER signal first' : ''}
            >
              {!activeOfferSignal ? 'Create OFFER First' : 'Create ASK Signal'}
            </button>
          )}
        </div>
      </section>

      {/* Stats Block */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-12">
        {[
          { label: 'Conversations', val: user.stats.conversationsCompleted, sub: 'Completed' },
          { label: 'People Helped', val: user.stats.peopleHelped, sub: 'Connections made' }
        ].map(stat => (
          <div key={stat.label}>
            <span className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em] mb-1 block">{stat.label}</span>
            <span className="text-2xl font-black block tracking-tighter">{stat.val}</span>
            <span className="text-[9px] text-gray-400 font-medium block mt-1">{stat.sub}</span>
          </div>
        ))}
      </section>
    </div>
  );
};

export default ProfileView;