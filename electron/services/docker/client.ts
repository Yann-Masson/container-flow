import Docker from 'dockerode';
import { Client } from 'ssh2';
import net from 'net';

// Variables to store active instances
export const state = {
    sshClient: null as Client | null,
    connected: false,
    server: null as net.Server | null,
    dockerClient: null as Docker | null,
    mysqlServer: null as net.Server | null,
};

// Constants
export const LOCAL_PORT = 23750;
export const MYSQL_LOCAL_PORT = 23751;
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
 * Create MySQL tunnel through SSH
 * @returns {Promise<void>}
 */
export const createMySQLTunnel = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!state.sshClient || !state.connected) {
            reject(new Error('SSH client not connected'));
            return;
        }

        if (state.mysqlServer) {
            resolve(); // Tunnel already exists
            return;
        }

        state.mysqlServer = net.createServer((localSocket) => {
            // Forward to MySQL container port on remote server
            state.sshClient!.forwardOut(
                    '127.0.0.1',
                    0,
                    '127.0.0.1',
                    3306,
                    (err, stream) => {
                        if (err) {
                            console.error('Error creating MySQL tunnel:', err);
                            localSocket.destroy();
                            return;
                        }

                        console.log('🔗 MySQL tunnel created');
                        localSocket.pipe(stream).pipe(localSocket);
                    }
            );
        });

        state.mysqlServer.listen(MYSQL_LOCAL_PORT, '127.0.0.1', () => {
            console.log(`🧩 MySQL tunnel ready on localhost:${MYSQL_LOCAL_PORT}`);
            resolve();
        });

        state.mysqlServer.on('error', (err) => {
            console.error('❌ MySQL tunnel error:', err);
            reject(err);
        });
    });
};

/**
 * Get MySQL connection options for tunneled connection
 * @returns {object} MySQL connection options
 */
export const getMySQLConnectionOptions = () => {
    if (!state.connected || !state.mysqlServer) {
        throw new Error('MySQL tunnel not established');
    }

    return {
        host: '127.0.0.1',
        port: MYSQL_LOCAL_PORT,
        user: 'root',
        password: 'rootpassword',
    };
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

    if (state.mysqlServer) {
        try {
            state.mysqlServer.close();
        } catch (error) {
            console.error('Error closing MySQL server:', error);
        }
        state.mysqlServer = null;
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
