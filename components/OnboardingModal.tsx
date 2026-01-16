import React, { useState } from 'react';
import { ContextType, ContextProfile } from '../types';

interface OnboardingModalProps {
  onComplete: (profile: ContextProfile) => void;
  userName: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, userName }) => {
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<ContextType>(ContextType.PROFESSIONAL);
  const [bio, setBio] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [availability, setAvailability] = useState('');
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [openToInput, setOpenToInput] = useState('');

  const handleAddGoal = () => {
    if (goalInput.trim() && !goals.includes(goalInput.trim())) {
      setGoals([...goals, goalInput.trim()]);
      setGoalInput('');
    }
  };

  const handleRemoveGoal = (goal: string) => {
    setGoals(goals.filter(g => g !== goal));
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

  const handleComplete = () => {
    const profile: ContextProfile = {
      id: `profile_${Date.now()}`,
      type: profileType,
      bio: bio.trim(),
      goals,
      availabilityRules: availability.trim(),
      openTo,
      isActive: true
    };
    onComplete(profile);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return profileType !== null;
      case 2:
        return bio.trim().length >= 20;
      case 3:
        return goals.length > 0;
      case 4:
        return availability.trim().length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-[9px] font-black uppercase text-gray-400">Step {step} of 5</span>
            <span className="text-[9px] font-black uppercase text-[#ff4d00]">{Math.round((step / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1">
            <div 
              className="bg-[#ff4d00] h-1 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="brutal-card p-8 md:p-12 bg-white mb-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Welcome, {userName}!</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Let&apos;s set up your first networking identity. You can create multiple profiles later.
                </p>
              </div>
              
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 block">
                  Choose Your Identity Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(ContextType).map(type => (
                    <button
                      key={type}
                      onClick={() => setProfileType(type)}
                      className={`p-4 border-2 text-left transition-all ${
                        profileType === type
                          ? 'border-[#ff4d00] bg-[#ff4d00]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs font-black uppercase mb-1">{type}</div>
                      <div className="text-[10px] text-gray-500">
                        {type === ContextType.PROFESSIONAL && 'Career, business, networking'}
                        {type === ContextType.BUILDER && 'Projects, startups, building'}
                        {type === ContextType.LEARNER && 'Learning, mentorship, growth'}
                        {type === ContextType.ANONYMOUS && 'Private, sensitive topics'}
                        {type === ContextType.LOCAL && 'Community, local connections'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Tell Your Story</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Write a brief bio that explains who you are and what you&apos;re working on. Be specific.
                </p>
              </div>
              
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                  Bio (min 20 characters)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g., Junior at Stanford. Building a distributed database in Rust. Want to chat with engineers who have shipped to production."
                  className="w-full p-4 border border-gray-200 focus:border-[#ff4d00] outline-none h-32 resize-none"
                  maxLength={300}
                />
                <p className="text-[8px] text-gray-400 mt-2">{bio.length}/300 characters</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">What Are Your Goals?</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  What do you want to achieve through networking? Add specific goals.
                </p>
              </div>
              
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                  Goals
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                    placeholder="e.g., Code reviews, Career advice"
                    className="flex-1 p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
                  />
                  <button
                    onClick={handleAddGoal}
                    className="btn-brutal !bg-black !text-white px-4"
                  >
                    Add
                  </button>
                </div>
                {goals.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {goals.map(goal => (
                      <span
                        key={goal}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-xs"
                      >
                        {goal}
                        <button
                          onClick={() => handleRemoveGoal(goal)}
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
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Set Availability</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  How available are you? Be honest. &quot;2 slots this week&quot; is better than vague.
                </p>
              </div>
              
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                  Availability Rules
                </label>
                <textarea
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g., 30 mins blocks, Tue/Thu eves only. Max 2 conversations per week."
                  className="w-full p-4 border border-gray-200 focus:border-[#ff4d00] outline-none h-24 resize-none"
                  maxLength={200}
                />
                <p className="text-[8px] text-gray-400 mt-2">{availability.length}/200 characters</p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">What Are You Open To?</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  What types of interactions are you open to? This helps others know how to reach out.
                </p>
              </div>
              
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                  Open To (optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={openToInput}
                    onChange={(e) => setOpenToInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOpenTo()}
                    placeholder="e.g., Pitch feedback, Mentorship, Introductions"
                    className="flex-1 p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
                  />
                  <button
                    onClick={handleAddOpenTo}
                    className="btn-brutal !bg-black !text-white px-4"
                  >
                    Add
                  </button>
                </div>
                {openTo.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {openTo.map(item => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-xs"
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

              <div className="p-4 bg-gray-50 border-l-4 border-[#ff4d00]">
                <p className="text-xs font-bold text-gray-700">
                  Ready to join Tapped! Your profile will be visible to others in the network.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="btn-brutal disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!isStepValid()}
              className="btn-brutal !bg-black !text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!isStepValid()}
              className="btn-brutal !bg-[#ff4d00] !text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
