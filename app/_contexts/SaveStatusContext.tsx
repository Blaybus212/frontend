'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusContextValue {
  status: SaveStatus;
  lastSavedTime: number; // 마지막 저장 시간 (timestamp)
  elapsedSeconds: number; // 경과 시간 (초)
  setStatus: (status: SaveStatus) => void;
  setLastSavedTime: (time: number) => void;
  setElapsedSeconds: (seconds: number) => void;
  triggerSave?: () => Promise<void>; // 수동 저장 함수
  setTriggerSave: (fn: () => Promise<void>) => void;
  isAutoSaveVisible: boolean;
  setIsAutoSaveVisible: (visible: boolean) => void;
}

const SaveStatusContext = createContext<SaveStatusContextValue | null>(null);

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [triggerSave, setTriggerSaveInternal] = useState<(() => Promise<void>) | undefined>();
  const [isAutoSaveVisible, setIsAutoSaveVisible] = useState(true);

  const setTriggerSave = useCallback((fn: () => Promise<void>) => {
    setTriggerSaveInternal(() => fn);
  }, []);

  return (
    <SaveStatusContext.Provider
      value={{
        status,
        lastSavedTime,
        elapsedSeconds,
        setStatus,
        setLastSavedTime,
        setElapsedSeconds,
        triggerSave,
        setTriggerSave,
        isAutoSaveVisible,
        setIsAutoSaveVisible,
      }}
    >
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  const context = useContext(SaveStatusContext);
  if (!context) {
    throw new Error('useSaveStatus must be used within SaveStatusProvider');
  }
  return context;
}
