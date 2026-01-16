import React from 'react';
import { User, ContextProfile } from '../types';

interface ProfileCardProps {
  user: User;
  onConnect: (user: User, profile: ContextProfile) => void;
  canAfford?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onConnect, canAfford = true }) => {
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

        <p className="text-sm font-bold leading-snug tracking-tight text-gray-800 mb-3">
          {primaryProfile?.bio}
        </p>

        {primaryProfile?.industry && (
          <p className="text-[9px] font-bold text-gray-600 mb-2">
            <span className="text-gray-400">Industry: </span>{primaryProfile.industry}
          </p>
        )}
        
        {primaryProfile?.topics && primaryProfile.topics.length > 0 && (
          <div className="mb-3">
            <p className="text-[9px] font-bold text-gray-400 mb-1">Topics:</p>
            <div className="flex flex-wrap gap-2">
              {primaryProfile.topics.map(topic => (
                <span key={topic} className="text-[8px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {(primaryProfile?.availabilityRules || primaryProfile?.location) && (
          <div className="mb-3 space-y-1">
            {primaryProfile.availabilityRules && (
              <p className="text-[9px] font-bold text-gray-600">
                <span className="text-gray-400">Meetings: </span>{primaryProfile.availabilityRules}
              </p>
            )}
            {primaryProfile.location && (
              <p className="text-[9px] font-bold text-gray-600">
                <span className="text-gray-400">Location: </span>{primaryProfile.location}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="w-full sm:w-28 sm:border-l border-gray-100 sm:pl-4 flex flex-col justify-center items-center text-center">
        {primaryProfile?.industry && (
          <div className="mb-3">
            <p className="text-xs font-black">{primaryProfile.industry}</p>
            <p className="text-[9px] text-gray-400">industry</p>
          </div>
        )}
        <button 
          onClick={() => onConnect(user, primaryProfile)}
          className="btn-brutal w-full !text-xs !py-2"
        >
          Connect
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;