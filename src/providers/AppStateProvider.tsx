import React, { createContext, useContext } from 'react';
import { useAppController } from '../utils/state/useAppController';
import { AppLifecycleState } from '../utils/state/app-state';
import { AppPreference } from '../../electron/services/storage/app/app.type';

interface AppStateValue {
  lifecycle: AppLifecycleState;
  preference: AppPreference | null;
  lastError: string | null;
  isHydrating: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  setMode: (pref: AppPreference) => Promise<void>;
  refresh: () => Promise<void>;
}

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export const AppStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const controller = useAppController();
  return (
    <AppStateContext.Provider value={controller}>
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
