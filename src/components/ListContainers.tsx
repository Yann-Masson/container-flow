'use client';

import { useEffect, useState } from 'react';
import { ContainerCreateOptions, ContainerInfo } from 'dockerode';
import { DockerClientService } from "../docker/docker-client.ts";
import { State } from "../types/state.ts";
import { Card } from "./ui/card";
import { toast } from "sonner";
import { ContainerHeader } from "./container/ContainerHeader";
import { ContainerCard } from "./container/ContainerCard";
import { LoadingSkeleton } from "./container/LoadingSkeleton";

export default function ListContainers() {
    const [state, setState] = useState(State.LOADING);
    const [containers, setContainers] = useState<ContainerInfo[]>([]);
    const [message, setMessage] = useState('');
    const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

    const dockerClientService = new DockerClientService();

    // List containers
    const handleListContainers = async () => {
        setState(State.LOADING);
        setMessage('loading containers...');

        try {
            const containers = await dockerClientService.containers.list();

            if (containers !== null) {
                setContainers(containers);
                setMessage(`${containers.length} container${containers.length > 0 ? 's' : ''} found`);
                setState(State.SUCCESS);
            } else {
                setState(State.ERROR);
                setMessage('No containers found');
            }
        } catch (error) {
            console.error('Failed to list containers:', error);
            setState(State.ERROR);
        }
    };

    // Start container
    const handleStartContainer = async (containerId: string, containerName: string) => {
        setActionLoading(prev => ({ ...prev, [containerId]: true }));
        try {
            await dockerClientService.containers.start(containerId);
            toast.success(`Container "${containerName}" started successfully`);
            await handleListContainers();
        } catch (error) {
            toast.error(`Failed to start container "${containerName}": ${error}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [containerId]: false }));
        }
    };

    // Stop container
    const handleStopContainer = async (containerId: string, containerName: string) => {
        setActionLoading(prev => ({ ...prev, [containerId]: true }));
        try {
            await dockerClientService.containers.stop(containerId, { t: 10 });
            toast.success(`Container "${containerName}" stopped successfully`);
            setContainers(prev => prev.map(container =>
                container.Id === containerId ? { ...container, State: 'stopped' } : container
            ));
        } catch (error) {
            toast.error(`Failed to stop container "${containerName}": ${error}`);
            console.error(error);
        } finally {
            setActionLoading(prev => ({ ...prev, [containerId]: false }));
        }
    };

    // Delete container
    const handleDeleteContainer = async (containerId: string, containerName: string) => {
        setActionLoading(prev => ({ ...prev, [containerId]: true }));
        try {
            await dockerClientService.containers.remove(containerId, { force: true });
            toast.success(`Container "${containerName}" deleted successfully`);
        } catch (error) {
            toast.error(`Failed to delete container "${containerName}": ${error}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [containerId]: false }));
        }
    };

    // Update container (recreate by deleting and creating new one)
    const handleDuplicateContainer = async (containerId: string, containerConfig: ContainerCreateOptions, removeCurrentContainer: boolean) => {
        setActionLoading(prev => ({ ...prev, [containerId]: true }));
        try {
            const containerInfo = await dockerClientService.containers.get(containerId);

            if (removeCurrentContainer) {
                await dockerClientService.containers.remove(containerId, { force: true });
            }

            const newContainer = await dockerClientService.containers.create(containerConfig);

            if (containerInfo.State.Running) {
                await dockerClientService.containers.start(newContainer.Id);
            }

            toast.success(`Container "${containerInfo.Name}" duplicated successfully`);
            await handleListContainers(); // Refresh the list
        } catch (error) {
            toast.error(`Failed to update container "${containerConfig.Image}": ${error}`);
        } finally {
            setActionLoading(prev => ({ ...prev, [containerId]: false }));
        }
    };

    // Get container logs
    const handleGetLogs = async (containerId: string, containerName: string) => {
        try {
            return await dockerClientService.containers.getLogs(containerId, {
                stdout: true,
                stderr: true
            });
        } catch (error) {
            toast.error(`Failed to get logs for container "${containerName}": ${error}`);
            return 'Failed to retrieve logs';
        }
    };

    useEffect(() => {
        // Automatically list containers when component mounts
        handleListContainers();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    return (
        <div className='p-4 w-full'>
            <ContainerHeader state={state} message={message} refreshFunction={handleListContainers}/>

            {/* Container list */}
            {state === State.LOADING ? (
                <LoadingSkeleton/>
            ) : state === State.SUCCESS && containers.length > 0 ? (
                <div className="space-y-4">
                    <h2 className='text-xl font-bold mb-3'>Container List</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {containers.map((container) => {
                            const containerName = formatContainerName(container.Names[0]);
                            const isRunning = container.Status.includes('Up');
                            const isLoading = actionLoading[container.Id];

                            return (
                                <ContainerCard
                                    key={container.Id}
                                    container={container}
                                    containerName={containerName}
                                    isRunning={isRunning}
                                    isLoading={isLoading}
                                    getStatusColor={getStatusColor}
                                    getStatusText={getStatusText}
                                    getImageBadgeStyle={getImageBadgeStyle}
                                    onStart={handleStartContainer}
                                    onStop={handleStopContainer}
                                    onGetLogs={handleGetLogs}
                                    onDelete={handleDeleteContainer}
                                    onDuplicate={handleDuplicateContainer}
                                />
                            );
                        })}
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
