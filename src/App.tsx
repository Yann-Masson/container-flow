import { useEffect, useState } from 'react';
import { DockerClientService } from './docker/docker-client.ts';
import ListContainers from './components/ListContainers.tsx';
import CreateContainer from './components/CreateContainer.tsx';
import traefik from './docker/containers/traefik.ts';
import mysql from './docker/containers/mysql.ts';
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
        <div
            className='flex flex-col items-center justify-center min-h-screen bg-background p-4 font-[family-name:var(--font-geist-sans)]'>
            {isConnected === State.IDLE ? (
                <div className='flex flex-col items-center justify-center gap-8 w-full max-w-xl'>
                    <div className='text-center mb-4'>
                        <h1 className='text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                            Container Flow
                        </h1>
                        <p className='text-muted-foreground mt-3'>
                            Gérez vos conteneurs Docker facilement et efficacement
                        </p>
                    </div>

                    <SSHForm setIsConnected={setIsConnected}/>
                </div>
            ) : isConnected === State.SUCCESS ? (
                <main className='flex flex-col gap-[32px] w-full max-w-4xl'>
                    <h1 className='text-3xl font-bold'>Container Flow</h1>

                    <div>
                        <ListContainers/>
                        <CreateContainer containerOptions={traefik}/>
                        <CreateContainer containerOptions={mysql}/>
                    </div>
                </main>
            ) : (
                <div className='flex flex-col items-center justify-center'>
                    <h1 className='text-4xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'>Container
                        Flow</h1>
                    <div className='text-xl animate-pulse'>Vérification de la connexion...</div>
                </div>
            )}
        </div>
    );
}
