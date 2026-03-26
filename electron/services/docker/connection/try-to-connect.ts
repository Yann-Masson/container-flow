import Docker from 'dockerode';
import net from 'net';
import { createMySQLTunnel, LOCAL_PORT, REMOTE_SOCKET, state, resetClient } from '../client';
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
            console.log('SSH connected');

            state.connected = true;

            // socat is preferred; nc -U (OpenBSD netcat) is the fallback
            const BRIDGE_CMD = `socat - UNIX-CONNECT:${REMOTE_SOCKET} 2>/dev/null || nc -U ${REMOTE_SOCKET}`;

            state.server = net.createServer((localSocket) => {
                state.sshClient!.exec(BRIDGE_CMD, (err, stream) => {
                    if (err) {
                        console.error(
                            'Error creating Docker socket tunnel (is socat or nc installed on the VPS?):',
                            err,
                        );
                        localSocket.destroy();
                        return;
                    }

                    console.log('Tunnel created for Docker socket');

                    stream.stderr.on('data', (data: Buffer) => {
                        console.error(
                            'Docker tunnel stderr (socat/nc not installed on VPS?):\n' +
                                data.toString(),
                        );
                    });

                    stream.on('close', (code: number) => {
                        if (code !== 0 && code !== null) {
                            console.error(
                                `Docker socket bridge exited with code ${code}. ` +
                                    'Install socat on the VPS: sudo apt-get install -y socat',
                            );
                        }
                        localSocket.destroy();
                    });

                    localSocket.pipe(stream).pipe(localSocket);

                    localSocket.on('close', () => stream.close());
                });
            });

            state.server!.listen(LOCAL_PORT, '127.0.0.1', () => {
                console.log(`Tunnel ready on localhost:${LOCAL_PORT}`);

                state.dockerClient = new Docker({
                    host: '127.0.0.1',
                    port: LOCAL_PORT,
                });

                // Create MySQL tunnel as well
                createMySQLTunnel()
                    .then(() => {
                        console.log('MySQL tunnel established');
                        resolve();
                    })
                    .catch((err) => {
                        console.error('Failed to create MySQL tunnel:', err);
                        resolve(); // Don't fail the whole connection for MySQL tunnel
                    });
            });

            state.server!.on('error', (err) => {
                console.error('Server error:', err);
                resetClient();
                reject(err);
            });
        });

        state.sshClient.on('error', (err) => {
            console.error('SSH error:', err);
            resetClient();
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
