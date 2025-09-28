import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AppPreference } from '../../../electron/services/storage/app/app.type';
import { AppLifecycleState, AppStateContext, initialAppState, reduceAppState } from './app-state';
import { dockerClientService } from '@/docker/docker-client';
import { useAppDispatch } from '@/store/hooks';
import { resetWordPressSetup } from '@/store/slices/wordpressSetupSlice';

interface ControllerApi extends AppStateContext {
  connect: () => Promise<void>;
  disconnect: () => void;
  setMode: (pref: AppPreference) => Promise<void>;
  refresh: () => Promise<void>;
}

// Helper to safely call electron storage
async function getStoredPreference(): Promise<AppPreference | null> {
  try {
    const stored = await window.electronAPI.storage.app.get();
    if (!stored) return null;
    return stored.preference as AppPreference;
  } catch {
    return null;
  }
}

async function persistPreference(pref: AppPreference): Promise<void> {
  try {
    await window.electronAPI.storage.app.save({ preference: pref });
  } catch {
    // swallow
  }
}

export function useAppController(): ControllerApi {
  const appDispatch = useAppDispatch();
  const [state, dispatch] = useReducer(reduceAppState, initialAppState);
  const lastVisibleLifecycle = useRef<AppLifecycleState>(AppLifecycleState.INIT);

  // Maintain last non-transient screen to avoid flashes during very quick transitions
  if (![AppLifecycleState.CONNECTING].includes(state.lifecycle)) {
    lastVisibleLifecycle.current = state.lifecycle;
  }

  const initApp = useCallback(async () => {
    try {
      const [connected, preference] = await Promise.all([
        dockerClientService.connection.isConnected(),
        getStoredPreference()
      ]);
      dispatch({ type: 'INIT_SUCCESS', connected, preference });
    } catch (e) {
      dispatch({ type: 'INIT_ERROR', error: e instanceof Error ? e.message : 'Init failed' });
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const connect = useCallback(async () => {
    dispatch({ type: 'CONNECT_REQUEST' });
    try {
      const ok = await dockerClientService.connection.isConnected(); // replace with actual connect if needed
      const preference = await getStoredPreference();
      if (!ok) {
        dispatch({ type: 'CONNECT_FAILURE', error: 'Docker not reachable' });
      } else {
        dispatch({ type: 'CONNECT_SUCCESS', preference });
      }
    } catch (e) {
      dispatch({ type: 'CONNECT_FAILURE', error: e instanceof Error ? e.message : 'Connection failed' });
    }
  }, []);

  const disconnect = useCallback(() => {
    dispatch({ type: 'DISCONNECT' });
    appDispatch(resetWordPressSetup());
  }, []);

  const setMode = useCallback(async (pref: AppPreference) => {
    await persistPreference(pref);
    dispatch({ type: 'MODE_SET', preference: pref });
    appDispatch(resetWordPressSetup());
  }, []);

  const refresh = useCallback(async () => {
    await initApp();
  }, [initApp]);

  return {
    ...state,
    lifecycle: state.lifecycle === AppLifecycleState.CONNECTING ? lastVisibleLifecycle.current : state.lifecycle,
    connect,
    disconnect,
    setMode,
    refresh
  };
}
