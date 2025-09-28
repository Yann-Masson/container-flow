import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ContainerInfo, ContainerCreateOptions } from 'dockerode';
import { State } from '@/utils/state/basic-state';
import { dockerClientService } from '@/docker/docker-client';

// Local state shape for generic containers (non-WordPress specific)
interface GenericContainerState {
  containers: ContainerInfo[];
  status: State;
  error: string | null;
  operationStatus: {
    retrievingAll: boolean;
    starting: Record<string, boolean>;
    stopping: Record<string, boolean>;
    removing: Record<string, boolean>;
    creating: boolean;
    duplicating: Record<string, boolean>; // previous container id -> loading
  };
}

const initialState: GenericContainerState = {
  containers: [],
  status: State.IDLE,
  error: null,
  operationStatus: {
    retrievingAll: false,
    starting: {},
    stopping: {},
    removing: {},
    creating: false,
    duplicating: {},
  }
};

// Thunks
export const listContainers = createAsyncThunk(
  'genericContainers/list',
  async (_, { rejectWithValue }) => {
    try {
      const containers = await dockerClientService.containers.list();
      return containers;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to list containers';
      return rejectWithValue(msg);
    }
  }
);

export const startGenericContainer = createAsyncThunk(
  'genericContainers/start',
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      await dockerClientService.containers.start(id);
      // We only need minimal optimistic data; caller already has previous info
      return { id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start container';
      return rejectWithValue(msg);
    }
  }
);

export const stopGenericContainer = createAsyncThunk(
  'genericContainers/stop',
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      await dockerClientService.containers.stop(id, { t: 10 });
      return { id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to stop container';
      return rejectWithValue(msg);
    }
  }
);

export const removeGenericContainer = createAsyncThunk(
  'genericContainers/remove',
  async ({ id }: { id: string }, { rejectWithValue }) => {
    try {
      await dockerClientService.containers.remove(id, { force: true });
      return { id };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to remove container';
      return rejectWithValue(msg);
    }
  }
);

export const duplicateGenericContainer = createAsyncThunk(
  'genericContainers/duplicate',
  async (
    { previousId, config, removePrevious }: { previousId: string; config: ContainerCreateOptions; removePrevious: boolean },
    { rejectWithValue }
  ) => {
    try {
      if (removePrevious) {
        // stop + remove previous (ignore errors for stop)
        try { await dockerClientService.containers.stop(previousId); } catch {}
        await dockerClientService.containers.remove(previousId, { force: true });
      }
      const newContainer = await dockerClientService.containers.create(config);
      // auto start if previous was running (we must check previous state client side)
      // Consumer should decide if need to start; we keep lean here.
      return { previousId, newContainer };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to duplicate container';
      return rejectWithValue(msg);
    }
  }
);

const containerSlice = createSlice({
  name: 'genericContainers',
  initialState,
  reducers: {
    clearGenericError: (state) => { state.error = null; },
  },
  extraReducers: builder => {
    builder
      // list
      .addCase(listContainers.pending, state => {
        state.operationStatus.retrievingAll = true;
        state.status = State.LOADING;
        state.error = null;
      })
      .addCase(listContainers.fulfilled, (state, action) => {
        state.operationStatus.retrievingAll = false;
        state.status = State.SUCCESS;
        state.containers = action.payload;
      })
      .addCase(listContainers.rejected, (state, action) => {
        state.operationStatus.retrievingAll = false;
        state.status = State.ERROR;
        state.error = action.payload as string;
      })
      // start
      .addCase(startGenericContainer.pending, (state, action) => {
        state.operationStatus.starting[action.meta.arg.id] = true;
      })
      .addCase(startGenericContainer.fulfilled, (state, action) => {
        delete state.operationStatus.starting[action.payload.id];
        // optimistic update to Status string
        state.containers = state.containers.map(c => c.Id === action.payload.id ? { ...c, State: 'running', Status: 'Up' } as any : c);
      })
      .addCase(startGenericContainer.rejected, (state, action) => {
        delete state.operationStatus.starting[(action.meta.arg as any).id];
        state.error = action.payload as string;
      })
      // stop
      .addCase(stopGenericContainer.pending, (state, action) => {
        state.operationStatus.stopping[action.meta.arg.id] = true;
      })
      .addCase(stopGenericContainer.fulfilled, (state, action) => {
        delete state.operationStatus.stopping[action.payload.id];
        state.containers = state.containers.map(c => c.Id === action.payload.id ? { ...c, State: 'exited', Status: 'Exited' } as any : c);
      })
      .addCase(stopGenericContainer.rejected, (state, action) => {
        delete state.operationStatus.stopping[(action.meta.arg as any).id];
        state.error = action.payload as string;
      })
      // remove
      .addCase(removeGenericContainer.pending, (state, action) => {
        state.operationStatus.removing[action.meta.arg.id] = true;
      })
      .addCase(removeGenericContainer.fulfilled, (state, action) => {
        delete state.operationStatus.removing[action.payload.id];
        state.containers = state.containers.filter(c => c.Id !== action.payload.id);
      })
      .addCase(removeGenericContainer.rejected, (state, action) => {
        delete state.operationStatus.removing[(action.meta.arg as any).id];
        state.error = action.payload as string;
      })
      // duplicate
      .addCase(duplicateGenericContainer.pending, (state, action) => {
        state.operationStatus.duplicating[action.meta.arg.previousId] = true;
      })
      .addCase(duplicateGenericContainer.fulfilled, (state, action) => {
        delete state.operationStatus.duplicating[action.payload.previousId];
        state.containers = state.containers.map(c => c.Id === action.payload.previousId ? action.payload.newContainer : c);
      })
      .addCase(duplicateGenericContainer.rejected, (state, action) => {
        delete state.operationStatus.duplicating[(action.meta.arg as any).previousId];
        state.error = action.payload as string;
      });
  }
});

export const { clearGenericError } = containerSlice.actions;
export default containerSlice.reducer;
