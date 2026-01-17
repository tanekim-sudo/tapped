import React, { useState, useRef } from 'react';
import { ContextProfile, ContextType } from '../types';

interface ProfileEditModalProps {
  profile: ContextProfile;
  onSave: (updates: Partial<ContextProfile>) => void;
  onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ profile, onSave, onClose }) => {
  const [privateName, setPrivateName] = useState(profile.privateName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [industry, setIndustry] = useState(profile.industry || '');
  const [topics, setTopics] = useState<string[]>(profile.topics || []);
  const [topicInput, setTopicInput] = useState('');
  const [meetingTypes, setMeetingTypes] = useState(profile.availabilityRules || '');
  const [location, setLocation] = useState(profile.location || '');
  const [openTo, setOpenTo] = useState<string[]>(profile.openTo || []);
  const [openToInput, setOpenToInput] = useState('');
  const [photo, setPhoto] = useState<string>(profile.photo || '');
  const [responseReliability, setResponseReliability] = useState(profile.responseReliability || 100);
  const [activeSignal, setActiveSignal] = useState(profile.activeSignal || '');
  // Connection preferences
  const [connectionLimit, setConnectionLimit] = useState(profile.connectionLimit || 0);
  const [weeklyCredits, setWeeklyCredits] = useState(profile.weeklyCredits || profile.connectionLimit || 0);
  const [qualificationQuestions, setQualificationQuestions] = useState<string[]>(profile.qualificationQuestions || []);
  const [questionInput, setQuestionInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOpenTo = () => {
    if (openToInput.trim() && !openTo.includes(openToInput.trim())) {
      setOpenTo([...openTo, openToInput.trim()]);
      setOpenToInput('');
    }
  };

  const handleRemoveOpenTo = (item: string) => {
    setOpenTo(openTo.filter(o => o !== item));
  };

  const handleAddTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const handleAddQuestion = () => {
    if (questionInput.trim() && qualificationQuestions.length < 3 && !qualificationQuestions.includes(questionInput.trim())) {
      setQualificationQuestions([...qualificationQuestions, questionInput.trim()]);
      setQuestionInput('');
    }
  };

  const handleRemoveQuestion = (question: string) => {
    setQualificationQuestions(qualificationQuestions.filter(q => q !== question));
  };

  const handleSave = () => {
    onSave({
      privateName: privateName.trim() || undefined,
      bio: bio.trim(),
      industry: industry.trim(),
      topics,
      availabilityRules: meetingTypes.trim(),
      location: location.trim(),
      openTo,
      responseReliability,
      activeSignal: activeSignal.trim() || undefined,
      photo: photo || undefined,
      connectionLimit: connectionLimit > 0 ? connectionLimit : undefined,
      weeklyCredits: weeklyCredits > 0 ? weeklyCredits : undefined,
      qualificationQuestions: qualificationQuestions.length > 0 ? qualificationQuestions : undefined
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-white/95 flex items-center justify-center z-[100] p-4 fade-in backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl p-8 md:p-12 brutal-card !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">
            Edit {profile.privateName || profile.type} Profile
          </h3>
          <button 
            onClick={onClose}
            className="text-4xl font-light hover:text-[#ff4d00] leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6">
          {/* Private Profile Name */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Profile Name (Private - only you can see this)
            </label>
            <input
              type="text"
              value={privateName}
              onChange={(e) => setPrivateName(e.target.value)}
              placeholder="e.g., My Work Profile, Founder Mode, etc."
              className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              maxLength={30}
            />
            <p className="text-[8px] text-gray-400 mt-1">This name is private and only visible to you</p>
          </div>

          {/* Photo */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 block">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              {photo ? (
                <img 
                  src={photo} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-black"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50">
                  <span className="text-2xl font-black text-gray-400">
                    {profile.type[0]}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-brutal !bg-black !text-white"
                >
                  {photo ? 'Change' : 'Upload'}
                </button>
                {photo && (
                  <button
                    onClick={() => setPhoto('')}
                    className="btn-brutal"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Industry */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Industry
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Tech, VC, Education"
              className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              maxLength={50}
            />
          </div>

          {/* Topics */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Topics
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                placeholder="e.g., Startups, AI, Networking"
                className="flex-1 p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
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
                {topics.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-xs"
                  >
                    {item}
                    <button
                      onClick={() => handleRemoveTopic(item)}
                      className="text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Connection Preferences */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-black uppercase mb-4">Connection Filtering</h4>
            
            {/* Connection Limit */}
            <div className="mb-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Max Connections Per Week
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={connectionLimit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setConnectionLimit(val);
                  if (weeklyCredits === 0 || weeklyCredits === connectionLimit) {
                    setWeeklyCredits(val);
                  }
                }}
                placeholder="e.g., 2"
                className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              />
              <p className="text-[8px] text-gray-400 mt-1">How many new connections you want per week</p>
            </div>

            {/* Weekly Credits */}
            <div className="mb-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Weekly Credits to Connect
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={weeklyCredits}
                onChange={(e) => setWeeklyCredits(Number(e.target.value))}
                placeholder="e.g., 2"
                className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              />
              <p className="text-[8px] text-gray-400 mt-1">Credits you get to connect with others (defaults to connection limit)</p>
            </div>

            {/* Qualification Questions */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                Qualification Questions (Max 3)
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddQuestion()}
                  placeholder="e.g., What's your main goal for this connection?"
                  disabled={qualificationQuestions.length >= 3}
                  className="flex-1 p-3 border border-gray-200 focus:border-[#ff4d00] outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleAddQuestion}
                  disabled={qualificationQuestions.length >= 3 || !questionInput.trim()}
                  className="btn-brutal !bg-black !text-white px-4 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {qualificationQuestions.length > 0 && (
                <div className="space-y-2">
                  {qualificationQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold text-gray-400 flex-shrink-0">{idx + 1}.</span>
                      <span className="text-sm flex-grow">{q}</span>
                      <button
                        onClick={() => handleRemoveQuestion(q)}
                        className="text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[8px] text-gray-400 mt-1">Applicants will answer these when requesting to connect. AI will rank them based on answers.</p>
            </div>
          </div>

          {/* Response Reliability */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Response Reliability
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={responseReliability}
                onChange={(e) => setResponseReliability(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-bold w-16 text-right">{responseReliability}%</span>
            </div>
            <p className="text-[8px] text-gray-400 mt-1">Your response rate and reliability score</p>
          </div>

          {/* Active Signal */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Active Signal (Optional)
            </label>
            <input
              type="text"
              value={activeSignal}
              onChange={(e) => setActiveSignal(e.target.value)}
              placeholder="e.g., Looking for AI engineers, Raising seed round"
              className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              maxLength={150}
            />
            <p className="text-[8px] text-gray-400 mt-1">Current active signal or ask</p>
          </div>

          {/* Location */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Stanford, CA or Remote"
              className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              maxLength={100}
            />
          </div>

          {/* Open To */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              What You're Open To
            </label>
            <div className="mb-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {['advice', 'intros', 'chats'].map(option => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openTo.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOpenTo([...openTo, option]);
                        } else {
                          setOpenTo(openTo.filter(o => o !== option));
                        }
                      }}
                      className="w-4 h-4 border-2 border-gray-300 checked:bg-[#ff4d00] checked:border-[#ff4d00]"
                    />
                    <span className="text-sm font-medium capitalize">{option}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                value={openToInput}
                onChange={(e) => setOpenToInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddOpenTo()}
                placeholder="Add custom option (e.g., Pitch feedback, Mentorship)"
                className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              />
              <button
                onClick={handleAddOpenTo}
                className="btn-brutal !bg-black !text-white px-4 mt-2"
              >
                Add Custom
              </button>
            </div>
            {openTo.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {openTo.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20 text-xs"
                  >
                    {item}
                    <button
                      onClick={() => handleRemoveOpenTo(item)}
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

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="btn-brutal flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-brutal flex-1 !bg-black !text-white"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;
