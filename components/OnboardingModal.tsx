import React, { useState } from 'react';
import { ContextType, ContextProfile } from '../types';

interface OnboardingModalProps {
  onComplete: (profile: ContextProfile) => void;
  userName: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, userName }) => {
  const [bio, setBio] = useState('');

  const handleComplete = () => {
    if (!bio.trim()) return;
    
    const profile: ContextProfile = {
      id: `profile_${Date.now()}`,
      type: ContextType.PROFESSIONAL,
      bio: bio.trim(),
      industry: '',
      topics: [],
      availabilityRules: '',
      location: '',
      openTo: [],
      isActive: true
    };
    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="brutal-card p-8 md:p-10 bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">Get Started</h2>
            <p className="text-sm text-gray-500">
              Write a short identity statement. You can add more details later.
            </p>
          </div>
          
          <div className="mb-6">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g., Building a distributed database. Looking to connect with engineers."
              className="w-full p-4 border-2 border-gray-200 focus:border-[#ff4d00] outline-none h-24 resize-none text-sm font-medium"
              autoFocus
            />
          </div>

          <button
            onClick={handleComplete}
            disabled={!bio.trim()}
            className="btn-brutal !bg-black !text-white w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Create Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
