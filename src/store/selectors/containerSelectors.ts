import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Base selectors
export const selectContainerState = (state: RootState) => state.containers;

// Memoized selectors
export const selectContainers = createSelector(
    [selectContainerState],
    (containerState) => containerState.containers
);

export const selectServices = createSelector(
    [selectContainerState],
    (containerState) => containerState.services
);

export const selectContainerStatus = createSelector(
    [selectContainerState],
    (containerState) => containerState.status
);

export const selectContainerError = createSelector(
    [selectContainerState],
    (containerState) => containerState.error
);

export const selectOperationStatus = createSelector(
    [selectContainerState],
    (containerState) => containerState.operationStatus
);

// Specific operation selectors
export const selectIsCreating = createSelector(
    [selectOperationStatus],
    (operationStatus) => operationStatus.creating
);

export const selectIsCloning = createSelector(
    [selectOperationStatus],
    (operationStatus) => operationStatus.cloning
);

export const selectIsContainerStarting = (containerId: string) => createSelector(
    [selectOperationStatus],
    (operationStatus) => operationStatus.starting[containerId] || false
);

export const selectIsContainerStopping = (containerId: string) => createSelector(
    [selectOperationStatus],
    (operationStatus) => operationStatus.stopping[containerId] || false
);

export const selectIsContainerRemoving = (containerId: string) => createSelector(
    [selectOperationStatus],
    (operationStatus) => operationStatus.removing[containerId] || false
);

// Service-specific selectors
export const selectServiceByName = (serviceName: string) => createSelector(
    [selectServices],
    (services) => services.find(service => service.name === serviceName)
);

export const selectServiceCount = createSelector(
    [selectServices],
    (services) => services.length
);

export const selectTotalContainerCount = createSelector(
    [selectServices],
    (services) => services.reduce((total, service) => total + service.containers.length, 0)
);

export const selectRunningContainerCount = createSelector(
    [selectServices],
    (services) => services.reduce(
        (total, service) => total + service.containers.filter(c => c.State.Status === 'running').length,
        0
    )
);
