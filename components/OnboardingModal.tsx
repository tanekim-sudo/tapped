import React, { useState } from 'react';
import { ContextType, ContextProfile } from '../types';

interface OnboardingModalProps {
  onComplete: (profile: ContextProfile) => void;
  userName: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, userName }) => {
  const [profileName, setProfileName] = useState(''); // Private profile name
  const [industry, setIndustry] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');

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
      industry: industry.trim(),
      topics,
      availabilityRules: '',
      location: '',
      openTo: ['advice', 'intros', 'chats'], // Default open to all
      responseReliability: 100, // Start at 100%
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
          
          <div className="space-y-4 mb-6">
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
                className="w-full p-4 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm font-medium"
                maxLength={50}
                autoFocus
              />
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
