const ONBOARDING_COMPLETE_KEY = 'tapped_onboarding_complete';
const WALKTHROUGH_COMPLETE_KEY = 'tapped_walkthrough_complete';

export const onboardingService = {
  isOnboardingComplete: (): boolean => {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
  },

  setOnboardingComplete: (): void => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  },

  isWalkthroughComplete: (): boolean => {
    return localStorage.getItem(WALKTHROUGH_COMPLETE_KEY) === 'true';
  },

  setWalkthroughComplete: (): void => {
    localStorage.setItem(WALKTHROUGH_COMPLETE_KEY, 'true');
  },

  reset: (): void => {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    localStorage.removeItem(WALKTHROUGH_COMPLETE_KEY);
  }
};
