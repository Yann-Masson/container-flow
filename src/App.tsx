import { useEffect, useState } from 'react';
import { DockerClientService } from './docker/docker-client.ts';
import ListContainers from './components/ListContainers.tsx';
import CreateContainer from './components/CreateContainer.tsx';
import traefik from './docker/containers/traefik.ts';
import mysql from './docker/containers/mysql.ts';
import SSHForm from "./components/SSHForm.tsx";
import { State } from "./types/state.ts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Separator } from "./components/ui/separator";
import { Badge } from "./components/ui/badge";
import { Skeleton } from "./components/ui/skeleton";

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
            className='min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 font-[family-name:var(--font-geist-sans)]'>
            {isConnected === State.IDLE ? (
                <div className='flex flex-col items-center justify-center min-h-screen'>
                    <Card
                        className="w-full max-w-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl border-gray-200 dark:border-gray-800">
                        <CardHeader className="text-center space-y-2">
                            <div
                                className="mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 p-1 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                     strokeLinejoin="round" className="text-white">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                    <line x1="9" x2="15" y1="15" y2="15"/>
                                </svg>
                            </div>
                            <CardTitle
                                className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                Container Flow
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                                Manage your Docker containers easily and efficiently
                            </CardDescription>
                        </CardHeader>

                        <Separator className="my-2"/>

                        <CardContent className="pt-6">
                            <SSHForm setIsConnected={setIsConnected}/>
                        </CardContent>

                        <CardFooter className="flex justify-center text-xs text-gray-500 pt-4">
                            <p>© 2025 Container Flow - Simplified Docker Management</p>
                        </CardFooter>
                    </Card>
                </div>
            ) : isConnected === State.SUCCESS ? (
                <div className="container mx-auto max-w-6xl">
                    <header className="flex flex-col md:flex-row justify-between items-center py-6">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 p-1 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                     strokeLinejoin="round" className="text-white">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                    <line x1="9" x2="15" y1="15" y2="15"/>
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                Container Flow
                            </h1>
                        </div>
                        <Badge variant="outline"
                               className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1">
                            Connected to Docker server
                        </Badge>
                    </header>

                    <Separator className="my-4"/>

                    <main className="grid grid-cols-1 gap-8">
                        <section>
                            <ListContainers/>
                        </section>

                        <Separator className="my-2"/>

                        <section>
                            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">Create a new container</CardTitle>
                                    <CardDescription>
                                        Select a container template to deploy
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CreateContainer containerOptions={traefik}/>
                                    <CreateContainer containerOptions={mysql}/>
                                </CardContent>
                            </Card>
                        </section>
                    </main>

                    <footer className="mt-12 mb-4 text-center text-sm text-gray-500">
                        <p>© 2025 Container Flow - Docker Management Platform</p>
                    </footer>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-gray-200 dark:border-gray-800 text-center">
                        <div
                            className="mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                 strokeLinejoin="round" className="text-white animate-pulse">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <line x1="9" x2="15" y1="15" y2="15"/>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            Container Flow
                        </h1>
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full animate-pulse"/>
                            <div className="text-lg animate-pulse">Checking connection...</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
