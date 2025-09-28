import { ContainerInspectInfo } from 'dockerode';
import { getClient } from '../../docker/client';

export interface WordPressProjectCredentials {
  dbUser: string;
  dbPassword: string;
  dbName: string;
}

export interface PasswordState {
  root?: { user: 'root'; password: string };
  metrics?: { user: string; password: string; dsn?: string };
  wordpressProjects: Record<string, WordPressProjectCredentials>;
  initialized: boolean;
}

const state: PasswordState = {
  wordpressProjects: {},
  initialized: false,
};

function parseEnvVar(env: string[], key: string): string | undefined {
  const found = env.find(e => e.startsWith(key + '='));
  return found ? found.substring(key.length + 1) : undefined;
}

/**
 * Discover existing credentials from running containers.
 * Trusts live container environment as source of truth.
 */
export async function discoverFromContainers(): Promise<PasswordState> {
  const client = getClient();
  if (!client) return state;

  try {
    const containers = await client.listContainers({ all: true });

    for (const c of containers) {
      // MySQL root password
      if (c.Names?.some(n => n === '/mysql') || c.Names?.some(n => n.includes('mysql'))) {
        try {
          const inspect: ContainerInspectInfo = await client.getContainer(c.Id).inspect();
          const env = inspect.Config?.Env || [];
          const rootPassword = parseEnvVar(env, 'MYSQL_ROOT_PASSWORD');
          if (rootPassword) {
            state.root = { user: 'root', password: rootPassword };
          }
        } catch (e) {
          console.warn('Failed to inspect mysql container for root password', e);
        }
      }

      // WordPress project credentials
      if (c.Labels && c.Labels['container-flow.type'] === 'wordpress') {
        try {
          const inspect: ContainerInspectInfo = await client.getContainer(c.Id).inspect();
          const env = inspect.Config?.Env || [];
          const labels = inspect.Config?.Labels || {};
          const projectName = labels['container-flow.name'];
          if (projectName) {
            const dbUser = parseEnvVar(env, 'WORDPRESS_DB_USER');
            const dbPassword = parseEnvVar(env, 'WORDPRESS_DB_PASSWORD');
            const dbName = parseEnvVar(env, 'WORDPRESS_DB_NAME');
            if (dbUser && dbPassword && dbName) {
              state.wordpressProjects[projectName] = { dbUser, dbPassword, dbName };
            }
          }
        } catch (e) {
          console.warn('Failed to inspect wordpress container for credentials', e);
        }
      }

      // Metrics credentials (derive from exporter container env if later added)
      if (c.Names?.some(n => n.includes('mysqld-exporter'))) {
        try {
          const inspect: ContainerInspectInfo = await client.getContainer(c.Id).inspect();
          const env = inspect.Config?.Env || [];
          const dsn = parseEnvVar(env, 'DATA_SOURCE_NAME');
          if (dsn) {
            // DSN format: user:password@(mysql:3306)/
            const match = dsn.match(/^(.*?):(.*?)@/);
            if (match) {
              state.metrics = { user: match[1], password: match[2], dsn };
            }
          }
        } catch (e) {
          console.warn('Failed to inspect metrics exporter container', e);
        }
      }
    }
  } catch (e) {
    console.warn('Failed listing containers for credential discovery', e);
  }

  state.initialized = true;
  return state;
}

export function getState(): PasswordState {
  return state;
}

export function setRootAndMetrics(opts: { rootPassword?: string; metricsUser?: string; metricsPassword?: string; metricsDsn?: string; }) {
  if (opts.rootPassword) {
    state.root = { user: 'root', password: opts.rootPassword };
  }
  if (opts.metricsUser && opts.metricsPassword) {
    state.metrics = { user: opts.metricsUser, password: opts.metricsPassword, dsn: opts.metricsDsn };
  }
}

export function registerProject(projectName: string, creds: WordPressProjectCredentials) {
  state.wordpressProjects[projectName] = creds;
}

export function status() {
  return {
    rootPresent: !!state.root?.password,
    metricsPresent: !!state.metrics?.password,
    projects: Object.keys(state.wordpressProjects),
    initialized: state.initialized,
  };
}

export default {
  discoverFromContainers,
  getState,
  setRootAndMetrics,
  registerProject,
  status,
};
