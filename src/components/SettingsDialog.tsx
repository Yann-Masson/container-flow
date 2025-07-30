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
import WordPressSetup from "@/components/wordpress/WordPressSetup.tsx";

interface SettingsDialogProps {
    currentMode: AppPreference;
    onModeChange: (mode: AppPreference) => void;
    onDisconnect: () => void;
}

export default function SettingsDialog({ currentMode, onModeChange, onDisconnect }: SettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [showModeConfirmation, setShowModeConfirmation] = useState(false);
    const [selectedMode, setSelectedMode] = useState<AppPreference>(currentMode);

    const handleModeChange = (newMode: string) => {
        const mode = newMode as AppPreference;
        if (mode !== currentMode) {
            setSelectedMode(mode);
            setShowModeConfirmation(true);
        }
    };

    const confirmModeChange = async () => {
        try {
            await window.electronAPI.storage.app.save({ preference: selectedMode });
            onModeChange(selectedMode);
            setShowModeConfirmation(false);
            setOpen(false);
            toast.success('Mode de l\'application changé avec succès');
        } catch (error) {
            console.error('Error changing mode:', error);
            toast.error('Erreur lors du changement de mode');
        }
    };

    const handleDisconnect = async () => {
        try {
            await window.electronAPI.docker.connection.disconnect();
            onDisconnect();
            setOpen(false);
            toast.success('Déconnecté avec succès');
        } catch (error) {
            console.error('Error disconnecting:', error);
            toast.error('Erreur lors de la déconnexion');
        }
    };

    const getModeLabel = (mode: AppPreference) => {
        switch (mode) {
            case AppPreference.BASIC:
                return 'Basique';
            case AppPreference.WORDPRESS:
                return 'WordPress';
            default:
                return 'Non défini';
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
                            Paramètres
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Mode de l'application */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Mode de l'application</h3>
                            <Select value={currentMode} onValueChange={handleModeChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un mode"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={AppPreference.BASIC}>
                                        Basique - Gestion simple des conteneurs
                                    </SelectItem>
                                    <SelectItem value={AppPreference.WORDPRESS}>
                                        WordPress - Infrastructure complète
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Mode actuel : {getModeLabel(currentMode)}
                            </p>
                        </div>

                        {/* Vérification infrastructure WordPress */}
                        {currentMode === AppPreference.WORDPRESS && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium">Infrastructure WordPress</h3>
                                <WordPressSetup>
                                    <Button variant="outline" className="w-full">
                                        <Settings className="mr-2 h-4 w-4"/>
                                        Configure WordPress Infrastructure
                                    </Button>
                                </WordPressSetup>
                                {/*<Button*/}
                                {/*    onClick={checkInfrastructure}*/}
                                {/*    disabled={isCheckingInfrastructure}*/}
                                {/*    variant="outline"*/}
                                {/*    className="w-full"*/}
                                {/*>*/}
                                {/*    {isCheckingInfrastructure ? (*/}
                                {/*        <>*/}
                                {/*            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>*/}
                                {/*            Vérification...*/}
                                {/*        </>*/}
                                {/*    ) : (*/}
                                {/*        <>*/}
                                {/*            <CheckCircle className="mr-2 h-4 w-4"/>*/}
                                {/*            Vérifier l'infrastructure*/}
                                {/*        </>*/}
                                {/*    )}*/}
                                {/*</Button>*/}
                                <p className="text-xs text-muted-foreground">
                                    Vérifie que Traefik, MySQL et le réseau sont opérationnels
                                </p>
                            </div>
                        )}

                        {/* Déconnexion */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium">Connexion Docker</h3>
                            <Button
                                onClick={handleDisconnect}
                                variant="destructive"
                                className="w-full"
                            >
                                <LogOut className="mr-2 h-4 w-4"/>
                                Se déconnecter
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Ferme la connexion et retourne à l'écran de connexion
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation du changement de mode */}
            <AlertDialog open={showModeConfirmation} onOpenChange={setShowModeConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer le changement de mode</AlertDialogTitle>
                        <AlertDialogDescription>
                            Voulez-vous vraiment changer le mode de l'application de "{getModeLabel(currentMode)}"
                            vers "{getModeLabel(selectedMode)}" ?
                            {selectedMode === AppPreference.WORDPRESS &&
                                ' Le mode WordPress nécessite une infrastructure spécifique.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowModeConfirmation(false)}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmModeChange}>
                            Confirmer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
