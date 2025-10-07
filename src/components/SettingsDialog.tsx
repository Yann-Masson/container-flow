import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LogOut, Settings, Key, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppPreference } from '../../electron/services/storage/app/app.type';
import WordPressSetupDialog from '@/components/wordpress/setup/WordPressSetupDialog';
import PasswordsDialog from '@/components/PasswordsDialog';
import { useAppDispatch } from '@/store/hooks';
import { resetWordPressSetup } from '@/store/slices/wordpressSetupSlice';
import { ScrollArea } from './ui/scroll-area';

interface SettingsDialogProps {
    currentMode: AppPreference;
    onModeChange: (mode: AppPreference) => void;
    onDisconnect: () => void;
}

export default function SettingsDialog({
    currentMode,
    onModeChange,
    onDisconnect,
}: SettingsDialogProps) {
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [showModeConfirmation, setShowModeConfirmation] = useState(false);
    const [showResetConfirmation, setShowResetConfirmation] = useState(false);
    const [selectedMode, setSelectedMode] = useState<AppPreference>(currentMode);
    const [hasPasswords, setHasPasswords] = useState(false);

    useEffect(() => {
        if (open && currentMode === AppPreference.WORDPRESS) {
            checkPasswordsAvailability();
        }
    }, [open, currentMode]);

    const checkPasswordsAvailability = async () => {
        try {
            const status = await window.electronAPI.passwords.status();
            setHasPasswords(
                status.rootPresent || status.metricsPresent || status.projects.length > 0,
            );
        } catch (error) {
            console.error('Error checking passwords availability:', error);
            setHasPasswords(false);
        }
    };

    const handleModeChange = (newMode: string) => {
        const mode = newMode as AppPreference;
        if (mode !== currentMode) {
            setSelectedMode(mode);
            setShowModeConfirmation(true);
            dispatch(resetWordPressSetup());
        }
    };

    const confirmModeChange = async () => {
        try {
            await window.electronAPI.storage.app.save({ preference: selectedMode });
            onModeChange(selectedMode);
            setShowModeConfirmation(false);
            setOpen(false);
            toast.success('Application mode changed successfully');
        } catch (error) {
            console.error('Error changing mode:', error);
            toast.error('Error while changing mode');
        }
    };

    const handleDisconnect = async () => {
        try {
            await window.electronAPI.docker.connection.disconnect();
            onDisconnect();
            setOpen(false);
            toast.success('Disconnected successfully');
        } catch (error) {
            console.error('Error disconnecting:', error);
            toast.error('Error while disconnecting');
        }
    };

    const handleResetAllData = async () => {
        try {
            // Clear all stored data
            await window.electronAPI.storage.app.clear();
            await window.electronAPI.storage.ssh.clear();
            await window.electronAPI.passwords.reset();
            
            // Disconnect from Docker
            await window.electronAPI.docker.connection.disconnect();
            
            // Reset local state
            dispatch(resetWordPressSetup());
            
            // Close dialogs and trigger disconnect flow
            setShowResetConfirmation(false);
            setOpen(false);
            onDisconnect();
            
            toast.success('All data has been reset successfully');
        } catch (error) {
            console.error('Error resetting data:', error);
            toast.error('Error while resetting data');
        }
    };

    const getModeLabel = (mode: AppPreference) => {
        switch (mode) {
            case AppPreference.LIST:
                return 'Basic';
            case AppPreference.WORDPRESS:
                return 'WordPress';
            default:
                return 'Undefined';
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant='outline' size='icon' className='h-8 w-8'>
                        <Settings className='h-4 w-4' />
                    </Button>
                </DialogTrigger>
                <DialogContent className='max-w-[95vw] sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle className='flex items-center gap-2'>
                            <Settings className='h-5 w-5' />
                            Settings
                        </DialogTitle>
                    </DialogHeader>

                    <div className='select-none flex flex-col items-center justify-center min-[250px]:hidden overflow-hidden'>
                        <p className='text-center text-gray-500 px-4'>
                            Container Flow is designed for screens wider than 250px. Please resize
                            your window.
                        </p>
                    </div>

                    <ScrollArea className='max-h-[calc(90vh-160px)] w-full min-w-0 hidden min-[250px]:flex'>
                        <div className='space-y-4 sm:space-y-6 p-2 sm:py-4 w-full hidden min-[250px]:flex flex-col min-w-0'>
                            {/* Application Mode */}
                            <div className='space-y-2 sm:space-y-3 w-full flex flex-col min-w-0'>
                                <h3 className='text-sm font-medium w-full min-w-0'>
                                    Application Mode
                                </h3>
                                <Select value={currentMode} onValueChange={handleModeChange}>
                                    <SelectTrigger className='w-full min-w-0'>
                                        <SelectValue placeholder='Select a mode' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AppPreference.LIST}>
                                            <span className='block truncate'>
                                                Basic - Simple container management
                                            </span>
                                        </SelectItem>
                                        <SelectItem value={AppPreference.WORDPRESS}>
                                            <span className='block truncate'>
                                                WordPress - Complete infrastructure
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className='text-xs text-muted-foreground'>
                                    Current mode: {getModeLabel(currentMode)}
                                </p>
                            </div>

                            {/* WordPress Infrastructure Check */}
                            {currentMode === AppPreference.WORDPRESS && (
                                <div className='space-y-2 sm:space-y-3'>
                                    <h3 className='text-sm font-medium'>
                                        WordPress Infrastructure
                                    </h3>
                                    <WordPressSetupDialog>
                                        <Button variant='outline' className='w-full justify-start'>
                                            <Settings className='mr-2 h-4 w-4 shrink-0' />
                                            <span className='truncate'>
                                                Configure WordPress Infrastructure
                                            </span>
                                        </Button>
                                    </WordPressSetupDialog>
                                    <p className='text-xs text-muted-foreground'>
                                        Checks that Traefik, MySQL, and the network are operational
                                    </p>
                                </div>
                            )}

                            {/* View Passwords */}
                            {currentMode === AppPreference.WORDPRESS && (
                                <div className='space-y-2 sm:space-y-3'>
                                    <h3 className='text-sm font-medium'>Passwords</h3>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <PasswordsDialog>
                                                        <Button
                                                            variant='outline'
                                                            className='w-full justify-start'
                                                            disabled={!hasPasswords}
                                                        >
                                                            <Key className='mr-2 h-4 w-4 shrink-0' />
                                                            <span className='truncate'>
                                                                View Passwords
                                                            </span>
                                                        </Button>
                                                    </PasswordsDialog>
                                                </div>
                                            </TooltipTrigger>
                                            {!hasPasswords && (
                                                <TooltipContent>
                                                    <p>
                                                        No passwords available. Set up WordPress
                                                        infrastructure first.
                                                    </p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                    <p className='text-xs text-muted-foreground'>
                                        View and copy MySQL and WordPress passwords
                                    </p>
                                </div>
                            )}

                            {/* Disconnect */}
                            <div className='space-y-2 sm:space-y-3'>
                                <h3 className='text-sm font-medium'>Docker Connection</h3>
                                <Button
                                    onClick={handleDisconnect}
                                    variant='destructive'
                                    className='w-full'
                                >
                                    <LogOut className='mr-2 h-4 w-4 shrink-0' />
                                    <span className='truncate'>Disconnect</span>
                                </Button>
                                <p className='text-xs text-muted-foreground'>
                                    Closes the connection and returns to the login screen
                                </p>
                            </div>

                            {/* Reset All Data */}
                            <div className='space-y-2 sm:space-y-3'>
                                <h3 className='text-sm font-medium'>Reset Application</h3>
                                <Button
                                    onClick={() => setShowResetConfirmation(true)}
                                    variant='destructive'
                                    className='w-full'
                                >
                                    <Trash2 className='mr-2 h-4 w-4 shrink-0' />
                                    <span className='truncate'>Reset All Data</span>
                                </Button>
                                <p className='text-xs text-muted-foreground'>
                                    Clears all stored settings, passwords, and returns to initial
                                    setup
                                </p>
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Mode Change Confirmation */}
            <AlertDialog open={showModeConfirmation} onOpenChange={setShowModeConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm mode change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Do you really want to change the application mode from "
                            {getModeLabel(currentMode)}" to "{getModeLabel(selectedMode)}"?
                            {selectedMode === AppPreference.WORDPRESS &&
                                ' WordPress mode requires a specific infrastructure.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowModeConfirmation(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmModeChange}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reset All Data Confirmation */}
            <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete:
                            <ul className='list-disc list-inside mt-2 space-y-1'>
                                <li>All saved SSH connection settings</li>
                                <li>Application preferences and mode</li>
                                <li>Runtime passwords cache</li>
                            </ul>
                            <p className='mt-3 font-semibold text-destructive'>
                                Your Docker containers and data will remain untouched.
                            </p>
                            <p className='mt-2'>
                                You will be disconnected and returned to the initial setup screen.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowResetConfirmation(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetAllData}
                            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                            Reset All Data
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
