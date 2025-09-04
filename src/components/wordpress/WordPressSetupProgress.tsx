import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress.tsx";
import { CheckCircle, ChevronDown, ChevronUp, Database, Globe, Loader2, Server, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface SetupStep {
    id: string;
    label: string;
    icon: React.ReactNode;
    status: 'pending' | 'running' | 'completed' | 'error';
    description: string;
    statusMessage?: string;
}

interface ProgressEvent {
    step: string;
    status: 'starting' | 'completed' | 'error';
    message?: string;
}

interface WordPressSetupProgressProps {
    onComplete?: () => void;
    onError?: (error: Error) => void;
    showDetails?: boolean;
    autoStart?: boolean;
    force?: boolean;
}

export default function WordPressSetupProgress({
                                                   onComplete,
                                                   onError,
                                                   showDetails = false,
                                                   autoStart = false,
                                                   force = false
                                               }: WordPressSetupProgressProps) {
    const [isSetupRunning, setIsSetupRunning] = useState(false);
    const [showDetailsState, setShowDetailsState] = useState(showDetails);
    const [steps, setSteps] = useState<SetupStep[]>([
        {
            id: 'network',
            label: 'Creating CF-WP network',
            icon: <Globe className="h-4 w-4"/>,
            status: 'pending',
            description: 'The CF-WP network will enable communication between containers',
        },
        {
            id: 'traefik',
            label: 'Deploying Traefik',
            icon: <Server className="h-4 w-4"/>,
            status: 'pending',
            description: 'Traefik will serve as a reverse proxy to route traffic',
        },
        {
            id: 'mysql',
            label: 'Deploying MySQL',
            icon: <Database className="h-4 w-4"/>,
            status: 'pending',
            description: 'MySQL will store data for your WordPress sites',
        },
        {
            id: 'mysql-ready',
            label: 'Waiting for MySQL',
            icon: <Database className="h-4 w-4"/>,
            status: 'pending',
            description: 'Once configured, you can create as many WordPress sites as you want',
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
                    return { ...step, status: newStatus, statusMessage: message };
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

    const handleSetup = useCallback(async () => {
        if (isSetupRunning) return;

        try {
            setIsSetupRunning(true);
            resetSteps();

            const result = await window.electronAPI.docker.wordpress.setup({
                force
            });

            console.log('Setup completed:', result);
            onComplete?.();
        } catch (error) {
            console.error('Setup failed:', error);
            const setupError = error instanceof Error ? error : new Error('Unknown error occurred');
            onError?.(setupError);
        } finally {
            setIsSetupRunning(false);
        }
    }, [isSetupRunning, onComplete, onError]);

    useEffect(() => {
        if (autoStart && !isSetupRunning) {
            handleSetup().then();
        }
    }, [autoStart]);

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
        <div className="space-y-4">
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
                onClick={() => setShowDetailsState(!showDetailsState)}
                className="w-full"
            >
                {showDetailsState ? (
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
            {showDetailsState && (
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Setup Steps</h3>
                    <div className="space-y-2">
                        {steps.map((step, index) => (
                            <Tooltip key={step.id}>
                                <TooltipTrigger asChild>
                                    <div
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
                                                    <span
                                                        className="font-medium text-gray-900 dark:text-gray-100">{step.label}</span>
                                                    <Badge variant={getStepBadgeVariant(step.status)}
                                                        className="text-xs">
                                                        {getStepBadgeText(step.status)}
                                                    </Badge>
                                                </div>
                                                {step.statusMessage && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{step.statusMessage}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {index + 1}
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {step.description}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
