import { useState } from 'react';
import { AppPreference } from '../../electron/services/storage/app/app.type.ts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FirstSetupScreenProps {
    setAppMode: (mode: AppPreference) => void;
}

export default function FirstSetupScreen(props: FirstSetupScreenProps) {
    const { setAppMode } = props;
    const [selectedMode, setSelectedMode] = useState<AppPreference | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedMode) return;

        setIsSaving(true);
        try {
            await window.electronAPI.storage.app.save({
                preference: selectedMode,
            });
            setAppMode(selectedMode);
        } catch (error) {
            console.error('Error during save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getModeDescription = (mode: AppPreference) => {
        switch (mode) {
            case AppPreference.LIST:
                return 'Standard mode with Docker container management';
            case AppPreference.WORDPRESS:
                return 'WordPress mode with automatic configuration';
            default:
                return '';
        }
    };

    return (
        <Card
            variant='glass'
            accent='glow'
            interactive={false}
            withHoverOverlay
            className='group relative overflow-hidden w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl border-gray-200 dark:border-gray-800'
        >
            <CardHeader>
                <CardTitle>Initial Setup</CardTitle>
                <CardDescription>Choose the application usage mode</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='space-y-2 mt-6'>
                    <Label htmlFor='mode-select'>Application Mode</Label>
                    <Select
                        value={selectedMode}
                        onValueChange={(value) => setSelectedMode(value as AppPreference)}
                    >
                        <SelectTrigger id='mode-select' className='w-full'>
                            <SelectValue placeholder='Select a mode' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={AppPreference.LIST}>Basic</SelectItem>
                            <SelectItem value={AppPreference.WORDPRESS}>WordPress</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {selectedMode && (
                    <div className='text-sm text-muted-foreground'>
                        {getModeDescription(selectedMode)}
                    </div>
                )}

                <Button
                    onClick={handleSave}
                    disabled={!selectedMode || isSaving}
                    className='w-full'
                >
                    {isSaving ? 'Saving...' : 'Select'}
                </Button>
            </CardContent>
        </Card>
    );
}
