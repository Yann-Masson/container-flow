import Docker from 'dockerode';
import net from 'net';
import { createMySQLTunnel, LOCAL_PORT, REMOTE_SOCKET, state } from '../client';
import { Client } from 'ssh2';

export interface SSHConfig {
    host: string;
    port: number;
    username: string;
    password: string;
}

export const tryToConnect = (config: SSHConfig): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (state.sshClient) return resolve();

        state.sshClient = new Client();

        state.sshClient.on('ready', () => {
            console.log('✅ SSH connected');

            state.connected = true;

            state.server = net.createServer((localSocket) => {
                state.sshClient!.exec(
                        `socat - UNIX-CONNECT:${REMOTE_SOCKET}`,
                        (err, stream) => {
                            if (err) {
                                console.error('Error creating socat stream:', err);
                                localSocket.destroy();
                                return;
                            }

                            console.log('🔗 Tunnel créé pour Docker socket');

                            localSocket.pipe(stream).pipe(localSocket);
                        },
                );
            });

            state.server!.listen(LOCAL_PORT, '127.0.0.1', () => {
                console.log(`🧩 Tunnel prêt sur localhost:${LOCAL_PORT}`);

                state.dockerClient = new Docker({
                    host: '127.0.0.1',
                    port: LOCAL_PORT,
                });

                // Create MySQL tunnel as well
                createMySQLTunnel()
                        .then(() => {
                            console.log('✅ MySQL tunnel established');
                            resolve();
                        })
                        .catch((err) => {
                            console.error('❌ Failed to create MySQL tunnel:', err);
                            resolve(); // Don't fail the whole connection for MySQL tunnel
                        });
            });

            state.server!.on('error', (err) => {
                console.error('❌ Server error:', err);
                reject(err);
            });
        });

        state.sshClient.on('error', (err) => {
            console.error('❌ SSH error:', err);
            reject(err);
        });

        state.sshClient.connect({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
        });
    });
};
