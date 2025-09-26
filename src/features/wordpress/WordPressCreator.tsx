import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, ClipboardList, Copy, Globe2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createWordPressProject } from '@/store/slices/containerSlice';
import { selectContainerStatus, selectIsCreating, selectProjects } from '@/store/selectors/containerSelectors';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { State } from '@/types/state';

export default function WordPressCreator() {
    const dispatch = useAppDispatch();
    
    // Redux state
    const projects = useAppSelector(selectProjects);
    const isCreating = useAppSelector(selectIsCreating);
    const state = useAppSelector(selectContainerStatus);
    
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
    });
    const [showPreview, setShowPreview] = useState(false);

    // Computed preview values
    const computedName = formData.name || 'my-site';
    const containerName = `wordpress-${computedName}-1`;
    const dbName = `wp_${(formData.name || 'my-site').replace(/[^a-zA-Z0-9]/g, '_')}`;
    const domainFallback = `${computedName}.agence-lumia.com`;
    const computedDomain = formData.domain || domainFallback;
    const traefikRule = `Host(\"${computedDomain}\")`;

    const copyPreview = () => {
        const summary = [
            `Project: ${computedName}`,
            `Container: ${containerName}`,
            `Database: ${dbName}`,
            `Domain: https://${computedDomain}`,
            `Traefik: ${traefikRule}`,
        ].join('\n');
        navigator.clipboard.writeText(summary)
            .then(() => toast.success('Preview copied to clipboard'))
            .catch(() => toast.error('Failed to copy preview'));
    };

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

        // Check if project name already exists
        const projectExists = projects.some(s => s.name === formData.name);
        if (projectExists) {
            errors.push('A project with this name already exists');
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
            toast.info('🚀 Creating WordPress project...', {
                description: `Name: ${formData.name}, Domain: ${formData.domain}`,
            });

            const resultAction = await dispatch(createWordPressProject({
                name: formData.name,
                domain: formData.domain,
            }));

            if (createWordPressProject.fulfilled.match(resultAction)) {
                toast.success('✅ WordPress project created!', {
                    description: `Accessible at https://${formData.domain}`,
                    duration: 5000,
                });

                setFormData({ name: '', domain: '' });
            } else if (createWordPressProject.rejected.match(resultAction)) {
                toast.error('❌ Error during creation', {
                    description: resultAction.payload as string || 'An unknown error occurred',
                });
            }
        } catch (error) {
            console.error('Failed to create WordPress project:', error);
            toast.error('❌ Error during creation', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    };

    const isFormValid = formData.name.trim() && formData.domain.trim() && validateForm().length === 0;

    const isLoading = state === State.LOADING;

    return (
        <Card>
            <CardHeader>
                {isLoading ? (
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-6 w-64"/>
                        <Skeleton className="h-4 w-96"/>
                    </div>
                ) : (
                    <>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5"/>
                            Create a new WordPress project
                        </CardTitle>
                        <CardDescription>
                            Create a new WordPress project with its own database and Traefik configuration.
                        </CardDescription>
                    </>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Form */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24"/>
                            <Skeleton className="h-10 w-full"/>
                            <Skeleton className="h-3 w-48"/>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20"/>
                            <Skeleton className="h-10 w-full"/>
                            <Skeleton className="h-3 w-56"/>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Project name</Label>
                            <Input
                                id="name"
                                placeholder="my-site"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                disabled={isCreating}
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
                                disabled={isCreating}
                            />
                            <p className="text-xs text-gray-500">
                                Full domain (e.g. my-site.agence-lumia.com)
                            </p>
                        </div>
                    </div>
                )}

                {/* Preview Toggle */}
                {!isLoading && (
                    <div className="flex items-center justify-between border rounded-md p-3 bg-muted/30 cursor-pointer" onClick={() => setShowPreview(!showPreview)}>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Configuration preview</span>
                            <span className="text-xs text-gray-500">Toggle to show computed project details</span>
                        </div>
                        <Switch
                            checked={showPreview}
                            onCheckedChange={(v) => setShowPreview(!!v)}
                            disabled={isCreating}
                            aria-label="Toggle configuration preview"
                            className="cursor-pointer"
                        />
                    </div>
                )}

                {/* Preview */}
                {!isLoading && showPreview && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <ClipboardList className="h-4 w-4" />
                                </span>
                                <h4 className="font-medium text-sm">Project configuration preview</h4>
                            </div>
                            <Button variant="ghost" size="icon" onClick={copyPreview} aria-label="Copy configuration preview" disabled={isCreating}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-4 space-y-5">
                            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                                <div className="space-y-1">
                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground">
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-semibold">ID</span>
                                        Project Name
                                    </dt>
                                    <dd className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border">{computedName}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground">
                                        <Globe2 className="h-4 w-4" /> Access URL
                                    </dt>
                                    <dd className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border break-all">https://{computedDomain}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground">
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-semibold">CT</span>
                                        First Container
                                    </dt>
                                    <dd className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border">{containerName}</dd>
                                </div>
                                <div className="space-y-1">
                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground">
                                        <Database className="h-4 w-4" /> Database Name
                                    </dt>
                                    <dd className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border">{dbName}</dd>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground">
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-semibold">TR</span>
                                        Traefik Routing Rule
                                    </dt>
                                    <dd className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border">{traefikRule}</dd>
                                </div>
                            </dl>
                            <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">These values are generated automatically based on your inputs and will be used to scaffold the WordPress environment (containers, database & Traefik labels).</p>
                                {!formData.name && (
                                    <p className="text-xs text-amber-600 flex items-center gap-1">Fill the project name to see the final resource names.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Create button */}
                {isLoading ? (
                    <Skeleton className="h-12 w-full"/>
                ) : (
                    <Button
                        onClick={handleCreate}
                        disabled={!isFormValid || isCreating}
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
                                <span className="hidden min-[401px]:block">Create WordPress project</span>
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
