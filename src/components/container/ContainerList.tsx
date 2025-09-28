'use client';

import { useEffect, useMemo } from 'react';
import { ContainerCreateOptions } from 'dockerode';
import { State } from "../../utils/state/basic-state.ts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card.tsx";
import { toast } from "sonner";
import { ContainerHeader } from "./ContainerHeader.tsx";
import { ContainerCard } from "./ContainerCard.tsx";
import { ContainerSkeleton } from "./ContainerSkeleton.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import traefik from "../../../electron/services/docker/configs/traefik.ts";
import { ContainerCreateDialog } from "@/components/container/create/ContainerCreateDialog.tsx";
import { dockerClientService } from "@/docker/docker-client.ts";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { listContainers, startGenericContainer, stopGenericContainer, removeGenericContainer, duplicateGenericContainer } from '@/store/slices/containerSlice';

// Selectors (inline to avoid creating separate file now)
const useGenericContainers = () => useAppSelector(s => s.genericContainers.containers);
const useGenericStatus = () => useAppSelector(s => s.genericContainers.status);
const useGenericOps = () => useAppSelector(s => s.genericContainers.operationStatus);
// const useGenericError = () => useAppSelector(s => s.genericContainers.error); // currently unused

export default function ContainerList() {
    const dispatch = useAppDispatch();
    const containers = useGenericContainers();
    const status = useGenericStatus();
    const ops = useGenericOps();
    // const error = useGenericError(); // reserved for future error banner usage

    // List containers
    const handleListContainers = async () => {
        await dispatch(listContainers());
    };

    // Start container
    const handleStartContainer = async (containerId: string, containerName: string) => {
        try {
            await dispatch(startGenericContainer({ id: containerId })).unwrap();
            toast.success(`Container "${containerName}" started successfully`);
        } catch (error) {
            toast.error(`Failed to start container "${containerName}": ${error}`);
        }
    };

    // Stop container
    const handleStopContainer = async (containerId: string, containerName: string) => {
        try {
            await dispatch(stopGenericContainer({ id: containerId })).unwrap();
            toast.success(`Container "${containerName}" stopped successfully`);
        } catch (error) {
            toast.error(`Failed to stop container "${containerName}": ${error}`);
        }
    };

    // Delete container
    const handleDeleteContainer = async (containerId: string, containerName: string) => {
        try {
            await dispatch(removeGenericContainer({ id: containerId })).unwrap();
            toast.success(`Container "${containerName}" deleted successfully`);
        } catch (error) {
            toast.error(`Failed to delete container "${containerName}": ${error}`);
        }
    };

    // Create / Duplicate container
    const handleCreateContainer = async (containerConfig: ContainerCreateOptions, previousContainerId: string | null, removePreviousContainer: boolean) => {
        try {
            if (!previousContainerId) {
                await dockerClientService.containers.create(containerConfig);
                toast.success(`Container "${containerConfig.name}" created successfully`);
                dispatch(listContainers());
                return;
            }
            await dispatch(duplicateGenericContainer({ previousId: previousContainerId, config: containerConfig, removePrevious: removePreviousContainer })).unwrap();
            toast.success(`Container duplicated successfully`);
        } catch (error) {
            toast.error(`Failed to update container "${containerConfig.Image}": ${error}`);
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
        dispatch(listContainers());
    }, [dispatch]);

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

    const running = useMemo(() => containers.filter(c => c.Status?.includes('Up')).length, [containers]);
    const stopped = useMemo(() => containers.filter(c => c.Status?.includes('Exited') || c.Status?.includes('Created')).length, [containers]);

    return (
        <main className="grid grid-cols-1 gap-8">

            <section className='p-4 w-full'>
                <ContainerHeader
                    state={status}
                    refreshFunction={handleListContainers}
                    running={running}
                    stopped={stopped}
                />

                <div className="space-y-4">
                {/* Container list */}
                {status === State.LOADING ? (
                    <ContainerSkeleton count={5}/>
                ) : status === State.SUCCESS && containers.length > 0 ? (
                            containers.map((container) => {
                                const containerName = formatContainerName(container.Names[0]);
                                const isRunning = container.Status?.includes('Up');
                                const isLoading = !!(ops.starting[container.Id] || ops.stopping[container.Id] || ops.removing[container.Id] || ops.duplicating[container.Id]);

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
                                        onCreate={handleCreateContainer}
                                    />
                                );
                            })
                ) : status === State.SUCCESS && containers.length === 0 ? (
                    <Card className="w-full p-6 text-center bg-gray-50 dark:bg-gray-800">
                        <p className="text-lg text-gray-600 dark:text-gray-400">No containers found</p>
                        <p className="text-sm text-gray-500 mt-2">Create a new container to get started</p>
                    </Card>
                ) : null}
                </div>
            </section>

            <Separator className="my-2"/>

            <section>
                <Card
                    variant="glass"
                    accent="glow"
                    interactive={false}
                    withHoverOverlay
                    className="group relative overflow-hidden"
                >
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">Create a new
                            container</CardTitle>
                        <CardDescription>
                            Select a container template to deploy
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="">
                        Traefik: <ContainerCreateDialog onCreate={handleCreateContainer} defaultConfig={traefik}/>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}
