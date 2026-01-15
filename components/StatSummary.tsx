import React from 'react';
import { UserStats } from '../types';

interface StatSummaryProps {stats: UserStats;}

const StatSummary: React.FC<StatSummaryProps> = ({ stats }) => {
  return (
    <div className="space-y-20 fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="brutal-card p-8 bg-white -rotate-1">
          <p className="handwritten text-3xl mb-4 text-[#ff4d00]">Credits</p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black">{stats.reciprocityCredits}</span>
          </div>
          <p className="text-[10px] font-bold mt-5 opacity-40 leading-tight">Burn to reach out.<br/>Refill by responding.</p>
        </div>

        <div className="brutal-card p-8 bg-white rotate-1">
          <p className="handwritten text-3xl mb-4 text-[#ff4d00]">Reachability</p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black">{stats.responseRate}%</span>
          </div>
          <p className="text-[10px] font-bold mt-5 opacity-40">System health marker.<br/>Silence is failure.</p>
        </div>

        <div className="brutal-card p-8 bg-white -rotate-1">
          <p className="handwritten text-3xl mb-4 text-[#ff4d00]">Network Lift</p>
          <div className="flex items-baseline gap-2">
            <span className="text-7xl font-black">{stats.peopleHelped}</span>
          </div>
          <p className="text-[10px] font-bold mt-5 opacity-40">Introductions verified.<br/>Value compounds here.</p>
        </div>

        <div className="brutal-card p-8 bg-white rotate-2 flex flex-col justify-between">
          <div>
            <p className="handwritten text-3xl mb-4 text-[#ff4d00]">Sync Speed</p>
            <span className="text-5xl font-black italic">{stats.medianReplyTime}</span>
          </div>
          <button className="text-[10px] font-black underline hover:text-[#ff4d00] mt-8 text-left uppercase tracking-widest transition-colors">
            Protocol manifest
          </button>
        </div>
      </div>

      <div className="brutal-card p-12 bg-white relative">
        <div className="absolute top-6 right-10 handwritten text-2xl opacity-10 rotate-12">Reachability = Virtue</div>
        <div className="max-w-4xl relative z-10">
          <h4 className="text-4xl font-black mb-10 uppercase tracking-tighter">
            The <span className="marker-highlight">Willingness</span> Mesh.
          </h4>
          <p className="text-2xl leading-relaxed mb-12 font-bold italic opacity-90">
            "Existing networks are ghost towns. We flip the default. Every node is opted-in to contact. Your response rate is your reputation. If you don't respond, you fade out."
          </p>
          <div className="flex flex-wrap gap-10">
            <button className="handwritten text-3xl border-b-4 border-[#ff4d00] pb-1 hover:text-[#ff4d00] transition-all">Protocol Whitepaper</button>
            <button className="handwritten text-3xl border-b-4 border-black pb-1 hover:text-gray-400 transition-all">Community Rules</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatSummary;