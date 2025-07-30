import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ContainerInspectInfo } from "dockerode";
import WordPressServiceCard from './WordPressServiceCard';

interface WordPressService {
    name: string;
    containers: ContainerInspectInfo[];
    dbName: string;
    dbUser: string;
    url: string;
}

export default function WordPressCreator() {
    const [isCreating, setIsCreating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [services, setServices] = useState<WordPressService[]>([]);
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
            domain: generateDomainFromName(value),
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

        // Check if service name already exists
        const serviceExists = services.some(s => s.name === formData.name);
        if (serviceExists) {
            errors.push('A service with this name already exists');
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

            toast.info('🚀 Creating WordPress service...', {
                description: `Name: ${formData.name}, Domain: ${formData.domain}`,
            });

            await window.electronAPI.docker.wordpress.create({
                name: formData.name,
                domain: formData.domain,
            });

            toast.success('✅ WordPress service created!', {
                description: `Accessible at https://${formData.domain}`,
                duration: 5000,
            });

            setFormData({ name: '', domain: '' });
            await retrieveContainers();

        } catch (error) {
            console.error('Failed to create WordPress service:', error);
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
            setIsRefreshing(true);
            const allContainers = await window.electronAPI.docker.containers.list();
            console.log('Retrieved containers:', allContainers);
            const wpContainers = allContainers.filter(c => c.Labels?.['container-flow.type'] === 'wordpress');
            console.log('Filtered WordPress containers:', wpContainers);

            const tempWpContainers: ContainerInspectInfo[] = [];
            for (const container of wpContainers) {
                const inspectInfo = await window.electronAPI.docker.containers.get(container.Id);
                // Remove the leading slash from the name
                inspectInfo.Name = inspectInfo.Name.replace(/^\/+/, '');
                tempWpContainers.push(inspectInfo);
            }

            groupContainersIntoServices(tempWpContainers);
        } catch (error) {
            console.error('Failed to retrieve containers:', error);
            toast.error('❌ Error retrieving containers', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const groupContainersIntoServices = (containers: ContainerInspectInfo[]) => {
        const serviceMap = new Map<string, ContainerInspectInfo[]>();

        console.log('Grouping containers into services...');

        containers.forEach(container => {
            // Extract service name from container name (wordpress-{serviceName}-{instanceNumber})
            const serviceName = container.Config.Labels?.['container-flow.name'];

            if (!serviceName) {
                console.warn(`Container ${container.Name} does not have a valid service name label`);
                return;
            }

            if (!serviceMap.has(serviceName)) {
                serviceMap.set(serviceName, []);
            }
            serviceMap.get(serviceName)!.push(container);
        });

        const groupedServices: WordPressService[] = [];

        serviceMap.forEach((containers, serviceName) => {
            // Use the first container to get shared configuration
            const firstContainer = containers[0];
            const env = firstContainer.Config.Env || [];
            const labels = firstContainer.Config.Labels || {};

            const dbName = env.find(env => env.startsWith('WORDPRESS_DB_NAME='))?.replace('WORDPRESS_DB_NAME=', '') || 'N/A';
            const dbUser = env.find(env => env.startsWith('WORDPRESS_DB_USER='))?.replace('WORDPRESS_DB_USER=', '') || 'N/A';

            // Extract URL from traefik labels
            const traefikRule = Object.keys(labels).find(key => key.includes('.rule') && labels[key].includes('Host('));
            const url = traefikRule
                ? labels[traefikRule].replace('Host("', '').replace('")', '')
                : 'N/A';

            groupedServices.push({
                name: serviceName,
                containers: containers.sort((a, b) => {
                    // Sort by instance number
                    const aMatch = a.Name.match(/-(\d+)$/);
                    const bMatch = b.Name.match(/-(\d+)$/);
                    const aNum = aMatch ? parseInt(aMatch[1]) : 1;
                    const bNum = bMatch ? parseInt(bMatch[1]) : 1;
                    return aNum - bNum;
                }),
                dbName,
                dbUser,
                url
            });
        });

        setServices(groupedServices);
    };

    useEffect(() => {
        retrieveContainers().then();
    }, []);

    return (
        <div className="space-y-6">

            {/* List of WordPress Services */}
            {services.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">WordPress Services ({services.length})</h2>
                            <p className="text-sm text-gray-600">
                                {services.reduce((total, service) => total + service.containers.length, 0)} total
                                containers
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={retrieveContainers}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin"/>
                            ) : (
                                <RefreshCw className="h-4 w-4"/>
                            )}
                        </Button>
                    </div>

                    {services.map((service) => (
                        <WordPressServiceCard
                            key={service.name}
                            service={service}
                            onContainerUpdate={retrieveContainers}
                        />
                    ))}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5"/>
                        Create a new WordPress service
                    </CardTitle>
                    <CardDescription>
                        Create a new WordPress service with its own database and Traefik configuration.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Service name</Label>
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
                            <h4 className="font-medium text-blue-900 mb-2">📋 Service preview</h4>
                            <div className="text-sm text-blue-800 space-y-1">
                                <div><strong>Service name:</strong> {formData.name}</div>
                                <div><strong>First container:</strong> wordpress-{formData.name}-1</div>
                                <div><strong>Database name:</strong> wp_{formData.name.replace(/[^a-zA-Z0-9]/g, '_')}
                                </div>
                                <div><strong>Access URL:</strong> https://{formData.domain}</div>
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
                                Create WordPress service
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">ℹ️ Important information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                    <ul className="space-y-1">
                        <li>• Each WordPress service can have multiple container instances</li>
                        <li>• All instances in a service share the same database and files</li>
                        <li>• Use +/- buttons to add or remove container instances</li>
                        <li>• Access is via Traefik on the configured domain</li>
                        <li>• Make sure the WordPress infrastructure is configured before creating services</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
