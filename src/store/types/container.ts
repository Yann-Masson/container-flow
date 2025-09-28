import { ContainerInspectInfo } from 'dockerode';
import { State } from '@/utils/state/basic-state';

export interface WordPressProject {
    name: string;
    containers: ContainerInspectInfo[];
    dbName: string;
    dbUser: string;
    url: string;
}

export interface ContainerState {
    // Container data
    containers: ContainerInspectInfo[];
    projects: WordPressProject[];
    
    // Loading states
    status: State;
    error: string | null;
    
    // Individual operation states
    operationStatus: {
        retrievingAll: boolean;
        creating: boolean;
        cloning: Record<string, boolean>; // serviceName -> isCloning
        starting: Record<string, boolean>; // containerID -> isStarting
        stopping: Record<string, boolean>; // containerID -> isStopping
        removing: Record<string, boolean>; // containerID -> isRemoving
        deleting: Record<string, boolean>; // projectName -> isDeleting
    };
}

export interface CreateWordPressServicePayload {
    name: string;
    domain: string;
}

export interface ContainerActionPayload {
    containerId: string;
    containerName?: string;
}

export interface CloneContainerPayload {
    sourceContainer: ContainerInspectInfo;
    serviceName: string;
}
