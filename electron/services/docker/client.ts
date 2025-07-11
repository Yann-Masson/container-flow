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
