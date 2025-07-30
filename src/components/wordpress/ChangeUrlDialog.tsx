import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Globe, Loader2 } from 'lucide-react';
import { ContainerInspectInfo } from "dockerode";
import { toast } from 'sonner';

interface WordPressService {
    name: string;
    containers: ContainerInspectInfo[];
    dbName: string;
    dbUser: string;
    url: string;
}

interface ChangeUrlDialogProps {
    service: WordPressService | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUrlChanged?: () => void;
}

export default function ChangeUrlDialog({ service, open, onOpenChange, onUrlChanged }: ChangeUrlDialogProps) {
    const [isChanging, setIsChanging] = useState(false);
    const [newUrl, setNewUrl] = useState('');

    if (!service) return null;

    const validateUrl = () => {
        const errors: string[] = [];

        if (!newUrl.trim()) {
            errors.push('URL is required');
        } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newUrl)) {
            errors.push('URL must be valid (e.g. my-new-site.agence-lumia.com)');
        }

        if (newUrl === service.url) {
            errors.push('New URL must be different from current URL');
        }

        return errors;
    };

    const handleChangeUrl = async () => {
        if (isChanging) return;

        const errors = validateUrl();
        if (errors.length > 0) {
            toast.error('Validation errors', {
                description: errors.join(', '),
            });
            return;
        }

        try {
            setIsChanging(true);

            toast.info('🔄 Changing service URL...', {
                description: `Updating ${service.name} to ${newUrl}`,
            });

            // Process each container in the service
            for (const container of service.containers) {
                await recreateContainerWithNewUrl(container, newUrl);
            }

            toast.success('✅ Service URL changed successfully!', {
                description: `${service.name} is now accessible at https://${newUrl}`,
                duration: 5000,
            });

            setNewUrl('');
            onOpenChange(false);
            onUrlChanged?.();

        } catch (error) {
            console.error('Failed to change service URL:', error);
            toast.error('❌ Error changing URL', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsChanging(false);
        }
    };

    const recreateContainerWithNewUrl = async (container: ContainerInspectInfo, newUrl: string) => {
        const containerName = container.Name.replace('wordpress-', '');

        toast.info(`🔄 Recreating container ${containerName}...`);

        await window.electronAPI.docker.wordpress.changeUrl(container, newUrl);

        toast.success(`✅ Container ${containerName} recreated with new URL`);
    };

    const isFormValid = newUrl.trim() && validateUrl().length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5"/>
                        Change Service URL
                    </DialogTitle>
                    <DialogDescription>
                        Change the URL for WordPress service "{service.name}" and all its container instances
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)] p-4">
                    <div className="space-y-4">
                        {/* Current Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Globe className="h-4 w-4"/>
                                    Current Configuration
                                </CardTitle>
                                <CardDescription>
                                    Current settings for the WordPress service
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Service Name:</span>
                                    <code className="bg-black px-2 py-1 rounded text-sm">{service.name}</code>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Current URL:</span>
                                    <code className="bg-black px-2 py-1 rounded text-sm">{service.url}</code>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Container Count:</span>
                                    <code
                                        className="bg-black px-2 py-1 rounded text-sm">{service.containers.length}</code>
                                </div>
                            </CardContent>
                        </Card>

                        {/* New URL Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Globe className="h-4 w-4"/>
                                    New URL Configuration
                                </CardTitle>
                                <CardDescription>
                                    Enter the new URL for this WordPress service
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-url">New URL</Label>
                                    <Input
                                        id="new-url"
                                        placeholder="my-new-site.agence-lumia.com"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        disabled={isChanging}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Full domain (e.g. my-new-site.agence-lumia.com)
                                    </p>
                                </div>

                                {/* Preview */}
                                {newUrl && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h4 className="font-medium text-blue-900 mb-2">📋 URL Change Preview</h4>
                                        <div className="text-sm text-blue-800 space-y-1">
                                            <div><strong>Service:</strong> {service.name}</div>
                                            <div><strong>Old URL:</strong> {service.url}</div>
                                            <div><strong>New URL:</strong> {newUrl}</div>
                                            <div><strong>Containers to update:</strong> {service.containers.length}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Warning */}
                        <Card className="border-yellow-200 bg-yellow-50">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                                    <AlertTriangle className="h-4 w-4"/>
                                    Important Notice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-yellow-800">
                                <ul className="space-y-1">
                                    <li>• All containers in this service will be recreated with the new URL</li>
                                    <li>• The containers will be briefly unavailable during the update</li>
                                    <li>• Database and files will be preserved (volumes are maintained)</li>
                                    <li>• Traefik routing will be updated automatically</li>
                                    <li>• Make sure DNS is configured for the new domain</li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isChanging}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleChangeUrl}
                                disabled={!isFormValid || isChanging}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isChanging ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Changing URL...
                                    </>
                                ) : (
                                    <>
                                        <Globe className="mr-2 h-4 w-4"/>
                                        Change URL
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
