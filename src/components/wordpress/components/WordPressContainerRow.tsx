import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Square, Play, ArrowUpCircle } from 'lucide-react';
import { itemVariants } from './variants';
import { ContainerInspectInfo } from 'dockerode';
import { ContainerLogsDialog } from '@/components/container/ContainerLogsDialog';

interface WordPressContainerRowProps {
    container: ContainerInspectInfo;
    projectName: string;
    isRunning: boolean;
    starting: boolean;
    stopping: boolean;
    removing: boolean;
    disabled: boolean;
    onAction: (container: ContainerInspectInfo, action: 'start' | 'stop') => void;
    updating: boolean;
    isOutdated: boolean;
    onUpdate?: (container: ContainerInspectInfo) => void;
}

export function WordPressContainerRow({
    container,
    projectName,
    isRunning,
    starting,
    stopping,
    removing,
    disabled,
    onAction,
    updating,
    isOutdated,
    onUpdate,
}: WordPressContainerRowProps) {
    const instanceMatch = container.Name.match(/-(\d+)$/);
    const instanceNumber = instanceMatch ? instanceMatch[1] : '1';

    return (
        <motion.div
            key={container.Id}
            variants={itemVariants}
            layout
            className='group/row relative flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3 sm:gap-0 bg-black/30 hover:bg-black/50 transition-colors ring-1 ring-white/5 overflow-hidden'
        >
            <div className='pointer-events-none absolute inset-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.15),transparent_70%)]' />
            <div className='flex items-center gap-3 min-w-0 flex-1 relative z-10'>
                <motion.div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                        starting
                            ? 'bg-blue-500'
                            : stopping
                              ? 'bg-yellow-500'
                              : removing
                                ? 'bg-red-500'
                                : isRunning
                                  ? 'bg-green-500'
                                  : 'bg-gray-400'
                    }`}
                    layoutId={`status-dot-${container.Id}`}
                />
                <div className='min-w-0 flex-1'>
                    <div className='flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2'>
                        <span className='font-medium truncate'>
                            {projectName}
                            <span className='text-gray-500'>-{instanceNumber}</span>
                        </span>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <Badge
                                variant={isRunning ? 'default' : 'secondary'}
                                className='text-xs w-fit capitalize'
                            >
                                {starting
                                    ? 'starting'
                                    : stopping
                                      ? 'stopping'
                                      : removing
                                        ? 'removing'
                                        : container.State.Status}
                            </Badge>
                            {isOutdated && (
                                <Badge variant='destructive' className='text-xs w-fit'>
                                    Outdated
                                </Badge>
                            )}
                        </div>
                    </div>
                    <div className='text-xs text-gray-400'>
                        Created {new Date(container.Created).toLocaleDateString('en-US')}
                    </div>
                </div>
            </div>

            <div className='flex items-center gap-2 justify-end sm:justify-start relative z-10'>
                <ContainerLogsDialog
                    containerName={container.Name.replace('wordpress-', '')}
                    containerId={container.Id}
                    onGetLogs={(searchOptions) =>
                        window.electronAPI.docker.containers.getLogs(
                            container.Id,
                            { follow: true },
                            searchOptions,
                        )
                    }
                />
                {isOutdated && onUpdate && (
                    <Button
                        size='sm'
                        variant='secondary'
                        onClick={() => onUpdate(container)}
                        disabled={disabled || removing || updating}
                        className='hover:shadow hover:shadow-primary/20 transition'
                    >
                        <ArrowUpCircle className={`h-3 w-3 ${updating ? 'animate-spin' : ''}`} />
                        <span className='ml-1 text-xs hidden sm:inline'>Update</span>
                    </Button>
                )}
                {isRunning ? (
                    <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onAction(container, 'stop')}
                        disabled={stopping || disabled || removing || updating}
                        className='hover:shadow hover:shadow-primary/20 transition'
                    >
                        <Square className='h-3 w-3' />
                    </Button>
                ) : (
                    <Button
                        size='sm'
                        variant='outline'
                        onClick={() => onAction(container, 'start')}
                        disabled={starting || disabled || removing || updating}
                        className='hover:shadow hover:shadow-primary/20 transition'
                    >
                        <Play className='h-3 w-3' />
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
