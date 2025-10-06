import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Globe, Loader2 } from 'lucide-react';
import { ContainerInspectInfo } from 'dockerode';
import { toast } from 'sonner';

export interface WordPressProject {
    name: string;
    containers: ContainerInspectInfo[];
    dbName: string;
    dbUser: string;
    url: string;
}

interface WordPressChangeUrlDialogProps {
    project: WordPressProject | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUrlChanged?: () => void;
}

export default function WordPressChangeUrlDialog({
    project,
    open,
    onOpenChange,
    onUrlChanged,
}: WordPressChangeUrlDialogProps) {
    const [isChanging, setIsChanging] = useState(false);
    const [newUrl, setNewUrl] = useState('');

    if (!project) return null;

    const validateUrl = () => {
        const errors: string[] = [];

        if (!newUrl.trim()) {
            errors.push('URL is required');
        } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newUrl)) {
            errors.push('URL must be valid (e.g. my-new-site.agence-lumia.com)');
        }

        if (newUrl === project.url) {
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

            toast.info('🔄 Changing project URL...', {
                description: `Updating ${project.name} to ${newUrl}`,
            });

            // Process each container in the project
            for (const container of project.containers) {
                await recreateContainerWithNewUrl(container, newUrl);
            }

            toast.success('✅ Project URL changed successfully!', {
                description: `${project.name} is now accessible at https://${newUrl}`,
                duration: 5000,
            });

            setNewUrl('');
            onOpenChange(false);
            onUrlChanged?.();
        } catch (error) {
            console.error('Failed to change project URL:', error);
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
            <DialogContent className='max-w-[90vw] max-h-[90vh]'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Globe className='h-5 w-5 shrink-0' />
                        <span>Change Project URL</span>
                    </DialogTitle>
                </DialogHeader>

                <div className='select-none flex flex-col items-center justify-center min-[250px]:hidden overflow-hidden'>
                    <p className='text-center text-gray-500 px-4'>
                        Container Flow is designed for screens wider than 250px. Please resize your
                        window.
                    </p>
                </div>

                <ScrollArea className='max-h-[calc(90vh-160px)] w-full min-w-0 hidden min-[250px]:flex'>
                    <div className='py-4'>
                        Change the URL for WordPress project "{project.name}" and all its container
                        instances
                    </div>
                    <div className='space-y-4 sm:space-y-6 w-full min-w-0 pt-4'>
                        {/* Current Configuration */}
                        <div className='space-y-3 w-full min-w-0'>
                            <h3 className='text-sm font-semibold flex items-center gap-2'>
                                <Globe className='h-4 w-4 shrink-0' />
                                Current Configuration
                            </h3>
                            <div className='space-y-2 text-sm'>
                                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2'>
                                    <span className='font-medium text-muted-foreground'>
                                        Project Name:
                                    </span>
                                    <code className='bg-muted px-2 py-1 rounded text-xs sm:text-sm truncate select-text'>
                                        {project.name}
                                    </code>
                                </div>
                                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2'>
                                    <span className='font-medium text-muted-foreground'>
                                        Current URL:
                                    </span>
                                    <code className='bg-muted px-2 py-1 rounded text-xs sm:text-sm truncate select-text'>
                                        {project.url}
                                    </code>
                                </div>
                                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2'>
                                    <span className='font-medium text-muted-foreground'>
                                        Container Count:
                                    </span>
                                    <code className='bg-muted px-2 py-1 rounded text-xs sm:text-sm truncate select-text'>
                                        {project.containers.length}
                                    </code>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* New URL Configuration */}
                        <div className='space-y-3'>
                            <h3 className='text-sm font-semibold'>New URL Configuration</h3>
                            <div className='space-y-2'>
                                <Input
                                    id='new-url'
                                    placeholder='my-new-site.agence-lumia.com'
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    disabled={isChanging}
                                    className='w-full'
                                />
                                <p className='text-xs text-muted-foreground'>
                                    Full domain (e.g. my-new-site.agence-lumia.com)
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Warning */}
                        <Alert variant='warning' className='w-full min-w-0'>
                            <AlertTriangle className='h-4 w-4 shrink-0' />
                            <AlertDescription className='text-xs sm:text-sm'>
                                <div className='font-semibold mb-2'>Important Notice</div>
                                <ul className='space-y-1 ml-4 list-disc'>
                                    <li>
                                        All containers in this project will be recreated with the
                                        new URL
                                    </li>
                                    <li>
                                        The containers will be briefly unavailable during the update
                                    </li>
                                    <li>
                                        Database and files will be preserved (volumes are
                                        maintained)
                                    </li>
                                    <li>Traefik routing will be updated automatically</li>
                                    <li>Make sure DNS is configured for the new domain</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        {/* Actions */}
                        <div className='flex flex-col sm:flex-row justify-end gap-2 pt-2 mb-2'>
                            <Button
                                variant='outline'
                                onClick={() => onOpenChange(false)}
                                disabled={isChanging}
                                className='w-full sm:w-auto'
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleChangeUrl}
                                disabled={!isFormValid || isChanging}
                                className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700'
                            >
                                {isChanging ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 shrink-0 animate-spin' />
                                        <span className='truncate'>Changing URL...</span>
                                    </>
                                ) : (
                                    <>
                                        <Globe className='mr-2 h-4 w-4 shrink-0' />
                                        <span className='truncate'>Change URL</span>
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
