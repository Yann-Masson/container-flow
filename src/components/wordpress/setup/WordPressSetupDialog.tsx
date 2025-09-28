
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Server } from 'lucide-react';
import { toast } from 'sonner';
import WordPressSetupProgress from './WordPressSetupProgress';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { runWordPressSetup, selectWordPressSetupStatus } from '@/store/slices/wordpressSetupSlice';

interface WordPressSetupDialogProps {
    children: React.ReactNode;
}

export default function WordPressSetupDialog({ children }: WordPressSetupDialogProps) {
    const dispatch = useAppDispatch();
    const status = useAppSelector(selectWordPressSetupStatus);
    const isSetupRunning = status === 'running';
    const failed = status === 'error';
    const [open, setOpen] = useState(false);
    const [forceSetup, setForceSetup] = useState(false);
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

    const handleSetupStart = () => {
        if (!isSetupRunning) {
            dispatch(runWordPressSetup({ force: forceSetup }));
        }
    };

    const handleRetrySetup = () => {
        if (!isSetupRunning) {
            dispatch(runWordPressSetup({ force: forceSetup }));
        }
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
                                <div className="flex items-center space-x-2 p-3 border-red-700 border-1 rounded-lg">
                                    <Switch
                                        id="force-setup-dialog"
                                        checked={forceSetup}
                                        onCheckedChange={setForceSetup}
                                        className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-red-200"
                                    />
                                    <Label htmlFor="force-setup-dialog" className="flex-1">
                                        <div className="text-sm text-red-600">
                                            Force the recreation of existing containers
                                        </div>
                                    </Label>
                                </div>

                                <Button onClick={handleRetrySetup} disabled={isSetupRunning} size="lg" className="w-full">
                                    {isSetupRunning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Setup in progress...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4" />
                                            Re-Launch WordPress Setup{forceSetup ? ' (Force)' : ''}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Initial launch button */}
                        {!failed && (
                            <div className="w-full p-2">
                                <Button
                                    variant={'default'}
                                    size="lg"
                                    onClick={handleSetupStart}
                                    disabled={isSetupRunning}
                                    className="w-full"
                                >
                                    {isSetupRunning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            Setup in progress...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4"/>
                                            Launch WordPress Setup
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        <WordPressSetupProgress showDetailsInitial={false} onDetailsVisibilityChange={handleDetailsVisibilityChange} />
                    </motion.div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
