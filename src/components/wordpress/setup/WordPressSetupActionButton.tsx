import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Play, RotateCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { runWordPressSetup, selectWordPressSetupStatus } from '@/store/slices/wordpressSetupSlice';

interface WordPressSetupActionButtonProps {
    className?: string;
    variant?: React.ComponentProps<typeof Button>['variant'];
    size?: React.ComponentProps<typeof Button>['size'];
    launchLabel?: string; // default: 'Launch WordPress Setup'
    retryLabel?: string; // default: 'Re-Launch WordPress Setup'
    onAction?: () => void; // optional callback after dispatch
}

export const WordPressSetupActionButton: React.FC<WordPressSetupActionButtonProps> = ({
    className,
    variant = 'default',
    size = 'lg',
    launchLabel = 'Launch WordPress Setup',
    retryLabel = 'Re-Launch WordPress Setup',
    onAction,
}) => {
    const status = useAppSelector(selectWordPressSetupStatus);
    const dispatch = useAppDispatch();
    const isRunning = status === 'running';
    const failed = status === 'error';

    const handleClick = () => {
        if (isRunning) return;
        dispatch(runWordPressSetup({}));
        onAction?.();
    };

    return (
        <Button
            variant={variant}
            size={size}
            disabled={isRunning}
            onClick={handleClick}
            className={className}
        >
            {isRunning ? (
                <div className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span className='font-medium hidden min-[350px]:block'>
                        Setup in progress...
                    </span>
                </div>
            ) : failed ? (
                <div className='flex items-center gap-2'>
                    <RotateCw className='h-4 w-4' />
                    <span className='font-medium hidden min-[350px]:block'>{retryLabel}</span>
                </div>
            ) : (
                <div className='flex items-center gap-2'>
                    <Play className='h-4 w-4' />
                    <span className='font-medium hidden min-[350px]:block'>{launchLabel}</span>
                </div>
            )}
        </Button>
    );
};

export default WordPressSetupActionButton;
