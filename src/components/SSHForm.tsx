import { FormEvent, useState } from 'react';
import { State } from "../types/state.ts";
import { DockerClientService } from "../docker/docker-client.ts";

interface SSHFormProps {
    setIsConnected: (state: State) => void;
}

export default function SSHForm(props: SSHFormProps) {
    const { setIsConnected } = props;

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [connectionState, setConnectionState] = useState<State>(State.IDLE);

    // SSH Form
    const [host, setHost] = useState('');
    const [port, setPort] = useState('22');
    const [username, setUsername] = useState('root');
    const [password, setPassword] = useState('');

    const dockerClientService = new DockerClientService();

    // Connect to Docker via SSH
    const handleConnect = async (e: FormEvent) => {
        e.preventDefault();
        setConnectionState(State.LOADING);
        setMessage('');
        setError('');

        try {
            await dockerClientService.connection.connect({
                host,
                port: Number(port),
                username,
                password,
            });

            const connected = await dockerClientService.connection.isConnected();

            if (connected) {
                setIsConnected(State.SUCCESS);
                setConnectionState(State.SUCCESS);
                setMessage('Successfully connected to Docker via SSH!');
            } else {
                setError('Connection error');
                setConnectionState(State.ERROR);
            }
        } catch (error) {
            setError(`Error: ${error}`);
            setConnectionState(State.ERROR);
        } finally {
            setConnectionState(State.IDLE);
        }
    };

    return (
            <form onSubmit={handleConnect} className='mb-6 space-y-4 max-w-md'>
                <div>
                    <label className='block mb-1'>Host</label>
                    <input
                            type='text'
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            required
                            className='w-full p-2 border rounded'
                            placeholder='example.com or IP address'
                            disabled={connectionState === State.LOADING}
                    />
                </div>

                <div>
                    <label className='block mb-1'>Port</label>
                    <input
                            type='number'
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            required
                            className='w-full p-2 border rounded'
                            disabled={connectionState === State.LOADING}
                    />
                </div>

                <div>
                    <label className='block mb-1'>Username</label>
                    <input
                            type='text'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className='w-full p-2 border rounded'
                            disabled={connectionState === State.LOADING}
                    />
                </div>

                <div>
                    <label className='block mb-1'>Password</label>
                    <input
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className='w-full p-2 border rounded'
                            placeholder='SSH password'
                            disabled={connectionState === State.LOADING}
                    />
                </div>

                <button
                        type='submit'
                        disabled={connectionState === State.LOADING}
                        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
                >
                    {connectionState === State.LOADING
                            ? 'Connecting...'
                            : 'Connect'}
                </button>

                { /* Connection status message */}
                {connectionState === State.SUCCESS && (
                        <div className='text-green-600'>{message}</div>
                )}

                {connectionState === State.ERROR && (
                        <div className='text-red-600'>{error}</div>
                )}
            </form>
    );
}
