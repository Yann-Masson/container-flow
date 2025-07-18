import { FormEvent, useState } from 'react';
import { State } from "../types/state.ts";
import { DockerClientService } from "../docker/docker-client.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
                <Input
                    type='text'
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    required
                    placeholder='example.com or IP address'
                    disabled={connectionState === State.LOADING}
                />
            </div>

            <div>
                <label className='block mb-1'>Port</label>
                <Input
                    type='number'
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    required
                    disabled={connectionState === State.LOADING}
                />
            </div>

            <div>
                <label className='block mb-1'>Username</label>
                <Input
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={connectionState === State.LOADING}
                />
            </div>

            <div>
                <label className='block mb-1'>Password</label>
                <Input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder='SSH password'
                    disabled={connectionState === State.LOADING}
                />
            </div>

            <Button
                type='submit'
                disabled={connectionState === State.LOADING}
            >
                {connectionState === State.LOADING
                    ? 'Connecting...'
                    : 'Connect'}
            </Button>

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
