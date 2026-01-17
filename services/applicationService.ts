import { ConnectionApplication } from '../types';

const APPLICATIONS_KEY = 'tapped_connection_applications';

// Get week identifier (resets weekly)
const getWeekId = (): string => {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  return `${startOfWeek.getFullYear()}-W${Math.floor(startOfWeek.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
};

export const applicationService = {
  // Get applications for a recipient profile
  getApplicationsForProfile: (recipientId: string, profileId: string): ConnectionApplication[] => {
    try {
      const stored = localStorage.getItem(APPLICATIONS_KEY);
      if (!stored) return [];
      const all = JSON.parse(stored);
      return all.filter((app: any) => 
        app.recipientId === recipientId && 
        app.profileId === profileId && 
        app.status === 'PENDING'
      ).map((app: any) => ({
        ...app,
        createdAt: new Date(app.createdAt)
      }));
    } catch {
      return [];
    }
  },

  // Create a new application
  createApplication: (application: ConnectionApplication): void => {
    try {
      const stored = localStorage.getItem(APPLICATIONS_KEY);
      const all: ConnectionApplication[] = stored ? JSON.parse(stored) : [];
      all.push(application);
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(all));
    } catch (error) {
      console.error('Failed to save application:', error);
    }
  },

  // Update application status
  updateApplication: (applicationId: string, updates: Partial<ConnectionApplication>): void => {
    try {
      const stored = localStorage.getItem(APPLICATIONS_KEY);
      if (!stored) return;
      const all: ConnectionApplication[] = JSON.parse(stored);
      const updated = all.map(app => 
        app.id === applicationId ? { ...app, ...updates } : app
      );
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  },

  // Get weekly credits used
  getWeeklyCreditsUsed: (userId: string): number => {
    try {
      const weekId = getWeekId();
      const key = `weekly_credits_${userId}_${weekId}`;
      const stored = localStorage.getItem(key);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  },

  // Increment weekly credits used
  useCredit: (userId: string): void => {
    try {
      const weekId = getWeekId();
      const key = `weekly_credits_${userId}_${weekId}`;
      const current = applicationService.getWeeklyCreditsUsed(userId);
      localStorage.setItem(key, String(current + 1));
    } catch (error) {
      console.error('Failed to track credit usage:', error);
    }
  },

  // Get remaining credits for a profile
  getRemainingCredits: (userId: string, profile: { weeklyCredits?: number; connectionLimit?: number }): number => {
    const limit = profile.weeklyCredits || profile.connectionLimit || 0;
    if (limit === 0) return 999; // No limit
    const used = applicationService.getWeeklyCreditsUsed(userId);
    return Math.max(0, limit - used);
  }
};
