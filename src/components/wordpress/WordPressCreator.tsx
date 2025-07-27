import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Database, Globe, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface WordPressContainer {
    id: string;
    name: string;
    domain: string;
    createdAt: Date;
}

export default function WordPressCreator() {
    const [isCreating, setIsCreating] = useState(false);
    const [containers, setContainers] = useState<WordPressContainer[]>([]);
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
            domain: prev.domain || generateDomainFromName(value),
        }));
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!formData.name.trim()) {
            errors.push('Le nom est requis');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
            errors.push('Le nom ne peut contenir que des lettres, chiffres, tirets et underscores');
        }

        if (!formData.domain.trim()) {
            errors.push('Le domaine est requis');
        } else if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.domain)) {
            errors.push('Le domaine doit être valide (ex: mon-site.agence-lumia.com)');
        }

        // Vérifier si le nom ou domaine existe déjà
        const nameExists = containers.some(c => c.name === `wordpress-${formData.name}`);
        const domainExists = containers.some(c => c.domain === formData.domain);

        if (nameExists) {
            errors.push('Un container avec ce nom existe déjà');
        }

        if (domainExists) {
            errors.push('Un container avec ce domaine existe déjà');
        }

        return errors;
    };

    const handleCreate = async () => {
        if (isCreating) return;

        const errors = validateForm();
        if (errors.length > 0) {
            toast.error('Erreurs de validation', {
                description: errors.join(', '),
            });
            return;
        }

        try {
            setIsCreating(true);

            toast.info('🚀 Création du container WordPress...', {
                description: `Nom: ${formData.name}, Domaine: ${formData.domain}`,
            });

            const result = await window.electronAPI.docker.wordpress.createWordPress({
                name: formData.name,
                domain: formData.domain,
            });

            // Ajouter le nouveau container à la liste
            const newContainer: WordPressContainer = {
                id: result.id,
                name: result.name,
                domain: formData.domain,
                createdAt: new Date(),
            };

            setContainers(prev => [...prev, newContainer]);

            toast.success('✅ Container WordPress créé !', {
                description: `Accessible sur http://${formData.domain}`,
                duration: 5000,
            });

            // Reset le formulaire
            setFormData({ name: '', domain: '' });

        } catch (error) {
            console.error('Failed to create WordPress container:', error);
            toast.error('❌ Erreur lors de la création', {
                description: error instanceof Error ? error.message : 'Une erreur inconnue est survenue',
            });
        } finally {
            setIsCreating(false);
        }
    };

    const isFormValid = formData.name.trim() && formData.domain.trim() && validateForm().length === 0;

    return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5"/>
                            Créer un nouveau site WordPress
                        </CardTitle>
                        <CardDescription>
                            Créez un nouveau container WordPress avec sa propre base de données et configuration
                            Traefik.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Formulaire */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom du site</Label>
                                <Input
                                        id="name"
                                        placeholder="mon-site"
                                        value={formData.name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        disabled={isCreating}
                                />
                                <p className="text-xs text-gray-500">
                                    Uniquement lettres, chiffres, tirets et underscores
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="domain">Domaine</Label>
                                <Input
                                        id="domain"
                                        placeholder="mon-site.agence-lumia.com"
                                        value={formData.domain}
                                        onChange={(e) => handleInputChange('domain', e.target.value)}
                                        disabled={isCreating}
                                />
                                <p className="text-xs text-gray-500">
                                    Domaine complet (ex: mon-site.agence-lumia.com)
                                </p>
                            </div>
                        </div>

                        {/* Aperçu */}
                        {formData.name && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">📋 Aperçu de la configuration</h4>
                                    <div className="text-sm text-blue-800 space-y-1">
                                        <div><strong>Container name:</strong> wordpress-{formData.name}</div>
                                        <div><strong>Database
                                            name:</strong> wp_{formData.name.replace(/[^a-zA-Z0-9]/g, '_')}</div>
                                        <div><strong>URL d'accès:</strong> http://{formData.domain}</div>
                                        <div><strong>Traefik routing:</strong> Host("{formData.domain}")</div>
                                    </div>
                                </div>
                        )}

                        {/* Bouton de création */}
                        <Button
                                onClick={handleCreate}
                                disabled={!isFormValid || isCreating}
                                size="lg"
                                className="w-full"
                        >
                            {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Création en cours...
                                    </>
                            ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4"/>
                                        Créer le site WordPress
                                    </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Liste des containers créés */}
                {containers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5"/>
                                    Sites WordPress créés ({containers.length})
                                </CardTitle>
                                <CardDescription>
                                    Liste des containers WordPress que vous avez créés
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {containers.map((container) => (
                                            <div
                                                    key={container.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        <CheckCircle className="h-5 w-5 text-green-500"/>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{container.name}</span>
                                                            <Badge variant="secondary" className="text-xs">
                                                                Actif
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <Globe className="h-3 w-3"/>
                                                    {container.domain}
                                                </span>
                                                            <span className="flex items-center gap-1">
                                                    <Database className="h-3 w-3"/>
                                                    wp_{container.name.replace('wordpress-', '').replace(/[^a-zA-Z0-9]/g, '_')}
                                                </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right text-sm text-gray-500">
                                                    <div>Créé le</div>
                                                    <div>{container.createdAt.toLocaleDateString('fr-FR')}</div>
                                                    <div>{container.createdAt.toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}</div>
                                                </div>
                                            </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                )}

                {/* Informations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">ℹ️ Informations importantes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-2">
                        <ul className="space-y-1">
                            <li>• Chaque site WordPress aura sa propre base de données MySQL</li>
                            <li>• L'accès se fait via Traefik sur le domaine configuré</li>
                            <li>• Les données sont persistées dans des volumes Docker</li>
                            <li>• Assurez-vous que l'infrastructure WordPress est configurée avant de créer des sites
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
    );
}
