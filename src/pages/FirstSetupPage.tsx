import { useState } from "react";
import { AppPreference } from "../../electron/services/storage/app/app.type.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FirstSetupPageProps {
    setAppMode: (mode: AppPreference) => void;
}

export default function FirstSetupPage(props: FirstSetupPageProps) {
    const { setAppMode } = props;
    const [selectedMode, setSelectedMode] = useState<AppPreference | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedMode) return;

        setIsSaving(true);
        try {
            await window.electronAPI.storage.app.save({
                preference: selectedMode
            });
            setAppMode(selectedMode);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getModeDescription = (mode: AppPreference) => {
        switch (mode) {
            case AppPreference.BASIC:
                return "Mode standard avec gestion des conteneurs Docker";
            case AppPreference.WORDPRESS:
                return "Mode WordPress avec configuration automatique";
            default:
                return "";
        }
    };

    return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Configuration initiale</CardTitle>
                        <CardDescription>
                            Choisissez le mode d'utilisation de l'application
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="mode-select">Mode d'application</Label>
                            <Select
                                    value={selectedMode}
                                    onValueChange={(value) => setSelectedMode(value as AppPreference)}
                            >
                                <SelectTrigger id="mode-select">
                                    <SelectValue placeholder="Sélectionnez un mode"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={AppPreference.BASIC}>
                                        Basique
                                    </SelectItem>
                                    <SelectItem value={AppPreference.WORDPRESS}>
                                        WordPress
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedMode && (
                                <div className="text-sm text-muted-foreground">
                                    {getModeDescription(selectedMode)}
                                </div>
                        )}

                        <Button
                                onClick={handleSave}
                                disabled={!selectedMode || isSaving}
                                className="w-full"
                        >
                            {isSaving ? "Sauvegarde..." : "Sélectionner"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
    );
}