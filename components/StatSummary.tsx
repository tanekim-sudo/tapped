import React from 'react';
import { UserStats } from '../types';

interface StatSummaryProps {stats: UserStats;}

const StatSummary: React.FC<StatSummaryProps> = ({ stats }) => {
  return (
    <div className="space-y-20 fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
        <div className="brutal-card p-8 bg-white -rotate-1">
          <p className="handwritten text-3xl mb-4 text-[#ff4d00]">Network Lift</p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black">{stats.peopleHelped}</span>
          </div>
          <p className="text-[10px] font-bold mt-5 opacity-40">People helped</p>
        </div>

        <div className="brutal-card p-8 bg-white rotate-1">
          <p className="handwritten text-3xl mb-4 text-[#ff4d00]">Conversations</p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black">{stats.conversationsCompleted}</span>
          </div>
          <p className="text-[10px] font-bold mt-5 opacity-40">Completed</p>
        </div>
      </div>

      <div className="brutal-card p-12 bg-white relative">
        <div className="absolute top-6 right-10 handwritten text-2xl opacity-10 rotate-12">Reachability = Virtue</div>
        <div className="max-w-4xl relative z-10">
          <h4 className="text-4xl font-black mb-10 uppercase tracking-tighter">
            The <span className="marker-highlight">Willingness</span> Mesh.
          </h4>
          <p className="text-2xl leading-relaxed mb-12 font-bold italic opacity-90">
            "A trust-based networking platform. Send signals, check signals, or search for people. No obligations, just goodwill."
          </p>
          <div className="flex flex-wrap gap-10">
            <button className="handwritten text-3xl border-b-4 border-black pb-1 hover:text-gray-400 transition-all">Community Rules</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatSummary;