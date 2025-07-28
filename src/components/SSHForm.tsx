import { FormEvent, useEffect, useState } from 'react';
import { State } from "../types/state.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { dockerClientService } from "@/docker/docker-client.ts";

interface SSHFormProps {
    setIsConnected: (state: State) => void;
}

export default function SSHForm(props: SSHFormProps) {
    const { setIsConnected } = props;
    const [connectionState, setConnectionState] = useState<State>(State.IDLE);

    // SSH Form
    const [host, setHost] = useState('');
    const [port, setPort] = useState('22');
    const [username, setUsername] = useState('root');
    const [password, setPassword] = useState('');

    // Load saved SSH preferences on component mount
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const preferences = await window.electronAPI.storage.ssh.get();
                if (preferences.host) setHost(preferences.host);
                if (preferences.port) setPort(preferences.port);
                if (preferences.username) setUsername(preferences.username);
            } catch (error) {
                console.error('Failed to load SSH preferences:', error);
            }
        };

        loadPreferences().then();
    }, []);

    // Save SSH preferences (excluding password)
    const savePreferences = async () => {
        try {
            await window.electronAPI.storage.ssh.save({
                host,
                port,
                username
            });
        } catch (error) {
            console.error('Failed to save SSH preferences:', error);
        }
    };

    // Connect to Docker via SSH
    const handleConnect = async (e: FormEvent) => {
        e.preventDefault();
        setConnectionState(State.LOADING);

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

                // Save preferences after successful connection
                await savePreferences();
            } else {
                setConnectionState(State.ERROR);
                toast.error('Failed to connect to Docker via SSH');
            }
        } catch (error) {
            console.error('SSH connection error:', error);
            toast.error(`SSH connection error: ${error}`);
            setConnectionState(State.ERROR);
        } finally {
            setConnectionState(State.IDLE);
        }
    };

    return (
            <div className="flex w-full justify-center">
                <form onSubmit={handleConnect} className='space-y-4 px-6 pb-6 w-2/3'>
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
                </form>
            </div>
    );
}
