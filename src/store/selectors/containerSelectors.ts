import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Base selectors
export const selectContainerState = (state: RootState) => state.containers;

// Memoized selectors
export const selectContainers = createSelector(
    [selectContainerState],
    (containerState) => containerState.containers,
);

export const selectProjects = createSelector(
    [selectContainerState],
    (containerState) => containerState.projects,
);

export const selectContainerStatus = createSelector(
    [selectContainerState],
    (containerState) => containerState.status,
);

export const selectContainerError = createSelector(
    [selectContainerState],
    (containerState) => containerState.error,
);

export const selectOperationStatus = createSelector(
    [selectContainerState],
    (containerState) => containerState.operationStatus,
);

export const selectVersionInfo = createSelector(
    [selectContainerState],
    (containerState) => containerState.versionInfo,
);

// Specific operation selectors
export const selectIsCreating = createSelector(
    [selectOperationStatus],
    (operationStatus) => operationStatus.creating,
);

export const selectIsRetrievingAll = createSelector(
    [selectOperationStatus],
    (operationStatus) => operationStatus.retrievingAll,
);

export const selectIsCloning = (serviceName: string) =>
    createSelector(
        [selectOperationStatus],
        (operationStatus) => operationStatus.cloning[serviceName] || false,
    );

export const selectIsContainerStarting = (containerId: string) =>
    createSelector(
        [selectOperationStatus],
        (operationStatus) => operationStatus.starting[containerId] || false,
    );

export const selectIsContainerStopping = (containerId: string) =>
    createSelector(
        [selectOperationStatus],
        (operationStatus) => operationStatus.stopping[containerId] || false,
    );

export const selectIsContainerRemoving = (containerId: string) =>
    createSelector(
        [selectOperationStatus],
        (operationStatus) => operationStatus.removing[containerId] || false,
    );

export const selectIsContainerUpdating = (containerId: string) =>
    createSelector(
        [selectOperationStatus],
        (operationStatus) => operationStatus.updating[containerId] || false,
    );

export const selectIsProjectDeleting = (projectName: string) =>
    createSelector(
        [selectOperationStatus],
        (operationStatus) => operationStatus.deleting?.[projectName] || false,
    );

export const selectOutdatedContainerIds = createSelector(
    [selectVersionInfo],
    (versionInfo) => versionInfo.containers,
);

export const selectIsContainerOutdated = (containerId: string) =>
    createSelector([selectOutdatedContainerIds], (outdatedIds) =>
        outdatedIds.includes(containerId),
    );

export const selectProjectHasUpdates = (projectName: string) =>
    createSelector([selectProjects, selectOutdatedContainerIds], (projects, outdatedIds) => {
        const project = projects.find((service) => service.name === projectName);
        if (!project) return false;
        return project.containers.some((container) => outdatedIds.includes(container.Id));
    });

export const selectOutdatedContainerCount = createSelector(
    [selectOutdatedContainerIds],
    (outdatedIds) => outdatedIds.length,
);

// Service-specific selectors
export const selectProjectByName = (serviceName: string) =>
    createSelector([selectProjects], (projects) =>
        projects.find((service) => service.name === serviceName),
    );

export const selectProjectCount = createSelector([selectProjects], (projects) => projects.length);

export const selectTotalContainerCount = createSelector([selectProjects], (projects) =>
    projects.reduce((total, service) => total + service.containers.length, 0),
);

export const selectRunningContainerCount = createSelector([selectProjects], (projects) =>
    projects.reduce(
        (total, service) =>
            total + service.containers.filter((c) => c.State.Status === 'running').length,
        0,
    ),
);
