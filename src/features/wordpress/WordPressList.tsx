import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import WordPressServiceCard from './WordPressServiceCard';
import WordPressServiceSkeleton from './WordPressServiceSkeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchContainers } from '@/store/slices/containerSlice';
import { 
    selectServices, 
    selectContainerStatus, 
    selectContainerError,
    selectServiceCount,
    selectTotalContainerCount
} from '@/store/selectors/containerSelectors';
import { State } from '@/types/state';

interface WordPressListProps {
    onRefresh?: () => void;
}

export default function WordPressList({ onRefresh }: WordPressListProps) {
    const dispatch = useAppDispatch();
    
    // Redux state
    const services = useAppSelector(selectServices);
    const status = useAppSelector(selectContainerStatus);
    const error = useAppSelector(selectContainerError);
    const serviceCount = useAppSelector(selectServiceCount);
    const totalContainerCount = useAppSelector(selectTotalContainerCount);
    
    const isRefreshing = status === State.LOADING;

    const retrieveContainers = async () => {
        try {
            const resultAction = await dispatch(fetchContainers());
            if (fetchContainers.fulfilled.match(resultAction)) {
                onRefresh?.();
            } else if (fetchContainers.rejected.match(resultAction)) {
                toast.error('❌ Error retrieving containers', {
                    description: resultAction.payload as string || 'An unknown error occurred',
                });
            }
        } catch (error) {
            console.error('Failed to retrieve containers:', error);
            toast.error('❌ Error retrieving containers', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    };

    useEffect(() => {
        retrieveContainers();
    }, []);

    // Show error toast when error state changes
    useEffect(() => {
        if (error) {
            toast.error('❌ Error retrieving containers', {
                description: error,
            });
        }
    }, [error]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">WordPress Services ({serviceCount})</h2>
                    <p className="text-sm text-gray-600">
                        {totalContainerCount} total containers
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

            {serviceCount === 0 && status !== State.LOADING && (
                <p className="text-sm text-gray-500">
                    No WordPress services found. Create a new service to get started.
                </p>
            )}
            
            {/* Show skeleton loading states when loading */}
            {status === State.LOADING && serviceCount === 0 && (
                <WordPressServiceSkeleton count={3} />
            )}
            
            {/* Show actual services */}
            {services.map((service) => (
                <WordPressServiceCard
                    key={service.name}
                    service={service}
                    onContainerUpdate={retrieveContainers}
                    isGloballyDisabled={isRefreshing} // Pass global disabled state
                />
            ))}
        </div>
    );
}
