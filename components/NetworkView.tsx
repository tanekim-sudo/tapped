import React, { useState } from 'react';
import { NetworkConnection } from '../types';

interface NetworkViewProps {
  connections: NetworkConnection[];
  onUpdate: (id: string, updates: Partial<NetworkConnection>) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  statusFilter: 'All Syncs' | 'Pending' | 'Archived';
  onStatusFilterChange: (status: 'All Syncs' | 'Pending' | 'Archived') => void;
  onTerminate: (id: string) => void;
}

const NetworkView: React.FC<NetworkViewProps> = ({ 
  connections, 
  onUpdate, 
  filter, 
  onFilterChange,
  statusFilter,
  onStatusFilterChange,
  onTerminate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex gap-6">
          {(['All Syncs', 'Pending', 'Archived'] as const).map((status) => (
            <button 
              key={status}
              onClick={() => onStatusFilterChange(status)}
              className={`text-[9px] font-black uppercase tracking-widest ${statusFilter === status ? 'text-black border-b border-black pb-1' : 'text-gray-300 hover:text-gray-500'}`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-48">
          <input 
            type="text" 
            placeholder="FILTER_NODES..." 
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="!py-1.5 text-[9px] border-gray-100 bg-white" 
          />
        </div>
      </div>

      {connections.length > 0 ? (
        <div className="space-y-3">
          {connections.map((conn) => (
          <div key={conn.id} className="brutal-card p-6 bg-white flex flex-col md:flex-row gap-6 items-stretch border-gray-100">
            {/* Metadata */}
            <div className="w-full md:w-56 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-xs uppercase truncate pr-2">{conn.name}</h4>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      onClick={() => onUpdate(conn.id, { ranking: star })}
                      className={`text-[10px] ${conn.ranking >= star ? 'text-[#ff4d00]' : 'text-gray-100 hover:text-[#ff4d00]'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-2">{conn.tagline}</p>
              <div className="mt-2 pt-2 border-t border-gray-50">
                <p className="text-[8px] text-gray-300 font-black uppercase mb-1">Last Sync: {conn.lastInteraction.toLocaleDateString()}</p>
                <p className="text-[7px] text-gray-400 italic">Response time matters. Fast replies = better reputation.</p>
              </div>
            </div>

            {/* Context Notes */}
            <div className="flex-grow w-full md:border-l border-gray-50 md:pl-6 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-black text-gray-200 uppercase tracking-widest">Private Mesh Notes</span>
                <span className="text-[8px] font-black text-[#ff4d00] uppercase tracking-widest">{conn.status}</span>
              </div>
              
              <div className="flex-grow">
                {editingId === conn.id ? (
                  <textarea 
                    autoFocus
                    className="w-full h-full min-h-[60px] text-[11px] font-medium bg-gray-50 border-gray-100 p-2 italic leading-relaxed"
                    defaultValue={conn.privateNotes}
                    onBlur={(e) => {
                      onUpdate(conn.id, { privateNotes: e.target.value });
                      setEditingId(null);
                    }}
                  />
                ) : (
                  <div 
                    onClick={() => setEditingId(conn.id)}
                    className="group relative cursor-text min-h-[60px] hover:bg-gray-50/50 p-2 -m-2 transition-colors"
                  >
                    <p className="text-[11px] font-medium italic text-gray-600 leading-relaxed">
                      {conn.privateNotes || "Establish private context for this node..."}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-4">
                <button 
                  onClick={() => onUpdate(conn.id, { lastInteraction: new Date() })}
                  className="text-[8px] font-bold uppercase tracking-widest hover:text-[#ff4d00]"
                >
                  Re-Sync
                </button>
                <button 
                  onClick={() => onTerminate(conn.id)}
                  className="text-[8px] font-bold uppercase tracking-widest text-red-300 hover:text-red-500 ml-auto"
                >
                  Terminate
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      ) : (
        <div className="brutal-card p-12 text-center bg-gray-50">
          <p className="text-sm font-bold text-gray-400 italic">No connections match your filters.</p>
        </div>
      )}
    </div>
  );
};

export default NetworkView;