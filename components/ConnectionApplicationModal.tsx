import React, { useState } from 'react';
import { User, ContextProfile } from '../types';

interface ConnectionApplicationModalProps {
  recipient: User;
  recipientProfile: ContextProfile;
  currentUser: User;
  onApply: (answers: string[]) => Promise<void>;
  onClose: () => void;
}

const ConnectionApplicationModal: React.FC<ConnectionApplicationModalProps> = ({
  recipient,
  recipientProfile,
  currentUser,
  onApply,
  onClose
}) => {
  const [answers, setAnswers] = useState<string[]>(
    recipientProfile.qualificationQuestions?.map(() => '') || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (recipientProfile.qualificationQuestions && recipientProfile.qualificationQuestions.length > 0) {
      // Validate all questions are answered
      if (answers.some(a => !a.trim())) {
        alert('Please answer all questions');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      await onApply(answers);
      onClose();
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-white/95 flex items-center justify-center z-[100] p-4 fade-in backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-2xl p-8 md:p-12 brutal-card !shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">
              Connect with {recipient.name}
            </h3>
            <p className="text-sm text-gray-500">
              {recipientProfile.qualificationQuestions && recipientProfile.qualificationQuestions.length > 0
                ? `Please answer ${recipientProfile.qualificationQuestions.length} question(s) to apply`
                : 'Request to connect'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-4xl font-light hover:text-[#ff4d00] leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-6">
          {recipientProfile.qualificationQuestions && recipientProfile.qualificationQuestions.length > 0 ? (
            <>
              <div className="p-4 bg-[#ff4d00]/5 border-l-4 border-[#ff4d00]">
                <p className="text-xs font-black uppercase text-[#ff4d00] mb-1">Note</p>
                <p className="text-sm text-gray-700">
                  Your answers will be reviewed by AI to help {recipient.name} select the best connections.
                </p>
              </div>

              {recipientProfile.qualificationQuestions.map((question, idx) => (
                <div key={idx}>
                  <label className="text-sm font-black uppercase tracking-widest text-gray-700 mb-2 block">
                    {idx + 1}. {question}
                  </label>
                  <textarea
                    value={answers[idx] || ''}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[idx] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                    placeholder="Your answer (short response)"
                    className="w-full p-4 border-2 border-gray-200 focus:border-[#ff4d00] outline-none text-sm min-h-[80px]"
                    maxLength={200}
                  />
                  <p className="text-[8px] text-gray-400 mt-1">
                    {(answers[idx] || '').length}/200 characters
                  </p>
                </div>
              ))}
            </>
          ) : (
            <div className="p-6 bg-gray-50 border border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                No qualification questions set. Your connection request will be sent directly.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="btn-brutal flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (recipientProfile.qualificationQuestions && answers.some(a => !a.trim()))}
            className="btn-brutal flex-1 !bg-black !text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionApplicationModal;
