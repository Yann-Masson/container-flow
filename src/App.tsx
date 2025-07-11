import { useEffect, useState } from 'react';
import { DockerClientService } from './docker/docker-client.ts';
import ListContainers from './components/ListContainers';
import CreateContainer from './components/CreateContainer';
import traefik from './docker/containers/traefik';
import mysql from './docker/containers/mysql';
import SSHForm from "./components/SSHForm.tsx";
import { State } from "./types/state.ts";

export default function App() {
    const [isConnected, setIsConnected] = useState(State.LOADING);

    const dockerClientService = new DockerClientService();

    // Check connection status
    const checkConnection = async () => {
        try {
            setIsConnected(State.LOADING);
            const connected = await dockerClientService.connection.isConnected();

            console.log('Connection check response:', connected);

            if (connected) {
                setIsConnected(State.SUCCESS);
            } else {
                setIsConnected(State.IDLE);
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    };

    // Check connection when component loads
    useEffect(() => {
        checkConnection().then();
    }, []);

    return (
            <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
                <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl'>
                    <h1 className='text-3xl font-bold'>Container Flow</h1>

                    {isConnected === State.LOADING && (
                            <div className='text-blue-600'>Connecting...</div>
                    )}

                    {isConnected === State.SUCCESS && (
                            <div className='text-green-600'>Connected to Docker</div>
                    )}

                    {isConnected === State.ERROR && (
                            <div className='text-red-600'>
                                Error connecting to Docker
                            </div>
                    )}

                    {isConnected === State.IDLE && (
                            <SSHForm setIsConnected={setIsConnected}/>
                    )}

                    {isConnected === State.SUCCESS && (
                            <div>
                                <ListContainers/>
                                <CreateContainer containerOptions={traefik}/>
                                <CreateContainer containerOptions={mysql}/>
                            </div>
                    )}
                </main>
            </div>
    );
}
