import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Plan } from '../types';

export type OnboardingStep = 'welcome' | 'profile' | 'organization' | 'plan' | 'first-project' | 'complete';

interface OnboardingState {
  currentStep: OnboardingStep;
  user: Partial<User> | null;
  organizationName: string;
  selectedPlan: Plan | null;
  isLoading: boolean;
}

interface OnboardingContextType extends OnboardingState {
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setUser: (user: Partial<User>) => void;
  setOrganizationName: (name: string) => void;
  setSelectedPlan: (plan: Plan | null) => void;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STEPS: OnboardingStep[] = ['welcome', 'profile', 'organization', 'plan', 'first-project', 'complete'];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'welcome',
    user: null,
    organizationName: '',
    selectedPlan: null,
    isLoading: false,
  });

  useEffect(() => {
    // Load saved onboarding state from localStorage
    const saved = localStorage.getItem('vulx-onboarding');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      } catch {
        // Invalid saved state, start fresh
      }
    }
  }, []);

  useEffect(() => {
    // Save onboarding state to localStorage
    localStorage.setItem('vulx-onboarding', JSON.stringify({
      currentStep: state.currentStep,
      user: state.user,
      organizationName: state.organizationName,
    }));
  }, [state.currentStep, state.user, state.organizationName]);

  const setStep = (step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const nextStep = () => {
    const currentIndex = STEPS.indexOf(state.currentStep);
    if (currentIndex < STEPS.length - 1) {
      setState(prev => ({ ...prev, currentStep: STEPS[currentIndex + 1] }));
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.indexOf(state.currentStep);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, currentStep: STEPS[currentIndex - 1] }));
    }
  };

  const setUser = (user: Partial<User>) => {
    setState(prev => ({ ...prev, user: { ...prev.user, ...user } }));
  };

  const setOrganizationName = (name: string) => {
    setState(prev => ({ ...prev, organizationName: name }));
  };

  const setSelectedPlan = (plan: Plan | null) => {
    setState(prev => ({ ...prev, selectedPlan: plan }));
  };

  const completeOnboarding = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // Mark onboarding as complete
      localStorage.setItem('vulx-onboarding-complete', 'true');
      localStorage.removeItem('vulx-onboarding');
      setState(prev => ({ ...prev, currentStep: 'complete', isLoading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        setStep,
        nextStep,
        prevStep,
        setUser,
        setOrganizationName,
        setSelectedPlan,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
