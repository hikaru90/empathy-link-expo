import React, { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export interface BottomDrawerSlotConfig {
  title?: string;
  headerRight?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  tall?: boolean;
  initialHeight?: number;
}

interface BottomDrawerSlotContextValue {
  openDrawer: (config: BottomDrawerSlotConfig) => void;
  closeDrawer: () => void;
  slot: BottomDrawerSlotConfig | null;
  visible: boolean;
}

const BottomDrawerSlotContext = createContext<BottomDrawerSlotContextValue | undefined>(undefined);

export function BottomDrawerSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<BottomDrawerSlotConfig | null>(null);
  const slotRef = useRef<BottomDrawerSlotConfig | null>(null);
  slotRef.current = slot;

  const closeDrawer = useCallback(() => {
    const onCloseCallback = slotRef.current?.onClose;
    setSlot(null);
    slotRef.current = null;
    onCloseCallback?.();
  }, []);

  const openDrawer = useCallback((config: BottomDrawerSlotConfig) => {
    setSlot(config);
  }, []);

  const visible = slot != null;

  return (
    <BottomDrawerSlotContext.Provider
      value={{
        openDrawer,
        closeDrawer,
        slot,
        visible,
      }}
    >
      {children}
    </BottomDrawerSlotContext.Provider>
  );
}

export function useBottomDrawerSlot() {
  const ctx = useContext(BottomDrawerSlotContext);
  if (!ctx) throw new Error('useBottomDrawerSlot must be used within BottomDrawerSlotProvider');
  return ctx;
}
