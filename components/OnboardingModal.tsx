import React, { useState, useRef } from 'react';
import { ContextType, ContextProfile } from '../types';

interface OnboardingModalProps {
  onComplete: (profile: ContextProfile) => void;
  userName: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete, userName }) => {
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<ContextType>(ContextType.PROFESSIONAL);
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string>('');
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

  const handleComplete = () => {
    const profile: ContextProfile = {
      id: `profile_${Date.now()}`,
      type: profileType,
      bio: bio.trim(),
      goals: [],
      availabilityRules: '',
      openTo: [],
      isActive: true,
      photo: photo || undefined
    };
    onComplete(profile);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return profileType !== null;
      case 2:
        return bio.trim().length >= 20;
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
            <span className="text-[9px] font-black uppercase text-gray-400">Step {step} of 3</span>
            <span className="text-[9px] font-black uppercase text-[#ff4d00]">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1">
            <div 
              className="bg-[#ff4d00] h-1 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="brutal-card p-8 md:p-12 bg-white mb-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black mb-3 uppercase tracking-tighter">Create Your First Profile</h2>
                <div className="p-4 bg-[#ff4d00]/5 border-l-4 border-[#ff4d00] mb-6">
                  <p className="text-sm font-bold text-gray-700 leading-relaxed mb-2">
                    This is just your <span className="text-[#ff4d00]">first networking identity</span>. You can create different profiles for different needs later (Professional, Builder, Learner, etc.). Each profile operates independently.
                  </p>
                  <p className="text-xs font-bold text-gray-600 italic">
                    Key Differentiator: Unlike LinkedIn, profiles are contexts, not identities. One person, multiple networking intents.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 block">
                  Choose Identity Type
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
                        {type === ContextType.PROFESSIONAL && 'Career, business'}
                        {type === ContextType.BUILDER && 'Projects, startups'}
                        {type === ContextType.LEARNER && 'Learning, growth'}
                        {type === ContextType.ANONYMOUS && 'Private topics'}
                        {type === ContextType.LOCAL && 'Local community'}
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
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Your Bio</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Write a brief bio. Be specific about who you are and what you&apos;re working on.
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
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Profile Photo (Optional)</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Add a photo for this profile. You can skip this and add it later.
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {photo ? (
                    <img 
                      src={photo} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-black"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-gray-200 flex items-center justify-center bg-gray-50">
                      <span className="text-4xl font-black text-gray-300">
                        {userName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
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
                    {photo ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {photo && (
                    <button
                      onClick={() => setPhoto('')}
                      className="btn-brutal !bg-white !text-gray-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-l-4 border-[#ff4d00] mt-6">
                <p className="text-xs font-bold text-gray-700">
                  You&apos;re all set! You can add goals, availability, and more details later in your profile settings. Create additional profiles anytime from the Nodes tab.
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
          
          {step < 3 ? (
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
              className="btn-brutal !bg-[#ff4d00] !text-white"
            >
              Create Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
