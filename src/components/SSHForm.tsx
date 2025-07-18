import { FormEvent, useState } from 'react';
import { State } from "../types/state.ts";
import { DockerClientService } from "../docker/docker-client.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl">Connexion SSH</CardTitle>
                <CardDescription>Connectez-vous à votre serveur Docker distant</CardDescription>
            </CardHeader>

            <form onSubmit={handleConnect} className='space-y-4 px-6 pb-6'>
                <div>
                    <label className='block mb-1 text-sm font-medium'>Host</label>
                    <Input
                        type='text'
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        required
                        placeholder='example.com or IP address'
                        disabled={connectionState === State.LOADING}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className='block mb-1 text-sm font-medium'>Port</label>
                    <Input
                        type='number'
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        required
                        disabled={connectionState === State.LOADING}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className='block mb-1 text-sm font-medium'>Username</label>
                    <Input
                        type='text'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={connectionState === State.LOADING}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className='block mb-1 text-sm font-medium'>Password</label>
                    <Input
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder='SSH password'
                        disabled={connectionState === State.LOADING}
                        className="w-full"
                    />
                </div>

                <Button
                    type='submit'
                    disabled={connectionState === State.LOADING}
                    className="w-full mt-2"
                >
                    {connectionState === State.LOADING
                        ? 'Connecting...'
                        : 'Connect'}
                </Button>

                { /* Connection status message */}
                {connectionState === State.SUCCESS && (
                    <div className='text-green-600 text-sm mt-2'>{message}</div>
                )}

                {connectionState === State.ERROR && (
                    <div className='text-red-600 text-sm mt-2'>{error}</div>
                )}
            </form>
        </Card>
    );
}
