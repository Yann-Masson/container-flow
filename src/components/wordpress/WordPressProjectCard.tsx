import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
// Icons now handled inside subcomponents
import { ContainerInspectInfo } from "dockerode";
import { toast } from 'sonner';
// Logs dialog handled inside WordPressContainerRow component
import WordPressChangeUrlDialog from './WordPressChangeUrlDialog';
import { WordPressDeleteDialog } from './WordPressDeleteDialog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { cloneContainer, startContainer, stopContainer, removeContainer } from '@/store/slices/wordpressSlice';
import { 
    selectIsCloning,
    selectIsRetrievingAll,
    selectOperationStatus,
    selectIsProjectDeleting
} from '@/store/selectors/containerSelectors';
import { WordPressProject } from '@/store/types/container';
import { WordPressProjectHeader } from './components/WordPressProjectHeader';
import { WordPressProjectActions } from './components/WordPressProjectActions';
import { WordPressContainerRow } from './components/WordPressContainerRow';
import { contentVariants, listVariants } from './components/variants';

interface WordPressProjectCardProps {
    project: WordPressProject;
}

export default function WordPressProjectCard({ project }: WordPressProjectCardProps) {
    const dispatch = useAppDispatch();
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChangeUrlDialogOpen, setIsChangeUrlDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const isRetrievingAll = useAppSelector(selectIsRetrievingAll);
    
    // Redux selectors for operation states (per service cloning)
    const isCloning = useAppSelector(selectIsCloning(project.name));
    
    // Single selector for all operation statuses to avoid dynamic hook calls
    const operationStatus = useAppSelector(selectOperationStatus);
    const isAnyInstanceRemoving = project.containers.some(c => operationStatus.removing[c.Id]);
    const isDeletingProject = useAppSelector(selectIsProjectDeleting(project.name));

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

    // Variants extracted to external module

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
                            <WordPressProjectHeader
                                project={project}
                                isExpanded={isExpanded}
                                runningCount={runningCount}
                                totalCount={totalCount}
                                onOpenUrl={openUrl}
                                disabled={isRetrievingAll || isDeletingProject}
                            />
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
                                            <WordPressProjectActions
                                                dbName={project.dbName}
                                                url={project.url}
                                                disabled={isRetrievingAll || isDeletingProject}
                                                isCloning={isCloning}
                                                canRemoveInstance={project.containers.length > 1 && !isAnyInstanceRemoving}
                                                onCopy={copyToClipboard}
                                                onChangeUrl={handleChangeUrl}
                                                onRemoveInstance={handleRemoveInstance}
                                                onAddInstance={handleAddInstance}
                                                onDeleteProject={() => { setIsDeleteDialogOpen(true); }}
                                                isDeleting={isDeletingProject}
                                            />

                                            {/* Individual Containers */}
                                            {project.containers.map((container) => (
                                                <WordPressContainerRow
                                                    key={container.Id}
                                                    container={container}
                                                    projectName={project.name}
                                                    isRunning={container.State.Status === 'running'}
                                                    starting={!!operationStatus.starting[container.Id]}
                                                    stopping={!!operationStatus.stopping[container.Id]}
                                                    removing={!!operationStatus.removing[container.Id]}
                                                    disabled={isRetrievingAll || isDeletingProject}
                                                    onAction={handleContainerAction}
                                                />
                                            ))}
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
            <WordPressDeleteDialog
                projectName={project.name}
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            />
        </>
    );
}
