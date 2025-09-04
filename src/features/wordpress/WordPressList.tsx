import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
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

interface WordPressListProps {
    onRefresh?: () => void;
}

export default function WordPressList({ onRefresh }: WordPressListProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [services, setServices] = useState<WordPressService[]>([]);

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
            onRefresh?.();
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

            {services.length === 0 && (
                <p className="text-sm text-gray-500">
                    No WordPress services found. Create a new service to get started.
                </p>
            )}
            {services.map((service) => (
                <WordPressServiceCard
                    key={service.name}
                    service={service}
                    onContainerUpdate={retrieveContainers}
                />
            ))}
        </div>
    );
}

export type { WordPressService };
