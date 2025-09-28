import { AppPreference } from '../../../electron/services/storage/app/app.type';

// High-level lifecycle states for the shell (finite but simple machine)
export enum AppLifecycleState {
  INIT = 'init',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  UNCONFIGURED = 'unconfigured',
  READY = 'ready',
  ERROR = 'error'
}

export interface AppStateContext {
  lifecycle: AppLifecycleState;
  preference: AppPreference | null;
  lastError: string | null;
  // meta flags
  isHydrating: boolean; // true only during initial hydration until first resolved lifecycle
}

export const initialAppState: AppStateContext = {
  lifecycle: AppLifecycleState.INIT,
  preference: null,
  lastError: null,
  isHydrating: true
};

// Events that can drive lifecycle transitions
export type AppEvent =
  | { type: 'INIT_SUCCESS'; connected: boolean; preference: AppPreference | null }
  | { type: 'INIT_ERROR'; error: string }
  | { type: 'CONNECT_REQUEST' }
  | { type: 'CONNECT_SUCCESS'; preference: AppPreference | null }
  | { type: 'CONNECT_FAILURE'; error: string }
  | { type: 'MODE_SET'; preference: AppPreference }
  | { type: 'DISCONNECT' };

export function reduceAppState(state: AppStateContext, event: AppEvent): AppStateContext {
  switch (event.type) {
  case 'INIT_SUCCESS': {
      const lifecycle = !event.connected
        ? AppLifecycleState.DISCONNECTED
        : event.preference === AppPreference.NONE
          ? AppLifecycleState.UNCONFIGURED
          : AppLifecycleState.READY;
      return { ...state, lifecycle, preference: event.preference, isHydrating: false, lastError: null };
    }
  case 'INIT_ERROR':
      return { ...state, lifecycle: AppLifecycleState.ERROR, lastError: event.error, isHydrating: false };
    case 'CONNECT_REQUEST':
      return { ...state, lifecycle: AppLifecycleState.CONNECTING, lastError: null };
    case 'CONNECT_SUCCESS': {
      const lifecycle = event.preference === AppPreference.NONE
        ? AppLifecycleState.UNCONFIGURED
        : AppLifecycleState.READY;
      return { ...state, lifecycle, preference: event.preference, lastError: null };
    }
    case 'CONNECT_FAILURE':
      return { ...state, lifecycle: AppLifecycleState.DISCONNECTED, lastError: event.error };
    case 'MODE_SET':
      return { ...state, lifecycle: AppLifecycleState.READY, preference: event.preference };
    case 'DISCONNECT':
      return { ...state, lifecycle: AppLifecycleState.DISCONNECTED };
    default:
      return state;
  }
}
