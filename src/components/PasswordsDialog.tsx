import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Eye, EyeOff, Copy, Key } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from './ui/scroll-area';

interface PasswordItemProps {
    label: string;
    value?: string;
    username?: string;
}

function PasswordItem({ label, value, username }: PasswordItemProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [timeoutId]);

    const handleToggleVisibility = () => {
        if (!value) return;

        if (isVisible) {
            // Hide immediately
            if (timeoutId) clearTimeout(timeoutId);
            setTimeoutId(null);
            setIsVisible(false);
        } else {
            // Show for 5 seconds
            setIsVisible(true);
            const id = setTimeout(() => {
                setIsVisible(false);
                setTimeoutId(null);
            }, 5000);
            setTimeoutId(id);
        }
    };

    const handleCopy = async () => {
        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);
            toast.success('Password copied to clipboard');
        } catch (error) {
            console.error('Failed to copy password:', error);
            toast.error('Failed to copy password');
        }
    };

    if (!value) {
        return (
            <div className='flex items-center justify-between py-2 opacity-50'>
                <div className='flex-1 min-w-0'>
                    <div className='text-sm font-medium text-muted-foreground'>{label}</div>
                    {username && (
                        <div className='text-xs text-muted-foreground'>User: {username}</div>
                    )}
                </div>
                <div className='text-xs text-muted-foreground'>Not set</div>
            </div>
        );
    }

    return (
        <div className='flex items-center justify-between py-2 gap-2'>
            <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium'>{label}</div>
                {username && <div className='text-xs text-muted-foreground'>User: {username}</div>}
                <div className='font-mono text-xs mt-1 break-all'>
                    {isVisible ? value : '••••••••••••'}
                </div>
            </div>
            <div className='flex gap-1 shrink-0'>
                <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8'
                    onClick={handleToggleVisibility}
                >
                    {isVisible ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
                <Button variant='outline' size='icon' className='h-8 w-8' onClick={handleCopy}>
                    <Copy className='h-4 w-4' />
                </Button>
            </div>
        </div>
    );
}

interface PasswordsDialogProps {
    children: React.ReactNode;
}

interface PasswordState {
    root?: { user: string; password: string };
    metrics?: { user: string; password: string; dsn?: string };
    wordpressProjects: Record<string, { dbUser: string; dbPassword: string; dbName: string }>;
    initialized: boolean;
}

export default function PasswordsDialog({ children }: PasswordsDialogProps) {
    const [open, setOpen] = useState(false);
    const [passwords, setPasswords] = useState<PasswordState | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadPasswords();
        }
    }, [open]);

    const loadPasswords = async () => {
        setLoading(true);
        try {
            const state = await window.electronAPI.passwords.getState();
            setPasswords(state);
        } catch (error) {
            console.error('Failed to load passwords:', error);
            toast.error('Failed to load passwords');
        } finally {
            setLoading(false);
        }
    };

    const hasAnyPasswords =
        passwords &&
        (passwords.root?.password ||
            passwords.metrics?.password ||
            Object.keys(passwords.wordpressProjects).length > 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className='max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Key className='h-5 w-5' />
                        Passwords
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className='max-h-[calc(90vh-160px)] w-full min-w-0 hidden min-[250px]:flex'>
                    {loading ? (
                        <div className='py-8 text-center text-muted-foreground'>
                            Loading passwords...
                        </div>
                    ) : !hasAnyPasswords ? (
                        <div className='py-8 text-center text-muted-foreground'>
                            No passwords found. Set up WordPress infrastructure to generate
                            passwords.
                        </div>
                    ) : (
                        <div className='space-y-6 py-4'>
                            {/* Root Credentials */}
                            {passwords?.root && (
                                <div>
                                    <h3 className='text-sm font-semibold mb-3'>MySQL Root</h3>
                                    <PasswordItem
                                        label='Root Password'
                                        value={passwords.root.password}
                                        username={passwords.root.user}
                                    />
                                </div>
                            )}

                            {/* Metrics Credentials */}
                            {passwords?.metrics && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className='text-sm font-semibold mb-3'>
                                            Metrics Exporter
                                        </h3>
                                        <PasswordItem
                                            label='Metrics Password'
                                            value={passwords.metrics.password}
                                            username={passwords.metrics.user}
                                        />
                                    </div>
                                </>
                            )}

                            {/* WordPress Projects */}
                            {passwords && Object.keys(passwords.wordpressProjects).length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h3 className='text-sm font-semibold mb-3'>
                                            WordPress Projects
                                        </h3>
                                        <div className='space-y-4'>
                                            {Object.entries(passwords.wordpressProjects).map(
                                                ([projectName, creds]) => (
                                                    <div
                                                        key={projectName}
                                                        className='border rounded-lg p-3 space-y-2'
                                                    >
                                                        <div className='font-medium text-sm mb-2'>
                                                            {projectName}
                                                        </div>
                                                        <div className='text-xs text-muted-foreground mb-2'>
                                                            Database: {creds.dbName}
                                                        </div>
                                                        <PasswordItem
                                                            label='Database User'
                                                            value={creds.dbUser}
                                                        />
                                                        <PasswordItem
                                                            label='Database Password'
                                                            value={creds.dbPassword}
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className='text-xs text-muted-foreground text-center pt-2 border-t'>
                        Passwords are shown for 5 seconds when revealed
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
