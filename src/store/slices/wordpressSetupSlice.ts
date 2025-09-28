import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export interface WordPressSetupProgressEvent {
  step: string;
  status: 'starting' | 'success' | 'error';
  message?: string;
}

export type SetupStepStatus = 'pending' | 'running' | 'success' | 'error';
export type IconKey = 'globe' | 'server' | 'database' | 'activity' | 'barchart2' | 'cpu' | 'gauge' | 'harddrive';

export interface SetupStep {
  id: string;
  label: string;
  icon: IconKey;
  status: SetupStepStatus;
  description: string;
  statusMessage?: string;
}

export interface WordPressSetupState {
  status: 'idle' | 'running' | 'success' | 'error';
  error: string | null;
  force: boolean;
  steps: SetupStep[];
  startedAt?: number;
  completedAt?: number;
}

const baseSteps: Omit<SetupStep, 'status' | 'statusMessage'>[] = [
  { id: 'network', label: 'Creating CF-WP network', icon: 'globe', description: 'The CF-WP network enables communication between infrastructure containers.' },
  { id: 'traefik', label: 'Deploying Traefik', icon: 'server', description: 'Traefik reverse proxy handles routing and TLS certificates.' },
  { id: 'mysql', label: 'Deploying MySQL', icon: 'database', description: 'MySQL stores WordPress data.' },
  { id: 'mysql-ready', label: 'Waiting for MySQL', icon: 'database', description: 'Ensuring MySQL is accepting connections.' },
  { id: 'mysql-metrics-user', label: 'Creating MySQL User Metrics for Monitoring', icon: 'database', description: 'A dedicated user for exporting MySQL metrics.' },
  { id: 'cadvisor', label: 'Deploying cAdvisor', icon: 'activity', description: 'cAdvisor collects container CPU, Memory, IO metrics.' },
  { id: 'mysqld-exporter', label: 'Deploying MySQL Exporter', icon: 'barchart2', description: 'Exports MySQL performance metrics for Prometheus.' },
  { id: 'node-exporter', label: 'Deploying Node Exporter', icon: 'cpu', description: 'Node Exporter provides hardware and OS metrics.' },
  { id: 'prometheus', label: 'Deploying Prometheus', icon: 'gauge', description: 'Prometheus stores and queries time-series metrics.' },
  { id: 'grafana', label: 'Deploying Grafana', icon: 'server', description: 'Grafana provides dashboards for visualization.' },
  { id: 'grafana-provision', label: 'Provisioning Grafana', icon: 'harddrive', description: 'Configuring Prometheus datasource and default dashboards.' }
];

const prepareSteps = () => baseSteps.map(s => ({ ...s, status: 'pending' as SetupStepStatus, statusMessage: undefined }));

const initialState: WordPressSetupState = {
  status: 'idle',
  error: null,
  force: false,
  steps: prepareSteps()
};

export const runWordPressSetup = createAsyncThunk<void, { force?: boolean } | void, { state: RootState }>(
  'wordpressSetup/run',
  async (arg, { dispatch, getState, rejectWithValue }) => {
    const force = !!(arg && typeof arg === 'object' && 'force' in arg && arg.force);
    const current = getState().wordpressSetup;
    if (current.status === 'running') return; // ignore concurrent starts
    dispatch(wordpressSetupSlice.actions.start({ force }));
    try {
      await window.electronAPI.docker.wordpress.setup(
        (event: WordPressSetupProgressEvent) => {
          dispatch(wordpressSetupSlice.actions.progress(event));
        },
        { force }
      );
      dispatch(wordpressSetupSlice.actions.complete());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      dispatch(wordpressSetupSlice.actions.failed(message));
      return rejectWithValue(message);
    }
  }
);

export const wordpressSetupSlice = createSlice({
  name: 'wordpressSetup',
  initialState,
  reducers: {
    start: (state, action: PayloadAction<{ force: boolean }>) => {
      state.status = 'running';
      state.error = null;
      state.force = action.payload.force;
      state.steps = prepareSteps();
      state.startedAt = Date.now();
      state.completedAt = undefined;
    },
    progress: (state, action: PayloadAction<WordPressSetupProgressEvent>) => {
      let step = state.steps.find(s => s.id === action.payload.step);
      if (!step) {
        step = {
          id: action.payload.step,
          label: action.payload.step.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          icon: 'server',
          description: 'Automatically added step.',
          status: 'pending'
        };
        state.steps.push(step);
      }
      switch (action.payload.status) {
        case 'starting': step.status = 'running'; break;
        case 'success': step.status = 'success'; break;
        case 'error': step.status = 'error'; break;
      }
      if (action.payload.message) step.statusMessage = action.payload.message;
    },
    complete: (state) => {
      state.status = 'success';
      state.completedAt = Date.now();
    },
    failed: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
      state.completedAt = Date.now();
    },
    reset: () => initialState
  }
});

export const { reset: resetWordPressSetup } = wordpressSetupSlice.actions;

// Selectors
export const selectWordPressSetup = (state: RootState) => state.wordpressSetup;
export const selectWordPressSetupStatus = (state: RootState) => state.wordpressSetup.status;
export const selectWordPressSetupSteps = (state: RootState) => state.wordpressSetup.steps;
export const selectWordPressSetupIsRunning = (state: RootState) => state.wordpressSetup.status === 'running';

export default wordpressSetupSlice.reducer;
