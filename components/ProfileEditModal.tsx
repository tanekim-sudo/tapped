import React, { useState, useRef } from 'react';
import { ContextProfile, ContextType } from '../types';

interface ProfileEditModalProps {
  profile: ContextProfile;
  onSave: (updates: Partial<ContextProfile>) => void;
  onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ profile, onSave, onClose }) => {
  const [bio, setBio] = useState(profile.bio);
  const [meetingTypes, setMeetingTypes] = useState(profile.availabilityRules);
  const [location, setLocation] = useState(profile.location || '');
  const [openTo, setOpenTo] = useState<string[]>(profile.openTo);
  const [openToInput, setOpenToInput] = useState('');
  const [photo, setPhoto] = useState<string>(profile.photo || '');
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

  const handleSave = () => {
    onSave({
      bio: bio.trim(),
      goals: [], // Always empty - networking is the sole goal
      availabilityRules: meetingTypes.trim(),
      location: location.trim(),
      openTo,
      photo: photo || undefined
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
            Edit {profile.type} Profile
          </h3>
          <button 
            onClick={onClose}
            className="text-4xl font-light hover:text-[#ff4d00] leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6">
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

          {/* Bio */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-4 border border-gray-200 focus:border-[#ff4d00] outline-none h-32 resize-none"
              maxLength={300}
            />
            <p className="text-[8px] text-gray-400 mt-2">{bio.length}/300</p>
          </div>

          {/* Meeting Types */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Meeting Types
            </label>
            <input
              type="text"
              value={meetingTypes}
              onChange={(e) => setMeetingTypes(e.target.value)}
              placeholder="e.g., Coffee chats, Video calls, In-person"
              className="w-full p-3 border border-gray-200 focus:border-[#ff4d00] outline-none"
              maxLength={100}
            />
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
              Open To
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={openToInput}
                onChange={(e) => setOpenToInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddOpenTo()}
                placeholder="e.g., Pitch feedback, Mentorship"
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
