import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress.tsx";
import { ChevronDown, ChevronUp, Database, Globe, Server, Activity, BarChart2, HardDrive, Gauge } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusIndicator } from '@/components/StatusIndicator';

interface SetupStep {
    id: string;
    label: string;
    icon: React.ReactNode;
    status: 'pending' | 'running' | 'success' | 'error';
    description: string;
    statusMessage?: string;
}

interface ProgressEvent {
    step: string;
    status: 'starting' | 'success' | 'error';
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
    const initialSteps: SetupStep[] = [
        {
            id: 'network',
            label: 'Creating CF-WP network',
            icon: <Globe className="h-4 w-4" />,
            status: 'pending',
            description: 'The CF-WP network enables communication between infrastructure containers.'
        },
        {
            id: 'traefik',
            label: 'Deploying Traefik',
            icon: <Server className="h-4 w-4" />,
            status: 'pending',
            description: 'Traefik reverse proxy handles routing and TLS certificates.'
        },
        {
            id: 'mysql',
            label: 'Deploying MySQL',
            icon: <Database className="h-4 w-4" />,
            status: 'pending',
            description: 'MySQL stores WordPress data.'
        },
        {
            id: 'mysql-ready',
            label: 'Waiting for MySQL',
            icon: <Database className="h-4 w-4" />,
            status: 'pending',
            description: 'Ensuring MySQL is accepting connections.'
        },
        // Monitoring stack steps (added to UI so order is predictable)
        {
            id: 'cadvisor',
            label: 'Deploying cAdvisor',
            icon: <Activity className="h-4 w-4" />,
            status: 'pending',
            description: 'cAdvisor collects container CPU, Memory, IO metrics.'
        },
        {
            id: 'mysqld-exporter',
            label: 'Deploying MySQL Exporter',
            icon: <BarChart2 className="h-4 w-4" />,
            status: 'pending',
            description: 'Exports MySQL performance metrics for Prometheus.'
        },
        {
            id: 'prometheus',
            label: 'Deploying Prometheus',
            icon: <Gauge className="h-4 w-4" />,
            status: 'pending',
            description: 'Prometheus stores and queries time-series metrics.'
        },
        {
            id: 'grafana',
            label: 'Deploying Grafana',
            icon: <Server className="h-4 w-4" />,
            status: 'pending',
            description: 'Grafana provides dashboards for visualization.'
        },
        {
            id: 'grafana-provision',
            label: 'Provisioning Grafana',
            icon: <HardDrive className="h-4 w-4" />,
            status: 'pending',
            description: 'Configuring Prometheus datasource and default dashboards.'
        }
    ];

    const [steps, setSteps] = useState<SetupStep[]>(initialSteps);

    useEffect(() => {
        const removeListener = window.electronAPI.docker.wordpress.onSetupProgress((event: ProgressEvent) => {
            console.log('Setup progress:', event);
            updateStepStatus(event.step, event.status, event.message);
        });

        return () => {
            removeListener();
        };
    }, []);

    const idToFallback = (id: string): SetupStep => ({
        id,
        label: id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        icon: <Server className="h-4 w-4" />,
        status: 'pending',
        description: 'Automatically added step.'
    });

    const updateStepStatus = (stepId: string, status: 'starting' | 'success' | 'error', message?: string) => {
        setSteps(prevSteps => {
            // If step not found, inject it (dynamic unknown backend step)
            let found = prevSteps.find(s => s.id === stepId);
            if (!found) {
                prevSteps = [...prevSteps, idToFallback(stepId)];
            }
            return prevSteps.map(step => {
                if (step.id === stepId) {
                    let newStatus: SetupStep['status'];
                    switch (status) {
                        case 'starting': newStatus = 'running'; break;
                        case 'success': newStatus = 'success'; break;
                        case 'error': newStatus = 'error'; break;
                        default: newStatus = step.status;
                    }
                    return { ...step, status: newStatus, statusMessage: message };
                }
                return step;
            });
        });
    };

    const resetSteps = () => {
        setSteps(initialSteps.map(s => ({ ...s, status: 'pending', statusMessage: undefined })));
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

    const getStepBadgeVariant = (status: SetupStep['status']) => {
        switch (status) {
            case 'running':
                return 'default';
            case 'success':
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
            case 'success':
                return 'Completed';
            case 'error':
                return 'Error';
            default:
                return 'Pending';
        }
    };

    const completedSteps = steps.filter(step => step.status === 'success').length;
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return (
        <div className="space-y-4 w-full max-w-2xl mx-auto px-2 sm:px-4">
            {/* Progress bar is always visible when setup is running */}
            {(isSetupRunning || progress === 100) && (
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
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
                        <span className="hidden xs:inline">Hide Details</span>
                        <span className="inline xs:hidden">Hide</span>
                    </>
                ) : (
                    <>
                        <ChevronDown className="mr-2 h-4 w-4"/>
                        <span className="hidden xs:inline">Show Details</span>
                        <span className="inline xs:hidden">Show</span>
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
                                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                            step.status === 'running'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
                                                : step.status === 'success'
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-400'
                                                    : step.status === 'error'
                                                        ? 'border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-400'
                                                        : 'border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex flex-row items-center gap-3 w-full">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <StatusIndicator 
                                                        status={step.status} 
                                                        size="md"
                                                    />
                                                    {step.icon}
                                                </div>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                                                    <span
                                                        className="font-medium text-gray-900 dark:text-gray-100 truncate">{step.label}</span>
                                                    <Badge variant={getStepBadgeVariant(step.status)}
                                                        className="text-xs whitespace-nowrap">
                                                        {getStepBadgeText(step.status)}
                                                    </Badge>
                                                </div>
                                                {step.statusMessage && (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">{step.statusMessage}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0 sm:ml-4">
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
