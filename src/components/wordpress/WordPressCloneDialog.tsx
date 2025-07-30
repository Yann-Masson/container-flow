import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Globe, Loader2 } from 'lucide-react';
import { ContainerInspectInfo } from "dockerode";
import { toast } from 'sonner';

interface WordPressCloneDialogProps {
    container: ContainerInspectInfo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCloneSuccess?: () => void;
}

export default function WordPressCloneDialog({
                                                 container,
                                                 open,
                                                 onOpenChange,
                                                 onCloneSuccess
                                             }: WordPressCloneDialogProps) {
    const [isCloning, setIsCloning] = useState(false);

    if (!container) return null;

    const match = container.Name.replace("wordpress-", "").match(/^(.*?)-(\d+)$/);
    const sourceName = match ? match[1] : container.Name;
    const sourceEnv = container.Config.Env || [];
    const dbName = sourceEnv.find(env => env.startsWith('WORDPRESS_DB_NAME='))?.replace('WORDPRESS_DB_NAME=', '') || 'N/A';
    const dbUser = sourceEnv.find(env => env.startsWith('WORDPRESS_DB_USER='))?.replace('WORDPRESS_DB_USER=', '') || 'N/A';

    const handleClone = async () => {
        if (isCloning) return;

        try {
            setIsCloning(true);

            toast.info('🔄 Cloning WordPress container...', {
                description: `Creating new container for ${sourceName}`,
            });

            const inspectedContainer = await window.electronAPI.docker.wordpress.clone(container);

            toast.success('✅ WordPress container cloned successfully!', {
                description: `${inspectedContainer.Name} has been created with shared database and files.`,
                duration: 5000,
            });

            onOpenChange(false);
            onCloneSuccess?.();
        } catch (error) {
            console.error('Failed to clone WordPress container:', error);
            toast.error('❌ Error during cloning', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsCloning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Copy className="h-5 w-5"/>
                        Clone WordPress Container
                    </DialogTitle>
                    <DialogDescription>
                        Create a new WordPress container that shares the same database and files as "{sourceName}"
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)] p-4">
                    <div className="space-y-4">
                        {/* Source Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Globe className="h-4 w-4"/>
                                    Source Container
                                </CardTitle>
                                <CardDescription>
                                    Information about the container being cloned
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Name:</span>
                                    <Badge variant="outline">{sourceName}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Database:</span>
                                    <code className="bg-black px-2 py-1 rounded text-sm">{dbName}</code>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Database User:</span>
                                    <code className="bg-black px-2 py-1 rounded text-sm">{dbUser}</code>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Shared Volume:</span>
                                    <code
                                        className="bg-black px-2 py-1 rounded text-sm">wordpress-{sourceName}-data</code>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCloning}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleClone}
                                disabled={isCloning}
                            >
                                {isCloning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Cloning...
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4"/>
                                        Clone Container
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
