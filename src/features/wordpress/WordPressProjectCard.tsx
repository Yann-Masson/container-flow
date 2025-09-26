import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
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

    // Animation variants
    const contentVariants = {
        collapsed: { height: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeInOut' } },
        open: {
            height: 'auto',
            opacity: 1,
            transition: {
                height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.25, delay: 0.05 },
                when: 'beforeChildren',
                staggerChildren: 0.05
            }
        }
    } as const;

    const listVariants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.05
            }
        }
    } as const;

    const itemVariants = {
        hidden: { y: 8, opacity: 0 },
        show: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 25 }
        }
    } as const;

    return (
        <>
            <Card
                variant="glass"
                accent="glow"
                interactive={false}
                withHoverOverlay
                className="group relative py-0 overflow-hidden"
            >
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer transition-colors p-4 flex relative overflow-hidden">
                            <div className="w-full relative z-10">
                                {/* Desktop Layout */}
                                <div className="hidden sm:flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                            className="text-muted-foreground"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </motion.div>
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Globe className="h-5 w-5"/>
                                                <motion.span layoutId={`wp-title-${project.name}`}>{project.name}</motion.span>
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 text-xs">
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="font-semibold text-foreground/90">{totalCount}</span>
                                                    container{totalCount !== 1 ? 's' : ''}
                                                </span>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="font-semibold text-foreground/90">{runningCount}</span>
                                                    running
                                                </span>
                                            </CardDescription>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="text-right text-sm text-gray-400 mr-4">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center flex-nowrap gap-1">
                                                    <Database className="h-3 w-3"/>
                                                    {project.dbName}
                                                </span>
                                                <span className="flex items-center gap-1 max-w-[200px] min-w-0">
                                                    <Globe className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{project.url}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {project.url !== 'N/A' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={openUrl}
                                                    className="cursor-pointer hover:shadow-md hover:shadow-primary/20 transition"
                                                    disabled={isRetrievingAll}
                                                >
                                                    <ExternalLink className="h-3 w-3"/>
                                                    <span className="hidden xs:inline">Open</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile/Tablet Layout */}
                                <div className="sm:hidden space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                                            <motion.div
                                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                                className="text-muted-foreground shrink-0"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </motion.div>
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="flex items-center gap-2 truncate">
                                                    <Globe className="h-5 w-5 shrink-0"/>
                                                    <span className="truncate">{project.name}</span>
                                                </CardTitle>
                                                <CardDescription className="hidden min-[301px]:block text-xs">
                                                    <p>{totalCount} container{totalCount !== 1 ? 's' : ''} • {runningCount} running</p>
                                                </CardDescription>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            {project.url !== 'N/A' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={openUrl}
                                                    className="cursor-pointer"
                                                    disabled={isRetrievingAll}
                                                >
                                                    <ExternalLink className="h-3 w-3"/>
                                                    <span className="hidden xs:inline">Open</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-row w-full items-center justify-around gap-2 text-sm text-gray-400 pl-7 hidden min-[301px]:flex">
                                        <span className="flex items-center gap-1 max-w-[200px] min-w-0">
                                            <Database className="h-3 w-3 shrink-0"/>
                                            <span className="truncate">{project.dbName}</span>
                                        </span>
                                        <span className="flex items-center gap-1 max-w-[200px] min-w-0">
                                            <Globe className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{project.url}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>

                    {/* Animated Content */}
                    <AnimatePresence initial={false}>
                        {isExpanded && (
                            <CollapsibleContent asChild forceMount>
                                <motion.div
                                    key="content"
                                    initial="collapsed"
                                    animate="open"
                                    exit="collapsed"
                                    variants={contentVariants}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <CardContent className="pb-4">
                                        <motion.div
                                            className="space-y-3 ml-3 sm:ml-7"
                                            variants={listVariants}
                                            initial="hidden"
                                            animate="show"
                                            exit="hidden"
                                        >
                                            {/* Service Actions */}
                                            <motion.div
                                                variants={itemVariants}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full p-3 bg-gradient-to-r from-black/70 to-black/40 rounded-lg gap-3 sm:gap-0"
                                            >
                                                <span className="text-sm font-medium sm:ml-4 tracking-wide text-foreground/90 flex items-center gap-2">
                                                    <motion.span
                                                        className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
                                                        animate={{ scale: isExpanded ? [1,1.4,1] : 1 }}
                                                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                                    />
                                                    Actions
                                                </span>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(project.dbName, 'Database name')}
                                                        className="cursor-pointer hover:shadow hover:shadow-primary/20 transition"
                                                        disabled={isRetrievingAll}
                                                    >
                                                        <Copy className="h-3 w-3 mr-1"/>
                                                        <span className="hidden md:inline">Copy DB</span>
                                                        <span className="md:hidden">DB</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(project.url, 'URL')}
                                                        className="cursor-pointer hover:shadow hover:shadow-primary/20 transition"
                                                        disabled={isRetrievingAll}
                                                    >
                                                        <Copy className="h-3 w-3 mr-1"/>
                                                        <span className="hidden md:inline">Copy URL</span>
                                                        <span className="md:hidden">URL</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleChangeUrl}
                                                        className="cursor-pointer hover:shadow hover:shadow-primary/20 transition"
                                                        disabled={isRetrievingAll}
                                                    >
                                                        <Settings className="h-3 w-3 mr-1"/>
                                                        <span className="hidden md:inline">Change URL</span>
                                                        <span className="md:hidden">URL</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleRemoveInstance}
                                                        disabled={project.containers.length <= 1 || isAnyInstanceRemoving || isRetrievingAll}
                                                        className="hover:shadow hover:shadow-primary/20 transition"
                                                    >
                                                        <Minus className="h-3 w-3"/>
                                                        <span className="hidden md:block">Remove</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleAddInstance}
                                                        disabled={isCloning || isRetrievingAll}
                                                        className="hover:shadow hover:shadow-primary/20 transition"
                                                    >
                                                        <Plus className="h-3 w-3"/>
                                                        <span className="hidden md:inline">Add</span>
                                                    </Button>
                                                </div>
                                            </motion.div>

                                            {/* Individual Containers */}
                                            {project.containers.map((container) => {
                                                const instanceMatch = container.Name.match(/-(\d+)$/);
                                                const instanceNumber = instanceMatch ? instanceMatch[1] : '1';
                                                const isRunning = container.State.Status === 'running';

                                                return (
                                                    <motion.div
                                                        key={container.Id}
                                                        variants={itemVariants}
                                                        layout
                                                        className="group/row relative flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3 sm:gap-0 bg-black/30 hover:bg-black/50 transition-colors ring-1 ring-white/5 overflow-hidden"
                                                    >
                                                        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.15),transparent_70%)]" />
                                                        <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10">
                                                            <motion.div
                                                                className={`w-2 h-2 rounded-full shrink-0 ${
                                                                    operationStatus.starting[container.Id] ? 'bg-blue-500' :
                                                                    operationStatus.stopping[container.Id] ? 'bg-yellow-500' :
                                                                    operationStatus.removing[container.Id] ? 'bg-red-500' :
                                                                    isRunning ? 'bg-green-500' : 'bg-gray-400'
                                                                }`}
                                                                layoutId={`status-dot-${container.Id}`}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                                                                    <span className="font-medium truncate">
                                                                        {project.name}
                                                                        <span className="text-gray-500">-{instanceNumber}</span>
                                                                    </span>
                                                                    <Badge
                                                                        variant={isRunning ? 'default' : 'secondary'}
                                                                        className="text-xs w-fit capitalize"
                                                                    >
                                                                        {
                                                                            (operationStatus.starting[container.Id] ? 'starting' :
                                                                            operationStatus.stopping[container.Id] ? 'stopping' :
                                                                            operationStatus.removing[container.Id] ? 'removing' :
                                                                            container.State.Status)
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    Created {new Date(container.Created).toLocaleDateString('en-US')}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 justify-end sm:justify-start relative z-10">
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
                                                                    className="hover:shadow hover:shadow-primary/20 transition"
                                                                >
                                                                    <Square className="h-3 w-3"/>
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleContainerAction(container, 'start')}
                                                                    disabled={operationStatus.starting[container.Id] || isRetrievingAll || operationStatus.removing[container.Id]}
                                                                    className="hover:shadow hover:shadow-primary/20 transition"
                                                                >
                                                                    <Play className="h-3 w-3"/>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </CardContent>
                                </motion.div>
                            </CollapsibleContent>
                        )}
                    </AnimatePresence>
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
