import { useEffect, useState } from 'react';
import { ContainerCreateOptions } from 'dockerode';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../ui/dialog.tsx';
import { Button } from '../../ui/button.tsx';
import { Copy, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs.tsx';
import { ScrollArea } from '../../ui/scroll-area.tsx';
import { Label } from '../../ui/label.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { KeyValuePair, PortMapping, VolumeMapping } from './types.ts';
import { BasicConfigTab } from './BasicConfigTab.tsx';
import { EnvironmentTab } from './EnvironmentTab.tsx';
import { PortsTab } from './PortsTab.tsx';
import { VolumesTab } from './VolumesTab.tsx';
import { NetworkSecurityTab } from './NetworkSecurityTab.tsx';
import { useContainerDetails } from './hooks.ts';
import { getButtonStyle } from './utils.ts';

interface ContainerCreateDialogProps {
    previousContainerName?: string;
    previousContainerId?: string;
    onCreate: (
        containerConfig: ContainerCreateOptions,
        previousContainerId: string | null,
        removePreviousContainer: boolean,
    ) => void;
    defaultConfig?: ContainerCreateOptions;
}

export function ContainerCreateDialog({
    previousContainerName,
    previousContainerId,
    onCreate,
    defaultConfig,
}: ContainerCreateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [removePreviousContainer, setRemovePreviousContainer] = useState(false);
    const [advancedConfiguration, setAdvancedConfiguration] = useState(false);

    const [envVars, setEnvVars] = useState<KeyValuePair[]>([]);
    const [ports, setPorts] = useState<PortMapping[]>([]);
    const [volumes, setVolumes] = useState<VolumeMapping[]>([]);
    const [labels, setLabels] = useState<KeyValuePair[]>([]);

    const form = useForm<ContainerCreateOptions>({
        defaultValues: {
            name: '',
            Image: '',
            Cmd: [],
            Env: [],
            ExposedPorts: {},
            HostConfig: {
                Binds: [],
                PortBindings: {},
                RestartPolicy: { Name: 'no' },
                NetworkMode: 'bridge',
                Privileged: false,
            },
        },
    });

    const { fetchPreviousContainerDetails, updateFormFromDefaultConfig } = useContainerDetails({
        form,
        setEnvVars,
        setPorts,
        setVolumes,
        setLabels,
        setLoading,
    });

    useEffect(() => {
        if (open) {
            if (previousContainerId) {
                fetchPreviousContainerDetails(previousContainerId).then();
            } else if (defaultConfig) {
                updateFormFromDefaultConfig(defaultConfig);
            }
        }
    }, [
        open,
        previousContainerId,
        fetchPreviousContainerDetails,
        updateFormFromDefaultConfig,
        defaultConfig,
    ]);

    const handleSubmit = () => {
        const values = form.getValues();

        if (!values.Image || !values.name) {
            toast.error('Container name and image are required');
            return;
        }

        values.Env = envVars.filter((v) => v.key.trim()).map((v) => `${v.key}=${v.value}`);

        if (!values.ExposedPorts) values.ExposedPorts = {};
        if (!values.HostConfig) values.HostConfig = {};
        if (!values.HostConfig.PortBindings) values.HostConfig.PortBindings = {};

        ports.forEach((port) => {
            if (port.containerPort && values.ExposedPorts && values.HostConfig?.PortBindings) {
                const containerPortWithProto = `${port.containerPort}/${port.protocol}`;
                values.ExposedPorts[containerPortWithProto] = {};

                if (port.hostPort) {
                    values.HostConfig.PortBindings[containerPortWithProto] = [
                        { HostPort: port.hostPort },
                    ];
                }
            }
        });

        if (values.HostConfig) {
            values.HostConfig.Binds = volumes
                .filter((v) => v.hostPath && v.containerPath)
                .map((v) => `${v.hostPath}:${v.containerPath}${v.readOnly ? ':ro' : ''}`);
        }

        if (!values.Labels) values.Labels = {};
        labels
            .filter((l) => l.key.trim())
            .forEach((label) => {
                if (values.Labels) {
                    values.Labels[label.key] = label.value;
                }
            });

        onCreate(values, previousContainerId || null, removePreviousContainer);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {previousContainerId ? (
                    <Button
                        variant='outline'
                        className='h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:border-orange-300'
                        title='Duplicate container'
                    >
                        <Copy className='h-4 w-4' />
                    </Button>
                ) : (
                    <Button
                        variant='outline'
                        className={`${getButtonStyle(defaultConfig)}`}
                        title='Duplicate container'
                    >
                        {defaultConfig?.name} <Plus className='h-4 w-4' />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className='max-w-[90vw] h-[85vh] p-0 flex flex-col overflow-hidden border border-white/10 bg-[#0b111b]/85 supports-[backdrop-filter]:bg-[#0b111b]/55 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl backdrop-saturate-150 shadow-xl shadow-black/40'>
                <div className='pointer-events-none absolute inset-0'>
                    <div className='absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.12),transparent_65%)]' />
                    <div className='absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.6)_0px,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_3px)]' />
                    <div className='absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-white/10 to-transparent' />
                </div>
                <DialogHeader className='px-6 pt-6 pb-4 flex-shrink-0'>
                    <DialogTitle className='flex items-center gap-2 text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]'>
                        {previousContainerId ? (
                            <>
                                <Copy className='h-5 w-5 text-orange-600' />
                                Duplicate Container: {previousContainerName}
                            </>
                        ) : (
                            <>
                                <Plus className='h-5 w-5 text-green-600' />
                                Create New Container
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {previousContainerId
                            ? 'Modify container configuration. The container will be recreated with the new settings.'
                            : 'Configure the new container settings below. All fields are optional except for the container name and image.'}
                    </DialogDescription>
                </DialogHeader>

                <div className='flex-1 flex flex-col min-h-0 px-6 relative'>
                    <Tabs defaultValue='basic' className='flex flex-col h-full'>
                        <TabsList className='grid w-full grid-cols-5 flex-shrink-0 mb-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden'>
                            {['basic', 'env', 'ports', 'volumes', 'other'].map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className='data-[state=active]:bg-gradient-to-br data-[state=active]:from-white/15 data-[state=active]:to-white/5 data-[state=active]:text-white/90 data-[state=active]:shadow-inner transition-all duration-300 text-sm tracking-wide uppercase data-[state=active]:backdrop-blur-sm hover:bg-white/5 rounded-xl'
                                >
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className='flex-1 min-h-0'>
                            <ScrollArea className='h-full'>
                                <div className='pr-4 pb-6 space-y-6'>
                                    <BasicConfigTab
                                        form={form}
                                        advancedConfiguration={advancedConfiguration}
                                    />

                                    <EnvironmentTab
                                        envVars={envVars}
                                        setEnvVars={setEnvVars}
                                        labels={labels}
                                        setLabels={setLabels}
                                    />

                                    <PortsTab ports={ports} setPorts={setPorts} />

                                    <VolumesTab volumes={volumes} setVolumes={setVolumes} />

                                    <NetworkSecurityTab
                                        form={form}
                                        advancedConfiguration={advancedConfiguration}
                                        removePreviousContainer={removePreviousContainer}
                                        setRemovePreviousContainer={setRemovePreviousContainer}
                                        previousContainerId={previousContainerId}
                                    />
                                </div>
                            </ScrollArea>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className='px-6 py-4 border-t border-white/10 bg-white/5 backdrop-blur-sm flex justify-between items-center w-full flex-col gap-4'>
                    <div className='flex items-center space-x-2 w-auto sm:w-full'>
                        <Switch
                            checked={advancedConfiguration}
                            onCheckedChange={setAdvancedConfiguration}
                        />
                        <Label>Advanced Configuration</Label>
                    </div>
                    <div className='flex-shrink-0 space-x-2'>
                        <Button variant='outline' onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        {previousContainerId ? (
                            <Button
                                onClick={handleSubmit}
                                className='bg-orange-600 hover:bg-orange-700 text-white'
                                disabled={
                                    loading || !form.getValues().Image || !form.getValues().name
                                }
                            >
                                Duplicate Container
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                className='bg-blue-600 hover:bg-blue-700 text-white'
                                disabled={
                                    loading || !form.getValues().Image || !form.getValues().name
                                }
                            >
                                Create Container
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
