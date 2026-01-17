import React, { useState, useEffect } from 'react';
import { ConnectionApplication, User, ContextProfile } from '../types';
import { rankConnectionApplicants } from '../services/claudeService';

interface RankedApplicantsViewProps {
  applications: ConnectionApplication[];
  applicants: User[]; // Full user data for applicants
  recipientProfile: ContextProfile;
  recipientUser: User;
  onAccept: (applicationId: string, userId: string) => Promise<void>;
  onReject: (applicationId: string, userId: string) => Promise<void>;
  remainingCredits: number;
}

interface RankedApplicant {
  application: ConnectionApplication;
  user: User;
  score: number;
  reason: string;
}

const RankedApplicantsView: React.FC<RankedApplicantsViewProps> = ({
  applications,
  applicants,
  recipientProfile,
  recipientUser,
  onAccept,
  onReject,
  remainingCredits
}) => {
  const [rankedApplicants, setRankedApplicants] = useState<RankedApplicant[]>([]);
  const [isRanking, setIsRanking] = useState(true);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set());

  useEffect(() => {
    const rankApplicants = async () => {
      if (!recipientProfile.qualificationQuestions || recipientProfile.qualificationQuestions.length === 0) {
        // No questions set, just show all applicants
        const ranked = applications.map(app => {
          const user = applicants.find(u => u.id === app.applicantId);
          return user ? {
            application: app,
            user,
            score: 50,
            reason: 'No qualification questions set'
          } : null;
        }).filter(Boolean) as RankedApplicant[];
        setRankedApplicants(ranked);
        setIsRanking(false);
        return;
      }

      setIsRanking(true);
      try {
        const applicantsData = applications.map(app => {
          const user = applicants.find(u => u.id === app.applicantId);
          if (!user) return null;
          return {
            userId: user.id,
            name: user.name,
            profile: {
              activeSignal: user.profiles[0]?.activeSignal,
              industry: user.profiles[0]?.industry,
              topics: user.profiles[0]?.topics || []
            },
            answers: app.answers
          };
        }).filter(Boolean) as any[];

        const rankings = await rankConnectionApplicants(
          recipientProfile.qualificationQuestions || [],
          applicantsData,
          {
            industry: recipientProfile.industry,
            topics: recipientProfile.topics,
            activeSignal: recipientProfile.activeSignal
          }
        );

        const ranked = applications.map(app => {
          const user = applicants.find(u => u.id === app.applicantId);
          const ranking = rankings.find(r => r.userId === app.applicantId);
          if (!user) return null;
          return {
            application: app,
            user,
            score: ranking?.score || 0,
            reason: ranking?.reason || 'Not ranked'
          };
        }).filter(Boolean) as RankedApplicant[];

        // Sort by score descending
        ranked.sort((a, b) => b.score - a.score);
        setRankedApplicants(ranked);
      } catch (error) {
        console.error('Failed to rank applicants:', error);
      } finally {
        setIsRanking(false);
      }
    };

    rankApplicants();
  }, [applications, applicants, recipientProfile]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'border-green-500 bg-green-50';
    if (score >= 60) return 'border-yellow-500 bg-yellow-50';
    if (score >= 40) return 'border-orange-500 bg-orange-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-yellow-700';
    if (score >= 40) return 'text-orange-700';
    return 'text-gray-600';
  };

  const toggleSelect = (applicationId: string) => {
    if (selectedApplicants.has(applicationId)) {
      setSelectedApplicants(prev => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    } else if (selectedApplicants.size < remainingCredits) {
      setSelectedApplicants(prev => new Set(prev).add(applicationId));
    }
  };

  const handleAcceptSelected = async () => {
    for (const appId of selectedApplicants) {
      const app = applications.find(a => a.id === appId);
      if (app) {
        await onAccept(app.id, app.applicantId);
      }
    }
    setSelectedApplicants(new Set());
  };

  if (isRanking) {
    return (
      <div className="brutal-card p-12 text-center bg-gray-50">
        <p className="text-sm font-bold text-gray-400 italic">AI is ranking applicants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black uppercase">
            Ranked Applicants ({rankedApplicants.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Select up to {remainingCredits} to connect with
          </p>
        </div>
        {selectedApplicants.size > 0 && (
          <button
            onClick={handleAcceptSelected}
            className="btn-brutal !bg-[#ff4d00] !text-white"
          >
            Accept Selected ({selectedApplicants.size})
          </button>
        )}
      </div>

      {rankedApplicants.length === 0 ? (
        <div className="brutal-card p-12 text-center bg-gray-50">
          <p className="text-sm font-bold text-gray-400 italic">No applicants yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankedApplicants.map(({ application, user, score, reason }) => {
            const isSelected = selectedApplicants.has(application.id);
            const canSelect = selectedApplicants.size < remainingCredits;
            const profile = user.profiles[0];

            return (
              <div
                key={application.id}
                className={`brutal-card p-6 border-2 ${getScoreColor(score)} ${isSelected ? 'ring-2 ring-[#ff4d00]' : ''} cursor-pointer transition-all`}
                onClick={() => toggleSelect(application.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-black text-sm bg-white rounded-full">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg uppercase">{user.name}</h4>
                        <p className="text-[9px] text-gray-500">
                          {profile?.activeSignal || profile?.industry || user.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Answers */}
                    {recipientProfile.qualificationQuestions && recipientProfile.qualificationQuestions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {recipientProfile.qualificationQuestions.map((question, idx) => (
                          <div key={idx} className="p-2 bg-white/50 border border-gray-200">
                            <p className="text-[8px] font-black uppercase text-gray-400 mb-1">{question}</p>
                            <p className="text-xs">{application.answers[idx] || 'No answer'}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Reason */}
                    {reason && (
                      <div className="mt-3 p-2 bg-white/70 border border-gray-200">
                        <p className="text-[8px] font-black uppercase text-gray-400 mb-1">AI Assessment</p>
                        <p className="text-[10px] italic">{reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className={`text-2xl font-black ${getScoreTextColor(score)}`}>
                      {score}
                    </div>
                    <div className="text-[8px] font-black uppercase text-gray-400">Score</div>
                    {isSelected && (
                      <div className="text-[#ff4d00] font-black text-xs">✓ Selected</div>
                    )}
                    {!isSelected && !canSelect && (
                      <div className="text-gray-400 text-[8px]">Limit reached</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAccept(application.id, application.applicantId);
                    }}
                    disabled={!canSelect && !isSelected}
                    className="btn-brutal !bg-black !text-white flex-1 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReject(application.id, application.applicantId);
                    }}
                    className="btn-brutal flex-1"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RankedApplicantsView;
