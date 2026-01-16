import React from 'react';
import { Signal } from '../types';

interface SignalCardProps {
  signal: Signal;
  onRespond: (signal: Signal) => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onRespond }) => {
  const hoursLeft = Math.max(0, Math.floor((new Date(signal.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)));
  const isExpired = new Date(signal.expiresAt) <= new Date();
  
  return (
    <div className={`brutal-card p-5 bg-white border border-black group transition-all ${isExpired ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[7px] font-black uppercase px-1 py-0.5 border border-black ${signal.type === 'OFFER' ? 'bg-[#ff4d00] text-white border-[#ff4d00]' : 'bg-white'}`}>
            {signal.type}
          </span>
          <span className="handwritten text-xs text-gray-400">from {signal.userName}</span>
        </div>
        <span className={`text-[7px] font-black uppercase ${isExpired ? 'text-red-400' : hoursLeft < 6 ? 'text-[#ff4d00]' : 'text-gray-200'}`}>
          {isExpired ? 'EXPIRED' : `${hoursLeft}h left`}
        </span>
      </div>
      
      <div className="mb-2">
        <p className="text-[6px] font-black uppercase text-gray-400 tracking-widest mb-1">Intent (Not a Post)</p>
        <p className="text-xs font-bold leading-relaxed italic text-gray-900 group-hover:text-black">
          &quot;{signal.content}&quot;
        </p>
      </div>
      
      <div className="mb-4 pt-3 border-t border-gray-100">
        <p className="text-[7px] font-black text-gray-300 uppercase mb-2">Action Required:</p>
        <div className="flex gap-2">
          <button 
            onClick={() => !isExpired && onRespond(signal)}
            disabled={isExpired}
            className="btn-brutal !py-1 !px-2 !text-[8px] flex-1"
          >
            {signal.type === 'OFFER' ? 'Sync' : 'Offer Help'}
          </button>
          <button 
            disabled={isExpired}
            className="btn-brutal !bg-white !text-gray-300 !border-gray-50 !py-1 !px-2 !text-[8px] hover:!text-black disabled:opacity-30"
            title="Make an introduction"
          >
            Relay
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;