import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ContainerInspectInfo } from 'dockerode';
import { State } from '@/utils/state/basic-state';
import { 
    ContainerState, 
    WordPressProject, 
    CreateWordPressServicePayload as CreateWordPressProjectPayload, 
    ContainerActionPayload,
    CloneContainerPayload 
} from '../types/container';

// Initial state
const initialState: ContainerState = {
    containers: [],
    projects: [],
    status: State.IDLE,
    error: null,
    operationStatus: {
        retrievingAll: true,
        creating: false,
        cloning: {},
        starting: {},
        stopping: {},
        removing: {},
        deleting: {}, // per project name
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

export const createWordPressProject = createAsyncThunk(
    'containers/createWordPressProject',
    async (payload: CreateWordPressProjectPayload, { rejectWithValue }) => {
        try {
            const createdContainer = await window.electronAPI.docker.wordpress.create(payload);
            // Fetch the full container details
            const inspectInfo = await window.electronAPI.docker.containers.get(createdContainer.id);
            inspectInfo.Name = inspectInfo.Name.replace(/^\/+/, '');
            return { payload, container: inspectInfo };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create WordPress project';
            return rejectWithValue(message);
        }
    }
);

export const cloneContainer = createAsyncThunk(
    'containers/cloneContainer',
    async (payload: CloneContainerPayload, { rejectWithValue }) => {
        try {
            const newContainer = await window.electronAPI.docker.wordpress.clone(payload.sourceContainer);
            newContainer.Name = newContainer.Name.replace(/^\/+/, '');
            return { ...payload, newContainer };
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
            // Re-inspect container after start
            const inspectInfo = await window.electronAPI.docker.containers.get(payload.containerId);
            inspectInfo.Name = inspectInfo.Name.replace(/^\/+/, '');
            return { ...payload, inspectInfo };
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
            const inspectInfo = await window.electronAPI.docker.containers.get(payload.containerId);
            inspectInfo.Name = inspectInfo.Name.replace(/^\/+/, '');
            return { ...payload, inspectInfo };
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
            const container = await window.electronAPI.docker.containers.get(payload.containerId);
            if (container.State.Status === 'running') {
                await window.electronAPI.docker.containers.stop(payload.containerId);
            }
            await window.electronAPI.docker.containers.remove(payload.containerId, { force: true });
            return payload; // containerId is enough to prune from state
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove container';
            return rejectWithValue(message);
        }
    }
);

export const deleteWordPressProject = createAsyncThunk(
    'containers/deleteWordPressProject',
    async (serviceName: string, { rejectWithValue }) => {
        try {
            await window.electronAPI.docker.wordpress.delete({ name: serviceName });
            return { serviceName };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete WordPress project';
            return rejectWithValue(message);
        }
    }
);

// Helper function to group containers into services
const groupContainersIntoServices = (containers: ContainerInspectInfo[]): WordPressProject[] => {
    const serviceMap = new Map<string, ContainerInspectInfo[]>();

    containers.forEach(container => {
        const serviceName = container.Config.Labels?.['container-flow.name'];
        if (!serviceName) return;

        if (!serviceMap.has(serviceName)) {
            serviceMap.set(serviceName, []);
        }
        serviceMap.get(serviceName)!.push(container);
    });

    const groupedServices: WordPressProject[] = [];

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

    // Sort projects alphabetically by name
    return groupedServices.sort((a, b) => a.name.localeCompare(b.name));
};

// Utility to recompute a single WordPress project from its containers
const buildProjectFromContainers = (serviceName: string, containers: ContainerInspectInfo[]): WordPressProject | null => {
    if (!containers.length) return null;
    const firstContainer = containers[0];
    const env = firstContainer.Config.Env || [];
    const labels = firstContainer.Config.Labels || {};

    const dbName = env.find(env => env.startsWith('WORDPRESS_DB_NAME='))?.replace('WORDPRESS_DB_NAME=', '') || 'N/A';
    const dbUser = env.find(env => env.startsWith('WORDPRESS_DB_USER='))?.replace('WORDPRESS_DB_USER=', '') || 'N/A';
    const traefikRule = Object.keys(labels).find(key => key.includes('.rule') && labels[key].includes('Host('));
    const url = traefikRule
        ? labels[traefikRule].replace('Host("', '').replace('")', '')
        : 'N/A';

    return {
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
    };
};

// Helper function to sort projects alphabetically
const sortProjectsAlphabetically = (projects: WordPressProject[]): WordPressProject[] => {
    return [...projects].sort((a, b) => a.name.localeCompare(b.name));
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
                retrievingAll: true,
                creating: false,
                cloning: {},
                starting: {},
                stopping: {},
                removing: {},
                deleting: {}, // per project name
            };
        },
        // Optional reducer to force recompute all projects from current containers
        recomputeProjects: (state) => {
            state.projects = groupContainersIntoServices(state.containers);
        }
    },
    extraReducers: (builder) => {
        // Fetch containers
        builder
            .addCase(fetchContainers.pending, (state) => {
                state.status = State.LOADING;
                state.error = null;
                state.operationStatus.retrievingAll = true;
            })
            .addCase(fetchContainers.fulfilled, (state, action) => {
                state.status = State.SUCCESS;
                state.containers = action.payload;
                state.projects = groupContainersIntoServices(action.payload);
                state.error = null;
                state.operationStatus.retrievingAll = false;
            })
            .addCase(fetchContainers.rejected, (state, action) => {
                state.status = State.ERROR;
                state.error = action.payload as string;
                state.operationStatus.retrievingAll = false;
            });

        // Create WordPress service
        builder
            .addCase(createWordPressProject.pending, (state) => {
                state.operationStatus.creating = true;
                state.error = null;
            })
            .addCase(createWordPressProject.fulfilled, (state, action) => {
                state.operationStatus.creating = false;
                state.error = null;
                
                // Add the new container to the containers array
                const newContainer = action.payload.container;
                state.containers.push(newContainer);
                
                // Create or update the project with this new container
                const serviceName = newContainer.Config.Labels?.['container-flow.name'];
                if (serviceName) {
                    const projectContainers = state.containers.filter(c => 
                        c.Config.Labels?.['container-flow.name'] === serviceName
                    );
                    const updatedProject = buildProjectFromContainers(serviceName, projectContainers);
                    if (updatedProject) {
                        const projectIndex = state.projects.findIndex(p => p.name === serviceName);
                        if (projectIndex >= 0) {
                            state.projects[projectIndex] = updatedProject;
                        } else {
                            state.projects.push(updatedProject);
                        }
                        // Sort projects alphabetically after modification
                        state.projects = sortProjectsAlphabetically(state.projects);
                    }
                }
            })
            .addCase(createWordPressProject.rejected, (state, action) => {
                state.operationStatus.creating = false;
                state.error = action.payload as string;
            });

        // Clone container
        builder
            .addCase(cloneContainer.pending, (state, action) => {
                const serviceName = action.meta.arg.serviceName;
                state.operationStatus.cloning[serviceName] = true;
                state.error = null;
            })
            .addCase(cloneContainer.fulfilled, (state, action) => {
                delete state.operationStatus.cloning[action.payload.serviceName];
                state.error = null;
                const serviceName = action.payload.serviceName;
                // Append new container to flat list
                state.containers.push(action.payload.newContainer);
                // Rebuild only that project using its containers
                const projectContainers = state.containers.filter(c => c.Config.Labels?.['container-flow.name'] === serviceName);
                const updatedProject = buildProjectFromContainers(serviceName, projectContainers);
                if (updatedProject) {
                    const projectIndex = state.projects.findIndex(p => p.name === serviceName);
                    if (projectIndex >= 0) state.projects[projectIndex] = updatedProject; else state.projects.push(updatedProject);
                    // Sort projects alphabetically after modification
                    state.projects = sortProjectsAlphabetically(state.projects);
                }
            })
            .addCase(cloneContainer.rejected, (state, action) => {
                const serviceName = action.meta.arg.serviceName;
                delete state.operationStatus.cloning[serviceName];
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
                // Update single container in list
                const idx = state.containers.findIndex(c => c.Id === action.payload.containerId);
                if (idx >= 0) {
                    state.containers[idx] = action.payload.inspectInfo;
                    const serviceName = action.payload.inspectInfo.Config.Labels?.['container-flow.name'];
                    if (serviceName) {
                        const projectContainers = state.containers.filter(c => c.Config.Labels?.['container-flow.name'] === serviceName);
                        const updatedProject = buildProjectFromContainers(serviceName, projectContainers);
                        const projectIndex = state.projects.findIndex(p => p.name === serviceName);
                        if (updatedProject) {
                            if (projectIndex >= 0) state.projects[projectIndex] = updatedProject; else state.projects.push(updatedProject);
                            // Sort projects alphabetically after modification
                            state.projects = sortProjectsAlphabetically(state.projects);
                        }
                    }
                }
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
                const idx = state.containers.findIndex(c => c.Id === action.payload.containerId);
                if (idx >= 0) {
                    state.containers[idx] = action.payload.inspectInfo;
                    const serviceName = action.payload.inspectInfo.Config.Labels?.['container-flow.name'];
                    if (serviceName) {
                        const projectContainers = state.containers.filter(c => c.Config.Labels?.['container-flow.name'] === serviceName);
                        const updatedProject = buildProjectFromContainers(serviceName, projectContainers);
                        const projectIndex = state.projects.findIndex(p => p.name === serviceName);
                        if (updatedProject) {
                            if (projectIndex >= 0) state.projects[projectIndex] = updatedProject; else state.projects.push(updatedProject);
                            // Sort projects alphabetically after modification
                            state.projects = sortProjectsAlphabetically(state.projects);
                        }
                    }
                }
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
                const removedContainer = state.containers.find(c => c.Id === action.payload.containerId);
                state.containers = state.containers.filter(c => c.Id !== action.payload.containerId);
                if (removedContainer) {
                    const serviceName = removedContainer.Config.Labels?.['container-flow.name'];
                    if (serviceName) {
                        const projectContainers = state.containers.filter(c => c.Config.Labels?.['container-flow.name'] === serviceName);
                        if (projectContainers.length) {
                            const updatedProject = buildProjectFromContainers(serviceName, projectContainers);
                            const projectIndex = state.projects.findIndex(p => p.name === serviceName);
                            if (updatedProject && projectIndex >= 0) {
                                state.projects[projectIndex] = updatedProject;
                                // Sort projects alphabetically after modification
                                state.projects = sortProjectsAlphabetically(state.projects);
                            }
                        } else {
                            // Remove empty project
                            state.projects = state.projects.filter(p => p.name !== serviceName);
                        }
                    }
                }
            })
            .addCase(removeContainer.rejected, (state, action) => {
                delete state.operationStatus.removing[action.meta.arg.containerId];
                state.error = action.payload as string;
            })
            // Delete WordPress project
            .addCase(deleteWordPressProject.pending, (state, action) => {
                state.operationStatus.deleting[action.meta.arg] = true;
                state.error = null;
            })
            .addCase(deleteWordPressProject.fulfilled, (state, action) => {
                delete state.operationStatus.deleting[action.payload.serviceName];
                state.error = null;
                const serviceName = action.payload.serviceName;
                // Remove all containers belonging to this project
                state.containers = state.containers.filter(c => c.Config.Labels?.['container-flow.name'] !== serviceName);
                // Remove the project
                state.projects = state.projects.filter(p => p.name !== serviceName);
            })
            .addCase(deleteWordPressProject.rejected, (state, action) => {
                delete state.operationStatus.deleting[action.meta.arg];
                state.error = action.payload as string;
            });
    },
});

export const { clearError, resetOperationStatus, recomputeProjects } = containerSlice.actions;
export default containerSlice.reducer;
