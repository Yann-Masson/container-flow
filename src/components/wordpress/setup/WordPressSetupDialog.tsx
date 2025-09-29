
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server } from 'lucide-react';
import { toast } from 'sonner';
import WordPressSetupProgress from './WordPressSetupProgress';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { runWordPressSetup, selectWordPressSetupStatus, selectWordPressSetup } from '@/store/slices/wordpressSetupSlice';
import WordPressSetupActionButton from './WordPressSetupActionButton';

interface WordPressSetupDialogProps {
    children: React.ReactNode;
}

export default function WordPressSetupDialog({ children }: WordPressSetupDialogProps) {
    const dispatch = useAppDispatch();
    const status = useAppSelector(selectWordPressSetupStatus);
    const fullSetup = useAppSelector(selectWordPressSetup);
    const isSetupRunning = status === 'running';
    const failed = status === 'error';
    const [open, setOpen] = useState(false);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const prevStatus = useRef(status);

    useEffect(() => {
        if (prevStatus.current !== status) {
            if (status === 'success') {
                toast.success('🎉 WordPress infrastructure configured successfully!', {
                    description: 'Traefik and MySQL are now available.'
                });
            } else if (status === 'error') {
                toast.error('❌ Setup error', { description: 'An error occurred during setup.' });
            }
            prevStatus.current = status;
        }
    }, [status]);

    const handleAction = () => {
        if (!isSetupRunning) dispatch(runWordPressSetup({}));
    };

    // Callback from progress component when details visibility toggles
    const handleDetailsVisibilityChange = useCallback((visible: boolean) => {
        setDetailsVisible(visible);
    }, []);

    // Determine dialog width classes.
    // Base (compact) = max-w-2xl. Expanded = larger width and maybe more height.
    const dialogWidthClass = detailsVisible
        ? 'sm:max-w-5xl w-full transition-[width,max-width] duration-500 ease-in-out'
        : 'sm:max-w-2xl w-full transition-[width,max-width] duration-500 ease-in-out';

    // Optional subtle scale animation when expanding
    const dialogMotionProps = {
        initial: false,
        animate: { scale: detailsVisible ? 1.0 : 1.0 },
        transition: { duration: 0.4, ease: 'easeInOut' }
    } as const;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className={`${dialogWidthClass} max-h-[90vh]`}>        
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5"/>
                        WordPress Infrastructure Setup
                    </DialogTitle>
                </DialogHeader>
                {/* AnimatePresence not strictly required around size but used for future content transitions */}
                <ScrollArea className="max-h-[calc(90vh-120px)] p-4">
                    <motion.div {...dialogMotionProps} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Configure the complete infrastructure to host your WordPress sites with Traefik and
                            MySQL.
                        </p>

                        {/* Retry section with force mode switch */}
                                                {failed && (
                                                    <div className="flex flex-col gap-3">
                                                        {fullSetup.error && (
                                                            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded p-2 whitespace-pre-wrap break-all">
                                                                {fullSetup.error}
                                                            </div>
                                                        )}
                                                        <WordPressSetupActionButton className="w-full" retryLabel="Re-Launch WordPress Setup" onAction={handleAction} />
                                                    </div>
                                                )}

                        {/* Initial launch button */}
                        {!failed && (
                            <div className="w-full p-2">
                                <WordPressSetupActionButton className="w-full" launchLabel="Launch WordPress Setup" onAction={handleAction} />
                            </div>
                        )}

                        <WordPressSetupProgress showDetailsInitial={false} onDetailsVisibilityChange={handleDetailsVisibilityChange} />
                    </motion.div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
