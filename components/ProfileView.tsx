import React from 'react';
import { User, ContextProfile, Signal } from '../types';

interface ProfileViewProps {
  user: User;
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onCreateProfile: () => void;
  onUpdateProfile: (id: string, updates: Partial<ContextProfile>) => void;
  activeSignal: Signal | undefined;
  onCreateSignal: () => void;
  onEditSignal: () => void;
  onDeleteSignal: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  activeProfileId, 
  onSelectProfile,
  onCreateProfile,
  activeSignal,
  onCreateSignal,
  onEditSignal,
  onDeleteSignal
}) => {
  const hoursLeft = activeSignal ? Math.max(0, Math.floor((new Date(activeSignal.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))) : 0;
  return (
    <div className="space-y-12 fade-in">
      {/* Operating Contexts / Nodes */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Operating Contexts</h4>
          <button 
            onClick={onCreateProfile}
            className="text-[9px] font-bold text-[#ff4d00] uppercase hover:underline"
          >
            + Create Identity
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.profiles.map((p) => (
            <div 
              key={p.id} 
              onClick={() => onSelectProfile(p.id)}
              className={`brutal-card p-6 cursor-pointer transition-all ${activeProfileId === p.id ? 'border-[#ff4d00] !shadow-[4px_4px_0px_0px_#ff4d00]' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[9px] font-black uppercase tracking-widest ${activeProfileId === p.id ? 'text-[#ff4d00]' : 'text-gray-400'}`}>
                  {p.type} Node {activeProfileId === p.id && '(Active)'}
                </span>
                <div className={`w-2 h-2 ${activeProfileId === p.id ? 'bg-[#ff4d00]' : 'bg-gray-200'}`}></div>
              </div>
              <p className="text-sm font-bold italic text-gray-800 leading-relaxed mb-6">"{p.bio}"</p>
              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-gray-50">
                {p.openTo.map(o => (
                  <span key={o} className="text-[8px] font-bold uppercase px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-100">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Broadcast Signal */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Broadcast (Intent)</h4>
          {activeSignal && (
            <span className="text-[9px] font-bold text-gray-300">
              {activeSignal.type} Signal Active / Expiring in {hoursLeft}h
            </span>
          )}
        </div>
        {activeSignal ? (
          <div className="brutal-card p-8 bg-white border-black">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[7px] font-black uppercase px-1 py-0.5 border border-black ${activeSignal.type === 'OFFER' ? 'bg-[#ff4d00] text-white border-[#ff4d00]' : 'bg-white'}`}>
                {activeSignal.type}
              </span>
            </div>
            <p className="text-xl font-bold tracking-tight italic text-gray-900 leading-snug">
              "{activeSignal.content}"
            </p>
            <div className="mt-8 flex gap-4">
              <button onClick={onEditSignal} className="btn-brutal">Modify Intent</button>
              <button 
                onClick={onDeleteSignal}
                className="text-[9px] font-bold text-gray-300 hover:text-red-500 uppercase tracking-widest ml-auto"
              >
                Kill Signal
              </button>
            </div>
          </div>
        ) : (
          <div className="brutal-card p-8 bg-gray-50 border-gray-200 text-center">
            <p className="text-sm font-bold text-gray-400 italic mb-4">No active signal</p>
            <button onClick={onCreateSignal} className="btn-brutal">
              Broadcast Signal
            </button>
          </div>
        )}
        <p className="mt-4 handwritten text-sm text-gray-400">Signals are public, time-bound statements of intent.</p>
      </section>

      {/* Stats Block */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-12">
        {[
          { label: 'Sync Efficiency', val: `${user.stats.responseRate}%`, sub: 'Real-time reliability' },
          { label: 'Avg Latency', val: user.stats.medianReplyTime, sub: 'Protocol average: 3h' },
          { label: 'Mesh Credits', val: user.stats.reciprocityCredits, sub: 'Refill by responding' }
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