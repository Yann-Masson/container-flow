import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Database, Globe, Info, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ContainerInspectInfo } from "dockerode";
import WordPressInfoDialog from './WordPressInfoDialog';

export default function WordPressCreator() {
    const [isCreating, setIsCreating] = useState(false);
    const [containers, setContainers] = useState<ContainerInspectInfo[]>([]);
    const [selectedContainer, setSelectedContainer] = useState<ContainerInspectInfo | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
    });

    const handleInputChange = (field: 'name' | 'domain', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const generateDomainFromName = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.agence-lumia.com';
    };

    const handleNameChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            name: value,
            domain: prev.domain || generateDomainFromName(value),
        }));
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!formData.name.trim()) {
            errors.push('Name is required');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
            errors.push('Name can only contain letters, numbers, dashes and underscores');
        }

        if (!formData.domain.trim()) {
            errors.push('Domain is required');
        } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.domain)) {
            errors.push('Domain must be valid (e.g. my-site.agence-lumia.com)');
        }

        // Check if name or domain already exists
        const nameExists = containers.some(c => c.Name === `wordpress-${formData.name}`);
        const domainExists = containers.some(c => c.Config?.Labels?.[`traefik.http.routers.${c.Name}.rule`] === `Host("${formData.domain}")`);

        if (nameExists) {
            errors.push('A container with this name already exists');
        }

        if (domainExists) {
            errors.push('A container with this domain already exists');
        }

        return errors;
    };

    const handleCreate = async () => {
        if (isCreating) return;

        const errors = validateForm();
        if (errors.length > 0) {
            toast.error('Validation errors', {
                description: errors.join(', '),
            });
            return;
        }

        try {
            setIsCreating(true);

            toast.info('🚀 Creating WordPress container...', {
                description: `Name: ${formData.name}, Domain: ${formData.domain}`,
            });

            await window.electronAPI.docker.wordpress.createWordPress({
                name: formData.name,
                domain: formData.domain,
            });

            toast.success('✅ WordPress container created!', {
                description: `Accessible at https://${formData.domain}`,
                duration: 5000,
            });

            setFormData({ name: '', domain: '' });

            await retrieveContainers();

        } catch (error) {
            console.error('Failed to create WordPress container:', error);
            toast.error('❌ Error during creation', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsCreating(false);
        }
    };

    const isFormValid = formData.name.trim() && formData.domain.trim() && validateForm().length === 0;

    const retrieveContainers = async () => {
        try {
            const allContainers = await window.electronAPI.docker.containers.list();
            console.log(allContainers);
            const wpContainers = allContainers.filter(c => c.Names[0].startsWith('/wordpress-'));

            const tempWpContainers: ContainerInspectInfo[] = [];
            for (const container of wpContainers) {
                const inspectInfo = await window.electronAPI.docker.containers.get(container.Id);

                // Remove the leading slash from the name
                inspectInfo.Name = inspectInfo.Name.replace(/^\/+/, '');
                tempWpContainers.push(inspectInfo);
            }

            console.log(tempWpContainers);

            setContainers(tempWpContainers);
        } catch (error) {
            console.error('Failed to retrieve containers:', error);
            toast.error('❌ Error retrieving containers', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    };

    const handleContainerClick = (container: ContainerInspectInfo) => {
        setSelectedContainer(container);
        setIsDialogOpen(true);
    };

    useEffect(() => {
        retrieveContainers().then();
    }, []);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5"/>
                        Create a new WordPress site
                    </CardTitle>
                    <CardDescription>
                        Create a new WordPress container with its own database and Traefik configuration.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Site name</Label>
                            <Input
                                id="name"
                                placeholder="my-site"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                disabled={isCreating}
                            />
                            <p className="text-xs text-gray-500">
                                Only letters, numbers, dashes and underscores
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="domain">Domain</Label>
                            <Input
                                id="domain"
                                placeholder="my-site.agence-lumia.com"
                                value={formData.domain}
                                onChange={(e) => handleInputChange('domain', e.target.value)}
                                disabled={isCreating}
                            />
                            <p className="text-xs text-gray-500">
                                Full domain (e.g. my-site.agence-lumia.com)
                            </p>
                        </div>
                    </div>

                    {/* Preview */}
                    {formData.name && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">📋 Configuration preview</h4>
                            <div className="text-sm text-blue-800 space-y-1">
                                <div><strong>Container name:</strong> wordpress-{formData.name}</div>
                                <div><strong>Database name:</strong> wp_{formData.name.replace(/[^a-zA-Z0-9]/g, '_')}
                                </div>
                                <div><strong>Access URL:</strong> http://{formData.domain}</div>
                                <div><strong>Traefik routing:</strong> Host("{formData.domain}")</div>
                            </div>
                        </div>
                    )}

                    {/* Create button */}
                    <Button
                        onClick={handleCreate}
                        disabled={!isFormValid || isCreating}
                        size="lg"
                        className="w-full"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4"/>
                                Create WordPress site
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* List of created containers */}
            {containers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5"/>
                            Created WordPress sites ({containers.length})
                        </CardTitle>
                        <CardDescription>
                            List of WordPress containers you have created
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {containers.map((container) => {
                                const match = container.Name.replace("wordpress-", "").match(/^(.*?)-(\d+)$/);
                                const baseName = match ? match[1] : container.Name;

                                return (
                                    <div
                                        key={container.Id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 hover:text-black transition-colors cursor-pointer"
                                        onClick={() => handleContainerClick(container)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                <CheckCircle className="h-5 w-5 text-green-500"/>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                <span
                                                    className="font-medium">{baseName}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        Active
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="h-3 w-3"/>
                                                    {container.Config.Labels?.['traefik.http.routers.' + baseName + '.rule']?.replace('Host("', '').replace('")', '') || 'N/A'}
                                                </span>
                                                    <span className="flex items-center gap-1">
                                                    <Database className="h-3 w-3"/>
                                                        {container.Config.Env?.find(env => env.startsWith('WORDPRESS_DB_NAME='))?.replace('WORDPRESS_DB_NAME=', '') || 'N/A'}
                                                </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right text-sm text-gray-500">
                                                Created on {
                                                new Date(container.Created).toLocaleDateString('en-US')
                                            } {
                                                new Date(container.Created).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                            }
                                            </div>
                                            <Info className="h-4 w-4 text-gray-400"/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">ℹ️ Important information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                    <ul className="space-y-1">
                        <li>• Each WordPress site will have its own MySQL database</li>
                        <li>• Access is via Traefik on the configured domain</li>
                        <li>• Data is persisted in Docker volumes</li>
                        <li>• Make sure the WordPress infrastructure is configured before creating sites</li>
                    </ul>
                </CardContent>
            </Card>

            {/* WordPress Info Dialog */}
            <WordPressInfoDialog
                container={selectedContainer}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onContainerUpdate={retrieveContainers}
            />
        </div>
    );
}
