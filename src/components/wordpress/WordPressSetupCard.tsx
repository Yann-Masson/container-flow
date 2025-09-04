import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Server } from 'lucide-react';
import WordPressSetupProgress from './WordPressSetupProgress';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button.tsx";
import WordPressCreator from "@/components/wordpress/WordPressCreator.tsx";
import { StatusIndicator } from './StatusIndicator';

type TransitionState = 'setup' | 'transitioning' | 'creator';

export default function WordPressSetupCard() {
    const [setupCompleted, setSetupCompleted] = useState(false);

    const [failed, setFailed] = useState(false);
    const [start, setIsRunning] = useState(true);
    const [forceSetup, setForceSetup] = useState(false);
    const [transitionState, setTransitionState] = useState<TransitionState>('setup');

    useEffect(() => {
        setSetupCompleted(false);
        console.log("Starting WordPress setup...");
    }, []);

    const handleSetupComplete = () => {
        setSetupCompleted(true);
        setIsRunning(false);
        toast.success('🎉 WordPress infrastructure configured successfully!', {
            description: 'You can now create WordPress sites.',
        });
    };

    useEffect(() => {
        if (setupCompleted && transitionState === 'setup') {
            // Wait 2 seconds after setup completion before transitioning
            const transitionTimer = setTimeout(() => {
                setTransitionState('transitioning');
            }, 2000);

            return () => clearTimeout(transitionTimer);
        }
    }, [setupCompleted, transitionState]);

    useEffect(() => {
        if (transitionState === 'transitioning') {
            const transitionTimer = setTimeout(() => {
                setTransitionState('creator');
            }, 300); // Duration of the transition

            return () => clearTimeout(transitionTimer);
        }
    }, [transitionState]);

    const handleSetupError = (error: Error) => {
        toast.error('❌ Setup error', {
            description: error.message,
        });

        setFailed(true);
        setIsRunning(false);
    };

    const handleRetrySetup = () => {
        setIsRunning(true);
        setSetupCompleted(false);
        setTransitionState('setup');
    };

    // Render based on transition state
    if (transitionState === 'creator') {
        console.log("Transitioning to creator");
        return (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <WordPressCreator/>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center h-full p-4 transition-all duration-500 ${
            transitionState === 'transitioning' 
                ? 'opacity-0 scale-95 translate-y-4' 
                : 'opacity-100 scale-100 translate-y-0'
        }`}>
            <Card className="w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5"/>
                        WordPress Infrastructure Setup
                    </CardTitle>
                    <CardDescription>
                        Setting up the infrastructure for your WordPress sites...
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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

                            <Button
                                onClick={handleRetrySetup}
                                disabled={start}
                                size="lg"
                                className="w-full"
                            >
                                {start ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Setup in progress...
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4"/>
                                        Re-Launch WordPress Setup{forceSetup ? ' (Force)' : ''}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}


                    <WordPressSetupProgress
                        onComplete={handleSetupComplete}
                        onError={handleSetupError}
                        showDetails={false}
                        autoStart={start}
                        force={forceSetup}
                    />

                    <StatusIndicator status={start ? "running" : "success"} size="lg"/>

                </CardContent>
            </Card>
        </div>
    );
}
