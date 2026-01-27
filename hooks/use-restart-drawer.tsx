import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Topic } from '@/lib/api/learn';

interface RestartDrawerContextType {
  isOpen: boolean;
  selectedTopic: Topic | null;
  openDrawer: (topic: Topic) => void;
  closeDrawer: () => void;
}

const RestartDrawerContext = createContext<RestartDrawerContextType | undefined>(undefined);

export function RestartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const openDrawer = useCallback((topic: Topic) => {
    setSelectedTopic(topic);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    setSelectedTopic(null);
  }, []);

  return (
    <RestartDrawerContext.Provider
      value={{
        isOpen,
        selectedTopic,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </RestartDrawerContext.Provider>
  );
}

export function useRestartDrawer() {
  const context = useContext(RestartDrawerContext);
  if (!context) {
    throw new Error('useRestartDrawer must be used within RestartDrawerProvider');
  }
  return context;
}
