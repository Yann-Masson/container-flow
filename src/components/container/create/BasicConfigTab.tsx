import { motion, AnimatePresence } from 'framer-motion';
import { UseFormReturn } from 'react-hook-form';
import { ContainerCreateOptions } from 'dockerode';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card.tsx';
import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { TabsContent } from '../../ui/tabs.tsx';

interface BasicConfigTabProps {
    form: UseFormReturn<ContainerCreateOptions>;
    advancedConfiguration: boolean;
}

export function BasicConfigTab({ form, advancedConfiguration }: BasicConfigTabProps) {
    return (
        <TabsContent value='basic' className='mt-0 space-y-4 focus-visible:outline-none'>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className='group relative'
            >
                <Card className='relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.07]'>
                    <CardHeader>
                        <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>
                            Basic Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='name'>Container Name*</Label>
                                <Input
                                    id='name'
                                    value={form.watch('name') || ''}
                                    onChange={(e) => form.setValue('name', e.target.value)}
                                    placeholder='my-container'
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='image'>Image*</Label>
                                <Input
                                    id='image'
                                    value={form.watch('Image') || ''}
                                    onChange={(e) => form.setValue('Image', e.target.value)}
                                    placeholder='nginx:latest'
                                />
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {advancedConfiguration && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                                    className='mt-6 pt-5 border-t border-white/10 space-y-5'
                                >
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label htmlFor='hostname'>Hostname</Label>
                                            <Input
                                                id='hostname'
                                                value={form.watch('Hostname') || ''}
                                                onChange={(e) =>
                                                    form.setValue('Hostname', e.target.value)
                                                }
                                                placeholder='my-hostname'
                                            />
                                        </div>
                                        <div className='space-y-2'>
                                            <Label htmlFor='domainname'>Domain Name</Label>
                                            <Input
                                                id='domainname'
                                                value={form.watch('Domainname') || ''}
                                                onChange={(e) =>
                                                    form.setValue('Domainname', e.target.value)
                                                }
                                                placeholder='example.com'
                                            />
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='user'>User</Label>
                                        <Input
                                            id='user'
                                            value={form.watch('User') || ''}
                                            onChange={(e) => form.setValue('User', e.target.value)}
                                            placeholder='1000:1000 or username'
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='workingdir'>Working Directory</Label>
                                        <Input
                                            id='workingdir'
                                            value={form.watch('WorkingDir') || ''}
                                            onChange={(e) =>
                                                form.setValue('WorkingDir', e.target.value)
                                            }
                                            placeholder='/app'
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='cmd'>Command (one per line)</Label>
                                        <textarea
                                            id='cmd'
                                            className='w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                            value={(form.watch('Cmd') || []).join('\n')}
                                            onChange={(e) =>
                                                form.setValue(
                                                    'Cmd',
                                                    e.target.value
                                                        .split('\n')
                                                        .filter((line) => line.trim()),
                                                )
                                            }
                                            placeholder='npm\nstart'
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='entrypoint'>Entrypoint (one per line)</Label>
                                        <textarea
                                            id='entrypoint'
                                            className='w-full min-h-[60px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                            value={
                                                Array.isArray(form.watch('Entrypoint'))
                                                    ? (
                                                          (form.watch('Entrypoint') as string[]) ||
                                                          []
                                                      ).join('\n')
                                                    : form.watch('Entrypoint') || ''
                                            }
                                            onChange={(e) =>
                                                form.setValue(
                                                    'Entrypoint',
                                                    e.target.value
                                                        .split('\n')
                                                        .filter((line) => line.trim()),
                                                )
                                            }
                                            placeholder='/docker-entrypoint.sh'
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    );
}
