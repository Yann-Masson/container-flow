// Shared types for WordPress infrastructure setup steps
import type { ContainerInfo } from 'dockerode';

export type ProgressStatus = 'starting' | 'success' | 'error';
export type ProgressCallback = (step: string, status: ProgressStatus, message?: string) => void;

export interface SetupOptions { 
  force?: boolean;
  /** Optional Grafana credentials to override default admin/admin when user has changed them */
  grafanaAuth?: { username: string; password: string };
}

// No composite result is needed anymore; setup process is side-effect only.

export interface EnsureContext {
  force: boolean;
  progress?: ProgressCallback;
  grafanaAuth?: { username: string; password: string };
}

export type EnsureFn = (ctx: EnsureContext) => Promise<void>;

export interface ContainerConfigLike {
  name?: string; // our configs seem to embed a name property
  Image?: string;
  Env?: string[];
  Cmd?: string[];
  HostConfig?: any;
  [k: string]: any;
}

export interface Validations {
  networkConfig: (networkInfo: any) => boolean;
  containerConfig: (containerInfo: any, expected: ContainerConfigLike) => boolean;
}

export interface DockerClientLike {
  getContainer(id: string): { inspect(): Promise<ContainerInfo> };
}
