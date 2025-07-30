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
import ChangeUrlDialog from './ChangeUrlDialog';

interface WordPressService {
    name: string;
    containers: ContainerInspectInfo[];
    dbName: string;
    dbUser: string;
    url: string;
}

interface WordPressServiceCardProps {
    service: WordPressService;
    onContainerUpdate: () => void;
}

export default function WordPressServiceCard({ service, onContainerUpdate }: WordPressServiceCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAddingInstance, setIsAddingInstance] = useState(false);
    const [isRemovingInstance, setIsRemovingInstance] = useState(false);
    const [isChangeUrlDialogOpen, setIsChangeUrlDialogOpen] = useState(false);

    const runningCount = service.containers.filter(c => c.State.Status === 'running').length;
    const totalCount = service.containers.length;

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`);
        } catch (error) {
            toast.error('Failed to copy to clipboard');
        }
    };

    const openUrl = async () => {
        if (service.url !== 'N/A') {
            try {
                await window.electronAPI.system.openExternal(`https://${service.url}`);
            } catch (error) {
                toast.error('Failed to open URL in browser');
                console.error('Error opening external URL:', error);
            }
        }
    };

    const handleAddInstance = async () => {
        if (isAddingInstance) return;

        try {
            setIsAddingInstance(true);

            // Find the highest instance number
            const instanceNumbers = service.containers.map(container => {
                const match = container.Name.match(/-(\d+)$/);
                return match ? parseInt(match[1]) : 1;
            });
            const nextInstanceNumber = Math.max(...instanceNumbers) + 1;

            toast.info('🚀 Adding new container instance...', {
                description: `Creating ${service.name}-${nextInstanceNumber}`,
            });

            // Use the last container as source for cloning
            const sourceContainer = service.containers[service.containers.length - 1];
            await window.electronAPI.docker.wordpress.clone(sourceContainer);

            toast.success('✅ New container instance added!', {
                description: `${service.name}-${nextInstanceNumber} is now available`,
                duration: 5000,
            });

            onContainerUpdate();
        } catch (error) {
            console.error('Failed to add container instance:', error);
            toast.error('❌ Error adding instance', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsAddingInstance(false);
        }
    };

    const handleRemoveInstance = async () => {
        if (isRemovingInstance || service.containers.length <= 1) return;

        try {
            setIsRemovingInstance(true);

            const containers = [...service.containers];

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

            // Stop and remove the container
            if (containerToRemove.State.Status === 'running') {
                await window.electronAPI.docker.containers.stop(containerToRemove.Id);
            }
            await window.electronAPI.docker.containers.remove(containerToRemove.Id, { force: true });

            toast.success('✅ Container instance removed!', {
                description: `${containerName} has been removed`,
                duration: 5000,
            });

            onContainerUpdate();
        } catch (error) {
            console.error('Failed to remove container instance:', error);
            toast.error('❌ Error removing instance', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsRemovingInstance(false);
        }
    };

    const handleContainerAction = async (container: ContainerInspectInfo, action: 'start' | 'stop') => {
        try {
            const containerName = container.Name.replace('wordpress-', '');

            if (action === 'start') {
                toast.info('▶️ Starting container...', {
                    description: `Starting ${containerName}`,
                });
                await window.electronAPI.docker.containers.start(container.Id);
                toast.success('✅ Container started!');
            } else {
                toast.info('⏹️ Stopping container...', {
                    description: `Stopping ${containerName}`,
                });
                await window.electronAPI.docker.containers.stop(container.Id);
                toast.success('✅ Container stopped!');
            }

            onContainerUpdate();
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

    const handleUrlChanged = () => {
        onContainerUpdate();
    };

    return (
        <>
            <Card>
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4"/>
                                    ) : (
                                        <ChevronRight className="h-4 w-4"/>
                                    )}
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Globe className="h-5 w-5"/>
                                            {service.name}
                                        </CardTitle>
                                        <CardDescription>
                                            {totalCount} container{totalCount !== 1 ? 's' : ''} • {runningCount} running
                                        </CardDescription>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <div className="text-right text-sm text-gray-600 mr-4">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Database className="h-3 w-3"/>
                                                {service.dbName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Globe className="h-3 w-3"/>
                                                {service.url}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRemoveInstance}
                                        disabled={service.containers.length <= 1 || isRemovingInstance}
                                    >
                                        <Minus className="h-3 w-3"/>
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleAddInstance}
                                        disabled={isAddingInstance}
                                    >
                                        <Plus className="h-3 w-3"/>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            <div className="space-y-3 ml-7">
                                {/* Service Actions */}
                                <div className="flex items-center gap-2 p-3 bg-black rounded-lg">
                                    <span className="text-sm font-medium">Service Actions:</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(service.dbName, 'Database name')}
                                    >
                                        <Copy className="h-3 w-3 mr-1"/>
                                        Copy DB
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyToClipboard(service.url, 'URL')}
                                    >
                                        <Copy className="h-3 w-3 mr-1"/>
                                        Copy URL
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleChangeUrl}
                                    >
                                        <Settings className="h-3 w-3 mr-1"/>
                                        Change URL
                                    </Button>
                                    {service.url !== 'N/A' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={openUrl}
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1"/>
                                            Open
                                        </Button>
                                    )}
                                </div>

                                {/* Individual Containers */}
                                {service.containers.map((container) => {
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
                                                    isRunning ? 'bg-green-500' : 'bg-gray-400'
                                                }`}/>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {service.name}
                                                            <span className="text-gray-500">-{instanceNumber}</span>
                                                        </span>
                                                        <Badge
                                                            variant={isRunning ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {container.State.Status}
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
                                                    onGetLogs={() => window.electronAPI.docker.containers.getLogs(container.Id, { follow: true })}
                                                />

                                                {isRunning ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleContainerAction(container, 'stop')}
                                                    >
                                                        <Square className="h-3 w-3"/>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleContainerAction(container, 'start')}
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
            <ChangeUrlDialog
                service={service}
                open={isChangeUrlDialogOpen}
                onOpenChange={setIsChangeUrlDialogOpen}
                onUrlChanged={handleUrlChanged}
            />
        </>
    );
}
