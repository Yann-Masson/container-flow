import { ContainerInspectInfo } from 'dockerode';
import { State } from '@/types/state';

export interface WordPressService {
    name: string;
    containers: ContainerInspectInfo[];
    dbName: string;
    dbUser: string;
    url: string;
}

export interface ContainerState {
    // Container data
    containers: ContainerInspectInfo[];
    services: WordPressService[];
    
    // Loading states
    status: State;
    error: string | null;
    
    // Individual operation states
    operationStatus: {
        creating: boolean;
        cloning: boolean;
        starting: Record<string, boolean>; // containerID -> isStarting
        stopping: Record<string, boolean>; // containerID -> isStopping
        removing: Record<string, boolean>; // containerID -> isRemoving
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
