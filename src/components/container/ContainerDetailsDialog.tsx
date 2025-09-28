import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { ContainerInfo, ContainerInspectInfo } from 'dockerode';
import { motion } from 'framer-motion';
import { ScrollArea } from '../ui/scroll-area';
import * as React from 'react';
import { dockerClientService } from '@/docker/docker-client';

interface ContainerDetailsDialogProps {
    container: ContainerInfo;
    containerName: string;
    getImageBadgeStyle: (image: string) => string;
    getStatusColor: (status: string) => string;
    children: React.ReactNode;
}

export function ContainerDetailsDialog({
    container,
    containerName,
    getImageBadgeStyle,
    getStatusColor,
    children,
}: ContainerDetailsDialogProps) {
    const SMALL_LIST_THRESHOLD = 6; // items before we lock height & scroll
    const [open, setOpen] = React.useState(false);
    const [inspect, setInspect] = React.useState<ContainerInspectInfo | null>(null);
    const [loadingInspect, setLoadingInspect] = React.useState(false);
    const hasLoadedRef = React.useRef(false);

    React.useEffect(() => {
        if (open && !hasLoadedRef.current) {
            (async () => {
                try {
                    setLoadingInspect(true);
                    const data = await dockerClientService.containers.get(container.Id);
                    setInspect(data as unknown as ContainerInspectInfo);
                    hasLoadedRef.current = true;
                } catch (e) {
                    console.warn('Failed to load container inspect', e);
                } finally {
                    setLoadingInspect(false);
                }
            })();
        }
    }, [open, container.Id]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className='sm:max-w-[640px] max-h-[90vh] p-0 overflow-hidden border border-white/10 bg-[#0b111b]/85 supports-[backdrop-filter]:bg-[#0b111b]/55 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl backdrop-saturate-150 shadow-xl shadow-black/40'>
                {/* Decorative glass overlays (non-interactive) */}
                <div className='pointer-events-none absolute inset-0'>
                    {/* Soft radial highlight */}
                    <div className='absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.12),transparent_60%)]' />
                    {/* Grain / noise (very light repeating pattern) */}
                    <div className='absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.6)_0px,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_3px)]' />
                </div>
                <ScrollArea className='max-h-[calc(90vh-40px)] relative'>
                    <div className='p-6 pr-4 space-y-6'>
                        <DialogHeader className='p-0'>
                            <DialogTitle className='text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]'>
                                {containerName}
                            </DialogTitle>
                            <DialogDescription className='text-[10px] uppercase tracking-[0.15em] text-white/50'>
                                Detailed container information
                            </DialogDescription>
                        </DialogHeader>

                        <div className='grid gap-6'>
                            {/* ID + Image */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                                className='grid grid-cols-1 sm:grid-cols-2 gap-5'
                            >
                                <div className='space-y-1 min-w-0'>
                                    <h3 className='text-[11px] font-semibold tracking-wide text-white/60'>
                                        ID
                                    </h3>
                                    <p className='select-text font-mono bg-white/5 border border-white/5 dark:bg-white/5/30 p-2 rounded-md overflow-auto break-all text-[11px] leading-relaxed'>
                                        {container.Id}
                                    </p>
                                </div>
                                <div className='space-y-1'>
                                    <h3 className='text-[11px] font-semibold tracking-wide text-white/60'>
                                        Image
                                    </h3>
                                    <Badge
                                        className={`${getImageBadgeStyle(
                                            container.Image,
                                        )} w-fit shadow-sm select-text`}
                                    >
                                        {container.Image}
                                    </Badge>
                                </div>
                            </motion.div>

                            {/* Status & Created */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className='grid grid-cols-1 sm:grid-cols-2 gap-5'
                            >
                                <div className='space-y-1'>
                                    <h3 className='text-[11px] font-semibold tracking-wide text-white/60'>
                                        Status
                                    </h3>
                                    <div className='flex items-center gap-2 text-sm'>
                                        <span
                                            className={`h-3 w-3 rounded-full ${getStatusColor(
                                                container.Status,
                                            )} shadow-[0_0_0_3px_rgba(255,255,255,0.08)]`}
                                        />
                                        <span className='font-medium text-white/85 select-text'>
                                            {container.Status}
                                        </span>
                                    </div>
                                </div>
                                <div className='space-y-1'>
                                    <h3 className='text-[11px] font-semibold tracking-wide text-white/60'>
                                        Created
                                    </h3>
                                    <p className='text-sm text-white/70 select-text'>
                                        {new Date(container.Created * 1000).toLocaleString()}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Ports */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className='space-y-2'
                            >
                                <h3 className='text-[11px] font-semibold tracking-wide text-white/60'>
                                    Ports
                                </h3>
                                {container.Ports && container.Ports.length > 0 ? (
                                    <div className='flex flex-wrap gap-2'>
                                        {container.Ports.map((port, index) => (
                                            <Badge
                                                key={index}
                                                variant='outline'
                                                className='bg-white/5 hover:bg-white/10 transition-colors border-white/10 text-[11px] font-medium shadow-[0_0_0_1px_rgba(255,255,255,0.05)] select-text'
                                            >
                                                {port.PublicPort
                                                    ? `${port.PublicPort}:${port.PrivatePort}`
                                                    : port.PrivatePort}{' '}
                                                {port.Type}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className='text-sm text-white/50'>No exposed ports</p>
                                )}
                            </motion.div>

                            {/* Labels */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className='space-y-2'
                            >
                                <h3 className='text-[11px] font-semibold tracking-wide text-white/60'>
                                    Labels
                                </h3>
                                {container.Labels && Object.keys(container.Labels).length > 0 ? (
                                    Object.keys(container.Labels).length > SMALL_LIST_THRESHOLD ? (
                                        <ScrollArea className='h-48 text-[11px] font-mono bg-white/5 border border-white/5 p-3 rounded-md leading-relaxed'>
                                            <div className='space-y-1'>
                                                {Object.entries(container.Labels).map(([key, value]) => (
                                                    <div key={key} className='flex gap-1'>
                                                        <span className='text-sky-300 font-medium'>
                                                            {key}
                                                        </span>
                                                        <span className='text-white/70 break-all select-text'>
                                                            : {value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className='text-[11px] font-mono bg-white/5 border border-white/5 p-3 rounded-md leading-relaxed space-y-1'>
                                            {Object.entries(container.Labels).map(([key, value]) => (
                                                <div key={key} className='flex gap-1'>
                                                    <span className='text-sky-300 font-medium'>
                                                        {key}
                                                    </span>
                                                    <span className='text-white/70 break-all select-text'>
                                                        : {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <p className='text-sm text-white/50'>No labels</p>
                                )}
                            </motion.div>

                            {/* Environment Variables */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className='space-y-2'
                            >
                                <h3 className='text-[11px] font-semibold tracking-wide text-white/60 flex items-center gap-2'>
                                    Environment{' '}
                                    <span className='text-[10px] font-normal text-white/40'>
                                        (runtime)
                                    </span>
                                </h3>
                                {loadingInspect && (
                                    <p className='text-xs text-white/40 animate-pulse'>
                                        Loading environment…
                                    </p>
                                )}
                                {!loadingInspect &&
                                inspect?.Config?.Env &&
                                inspect.Config.Env.length > 0 ? (
                                    inspect.Config.Env.length > SMALL_LIST_THRESHOLD ? (
                                        <ScrollArea className='h-48 text-[11px] font-mono bg-white/5 border border-white/5 p-3 rounded-md leading-relaxed'>
                                            <div className='space-y-1'>
                                                {inspect.Config.Env.map((pair) => {
                                                    const [k, ...rest] = pair.split('=');
                                                    const v = rest.join('=');
                                                    return (
                                                        <div key={k} className='flex gap-1'>
                                                            <span className='text-emerald-300 font-medium'>
                                                                {k}
                                                            </span>
                                                            <span className='text-white/70 break-all select-text'>
                                                                = {v}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className='text-[11px] font-mono bg-white/5 border border-white/5 p-3 rounded-md leading-relaxed space-y-1'>
                                            {inspect.Config.Env.map((pair) => {
                                                const [k, ...rest] = pair.split('=');
                                                const v = rest.join('=');
                                                return (
                                                    <div key={k} className='flex gap-1'>
                                                        <span className='text-emerald-300 font-medium'>
                                                            {k}
                                                        </span>
                                                        <span className='text-white/70 break-all select-text'>
                                                            = {v}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                ) : !loadingInspect ? (
                                    <p className='text-sm text-white/50'>
                                        No environment variables
                                    </p>
                                ) : null}
                            </motion.div>

                            {/* Volumes / Mounts */}
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className='space-y-2'
                            >
                                <h3 className='text-[11px] font-semibold tracking-wide text-white/60 flex items-center gap-2'>
                                    Volumes{' '}
                                    <span className='text-[10px] font-normal text-white/40'>
                                        (mounts)
                                    </span>
                                </h3>
                                {loadingInspect && (
                                    <p className='text-xs text-white/40 animate-pulse'>
                                        Loading mounts…
                                    </p>
                                )}
                                {!loadingInspect && inspect?.Mounts && inspect.Mounts.length > 0 ? (
                                    inspect.Mounts.length > SMALL_LIST_THRESHOLD ? (
                                        <ScrollArea className='h-48 text-[11px] font-mono bg-white/5 border border-white/5 p-3 rounded-md leading-relaxed'>
                                            <div className='space-y-1'>
                                                {inspect.Mounts.map((m) => (
                                                    <div
                                                        key={m.Destination + m.Source}
                                                        className='flex flex-col gap-0.5'
                                                    >
                                                        <div className='flex flex-wrap items-center gap-2'>
                                                            <span className='text-sky-300 font-medium'>
                                                                {m.Type}
                                                            </span>
                                                            <span className='text-white/60'>→</span>
                                                            <span className='text-white/80 break-all select-text'>
                                                                {m.Destination}
                                                            </span>
                                                        </div>
                                                        <div className='text-white/50 break-all pl-1 select-text'>
                                                            {m.Source}
                                                        </div>
                                                        {m.RW === false && (
                                                            <span className='text-[10px] text-amber-300/70 pl-1'>
                                                                read-only
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    ) : (
                                        <div className='text-[11px] font-mono bg-white/5 border border-white/5 p-3 rounded-md leading-relaxed space-y-1'>
                                            {inspect.Mounts.map((m) => (
                                                <div
                                                    key={m.Destination + m.Source}
                                                    className='flex flex-col gap-0.5'
                                                >
                                                    <div className='flex flex-wrap items-center gap-2'>
                                                        <span className='text-sky-300 font-medium'>
                                                            {m.Type}
                                                        </span>
                                                        <span className='text-white/60'>→</span>
                                                        <span className='text-white/80 break-all select-text'>
                                                            {m.Destination}
                                                        </span>
                                                    </div>
                                                    <div className='text-white/50 break-all pl-1 select-text'>
                                                        {m.Source}
                                                    </div>
                                                    {m.RW === false && (
                                                        <span className='text-[10px] text-amber-300/70 pl-1'>
                                                            read-only
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : !loadingInspect ? (
                                    <p className='text-sm text-white/50'>No mounts</p>
                                ) : null}
                            </motion.div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
