import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Database, Globe, Loader2, Play, Server, XCircle } from 'lucide-react';
import { toast } from 'sonner';

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

export default function WordPressSetup() {
    const [isSetupRunning, setIsSetupRunning] = useState(false);
    const [steps, setSteps] = useState<SetupStep[]>([
        {
            id: 'setup',
            label: 'Initialisation du setup',
            icon: <Play className="h-4 w-4"/>,
            status: 'pending',
        },
        {
            id: 'network',
            label: 'Création du réseau CF-WP',
            icon: <Globe className="h-4 w-4"/>,
            status: 'pending',
        },
        {
            id: 'traefik',
            label: 'Déploiement de Traefik',
            icon: <Server className="h-4 w-4"/>,
            status: 'pending',
        },
        {
            id: 'mysql',
            label: 'Déploiement de MySQL',
            icon: <Database className="h-4 w-4"/>,
            status: 'pending',
        },
        {
            id: 'mysql-ready',
            label: 'Attente de MySQL',
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

            toast.success('🎉 Infrastructure WordPress configurée avec succès !', {
                description: 'Traefik et MySQL sont maintenant disponibles.',
            });

            console.log('Setup completed:', result);
        } catch (error) {
            console.error('Setup failed:', error);
            toast.error('❌ Erreur lors du setup', {
                description: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
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
                return 'En cours...';
            case 'completed':
                return 'Terminé';
            case 'error':
                return 'Erreur';
            default:
                return 'En attente';
        }
    };

    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5"/>
                            Configuration WordPress Infrastructure
                        </CardTitle>
                        <CardDescription>
                            Configurez l'infrastructure complète pour héberger vos sites WordPress avec Traefik et
                            MySQL.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Bouton de lancement */}
                        <div className="flex flex-col gap-4">
                            <Button
                                    onClick={handleSetup}
                                    disabled={isSetupRunning}
                                    size="lg"
                                    className="w-full"
                            >
                                {isSetupRunning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                            Configuration en cours...
                                        </>
                                ) : (
                                        <>
                                            <Play className="mr-2 h-4 w-4"/>
                                            Lancer le setup WordPress
                                        </>
                                )}
                            </Button>

                            {isSetupRunning && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Progression</span>
                                            <span>{completedSteps}/{totalSteps}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">Étapes du setup</h3>
                            <div className="space-y-2">
                                {steps.map((step, index) => (
                                        <div
                                                key={step.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                                                        step.status === 'running'
                                                                ? 'border-blue-200 bg-blue-50'
                                                                : step.status === 'completed'
                                                                        ? 'border-green-200 bg-green-50'
                                                                        : step.status === 'error'
                                                                                ? 'border-red-200 bg-red-50'
                                                                                : 'border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {getStepIcon(step)}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{step.label}</span>
                                                        <Badge variant={getStepBadgeVariant(step.status)}
                                                               className="text-xs">
                                                            {getStepBadgeText(step.status)}
                                                        </Badge>
                                                    </div>
                                                    {step.message && (
                                                            <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {index + 1}
                                            </div>
                                        </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informations</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Le réseau <code>CF-WP</code> permettra la communication entre containers</li>
                                <li>• Traefik servira de reverse proxy pour router le trafic</li>
                                <li>• MySQL stockera les données de vos sites WordPress</li>
                                <li>• Une fois configuré, vous pourrez créer autant de sites WordPress que souhaité</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
    );
}
