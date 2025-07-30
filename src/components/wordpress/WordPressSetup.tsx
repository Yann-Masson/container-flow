import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Server } from 'lucide-react';
import { toast } from 'sonner';
import WordPressSetupProgress from './WordPressSetupProgress';

interface WordPressSetupProps {
    children: React.ReactNode;
}

export default function WordPressSetup({ children }: WordPressSetupProps) {
    const [isSetupRunning, setIsSetupRunning] = useState(false);
    const [open, setOpen] = useState(false);
    const [failed, setFailed] = useState(false);
    const [forceSetup, setForceSetup] = useState(false);

    const handleSetupStart = () => {
        setIsSetupRunning(true);
    };

    const handleSetupComplete = () => {
        setIsSetupRunning(false);
        toast.success('🎉 WordPress infrastructure configured successfully!', {
            description: 'Traefik and MySQL are now available.',
        });
    };

    const handleSetupError = (error: Error) => {
        setIsSetupRunning(false);
        toast.error('❌ Setup error', {
            description: error.message,
        });
        setFailed(true);
    };

    const handleRetrySetup = () => {
        setIsSetupRunning(true);
        setFailed(false);
    };

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

                                <Button
                                    onClick={handleRetrySetup}
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
                                            Re-Launch WordPress Setup{forceSetup ? ' (Force)' : ''}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Initial launch button */}
                        {!failed && (
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleSetupStart}
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
                        )}

                        <WordPressSetupProgress
                            onComplete={handleSetupComplete}
                            onError={handleSetupError}
                            showDetails={false}
                            autoStart={isSetupRunning}
                            force={forceSetup}
                        />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
