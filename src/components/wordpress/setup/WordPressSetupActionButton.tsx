import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Play, RotateCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { runWordPressSetup, selectWordPressSetupStatus } from '@/store/slices/wordpressSetupSlice';
import { Switch } from '@/components/ui/switch';

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
    const [force, setForce] = useState(false);

    // Reset force toggle when status changes from error to something else
    useEffect(() => {
        if (!failed) {
            setForce(false);
        }
    }, [failed]);

    const handleClick = () => {
        if (isRunning) return;
        dispatch(runWordPressSetup({ force }));
        onAction?.();
    };

    return (
        <div className='flex flex-col gap-3 w-full items-center justify-center'>
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
            {failed && (
                <div className='flex items-center gap-2 w-full justify-center'>
                    <Switch
                        id='force-setup'
                        checked={force}
                        onCheckedChange={(checked) => setForce(checked === true)}
                    />
                    <label
                        htmlFor='force-setup'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                    >
                        Force setup{' '}
                        <span className='hidden min-[350px]:inline'>
                            (remove existing infrastructure)
                        </span>
                    </label>
                </div>
            )}
        </div>
    );
};

export default WordPressSetupActionButton;
