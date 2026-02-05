import { ONBOARDING_STORAGE_KEY } from '@/constants/onboarding';
import { storage } from '@/lib/storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface OnboardingContextType {
  showOnboarding: boolean | null;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  // Start as null = not yet checked; avoid flash of chat before onboarding
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const completed = await storage.getItem(ONBOARDING_STORAGE_KEY);
        if (!cancelled) {
          setShowOnboarding(completed !== 'true');
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
        if (!cancelled) setShowOnboarding(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    await storage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setShowOnboarding(false);
  }, []);

  const restartOnboarding = useCallback(async () => {
    await storage.setItem(ONBOARDING_STORAGE_KEY, 'false');
    setShowOnboarding(true);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        setShowOnboarding,
        completeOnboarding,
        restartOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
