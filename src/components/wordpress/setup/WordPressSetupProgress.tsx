import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Globe, Server, Database, Activity, BarChart2, Cpu, Gauge, HardDrive } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusIndicator } from '@/components/StatusIndicator';
import { useAppSelector } from '@/store/hooks';
import { selectWordPressSetupIsRunning, selectWordPressSetupSteps, runWordPressSetup } from '@/store/slices/wordpressSetupSlice';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/store/hooks';
import { Loader2, Play } from 'lucide-react';

interface WordPressSetupProgressProps {
    showDetailsInitial?: boolean;
    onDetailsVisibilityChange?: (visible: boolean) => void;
}

export default function WordPressSetupProgress({
    showDetailsInitial = false,
    onDetailsVisibilityChange
}: WordPressSetupProgressProps) {
    const dispatch = useAppDispatch();
    const isSetupRunning = useAppSelector(selectWordPressSetupIsRunning);
    const steps = useAppSelector(selectWordPressSetupSteps);
    const [showDetailsState, setShowDetailsState] = useState(showDetailsInitial);
    const [grafanaAuthNeeded, setGrafanaAuthNeeded] = useState(false);
    const [grafanaUsername, setGrafanaUsername] = useState('');
    const [grafanaPassword, setGrafanaPassword] = useState('');
    const unauthorizedDetectedRef = useRef(false);

  // Parent width coordination (unchanged logic)
  useEffect(() => {
    if (!onDetailsVisibilityChange) return;
    if (showDetailsState) {
      onDetailsVisibilityChange(true);
    } else {
      const timeout = setTimeout(() => onDetailsVisibilityChange(false), 350);
      return () => clearTimeout(timeout);
    }
  }, [showDetailsState, onDetailsVisibilityChange]);

  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'globe': return <Globe className="h-4 w-4" />;
      case 'server': return <Server className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'activity': return <Activity className="h-4 w-4" />;
      case 'barchart2': return <BarChart2 className="h-4 w-4" />;
      case 'cpu': return <Cpu className="h-4 w-4" />;
      case 'gauge': return <Gauge className="h-4 w-4" />;
      case 'harddrive': return <HardDrive className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

    const getStepBadgeVariant = (status: any) => {
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

    const getStepBadgeText = (status: any) => {
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

    // Detect unauthorized Grafana provisioning failure
    useEffect(() => {
        if (unauthorizedDetectedRef.current) return; // avoid flipping UI repeatedly
        const grafanaProvStep = steps.find(s => s.id === 'grafana-provision');
        if (grafanaProvStep && grafanaProvStep.status === 'error') {
            const msg = grafanaProvStep.statusMessage || '';
            if (/401/i.test(msg) || /unauthorized/i.test(msg)) {
                setGrafanaAuthNeeded(true);
                unauthorizedDetectedRef.current = true;
            }
        }
    }, [steps]);

    const handleRetry = useCallback(() => {
        if (isSetupRunning) return;
        dispatch(runWordPressSetup({
            grafanaAuth: grafanaAuthNeeded && grafanaUsername && grafanaPassword ? { username: grafanaUsername, password: grafanaPassword } : undefined
        }));
    }, [dispatch, grafanaAuthNeeded, grafanaUsername, grafanaPassword, isSetupRunning]);

    return (
                <div className="space-y-4 w-full max-w-2xl mx-auto px-2 sm:px-4">
                        {grafanaAuthNeeded && (
                            <div className="space-y-3 p-3 border rounded-md">
                                <p className="text-sm font-medium">Grafana credentials required</p>
                                <p className="text-xs text-muted-foreground">Provisioning failed due to invalid default credentials. Enter the current Grafana admin credentials and retry.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium" htmlFor="grafana-username">Username</label>
                                        <Input id="grafana-username" value={grafanaUsername} onChange={e => setGrafanaUsername(e.target.value)} placeholder="admin" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-medium" htmlFor="grafana-password">Password</label>
                                        <Input id="grafana-password" type="password" value={grafanaPassword} onChange={e => setGrafanaPassword(e.target.value)} placeholder="••••••" />
                                    </div>
                                </div>
                                <Button disabled={isSetupRunning} onClick={handleRetry} className="w-full">
                                    {isSetupRunning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Retrying...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4" />
                                            Retry Setup with Grafana Credentials
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
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
                className="w-full m-0"
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

            {/* Collapsible details section (kept mounted for smooth height animation) */}
            <motion.div
                key="details-wrapper"
                initial={false}
                animate={showDetailsState ? 'open' : 'closed'}
                variants={{
                    open: { height: 'auto', opacity: 1, marginTop: 0 },
                    closed: { height: 0, opacity: 0, marginTop: 0 }
                }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="overflow-hidden"
            >
                <div className="space-y-3 mt-2">
                    <h3 className="text-lg font-semibold">Setup Steps</h3>
                    <motion.div
                        className="space-y-2"
                        initial={false}
                        animate={showDetailsState ? 'visible' : 'hidden'}
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.05 } }
                        }}
                    >
                        {steps.map((step, index) => (
                            <Tooltip key={step.id}>
                                <TooltipTrigger asChild>
                                    <motion.div
                                        layout
                                        variants={{
                                            hidden: { opacity: 0, y: 8 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border shadow-sm transition-colors duration-300 ${
                                            step.status === 'running'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-400'
                                                : step.status === 'success'
                                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/40 dark:border-green-400'
                                                    : step.status === 'error'
                                                        ? 'border-red-500 bg-red-50 dark:bg-red-950/40 dark:border-red-400'
                                                        : 'border-gray-300 bg-gray-50 dark:bg-gray-800/40 dark:border-gray-600'
                                        }`}
                                    >
                                        <div className="flex flex-row items-center gap-3 w-full">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <StatusIndicator status={step.status} size="md" />
                                                    {renderIcon(step.icon)}
                                                </div>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{step.label}</span>
                                                    <Badge variant={getStepBadgeVariant(step.status)} className="text-xs whitespace-nowrap">
                                                        {getStepBadgeText(step.status)}
                                                    </Badge>
                                                </div>
                                                {step.statusMessage && (
                                                    <div className="mt-1 text-xs text-muted-foreground break-all whitespace-pre-wrap">{step.statusMessage}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0 sm:ml-4">
                                            {index + 1}
                                        </div>
                                    </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {step.description}
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
