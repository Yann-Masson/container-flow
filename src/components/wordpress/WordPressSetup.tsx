import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, ChevronDown, ChevronUp, Database, Globe, Loader2, Play, Server, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from "@/components/ui/progress.tsx";

interface SetupStep {
    id: string;
    label: string;
    icon: React.ReactNode;
    status: 'pending' | 'running' | 'completed' | 'error';
    message?: string;
}

interface ProgressEvent {
    step: string;
    status: 'starting' | 'completed' | 'error';
    message?: string;
}

interface WordPressSetupProps {
    children: React.ReactNode;
}

export default function WordPressSetup({ children }: WordPressSetupProps) {
    const [isSetupRunning, setIsSetupRunning] = useState(false);
    const [open, setOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [steps, setSteps] = useState<SetupStep[]>([
        {
            id: 'network',
            label: 'Creating CF-WP network',
            icon: <Globe className="h-4 w-4"/>,
            status: 'pending',
        },
        {
            id: 'traefik',
            label: 'Deploying Traefik',
            icon: <Server className="h-4 w-4"/>,
            status: 'pending',
        },
        {
            id: 'mysql',
            label: 'Deploying MySQL',
            icon: <Database className="h-4 w-4"/>,
            status: 'pending',
        },
        {
            id: 'mysql-ready',
            label: 'Waiting for MySQL',
            icon: <Database className="h-4 w-4"/>,
            status: 'pending',
        },
    ]);

    useEffect(() => {
        const removeListener = window.electronAPI.docker.wordpress.onSetupProgress((event: ProgressEvent) => {
            console.log('Setup progress:', event);
            updateStepStatus(event.step, event.status, event.message);
        });

        return () => {
            removeListener();
        };
    }, []);

    const updateStepStatus = (stepId: string, status: 'starting' | 'completed' | 'error', message?: string) => {
        setSteps(prevSteps =>
                prevSteps.map(step => {
                    if (step.id === stepId) {
                        let newStatus: SetupStep['status'];
                        switch (status) {
                            case 'starting':
                                newStatus = 'running';
                                break;
                            case 'completed':
                                newStatus = 'completed';
                                break;
                            case 'error':
                                newStatus = 'error';
                                break;
                            default:
                                newStatus = step.status;
                        }
                        return { ...step, status: newStatus, message };
                    }
                    return step;
                })
        );
    };

    const resetSteps = () => {
        setSteps(prevSteps =>
                prevSteps.map(step => ({ ...step, status: 'pending', message: undefined }))
        );
    };

    const handleSetup = async () => {
        if (isSetupRunning) return;

        try {
            setIsSetupRunning(true);
            resetSteps();

            const result = await window.electronAPI.docker.wordpress.setup();

            toast.success('🎉 WordPress infrastructure configured successfully!', {
                description: 'Traefik and MySQL are now available.',
            });

            console.log('Setup completed:', result);
        } catch (error) {
            console.error('Setup failed:', error);
            toast.error('❌ Setup error', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsSetupRunning(false);
        }
    };

    const getStepIcon = (step: SetupStep) => {
        switch (step.status) {
            case 'running':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500"/>;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500"/>;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-500"/>;
            default:
                return <div className="h-4 w-4 rounded-full border-2 border-gray-300"/>;
        }
    };

    const getStepBadgeVariant = (status: SetupStep['status']) => {
        switch (status) {
            case 'running':
                return 'default';
            case 'completed':
                return 'secondary';
            case 'error':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getStepBadgeText = (status: SetupStep['status']) => {
        switch (status) {
            case 'running':
                return 'Running...';
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Error';
            default:
                return 'Pending';
        }
    };

    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5"/>
                            WordPress Infrastructure Setup
                        </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="max-h-[calc(90vh-120px)] p-4">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Configure the complete infrastructure to host your WordPress sites with Traefik and
                                MySQL.
                            </p>

                            {/* Launch button */}
                            <div className="flex flex-col gap-3">
                                <Button
                                        onClick={handleSetup}
                                        disabled={isSetupRunning}
                                        size="lg"
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

                            {/* Progress bar is always visible when setup is running */}
                            {(isSetupRunning || progress === 100) && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Progress</span>
                                            <span>{completedSteps}/{totalSteps}</span>
                                        </div>
                                        <Progress value={progress}/>
                                    </div>
                            )}

                            {/* Toggle button for details */}
                            <Button
                                    variant="outline"
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="w-full"
                            >
                                {showDetails ? (
                                        <>
                                            <ChevronUp className="mr-2 h-4 w-4"/>
                                            Hide Details
                                        </>
                                ) : (
                                        <>
                                            <ChevronDown className="mr-2 h-4 w-4"/>
                                            Show Details
                                        </>
                                )}
                            </Button>

                            {/* Collapsible details section */}
                            {showDetails && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold">Setup Steps</h3>
                                        <div className="space-y-2">
                                            {steps.map((step, index) => (
                                                    <div
                                                            key={step.id}
                                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                                                    step.status === 'running'
                                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
                                                                            : step.status === 'completed'
                                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-400'
                                                                                    : step.status === 'error'
                                                                                            ? 'border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-400'
                                                                                            : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-shrink-0">
                                                                {getStepIcon(step)}
                                                            </div>
                                                            <div className="flex-grow">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{step.label}</span>
                                                                    <Badge variant={getStepBadgeVariant(step.status)}
                                                                           className="text-xs">
                                                                        {getStepBadgeText(step.status)}
                                                                    </Badge>
                                                                </div>
                                                                {step.message && (
                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{step.message}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                            ))}
                                        </div>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="font-medium text-blue-900 mb-2">ℹ️ Information</h4>
                                            <ul className="text-sm text-blue-800 space-y-1">
                                                <li>• The <code>CF-WP</code> network will enable communication between
                                                    containers
                                                </li>
                                                <li>• Traefik will serve as a reverse proxy to route traffic</li>
                                                <li>• MySQL will store data for your WordPress sites</li>
                                                <li>• Once configured, you can create as many WordPress sites as you
                                                    want
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                            )}

                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
    );
}
