'use client';

import { useEffect, useState } from 'react';
import { ContainerInfo } from 'dockerode';
import { DockerClientService } from "../docker/docker-client.ts";
import { State } from "../types/state.ts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "./ui/dialog";

export default function ListContainers() {
    const [state, setState] = useState(State.LOADING);
    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const dockerClientService = new DockerClientService();

    // List containers
    const handleListContainers = async () => {
        setState(State.LOADING);
        setError('');
        setMessage('');

        try {
            const containers = await dockerClientService.containers.list();

            if (containers) {
                setContainers(containers);
                setMessage(`${containers.length} container(s) found`);
                setState(State.SUCCESS);
            } else {
                setError('Error retrieving containers');
                setState(State.ERROR);
            }
        } catch (error) {
            setError(`Error: ${error}`);
            setState(State.ERROR);
        }
    };

    useEffect(() => {
        // Automatically list containers when component mounts
        handleListContainers().then();
    }, []);

    // Function to get status color
    const getStatusColor = (status: string) => {
        if (status.includes('Up')) return 'bg-green-500';
        if (status.includes('Exited')) return 'bg-red-500';
        if (status.includes('Created')) return 'bg-yellow-500';
        return 'bg-gray-500';
    };

    // Function to format container name
    const formatContainerName = (name: string) => {
        return name.replace(/^\//, '');
    };

    // Function to determine badge style based on image
    const getImageBadgeStyle = (image: string) => {
        if (image.includes('nginx')) return 'bg-emerald-500 hover:bg-emerald-600';
        if (image.includes('mysql')) return 'bg-blue-500 hover:bg-blue-600';
        if (image.includes('traefik')) return 'bg-purple-500 hover:bg-purple-600';
        if (image.includes('wordpress')) return 'bg-cyan-500 hover:bg-cyan-600';
        if (image.includes('php')) return 'bg-indigo-500 hover:bg-indigo-600';
        if (image.includes('mongo')) return 'bg-green-500 hover:bg-green-600';
        if (image.includes('postgres')) return 'bg-blue-600 hover:bg-blue-700';
        if (image.includes('redis')) return 'bg-red-500 hover:bg-red-600';
        return 'bg-gray-500 hover:bg-gray-600';
    };

    // Function to get status text
    const getStatusText = (status: string) => {
        if (status.includes('Up')) return 'Running';
        if (status.includes('Exited')) return 'Stopped';
        if (status.includes('Created')) return 'Created';
        return 'Unknown';
    };

    // Render loading skeletons
    const renderSkeletons = () => {
        return Array(3).fill(0).map((_, i) => (
            <Card key={`skeleton-${i}`} className="w-full mb-4 hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2"/>
                    <Skeleton className="h-4 w-1/2"/>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <Skeleton className="h-6 w-20"/>
                        <Skeleton className="h-6 w-24"/>
                    </div>
                    <Skeleton className="h-4 w-full mb-2"/>
                    <Skeleton className="h-4 w-2/3"/>
                </CardContent>
            </Card>
        ));
    };

    return (
        <div className='p-4 w-full'>
            <Card
                className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Docker Container Manager</CardTitle>
                </CardHeader>
                <CardContent>
                    {state === State.SUCCESS && (
                        <Badge variant="outline"
                               className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                            {message}
                        </Badge>
                    )}

                    {state === State.ERROR && (
                        <Badge variant="outline"
                               className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700">
                            {error}
                        </Badge>
                    )}

                    {state === State.LOADING && (
                        <Badge variant="outline"
                               className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700 animate-pulse">
                            Loading containers...
                        </Badge>
                    )}
                </CardContent>
            </Card>

            {/* Container list */}
            {state === State.LOADING ? (
                <div className="space-y-4">
                    {renderSkeletons()}
                </div>
            ) : state === State.SUCCESS && containers.length > 0 ? (
                <div className="space-y-4">
                    <h2 className='text-xl font-bold mb-3'>Container List</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {containers.map((container) => (
                            <Dialog key={container.Id}>
                                <DialogTrigger asChild>
                                    <Card
                                        className="cursor-pointer hover:shadow-md transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle
                                                        className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                                        {formatContainerName(container.Names[0])}
                                                    </CardTitle>
                                                    <p className="text-xs text-gray-500 mt-1">ID: {container.Id.substring(0, 12)}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <div
                                                        className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(container.Status)}`}></div>
                                                    <span className="text-sm">
                                                        {getStatusText(container.Status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <Separator/>
                                        <CardContent className="pt-4">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <Badge className={getImageBadgeStyle(container.Image)}>
                                                    {container.Image}
                                                </Badge>
                                                <Badge variant="outline">{container.Status}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Created
                                                on {new Date(container.Created * 1000).toLocaleDateString()} at {new Date(container.Created * 1000).toLocaleTimeString()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {formatContainerName(container.Names[0])}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Detailed container information
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h3 className="text-sm font-semibold mb-1">ID</h3>
                                                <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded overflow-auto break-all text-xs">
                                                    {container.Id}
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold mb-1">Image</h3>
                                                <Badge className={`${getImageBadgeStyle(container.Image)} w-fit`}>
                                                    {container.Image}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold mb-1">Status</h3>
                                            <div className="flex items-center">
                                                <div
                                                    className={`h-3 w-3 rounded-full mr-2 ${getStatusColor(container.Status)}`}></div>
                                                <span>{container.Status}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold mb-1">Created on</h3>
                                            <p>{new Date(container.Created * 1000).toLocaleString()}</p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold mb-1">Ports</h3>
                                            {container.Ports && container.Ports.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {container.Ports.map((port, index) => (
                                                        <Badge key={index} variant="outline"
                                                               className="bg-gray-100 dark:bg-gray-800">
                                                            {port.PublicPort ? `${port.PublicPort}:${port.PrivatePort}` : port.PrivatePort} {port.Type}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No exposed ports</p>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-semibold mb-1">Labels</h3>
                                            {container.Labels && Object.keys(container.Labels).length > 0 ? (
                                                <div
                                                    className="overflow-auto max-h-40 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                                    {Object.entries(container.Labels).map(([key, value]) => (
                                                        <div key={key} className="mb-1">
                                                            <span
                                                                className="text-blue-600 dark:text-blue-400">{key}</span>: {value}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No labels</p>
                                            )}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ))}
                    </div>
                </div>
            ) : state === State.SUCCESS && containers.length === 0 ? (
                <Card className="w-full p-6 text-center bg-gray-50 dark:bg-gray-800">
                    <p className="text-lg text-gray-600 dark:text-gray-400">No containers found</p>
                    <p className="text-sm text-gray-500 mt-2">Create a new container to get started</p>
                </Card>
            ) : null}
        </div>
    );
}
