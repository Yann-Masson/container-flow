import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ContainerInspectInfo } from 'dockerode';
import { State } from '@/types/state';
import { 
    ContainerState, 
    WordPressService, 
    CreateWordPressServicePayload, 
    ContainerActionPayload,
    CloneContainerPayload 
} from '../types/container';

// Initial state
const initialState: ContainerState = {
    containers: [],
    services: [],
    status: State.IDLE,
    error: null,
    operationStatus: {
        creating: false,
        cloning: false,
        starting: {},
        stopping: {},
        removing: {},
    },
};

// Async thunks for container operations
export const fetchContainers = createAsyncThunk(
    'containers/fetchContainers',
    async (_, { rejectWithValue }) => {
        try {
            const allContainers = await window.electronAPI.docker.containers.list();
            const wpContainers = allContainers.filter(c => c.Labels?.['container-flow.type'] === 'wordpress');
            
            const inspectedContainers: ContainerInspectInfo[] = [];
            for (const container of wpContainers) {
                const inspectInfo = await window.electronAPI.docker.containers.get(container.Id);
                // Remove the leading slash from the name
                inspectInfo.Name = inspectInfo.Name.replace(/^\/+/, '');
                inspectedContainers.push(inspectInfo);
            }
            
            return inspectedContainers;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch containers';
            return rejectWithValue(message);
        }
    }
);

export const createWordPressService = createAsyncThunk(
    'containers/createWordPressService',
    async (payload: CreateWordPressServicePayload, { rejectWithValue }) => {
        try {
            await window.electronAPI.docker.wordpress.create(payload);
            return payload;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create WordPress service';
            return rejectWithValue(message);
        }
    }
);

export const cloneContainer = createAsyncThunk(
    'containers/cloneContainer',
    async (payload: CloneContainerPayload, { rejectWithValue }) => {
        try {
            await window.electronAPI.docker.wordpress.clone(payload.sourceContainer);
            return payload;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to clone container';
            return rejectWithValue(message);
        }
    }
);

export const startContainer = createAsyncThunk(
    'containers/startContainer',
    async (payload: ContainerActionPayload, { rejectWithValue }) => {
        try {
            await window.electronAPI.docker.containers.start(payload.containerId);
            return payload;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to start container';
            return rejectWithValue(message);
        }
    }
);

export const stopContainer = createAsyncThunk(
    'containers/stopContainer',
    async (payload: ContainerActionPayload, { rejectWithValue }) => {
        try {
            await window.electronAPI.docker.containers.stop(payload.containerId);
            return payload;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to stop container';
            return rejectWithValue(message);
        }
    }
);

export const removeContainer = createAsyncThunk(
    'containers/removeContainer',
    async (payload: ContainerActionPayload, { rejectWithValue }) => {
        try {
            // Stop container first if running
            const container = await window.electronAPI.docker.containers.get(payload.containerId);
            if (container.State.Status === 'running') {
                await window.electronAPI.docker.containers.stop(payload.containerId);
            }
            await window.electronAPI.docker.containers.remove(payload.containerId, { force: true });
            return payload;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove container';
            return rejectWithValue(message);
        }
    }
);

// Helper function to group containers into services
const groupContainersIntoServices = (containers: ContainerInspectInfo[]): WordPressService[] => {
    const serviceMap = new Map<string, ContainerInspectInfo[]>();

    containers.forEach(container => {
        const serviceName = container.Config.Labels?.['container-flow.name'];
        if (!serviceName) return;

        if (!serviceMap.has(serviceName)) {
            serviceMap.set(serviceName, []);
        }
        serviceMap.get(serviceName)!.push(container);
    });

    const groupedServices: WordPressService[] = [];

    serviceMap.forEach((containers, serviceName) => {
        const firstContainer = containers[0];
        const env = firstContainer.Config.Env || [];
        const labels = firstContainer.Config.Labels || {};

        const dbName = env.find(env => env.startsWith('WORDPRESS_DB_NAME='))?.replace('WORDPRESS_DB_NAME=', '') || 'N/A';
        const dbUser = env.find(env => env.startsWith('WORDPRESS_DB_USER='))?.replace('WORDPRESS_DB_USER=', '') || 'N/A';

        // Extract URL from traefik labels
        const traefikRule = Object.keys(labels).find(key => key.includes('.rule') && labels[key].includes('Host('));
        const url = traefikRule
            ? labels[traefikRule].replace('Host("', '').replace('")', '')
            : 'N/A';

        groupedServices.push({
            name: serviceName,
            containers: containers.sort((a, b) => {
                const aMatch = a.Name.match(/-(\d+)$/);
                const bMatch = b.Name.match(/-(\d+)$/);
                const aNum = aMatch ? parseInt(aMatch[1]) : 1;
                const bNum = bMatch ? parseInt(bMatch[1]) : 1;
                return aNum - bNum;
            }),
            dbName,
            dbUser,
            url
        });
    });

    return groupedServices;
};

// Container slice
const containerSlice = createSlice({
    name: 'containers',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetOperationStatus: (state) => {
            state.operationStatus = {
                creating: false,
                cloning: false,
                starting: {},
                stopping: {},
                removing: {},
            };
        },
    },
    extraReducers: (builder) => {
        // Fetch containers
        builder
            .addCase(fetchContainers.pending, (state) => {
                state.status = State.LOADING;
                state.error = null;
            })
            .addCase(fetchContainers.fulfilled, (state, action) => {
                state.status = State.SUCCESS;
                state.containers = action.payload;
                state.services = groupContainersIntoServices(action.payload);
                state.error = null;
            })
            .addCase(fetchContainers.rejected, (state, action) => {
                state.status = State.ERROR;
                state.error = action.payload as string;
            });

        // Create WordPress service
        builder
            .addCase(createWordPressService.pending, (state) => {
                state.operationStatus.creating = true;
                state.error = null;
            })
            .addCase(createWordPressService.fulfilled, (state) => {
                state.operationStatus.creating = false;
                state.error = null;
            })
            .addCase(createWordPressService.rejected, (state, action) => {
                state.operationStatus.creating = false;
                state.error = action.payload as string;
            });

        // Clone container
        builder
            .addCase(cloneContainer.pending, (state) => {
                state.operationStatus.cloning = true;
                state.error = null;
            })
            .addCase(cloneContainer.fulfilled, (state) => {
                state.operationStatus.cloning = false;
                state.error = null;
            })
            .addCase(cloneContainer.rejected, (state, action) => {
                state.operationStatus.cloning = false;
                state.error = action.payload as string;
            });

        // Start container
        builder
            .addCase(startContainer.pending, (state, action) => {
                state.operationStatus.starting[action.meta.arg.containerId] = true;
                state.error = null;
            })
            .addCase(startContainer.fulfilled, (state, action) => {
                delete state.operationStatus.starting[action.payload.containerId];
                state.error = null;
            })
            .addCase(startContainer.rejected, (state, action) => {
                delete state.operationStatus.starting[action.meta.arg.containerId];
                state.error = action.payload as string;
            });

        // Stop container
        builder
            .addCase(stopContainer.pending, (state, action) => {
                state.operationStatus.stopping[action.meta.arg.containerId] = true;
                state.error = null;
            })
            .addCase(stopContainer.fulfilled, (state, action) => {
                delete state.operationStatus.stopping[action.payload.containerId];
                state.error = null;
            })
            .addCase(stopContainer.rejected, (state, action) => {
                delete state.operationStatus.stopping[action.meta.arg.containerId];
                state.error = action.payload as string;
            });

        // Remove container
        builder
            .addCase(removeContainer.pending, (state, action) => {
                state.operationStatus.removing[action.meta.arg.containerId] = true;
                state.error = null;
            })
            .addCase(removeContainer.fulfilled, (state, action) => {
                delete state.operationStatus.removing[action.payload.containerId];
                state.error = null;
            })
            .addCase(removeContainer.rejected, (state, action) => {
                delete state.operationStatus.removing[action.meta.arg.containerId];
                state.error = action.payload as string;
            });
    },
});

export const { clearError, resetOperationStatus } = containerSlice.actions;
export default containerSlice.reducer;
