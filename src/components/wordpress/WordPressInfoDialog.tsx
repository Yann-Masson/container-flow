import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Database, ExternalLink, Eye, EyeOff, Globe } from 'lucide-react';
import { ContainerInspectInfo } from "dockerode";
import { toast } from 'sonner';

interface WordPressInfoDialogProps {
    container: ContainerInspectInfo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function WordPressInfoDialog({ container, open, onOpenChange }: WordPressInfoDialogProps) {
    const [showPassword, setShowPassword] = useState(false);

    if (!container) return null;

    const containerName = container.Name.replace("/wordpress-", "");
    const domain = container.Config.Labels?.['traefik.http.routers.' + containerName + '.rule']?.replace('Host("', '').replace('")', '') || 'N/A';

    // Extract database information from environment variables
    const dbName = container.Config.Env?.find(env => env.startsWith('WORDPRESS_DB_NAME='))?.replace('WORDPRESS_DB_NAME=', '') || 'N/A';
    const dbUser = container.Config.Env?.find(env => env.startsWith('WORDPRESS_DB_USER='))?.replace('WORDPRESS_DB_USER=', '') || 'N/A';
    const dbPassword = container.Config.Env?.find(env => env.startsWith('WORDPRESS_DB_PASSWORD='))?.replace('WORDPRESS_DB_PASSWORD=', '') || 'N/A';
    const dbHost = container.Config.Env?.find(env => env.startsWith('WORDPRESS_DB_HOST='))?.replace('WORDPRESS_DB_HOST=', '') || 'N/A';

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied to clipboard!`);
        } catch (error) {
            toast.error('Failed to copy to clipboard');
        }
    };

    const openUrl = async () => {
        if (domain !== 'N/A') {
            try {
                await window.electronAPI.system.openExternal(`https://${domain}`);
            } catch (error) {
                toast.error('Failed to open URL in browser');
                console.error('Error opening external URL:', error);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5"/>
                        WordPress Site Information
                    </DialogTitle>
                    <DialogDescription>
                        Detailed information for WordPress container: {containerName}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-120px)] p-4">
                    <div className="space-y-4">
                        {/* General Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Globe className="h-4 w-4"/>
                                    General Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Site Name:</span>
                                    <Badge variant="outline">{containerName}</Badge>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Domain:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{domain}</span>
                                        {domain !== 'N/A' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => copyToClipboard(domain, 'Domain')}
                                                >
                                                    <Copy className="h-3 w-3"/>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={openUrl}
                                                >
                                                    <ExternalLink className="h-3 w-3"/>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Status:</span>
                                    <Badge variant="secondary" className="text-green-600">
                                        {container.State.Status}
                                    </Badge>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Created:</span>
                                    <span className="text-sm">
                                        {new Date(container.Created).toLocaleDateString('en-US')} at{' '}
                                        {new Date(container.Created).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Database Configuration */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Database className="h-4 w-4"/>
                                    Database Configuration
                                </CardTitle>
                                <CardDescription>
                                    Database connection details for this WordPress installation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Database Name:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-black px-2 py-1 rounded text-sm">{dbName}</code>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(dbName, 'Database name')}
                                        >
                                            <Copy className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Database User:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-black px-2 py-1 rounded text-sm">{dbUser}</code>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(dbUser, 'Database user')}
                                        >
                                            <Copy className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Database Password:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-black px-2 py-1 rounded text-sm">
                                            {showPassword ? dbPassword : '••••••••'}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(dbPassword, 'Database password')}
                                        >
                                            <Copy className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Database Host:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="bg-black px-2 py-1 rounded text-sm">{dbHost}</code>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(dbHost, 'Database host')}
                                        >
                                            <Copy className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <div className="flex justify-end gap-2">
                            {domain !== 'N/A' && (
                                <Button variant="outline" onClick={openUrl}>
                                    <ExternalLink className="h-4 w-4 mr-2"/>
                                    Open Website
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
