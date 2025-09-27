import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import WordPressProjectCard from './WordPressProjectCard';
import { AnimatePresence, motion } from 'framer-motion';
import WordPressProjectSkeleton from './WordPressProjectSkeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchContainers } from '@/store/slices/containerSlice';
import { 
    selectProjects, 
    selectContainerStatus, 
    selectContainerError,
    selectProjectCount,
    selectTotalContainerCount
} from '@/store/selectors/containerSelectors';
import { State } from '@/types/state';

export default function WordPressList() {
    const dispatch = useAppDispatch();
    
    // Redux state
    const projects = useAppSelector(selectProjects);
    const status = useAppSelector(selectContainerStatus);
    const error = useAppSelector(selectContainerError);
    const projectCount = useAppSelector(selectProjectCount);
    const totalContainerCount = useAppSelector(selectTotalContainerCount);
    
    const isRefreshing = status === State.LOADING;

    const retrieveContainers = useCallback(async () => {
        try {
            const resultAction = await dispatch(fetchContainers());
            if (fetchContainers.rejected.match(resultAction)) {
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
    }, [dispatch]);

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
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{status === State.SUCCESS && projectCount} WordPress Projects</h2>
                    {status === State.SUCCESS && (
                        <p className="text-sm text-gray-600 hidden sm:block">
                            {totalContainerCount} total containers
                        </p>
                    )}
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

            {projectCount === 0 && status !== State.LOADING && (
                <p className="text-sm text-gray-500">
                    No WordPress projects found. Create a new project to get started.
                </p>
            )}
            
            {/* Show skeleton loading states when loading */}
            {status === State.LOADING && projectCount === 0 && (
                <WordPressProjectSkeleton count={3} />
            )}

            {/* Show actual projects */}
            <AnimatePresence mode="popLayout">
                {projects.map((project) => (
                    <motion.div
                        key={project.name}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        <WordPressProjectCard
                            project={project}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
