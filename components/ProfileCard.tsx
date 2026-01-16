import React from 'react';
import { User, ContextProfile } from '../types';

interface ProfileCardProps {
  user: User;
  onConnect: (user: User, profile: ContextProfile) => void;
  canAfford?: boolean;
  discoveryUsers?: User[]; // For showing who introduced them
  connectionStatus?: 'CONNECTED' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NOT_CONNECTED';
  onAcceptRequest?: (userId: string) => void;
  onDeclineRequest?: (userId: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  user, 
  onConnect, 
  canAfford = true, 
  discoveryUsers = [],
  connectionStatus = 'NOT_CONNECTED',
  onAcceptRequest,
  onDeclineRequest
}) => {
  const primaryProfile = user.profiles[0];
  const initials = user.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="brutal-card p-5 mb-3 bg-white hover:bg-gray-50/50 flex flex-col sm:flex-row gap-6 items-center border-gray-100">
      <div className="flex-grow w-full">
        <div className="flex items-center gap-3 mb-3">
          {primaryProfile?.photo ? (
            <img 
              src={primaryProfile.photo} 
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-black"
            />
          ) : (
            <div className="w-8 h-8 border border-black flex items-center justify-center font-black text-[9px] bg-white rounded-full">
              {initials}
            </div>
          )}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-tight leading-none mb-1">{user.name}</h4>
            <span className="text-[8px] font-black uppercase text-gray-300 tracking-widest">
              node_{primaryProfile?.type.toLowerCase()}
            </span>
          </div>
        </div>

        {/* Simplified profile - only essential info */}
        <div className="space-y-2">
          <p className="text-sm font-bold leading-snug tracking-tight text-gray-800">
            {primaryProfile?.bio}
          </p>
          
          {/* What they're open to */}
          {primaryProfile?.openTo && primaryProfile.openTo.length > 0 && (
            <div>
              <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Open to:</p>
              <div className="flex flex-wrap gap-1">
                {primaryProfile.openTo.map(item => (
                  <span key={item} className="text-[8px] font-bold uppercase px-2 py-0.5 bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What they know - topics */}
          {primaryProfile?.topics && primaryProfile.topics.length > 0 && (
            <div>
              <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Knows:</p>
              <div className="flex flex-wrap gap-1">
                {primaryProfile.topics.slice(0, 3).map(topic => (
                  <span key={topic} className="text-[8px] font-bold text-gray-600">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Who introduced them */}
          {user.stats.introducedBy && discoveryUsers.length > 0 && (
            <p className="text-[8px] font-bold text-gray-500 italic">
              Introduced by {discoveryUsers.find(u => u.id === user.stats.introducedBy)?.name || 'someone'}
            </p>
          )}
        </div>
      </div>

      <div className="w-full sm:w-28 sm:border-l border-gray-100 sm:pl-4 flex flex-col justify-center items-center text-center">
        {/* Show follow-through rate if available */}
        {user.stats.followThroughRate !== undefined && user.stats.followThroughRate >= 80 && (
          <div className="mb-2">
            <p className="text-[8px] font-black text-[#ff4d00]">High Follow-Through</p>
          </div>
        )}
        {user.stats.introducedBy && (
          <div className="mb-2">
            <p className="text-[8px] font-bold text-gray-500 italic">Vouched</p>
          </div>
        )}
        {connectionStatus === 'CONNECTED' ? (
          <div className="w-full">
            <span className="text-[8px] font-black uppercase text-[#ff4d00] mb-2 block">Connected</span>
            <button 
              onClick={() => onConnect(user, primaryProfile)}
              className="btn-brutal w-full !text-xs !py-2 !bg-gray-50"
            >
              Message
            </button>
          </div>
        ) : connectionStatus === 'PENDING_SENT' ? (
          <div className="w-full">
            <span className="text-[8px] font-black uppercase text-gray-400 mb-2 block">Pending</span>
            <button 
              disabled
              className="btn-brutal w-full !text-xs !py-2 opacity-50 cursor-not-allowed"
            >
              Request Sent
            </button>
          </div>
        ) : connectionStatus === 'PENDING_RECEIVED' ? (
          <div className="w-full space-y-2">
            <button 
              onClick={() => onAcceptRequest?.(user.id)}
              className="btn-brutal w-full !text-xs !py-2 !bg-black !text-white"
            >
              Accept
            </button>
            <button 
              onClick={() => onDeclineRequest?.(user.id)}
              className="btn-brutal w-full !text-xs !py-2"
            >
              Decline
            </button>
          </div>
        ) : (
          <button 
            onClick={() => onConnect(user, primaryProfile)}
            className="btn-brutal w-full !text-xs !py-2"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;