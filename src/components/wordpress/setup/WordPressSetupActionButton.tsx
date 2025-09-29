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
  retryLabel?: string;  // default: 'Re-Launch WordPress Setup'
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
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Setup in progress...
        </>
      ) : failed ? (
        <>
          <RotateCw className="mr-2 h-4 w-4" />
          {retryLabel}
        </>
      ) : (
        <>
          <Play className="mr-2 h-4 w-4" />
          {launchLabel}
        </>
      )}
    </Button>
  );
};

export default WordPressSetupActionButton;
