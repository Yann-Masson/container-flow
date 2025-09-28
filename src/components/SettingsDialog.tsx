import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { AppPreference } from '../../electron/services/storage/app/app.type';
import WordPressSetupDialog from '@/components/wordpress/setup/WordPressSetupDialog';
import { useAppDispatch } from '@/store/hooks';
import { resetWordPressSetup } from '@/store/slices/wordpressSetupSlice';

interface SettingsDialogProps {
    currentMode: AppPreference;
    onModeChange: (mode: AppPreference) => void;
    onDisconnect: () => void;
}

export default function SettingsDialog({ currentMode, onModeChange, onDisconnect }: SettingsDialogProps) {
    const dispatch = useAppDispatch();
    const [open, setOpen] = useState(false);
    const [showModeConfirmation, setShowModeConfirmation] = useState(false);
    const [selectedMode, setSelectedMode] = useState<AppPreference>(currentMode);

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
            toast.success("Application mode changed successfully");
        } catch (error) {
            console.error('Error changing mode:', error);
            toast.error("Error while changing mode");
        }
    };

    const handleDisconnect = async () => {
        try {
            await window.electronAPI.docker.connection.disconnect();
            onDisconnect();
            setOpen(false);
            toast.success("Disconnected successfully");
        } catch (error) {
            console.error('Error disconnecting:', error);
            toast.error("Error while disconnecting");
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
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4"/>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5"/>
                            Settings
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Application Mode */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Application Mode</h3>
                            <Select value={currentMode} onValueChange={handleModeChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a mode"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={AppPreference.LIST}>
                                        Basic - Simple container management
                                    </SelectItem>
                                    <SelectItem value={AppPreference.WORDPRESS}>
                                        WordPress - Complete infrastructure
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Current mode: {getModeLabel(currentMode)}
                            </p>
                        </div>

                        {/* WordPress Infrastructure Check */}
                        {currentMode === AppPreference.WORDPRESS && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium">WordPress Infrastructure</h3>
                                <WordPressSetupDialog>
                                    <Button variant="outline" className="w-full">
                                        <Settings className="mr-2 h-4 w-4"/>
                                        Configure WordPress Infrastructure
                                    </Button>
                                </WordPressSetupDialog>
                                <p className="text-xs text-muted-foreground">
                                    Checks that Traefik, MySQL, and the network are operational
                                </p>
                            </div>
                        )}

                        {/* Disconnect */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Docker Connection</h3>
                            <Button
                                onClick={handleDisconnect}
                                variant="destructive"
                                className="w-full"
                            >
                                <LogOut className="mr-2 h-4 w-4"/>
                                Disconnect
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Closes the connection and returns to the login screen
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Mode Change Confirmation */}
            <AlertDialog open={showModeConfirmation} onOpenChange={setShowModeConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm mode change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Do you really want to change the application mode from "{getModeLabel(currentMode)}"
                            to "{getModeLabel(selectedMode)}"?
                            {selectedMode === AppPreference.WORDPRESS &&
                                ' WordPress mode requires a specific infrastructure.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowModeConfirmation(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmModeChange}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
