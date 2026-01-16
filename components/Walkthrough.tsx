import React, { useState, useEffect, useRef } from 'react';

interface WalkthroughStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to take before showing step
}

interface WalkthroughProps {
  steps: WalkthroughStep[];
  onComplete: () => void;
  onSkip: () => void;
}

const Walkthrough: React.FC<WalkthroughProps> = ({ steps, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (currentStepData?.action) {
      currentStepData.action();
      // Wait for DOM to update
      setTimeout(() => {
        highlightTarget();
      }, 300);
    } else {
      highlightTarget();
    }
  }, [currentStep]);

  const highlightTarget = () => {
    if (currentStepData?.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setHighlightedElement(null);
    onComplete();
  };

  const handleSkip = () => {
    setHighlightedElement(null);
    onSkip();
  };

  // Calculate highlight position
  const highlightRect = highlightedElement?.getBoundingClientRect();

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 z-[199] transition-opacity"
        onClick={handleSkip}
      />

      {/* Highlight Box */}
      {highlightRect && highlightedElement && (
        <div
          className="fixed border-4 border-[#ff4d00] rounded pointer-events-none z-[201] transition-all"
          style={{
            top: `${highlightRect.top - 4}px`,
            left: `${highlightRect.left - 4}px`,
            width: `${highlightRect.width + 8}px`,
            height: `${highlightRect.height + 8}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[202] bg-white brutal-card p-6 max-w-sm"
        style={
          highlightRect
            ? currentStepData.position === 'top'
              ? {
                  bottom: `${window.innerHeight - highlightRect.top + 20}px`,
                  left: `${highlightRect.left + highlightRect.width / 2}px`,
                  transform: 'translateX(-50%)'
                }
              : currentStepData.position === 'bottom'
              ? {
                  top: `${highlightRect.bottom + 20}px`,
                  left: `${highlightRect.left + highlightRect.width / 2}px`,
                  transform: 'translateX(-50%)'
                }
              : currentStepData.position === 'right'
              ? {
                  left: `${highlightRect.right + 20}px`,
                  top: `${highlightRect.top + highlightRect.height / 2}px`,
                  transform: 'translateY(-50%)'
                }
              : currentStepData.position === 'left'
              ? {
                  right: `${window.innerWidth - highlightRect.left + 20}px`,
                  top: `${highlightRect.top + highlightRect.height / 2}px`,
                  transform: 'translateY(-50%)'
                }
              : {
                  left: `${highlightRect.left + highlightRect.width / 2}px`,
                  top: `${highlightRect.top + highlightRect.height / 2}px`,
                  transform: 'translate(-50%, -50%)'
                }
            : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }
        }
      >
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-black uppercase text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-[8px] font-bold text-gray-400 hover:text-[#ff4d00] uppercase"
            >
              Skip Tour
            </button>
          </div>
          <div className="w-full bg-gray-100 h-1">
            <div
              className="bg-[#ff4d00] h-1 transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-xl font-black mb-2 uppercase tracking-tight">{currentStepData.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{currentStepData.content}</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="btn-brutal disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep ? 'bg-[#ff4d00] w-6' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="btn-brutal !bg-black !text-white"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Walkthrough;
