import Docker from 'dockerode';
import { Client } from 'ssh2';
import net from 'net';

// Variables to store active instances
export const state = {
    sshClient: null as Client | null,
    connected: false,
    server: null as net.Server | null,
    dockerClient: null as Docker | null,
};

// Constants
export const LOCAL_PORT = 23750;
export const DOCKER_SOCKET = '/var/run/docker.sock';
export const REMOTE_SOCKET = '/var/run/docker.sock';

/**
 * Get the Docker client instance
 * @returns {Docker | null} The Docker client instance or null if not connected
 */
export const getClient = (): Docker | null => {
    return state.dockerClient;
};

/**
 * Set the Docker client instance
 * @param {Docker} client - The Docker client instance
 */
export const setClient = (client: Docker): void => {
    state.dockerClient = client;
};

/**
 * Reset the Docker client and close any active connections
 * @returns {void}
 */
export const resetClient = (): void => {
    if (state.server) {
        try {
            state.server.close();
        } catch (error) {
            console.error('Error closing server:', error);
        }
        state.server = null;
    }

    if (state.sshClient) {
        try {
            state.sshClient.end();
        } catch (error) {
            console.error('Error closing SSH client:', error);
        }
        state.sshClient = null;
    }

    state.dockerClient = null;
    state.connected = false;
    console.log('Docker client has been reset');
};
