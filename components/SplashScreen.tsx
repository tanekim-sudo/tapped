import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'initial' | 'animating' | 'complete'>('initial');

  useEffect(() => {
    // Start animation after a brief delay
    const timer = setTimeout(() => {
      setPhase('animating');
    }, 300);

    // Complete after animation
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      setTimeout(onComplete, 200);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-[300] flex items-center justify-center overflow-hidden">
      <div className="text-center">
        <div 
          className={`transition-all duration-1000 ${
            phase === 'initial' 
              ? 'opacity-0 scale-95' 
              : phase === 'animating'
              ? 'opacity-100 scale-100 animate-pulse'
              : 'opacity-0 scale-110'
          }`}
        >
          <h1 
            className={`text-6xl md:text-8xl font-black italic tracking-tighter mb-6 transition-all duration-1000 ${
              phase === 'animating' ? 'text-[#ff4d00]' : 'text-black'
            }`}
            style={{
              transform: phase === 'animating' ? 'rotate(-2deg)' : 'rotate(0deg)',
              textShadow: phase === 'animating' 
                ? '4px 4px 0px rgba(255, 77, 0, 0.3), 8px 8px 0px rgba(255, 77, 0, 0.2)' 
                : 'none'
            }}
          >
            Tapped.
          </h1>
          
          {phase === 'initial' && (
            <button
              onClick={() => setPhase('animating')}
              className="btn-brutal !bg-black !text-white px-12 py-4 text-lg md:text-xl font-black uppercase tracking-wider hover:!bg-[#ff4d00] transition-all"
            >
              Get Started
            </button>
          )}
          
          {phase === 'animating' && (
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-[#ff4d00] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                Connecting...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
