import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Server } from 'lucide-react';
import WordPressSetupProgress from './WordPressSetupProgress';
import { toast } from 'sonner';
import WordPressSetupActionButton from './WordPressSetupActionButton';
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
    const prevStatus = useRef(status);

    // Auto-start if idle on mount
    useEffect(() => {
        if (status === 'idle') {
            dispatch(runWordPressSetup({}));
        }
    }, [status, dispatch]);

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
            dispatch(runWordPressSetup({}));
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
                            <WordPressSetupActionButton
                                className="w-full"
                                retryLabel="Re-Launch WordPress Setup"
                                onAction={handleRetrySetup}
                            />
                        </div>
                    )}
                    <WordPressSetupProgress showDetailsInitial={false} />

                    <StatusIndicator status={isRunning ? 'running' : failed ? 'error' : status === 'success' ? 'success' : 'pending'} size="lg" />

                </CardContent>
            </Card>
        </div>
    );
}
