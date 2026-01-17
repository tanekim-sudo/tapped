import React, { useState } from 'react';
import { ContextType, ContextProfile } from '../types';
import LocationPicker from './LocationPicker';

interface OnboardingModalProps {
  onComplete: (profile: ContextProfile) => void;
  userName: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, userName }) => {
  const [profileName, setProfileName] = useState(''); // Private profile name
  const [industry, setIndustry] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  const handleAddTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const handleComplete = () => {
    if (!industry.trim()) return;
    
    const profile: ContextProfile = {
      id: `profile_${Date.now()}`,
      type: ContextType.FOUNDER, // Default type
      privateName: profileName.trim() || undefined, // Private name (customizable, not shown to others)
      bio: '', // Empty bio initially (replaced by activeSignal in new design)
      industry: industry.trim(),
      topics,
      availabilityRules: '',
      location: location.trim(),
      latitude,
      longitude,
      openTo: ['advice', 'intros', 'chats'], // Default open to all
      responseReliability: 100, // Start at 100%
      isActive: true,
      isAvailable: true // Everyone is assumed available
    };
    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center p-4 overflow-y-auto" style={{ touchAction: 'pan-y' }}>
      <div className="w-full max-w-lg my-auto min-h-0">
        <div className="brutal-card p-6 md:p-8 lg:p-10 bg-white">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-black mb-2 uppercase tracking-tighter">Get Started</h2>
            <p className="text-xs md:text-sm text-gray-500">
              Create your first profile to start connecting.
            </p>
          </div>
          
          <div className="space-y-4 mb-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Profile Name (Private - only you can see this)
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g., My Work Profile, Founder Mode, etc."
                className="w-full p-4 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm font-medium"
                maxLength={30}
              />
              <p className="text-[8px] text-gray-400 mt-1">This name is private and only visible to you</p>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Industry
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Tech, VC, Education"
                className="w-full p-3 md:p-4 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm font-medium"
                maxLength={50}
                autoFocus
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Location
              </label>
              <LocationPicker
                value={location}
                latitude={latitude}
                longitude={longitude}
                onChange={(loc, lat, lng) => {
                  setLocation(loc);
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                placeholder="e.g., San Francisco, CA or New York, NY"
              />
              <p className="text-[8px] text-gray-400 mt-1">Location helps us match you with nearby connections</p>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Topics / Domains
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                  placeholder="e.g., AI, Startups, Networking"
                  className="flex-1 p-3 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm font-medium"
                />
                <button
                  onClick={handleAddTopic}
                  className="btn-brutal !bg-black !text-white px-4"
                >
                  Add
                </button>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-xs"
                    >
                      {topic}
                      <button
                        onClick={() => handleRemoveTopic(topic)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleComplete}
            disabled={!industry.trim() || !profileName.trim()}
            className="btn-brutal !bg-black !text-white w-full py-3 md:py-4 text-sm md:text-base disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Create Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
