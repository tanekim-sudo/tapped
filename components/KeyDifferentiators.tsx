import React from 'react';

const KeyDifferentiators: React.FC = () => {
  return (
    <div className="space-y-6 mb-12">
      <div className="brutal-card p-6 bg-black text-white">
        <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-[#ff4d00]">
          Why Tapped is Different
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-black uppercase mb-2">vs. LinkedIn</h4>
            <ul className="text-xs space-y-1 font-bold opacity-90">
              <li>✓ Response required, not optional</li>
              <li>✓ Multiple context profiles</li>
              <li>✓ Response rate = reputation</li>
              <li>✓ Intent-first, not resume-first</li>
              <li>✓ Reciprocity credits system</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase mb-2">vs. Social Apps</h4>
            <ul className="text-xs space-y-1 font-bold opacity-90">
              <li>✓ Signals, not posts</li>
              <li>✓ No feed, no likes, no comments</li>
              <li>✓ Time-bound, actionable intents</li>
              <li>✓ Explicit opt-in to contact</li>
              <li>✓ Availability is visible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyDifferentiators;
