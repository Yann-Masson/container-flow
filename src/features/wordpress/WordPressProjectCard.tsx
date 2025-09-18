import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    ChevronDown,
    ChevronRight,
    Copy,
    Database,
    ExternalLink,
    Globe,
    Minus,
    Play,
    Plus,
    Settings,
    Square
} from 'lucide-react';
import { ContainerInspectInfo } from "dockerode";
import { toast } from 'sonner';
import { ContainerLogsDialog } from "@/components/container/ContainerLogsDialog.tsx";
import WordPressChangeUrlDialog from './WordPressChangeUrlDialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
    cloneContainer, 
    startContainer, 
    stopContainer, 
    removeContainer
} from '@/store/slices/containerSlice';
import { 
    selectIsCloning,
    selectIsRetrievingAll,
    selectOperationStatus
} from '@/store/selectors/containerSelectors';
import { WordPressProject } from '@/store/types/container';

interface WordPressProjectCardProps {
    project: WordPressProject;
}

export default function WordPressProjectCard({ project }: WordPressProjectCardProps) {
    const dispatch = useAppDispatch();
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChangeUrlDialogOpen, setIsChangeUrlDialogOpen] = useState(false);

    const isRetrievingAll = useAppSelector(selectIsRetrievingAll);
    
    // Redux selectors for operation states (per service cloning)
    const isCloning = useAppSelector(selectIsCloning(project.name));
    
    // Single selector for all operation statuses to avoid dynamic hook calls
    const operationStatus = useAppSelector(selectOperationStatus);
    const isAnyInstanceRemoving = project.containers.some(c => operationStatus.removing[c.Id]);

    const runningCount = project.containers.filter(c => c.State.Status === 'running').length;
    const totalCount = project.containers.length;

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`);
        } catch (error) {
            toast.error('Failed to copy to clipboard');
        }
    };

    const openUrl = async () => {
        if (project.url !== 'N/A') {
            try {
                await window.electronAPI.system.openExternal(`https://${project.url}`);
            } catch (error) {
                toast.error('Failed to open URL in browser');
                console.error('Error opening external URL:', error);
            }
        }
    };

    const handleAddInstance = async () => {
        if (isCloning) return;

        try {
            // Find the highest instance number
            const instanceNumbers = project.containers.map(container => {
                const match = container.Name.match(/-(\d+)$/);
                return match ? parseInt(match[1]) : 1;
            });
            const nextInstanceNumber = Math.max(...instanceNumbers) + 1;

            toast.info('🚀 Adding new container instance...', {
                description: `Creating ${project.name}-${nextInstanceNumber}`,
            });

            // Use the last container as source for cloning
            const sourceContainer = project.containers[project.containers.length - 1];
            const resultAction = await dispatch(cloneContainer({
                sourceContainer,
                serviceName: project.name
            }));

            if (cloneContainer.fulfilled.match(resultAction)) {
                toast.success('✅ New container instance added!', {
                    description: `${project.name}-${nextInstanceNumber} is now available`,
                    duration: 5000,
                });
            } else if (cloneContainer.rejected.match(resultAction)) {
                toast.error('❌ Error adding instance', {
                    description: resultAction.payload as string || 'An unknown error occurred',
                });
            }
        } catch (error) {
            console.error('Failed to add container instance:', error);
            toast.error('❌ Error adding instance', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    };

    const handleRemoveInstance = async () => {
        if (isAnyInstanceRemoving || project.containers.length <= 1) return;

        try {
            const containers = [...project.containers];

            // Find the container with the highest instance number
            const sortedContainers = containers.sort((a, b) => {
                const aMatch = a.Name.match(/-(\d+)$/);
                const bMatch = b.Name.match(/-(\d+)$/);
                const aNum = aMatch ? parseInt(aMatch[1]) : 1;
                const bNum = bMatch ? parseInt(bMatch[1]) : 1;
                return bNum - aNum;
            });

            const containerToRemove = sortedContainers[0];
            const containerName = containerToRemove.Name.replace('wordpress-', '');

            toast.info('🗑️ Removing container instance...', {
                description: `Removing ${containerName}`,
            });

            const resultAction = await dispatch(removeContainer({
                containerId: containerToRemove.Id,
                containerName
            }));

            if (removeContainer.fulfilled.match(resultAction)) {
                toast.success('✅ Container instance removed!', {
                    description: `${containerName} has been removed`,
                    duration: 5000,
                });
            } else if (removeContainer.rejected.match(resultAction)) {
                toast.error('❌ Error removing instance', {
                    description: resultAction.payload as string || 'An unknown error occurred',
                });
            }
        } catch (error) {
            console.error('Failed to remove container instance:', error);
            toast.error('❌ Error removing instance', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    };

    const handleContainerAction = async (container: ContainerInspectInfo, action: 'start' | 'stop') => {
        try {
            const containerName = container.Name.replace('wordpress-', '');

            if (action === 'start') {
                toast.info('▶️ Starting container...', {
                    description: `Starting ${containerName}`,
                });
                const resultAction = await dispatch(startContainer({ containerId: container.Id, containerName }));
                
                if (startContainer.fulfilled.match(resultAction)) {
                    toast.success('✅ Container started!');
                } else if (startContainer.rejected.match(resultAction)) {
                    toast.error('❌ Error starting container', {
                        description: resultAction.payload as string || 'An unknown error occurred',
                    });
                }
            } else {
                toast.info('⏹️ Stopping container...', {
                    description: `Stopping ${containerName}`,
                });
                const resultAction = await dispatch(stopContainer({ containerId: container.Id, containerName }));
                
                if (stopContainer.fulfilled.match(resultAction)) {
                    toast.success('✅ Container stopped!');
                } else if (stopContainer.rejected.match(resultAction)) {
                    toast.error('❌ Error stopping container', {
                        description: resultAction.payload as string || 'An unknown error occurred',
                    });
                }
            }
        } catch (error) {
            console.error(`Failed to ${action} container:`, error);
            toast.error(`❌ Error ${action}ing container`, {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    };

    const handleChangeUrl = () => {
        setIsChangeUrlDialogOpen(true);
    };

    return (
        <>
            <Card className="py-0">
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer transition-colors p-4 flex">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4"/>
                                    ) : (
                                        <ChevronRight className="h-4 w-4"/>
                                    )}
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Globe className="h-5 w-5"/>
                                            {project.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {totalCount} container{totalCount !== 1 ? 's' : ''} • {runningCount} running
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="text-right text-sm text-gray-600 mr-4">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Database className="h-3 w-3"/>
                                                {project.dbName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Globe className="h-3 w-3"/>
                                                {project.url}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleRemoveInstance}
                                            disabled={project.containers.length <= 1 || isAnyInstanceRemoving || isRetrievingAll}
                                        >
                                            <Minus className="h-3 w-3"/>
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleAddInstance}
                                            disabled={isCloning || isRetrievingAll}
                                        >
                                            <Plus className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <CardContent className="pb-4">
                            <div className="space-y-3 ml-7">
                                <div className="flex items-center justify-between w-full p-3 bg-black rounded-lg">
                                    <span className="text-sm font-medium ml-4">Project Actions</span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(project.dbName, 'Database name')}
                                            className="cursor-pointer"
                                            disabled={isRetrievingAll}
                                        >
                                            <Copy className="h-3 w-3 mr-1"/>
                                            Copy DB
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(project.url, 'URL')}
                                            className="cursor-pointer"
                                            disabled={isRetrievingAll}
                                        >
                                            <Copy className="h-3 w-3 mr-1"/>
                                            Copy URL
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleChangeUrl}
                                            className="cursor-pointer"
                                            disabled={isRetrievingAll}
                                        >
                                            <Settings className="h-3 w-3 mr-1"/>
                                            Change URL
                                        </Button>
                                        {project.url !== 'N/A' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={openUrl}
                                                className="cursor-pointer"
                                                disabled={isRetrievingAll}
                                            >
                                                <ExternalLink className="h-3 w-3 mr-1"/>
                                                Open
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Individual Containers */}
                                {project.containers.map((container) => {
                                    const instanceMatch = container.Name.match(/-(\d+)$/);
                                    const instanceNumber = instanceMatch ? instanceMatch[1] : '1';
                                    const isRunning = container.State.Status === 'running';

                                    return (
                                        <div
                                            key={container.Id}
                                            className="flex items-center justify-between p-3 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    operationStatus.starting[container.Id] ? 'bg-blue-500' :
                                                        operationStatus.stopping[container.Id] ? 'bg-yellow-500' :
                                                        operationStatus.removing[container.Id] ? 'bg-red-500' :
                                                        isRunning ? 'bg-green-500' : 'bg-gray-400'
                                                }`}/>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {project.name}
                                                            <span className="text-gray-500">-{instanceNumber}</span>
                                                        </span>
                                                        <Badge
                                                            variant={isRunning ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {
                                                                (operationStatus.starting[container.Id] ? 'starting' :
                                                                operationStatus.stopping[container.Id] ? 'stopping' :
                                                                operationStatus.removing[container.Id] ? 'removing' :
                                                                container.State.Status)
                                                            }
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Created {new Date(container.Created).toLocaleDateString('en-US')}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <ContainerLogsDialog
                                                    containerName={container.Name.replace('wordpress-', '')}
                                                    containerId={container.Id}
                                                    onGetLogs={() => window.electronAPI.docker.containers.getLogs(container.Id, { follow: true })}
                                                />

                                                {isRunning ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleContainerAction(container, 'stop')}
                                                        disabled={operationStatus.stopping[container.Id] || isRetrievingAll || operationStatus.removing[container.Id]}
                                                    >
                                                        <Square className="h-3 w-3"/>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleContainerAction(container, 'start')}
                                                        disabled={operationStatus.starting[container.Id] || isRetrievingAll || operationStatus.removing[container.Id]}
                                                    >
                                                        <Play className="h-3 w-3"/>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Change URL Dialog */}
            <WordPressChangeUrlDialog
                project={project}
                open={isChangeUrlDialogOpen}
                onOpenChange={setIsChangeUrlDialogOpen}
            />
        </>
    );
}
