import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Server } from 'lucide-react';
import WordPressSetupProgress from './WordPressSetupProgress';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button.tsx";
import WordPressCreator from "@/components/wordpress/WordPressCreator.tsx";

export default function WordPressSetupCard() {
    const [setupCompleted, setSetupCompleted] = useState(false);
    const [minimumDelayPassed, setMinimumDelayPassed] = useState(false);
    const [timerProgress, setTimerProgress] = useState(0);
    const [failed, setFailed] = useState(false);
    const [start, setIsRunning] = useState(true);
    const [forceSetup, setForceSetup] = useState(false);

    useEffect(() => {
        setSetupCompleted(false);
        setMinimumDelayPassed(false);
        setTimerProgress(0);
        console.log("Starting WordPress setup...");

        const progressInterval = setInterval(() => {
            setTimerProgress(prev => {
                const newProgress = prev + 2;
                if (newProgress >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return newProgress;
            });
        }, 100);

        // Délai minimum de 5 secondes
        const timer = setTimeout(() => {
            setMinimumDelayPassed(true);
        }, 5000);

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, []);

    const handleSetupComplete = () => {
        setSetupCompleted(true);
        setIsRunning(false);
        toast.success('🎉 WordPress infrastructure configured successfully!', {
            description: 'You can now create WordPress sites.',
        });
    };

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
    };

    if (setupCompleted && minimumDelayPassed) {
        return <WordPressCreator/>;
    }

    return (
        <div className="flex items-center justify-center h-full p-4">
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

                    {!minimumDelayPassed && !failed && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Délai minimum avant transition</span>
                                <span>{Math.ceil((100 - timerProgress) / 20)}s restantes</span>
                            </div>
                            <Progress value={timerProgress} className="w-full"/>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
