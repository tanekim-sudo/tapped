import React from 'react';

const rules = [
  {
    title: "Short by Default",
    content: "Messages are expected to be brief. If it takes more than ~3 sentences, it’s probably wrong. This isn’t email — it’s routing.",
    annotation: "Zero fluff."
  },
  {
    title: "Intent First, Context Second",
    content: "Every outreach starts with why, not background. Good: 'Looking for 15 min advice on X'. Bad: 'Hi, I'm a sophomore...'",
    annotation: "Leading with value."
  },
  {
    title: "Schedule Fast or Exit",
    content: "Within 2–3 messages, either schedule a meeting, make an intro, or close the thread. Lingering chats are failure states.",
    annotation: "Avoid churn."
  },
  {
    title: "Default to Calendar, Not Chat",
    content: "Nudge toward 15 min slots or async voice notes. Chat is a bridge, not the destination.",
    annotation: "Operational speed."
  },
  {
    title: "No Cold Pitches",
    content: "Don't pitch in the first interaction. Use it to clarify intent and test fit. Anything else is noise.",
    annotation: "Signal > Noise."
  },
  {
    title: "Clear Asks Only",
    content: "Must be: Advice, Feedback, Introduction, or Conversation. No vague 'would love to connect' energy.",
    annotation: "Specificity is kind."
  },
  {
    title: "Fast Declines Are Respected",
    content: "Saying 'no' quickly is good behavior. Declining is better than ignoring. Ignoring is penalized.",
    annotation: "Reputation cost."
  },
  {
    title: "Introduce or Exit",
    content: "If you can't help directly, make an intro or say you can't. Silently passing is not acceptable.",
    annotation: "Relay node."
  },
  {
    title: "Speed Over Polish",
    content: "Fast replies beat perfect messages. If it takes more than a few seconds to send, it's wrong.",
    annotation: "Synchronous logic."
  }
];

const GroundRules: React.FC = () => {
  return (
    <div className="space-y-10 fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule, index) => (
          <div 
            key={index} 
            className="brutal-card p-8 bg-white"
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-300">Rule_{String(index + 1).padStart(2, '0')}</span>
              <div className="w-2 h-2 bg-[#ff4d00]/20"></div>
            </div>
            <h3 className="text-sm font-bold mb-3 uppercase tracking-tight text-gray-800">
              <span className="marker-highlight">{rule.title}</span>
            </h3>
            <p className="text-[11px] font-medium leading-relaxed mb-6 text-gray-500">
              {rule.content}
            </p>
            <div className="pt-4 border-t border-gray-50">
              <span className="handwritten text-sm text-[#ff4d00] italic">{rule.annotation}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="brutal-card p-10 bg-black text-white mt-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4d00] opacity-10 blur-3xl"></div>
        <div className="max-w-3xl relative z-10">
          <h4 className="text-2xl font-black mb-6 uppercase tracking-tighter text-[#ff4d00]">
            Trust-Based Networking
          </h4>
          <p className="text-lg leading-relaxed font-bold italic opacity-80 mb-6">
            &quot;This platform runs on goodwill. No obligations, no rankings, no enforcement. We trust that everyone here wants to network and help others.&quot;
          </p>
          <div className="pt-6 border-t border-white/20">
            <p className="text-sm font-black uppercase mb-3 text-[#ff4d00]">Core Principles:</p>
            <ul className="text-sm space-y-2 font-bold opacity-90">
              <li>• Search for people by industry or topic. Connect directly.</li>
              <li>• Search by industry or topic to find the right people.</li>
              <li>• No requirements, no tracking, no penalties. Just networking from goodwill.</li>
              <li>• Multiple profiles for different contexts and networking needs.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroundRules;