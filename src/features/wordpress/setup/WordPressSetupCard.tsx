import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Server } from 'lucide-react';
import WordPressSetupProgress from './WordPressSetupProgress';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button.tsx";
import { StatusIndicator } from '@/components/StatusIndicator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { runWordPressSetup, selectWordPressSetupStatus } from '@/store/slices/wordpressSetupSlice';

interface WordPressSetupCardProps {
    onSetupComplete: () => void;
    onRetrySetup: () => void;
}

export default function WordPressSetupCard({ onSetupComplete, onRetrySetup }: WordPressSetupCardProps) {
    const dispatch = useAppDispatch();
    const status = useAppSelector(selectWordPressSetupStatus);
    const isRunning = status === 'running';
    const failed = status === 'error';
    const [forceSetup, setForceSetup] = useState(false);
    const prevStatus = useRef(status);

    // Auto-start if idle on mount
    useEffect(() => {
        if (status === 'idle') {
            dispatch(runWordPressSetup({ force: forceSetup }));
        }
    }, [status, dispatch, forceSetup]);

    // Toasts & callbacks
    useEffect(() => {
        if (prevStatus.current !== status) {
            if (status === 'success') {
                toast.success('🎉 WordPress infrastructure configured successfully!', {
                    description: 'You can now create WordPress sites.'
                });
                onSetupComplete();
            } else if (status === 'error') {
                toast.error('❌ Setup error', { description: 'An error occurred during setup.' });
            }
            prevStatus.current = status;
        }
    }, [status, onSetupComplete]);

    const handleRetrySetup = () => {
        if (!isRunning) {
            dispatch(runWordPressSetup({ force: forceSetup }));
            onRetrySetup();
        }
    };

    return (
        <div className="flex items-center justify-center w-full h-full p-4">
            <Card
                variant="glass"
                accent="glow"
                interactive={false}
                withHoverOverlay
                className="group relative overflow-hidden max-w-2xl w-full"
            >
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5"/>
                        WordPress Infrastructure Setup
                    </CardTitle>
                    <CardDescription className='mb-3'>
                        Setting up the infrastructure for your WordPress sites...
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {failed && (
                        <div className="flex flex-col gap-3 py-4">
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

                            <Button onClick={handleRetrySetup} disabled={isRunning} size="lg" className="w-full">
                                {isRunning ? (
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
                    <WordPressSetupProgress showDetailsInitial={false} />

                    <StatusIndicator status={isRunning ? 'running' : failed ? 'error' : status === 'success' ? 'success' : 'pending'} size="lg" />

                </CardContent>
            </Card>
        </div>
    );
}
