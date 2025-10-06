import { Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UseFormReturn } from 'react-hook-form';
import { ContainerCreateOptions } from 'dockerode';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card.tsx';
import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { TabsContent } from '../../ui/tabs.tsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Switch } from '@/components/ui/switch.tsx';

interface NetworkSecurityTabProps {
    form: UseFormReturn<ContainerCreateOptions>;
    advancedConfiguration: boolean;
    removePreviousContainer: boolean;
    setRemovePreviousContainer: Dispatch<SetStateAction<boolean>>;
    previousContainerId?: string;
}

const restartPolicies = ['no', 'always', 'on-failure', 'unless-stopped'];
const networkModes = ['bridge', 'host', 'none'];

export function NetworkSecurityTab({
    form,
    advancedConfiguration,
    removePreviousContainer,
    setRemovePreviousContainer,
    previousContainerId,
}: NetworkSecurityTabProps) {
    return (
        <TabsContent value='other' className='mt-4 space-y-4'>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <Card className='relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]'>
                    <CardHeader>
                        <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>
                            Network & Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='restart-policy'>Restart Policy</Label>
                                <Select
                                    value={
                                        form.watch('HostConfig.RestartPolicy.Name') || 'no'
                                    }
                                    onValueChange={(value) =>
                                        form.setValue('HostConfig.RestartPolicy.Name', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {restartPolicies.map((policy) => (
                                            <SelectItem key={policy} value={policy}>
                                                {policy}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='network-mode'>Network Mode</Label>
                                <Select
                                    value={form.watch('HostConfig.NetworkMode') || 'bridge'}
                                    onValueChange={(value) =>
                                        form.setValue('HostConfig.NetworkMode', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {networkModes.map((mode) => (
                                            <SelectItem key={mode} value={mode}>
                                                {mode}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {advancedConfiguration && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.35 }}
                                    className='grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/10'
                                >
                                    <div className='space-y-2'>
                                        <Label htmlFor='max-retry'>Max Retry Count</Label>
                                        <Input
                                            id='max-retry'
                                            type='number'
                                            value={
                                                form.watch(
                                                    'HostConfig.RestartPolicy.MaximumRetryCount',
                                                ) || ''
                                            }
                                            onChange={(e) =>
                                                form.setValue(
                                                    'HostConfig.RestartPolicy.MaximumRetryCount',
                                                    parseInt(e.target.value) || 0,
                                                )
                                            }
                                            placeholder='0'
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                        <Label htmlFor='pid-mode'>PID Mode</Label>
                                        <Input
                                            id='pid-mode'
                                            value={form.watch('HostConfig.PidMode') || ''}
                                            onChange={(e) =>
                                                form.setValue('HostConfig.PidMode', e.target.value)
                                            }
                                            placeholder='host'
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Separator />

                        <div className='space-y-4'>
                            {advancedConfiguration && (
                                <div className='flex items-center justify-between'>
                                    <div className='space-y-0.5'>
                                        <Label>Privileged Mode</Label>
                                        <p className='text-sm text-muted-foreground'>
                                            Give extended privileges to this container
                                        </p>
                                    </div>
                                    <Switch
                                        checked={form.watch('HostConfig.Privileged') || false}
                                        onCheckedChange={(checked) =>
                                            form.setValue('HostConfig.Privileged', checked)
                                        }
                                    />
                                </div>
                            )}

                            <div className='flex items-center justify-between'>
                                <div className='space-y-0.5'>
                                    <Label>Auto Remove</Label>
                                    <p className='text-sm text-muted-foreground'>
                                        Automatically remove container when it exits
                                    </p>
                                </div>
                                <Switch
                                    checked={form.watch('HostConfig.AutoRemove') || false}
                                    onCheckedChange={(checked) =>
                                        form.setValue('HostConfig.AutoRemove', checked)
                                    }
                                />
                            </div>

                            {previousContainerId && (
                                <div className='flex items-center justify-between'>
                                    <div className='space-y-0.5'>
                                        <Label>Remove Current Container</Label>
                                        <p className='text-sm text-muted-foreground'>
                                            Remove the original container after duplication
                                        </p>
                                    </div>
                                    <Switch
                                        checked={removePreviousContainer}
                                        onCheckedChange={setRemovePreviousContainer}
                                    />
                                </div>
                            )}
                        </div>

                        <AnimatePresence initial={false}>
                            {advancedConfiguration && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.35 }}
                                    className='mt-8 space-y-6 pt-6 border-t border-white/10'
                                >
                                    <Separator />

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label htmlFor='memory'>Memory Limit (MB)</Label>
                                            <Input
                                                id='memory'
                                                type='number'
                                                value={
                                                    form.watch('HostConfig.Memory')
                                                        ? (form.watch('HostConfig.Memory') || 0) /
                                                          1024 /
                                                          1024
                                                        : ''
                                                }
                                                onChange={(e) =>
                                                    form.setValue(
                                                        'HostConfig.Memory',
                                                        parseInt(e.target.value) * 1024 * 1024 ||
                                                            0,
                                                    )
                                                }
                                                placeholder='512'
                                            />
                                        </div>
                                        <div className='space-y-2'>
                                            <Label htmlFor='cpu-shares'>CPU Shares</Label>
                                            <Input
                                                id='cpu-shares'
                                                type='number'
                                                value={form.watch('HostConfig.CpuShares') || ''}
                                                onChange={(e) =>
                                                    form.setValue(
                                                        'HostConfig.CpuShares',
                                                        parseInt(e.target.value) || 0,
                                                    )
                                                }
                                                placeholder='1024'
                                            />
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='dns'>DNS Servers (one per line)</Label>
                                        <textarea
                                            id='dns'
                                            className='w-full min-h-[60px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                            value={(form.watch('HostConfig.Dns') || []).join('\n')}
                                            onChange={(e) =>
                                                form.setValue(
                                                    'HostConfig.Dns',
                                                    e.target.value
                                                        .split('\n')
                                                        .filter((line) => line.trim()),
                                                )
                                            }
                                            placeholder='8.8.8.8&#10;1.1.1.1'
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='extra-hosts'>
                                            Extra Hosts (one per line, format: hostname:ip)
                                        </Label>
                                        <textarea
                                            id='extra-hosts'
                                            className='w-full min-h-[60px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                            value={(
                                                form.watch('HostConfig.ExtraHosts') || []
                                            ).join('\n')}
                                            onChange={(e) =>
                                                form.setValue(
                                                    'HostConfig.ExtraHosts',
                                                    e.target.value
                                                        .split('\n')
                                                        .filter((line) => line.trim()),
                                                )
                                            }
                                            placeholder='somehost:162.242.195.82&#10;otherhost:50.31.209.229'
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
