import type { Feeling } from '@/lib/api/chat';
import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';

export interface BodymapPointForDrawer {
  id: number;
  x: number;
  y: number;
  feelings: string[];
}

export interface FeelingsDrawerPayload {
  feelings: Feeling[];
  activePoint: BodymapPointForDrawer;
  onFeelingPress: (feelingName: string) => void;
  /** Called with the point id to remove. Use payload.activePoint.id when invoking from the drawer. */
  removePoint: (pointId: number) => void;
  onClose?: () => void;
  feelingsLoading: boolean;
}

interface FeelingsDrawerContextType {
  isOpen: boolean;
  payload: FeelingsDrawerPayload | null;
  openDrawer: (p: FeelingsDrawerPayload) => void;
  closeDrawer: () => void;
}

const FeelingsDrawerContext = createContext<FeelingsDrawerContextType | undefined>(undefined);

export function FeelingsDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState<FeelingsDrawerPayload | null>(null);

  const openDrawer = useCallback((p: FeelingsDrawerPayload) => {
    setPayload(p);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    setPayload(null);
  }, []);

  return (
    <FeelingsDrawerContext.Provider
      value={{
        isOpen,
        payload,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </FeelingsDrawerContext.Provider>
  );
}

export function useFeelingsDrawer() {
  const context = useContext(FeelingsDrawerContext);
  if (!context) {
    throw new Error('useFeelingsDrawer must be used within FeelingsDrawerProvider');
  }
  return context;
}
