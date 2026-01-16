import React from 'react';

const DifferentiatorsBanner: React.FC = () => {
  return (
    <div className="brutal-card p-6 md:p-8 bg-[#ff4d00] text-white mb-8 border-black">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-black uppercase mb-2 tracking-tight">Response Required</h3>
          <p className="text-xs font-bold leading-relaxed opacity-90">
            Everyone here opted in. Response isn&apos;t optional—it&apos;s the condition of being on the platform.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase mb-2 tracking-tight">Not a Feed</h3>
          <p className="text-xs font-bold leading-relaxed opacity-90">
            Signals are actionable intents, not posts. No likes, no comments, no engagement metrics. Just routing.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase mb-2 tracking-tight">Response Rate = Reputation</h3>
          <p className="text-xs font-bold leading-relaxed opacity-90">
            Your response rate is public. Silence is a failure state. This isn&apos;t LinkedIn—we measure availability, not followers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DifferentiatorsBanner;
