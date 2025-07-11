import { state } from '../client';

export const isConnected = () => {
    return (
        state.sshClient !== null &&
        state.dockerClient !== null &&
        state.connected
    );
};
