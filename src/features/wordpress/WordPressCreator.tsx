import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createWordPressService, fetchContainers } from '@/store/slices/containerSlice';
import { selectIsCreating, selectServices } from '@/store/selectors/containerSelectors';

interface WordPressCreatorProps {
    onServiceCreated?: () => void;
    disabled?: boolean; // New prop to disable creation when loading
}

export default function WordPressCreator({ onServiceCreated, disabled = false }: WordPressCreatorProps) {
    const dispatch = useAppDispatch();
    
    // Redux state
    const services = useAppSelector(selectServices);
    const isCreating = useAppSelector(selectIsCreating);
    
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
    });

    const handleInputChange = (field: 'name' | 'domain', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const generateDomainFromName = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '.agence-lumia.com';
    };

    const handleNameChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            name: value,
            domain: generateDomainFromName(value),
        }));
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!formData.name.trim()) {
            errors.push('Name is required');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
            errors.push('Name can only contain letters, numbers, dashes and underscores');
        }

        if (!formData.domain.trim()) {
            errors.push('Domain is required');
        } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.domain)) {
            errors.push('Domain must be valid (e.g. my-site.agence-lumia.com)');
        }

        // Check if service name already exists
        const serviceExists = services.some(s => s.name === formData.name);
        if (serviceExists) {
            errors.push('A service with this name already exists');
        }

        return errors;
    };

    const handleCreate = async () => {
        if (isCreating) return;

        const errors = validateForm();
        if (errors.length > 0) {
            toast.error('Validation errors', {
                description: errors.join(', '),
            });
            return;
        }

        try {
            toast.info('🚀 Creating WordPress service...', {
                description: `Name: ${formData.name}, Domain: ${formData.domain}`,
            });

            const resultAction = await dispatch(createWordPressService({
                name: formData.name,
                domain: formData.domain,
            }));

            if (createWordPressService.fulfilled.match(resultAction)) {
                toast.success('✅ WordPress service created!', {
                    description: `Accessible at https://${formData.domain}`,
                    duration: 5000,
                });

                setFormData({ name: '', domain: '' });
                // Refresh containers after successful creation
                dispatch(fetchContainers());
                onServiceCreated?.();
            } else if (createWordPressService.rejected.match(resultAction)) {
                toast.error('❌ Error during creation', {
                    description: resultAction.payload as string || 'An unknown error occurred',
                });
            }
        } catch (error) {
            console.error('Failed to create WordPress service:', error);
            toast.error('❌ Error during creation', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    };

    const isFormValid = formData.name.trim() && formData.domain.trim() && validateForm().length === 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5"/>
                    Create a new WordPress service
                </CardTitle>
                <CardDescription>
                    Create a new WordPress service with its own database and Traefik configuration.
                </CardDescription>
            </CardHeader>            <CardContent className="space-y-4">
                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Service name</Label>
                        <Input
                            id="name"
                            placeholder="my-site"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            disabled={isCreating || disabled}
                        />
                        <p className="text-xs text-gray-500">
                            Only letters, numbers, dashes and underscores
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="domain">Domain</Label>
                        <Input
                            id="domain"
                            placeholder="my-site.agence-lumia.com"
                            value={formData.domain}
                            onChange={(e) => handleInputChange('domain', e.target.value)}
                            disabled={isCreating || disabled}
                        />
                        <p className="text-xs text-gray-500">
                            Full domain (e.g. my-site.agence-lumia.com)
                        </p>
                    </div>
                </div>

                {/* Preview */}
                {formData.name && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">📋 Service preview</h4>
                        <div className="text-sm text-blue-800 space-y-1">
                            <div><strong>Service name:</strong> {formData.name}</div>
                            <div><strong>First container:</strong> wordpress-{formData.name}-1</div>
                            <div><strong>Database name:</strong> wp_{formData.name.replace(/[^a-zA-Z0-9]/g, '_')}
                            </div>
                            <div><strong>Access URL:</strong> https://{formData.domain}</div>
                            <div><strong>Traefik routing:</strong> Host("{formData.domain}")</div>
                        </div>
                    </div>
                )}

                {/* Create button */}
                <Button
                    onClick={handleCreate}
                    disabled={!isFormValid || isCreating || disabled}
                    size="lg"
                    className="w-full"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            Creating...
                        </>
                    ) : (
                        <>
                            <Plus className="mr-2 h-4 w-4"/>
                            Create WordPress service
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
