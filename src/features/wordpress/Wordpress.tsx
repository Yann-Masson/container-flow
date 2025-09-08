import { useEffect, useState } from 'react';
import WordPressSetupCard from './setup/WordPressSetupCard';
import WordPressCreator from './WordPressCreator';
import WordPressList from './WordPressList';

type TransitionState = 'setup' | 'transitioning' | 'creator';

export default function WordPress() {
    const [setupCompleted, setSetupCompleted] = useState(false);
    const [transitionState, setTransitionState] = useState<TransitionState>('setup');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (setupCompleted && transitionState === 'setup') {
            // Wait 2 seconds after setup completion before transitioning
            const transitionTimer = setTimeout(() => {
                setTransitionState('transitioning');
            }, 2000);

            return () => clearTimeout(transitionTimer);
        }
    }, [setupCompleted, transitionState]);

    useEffect(() => {
        if (transitionState === 'transitioning') {
            const transitionTimer = setTimeout(() => {
                setTransitionState('creator');
            }, 300); // Duration of the transition

            return () => clearTimeout(transitionTimer);
        }
    }, [transitionState]);

    const handleSetupComplete = () => {
        setSetupCompleted(true);
    };

    const handleRetrySetup = () => {
        setSetupCompleted(false);
        setTransitionState('setup');
    };

    const handleServiceCreated = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleRefresh = () => {
        // This will be called by WordPressList when it refreshes
        // We can use this to update any parent state if needed
    };

    // Render based on transition state
    if (transitionState === 'creator') {
        return (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 space-y-6">
                <WordPressList
                    key={refreshKey} 
                    onRefresh={handleRefresh} 
                />
                <WordPressCreator 
                    onServiceCreated={handleServiceCreated} 
                />
            </div>
        );
    }

    return (
        <div className={`transition-all duration-500 flex flex-col flex-grow justify-center items-center 
             ${
            transitionState === 'transitioning' 
                ? 'opacity-0 scale-95 translate-y-4' 
                : 'opacity-100 scale-100 translate-y-0'
        }`}>
            <WordPressSetupCard
                onSetupComplete={handleSetupComplete}
                onRetrySetup={handleRetrySetup}
            />
        </div>
    );
}