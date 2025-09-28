import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { ContainerCreateOptions } from 'dockerode';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "../../ui/dialog.tsx";
import { Button } from "../../ui/button.tsx";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs.tsx";
import { ScrollArea } from "../../ui/scroll-area.tsx";
import { Input } from "../../ui/input.tsx";
import { Label } from "../../ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { dockerClientService } from "@/docker/docker-client.ts";

interface ContainerCreateDialogProps {
    previousContainerName?: string;
    previousContainerId?: string;
    onCreate: (containerConfig: ContainerCreateOptions, previousContainerId: string | null, removePreviousContainer: boolean) => void;
    defaultConfig?: ContainerCreateOptions;
}

interface KeyValuePair {
    key: string;
    value: string;
}

interface PortMapping {
    containerPort: string;
    hostPort: string;
    protocol: 'tcp' | 'udp';
}

interface VolumeMapping {
    hostPath: string;
    containerPath: string;
    readOnly: boolean;
}

export function ContainerCreateDialog({
                                          previousContainerName,
                                          previousContainerId,
                                          onCreate,
                                          defaultConfig
                                      }: ContainerCreateDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [removePreviousContainer, setRemovePreviousContainer] = useState(false);
    const [advancedConfiguration, setAdvancedConfiguration] = useState(false);

    const [envVars, setEnvVars] = useState<KeyValuePair[]>([]);
    const [ports, setPorts] = useState<PortMapping[]>([]);
    const [volumes, setVolumes] = useState<VolumeMapping[]>([]);
    const [labels, setLabels] = useState<KeyValuePair[]>([]);
    const restartPolicies = ['no', 'always', 'on-failure', 'unless-stopped'];
    const networkModes = ['bridge', 'host', 'none'];

    const form = useForm<ContainerCreateOptions>({
        defaultValues: {
            name: "",
            Image: "",
            Cmd: [],
            Env: [],
            ExposedPorts: {},
            HostConfig: {
                Binds: [],
                PortBindings: {},
                RestartPolicy: { Name: "no" },
                NetworkMode: "bridge",
                Privileged: false,
            },
        },
    });

    const fetchPreviousContainerDetails = useCallback(async () => {
        if (!previousContainerId) {
            toast.error("No previous container ID provided");
            return;
        }

        setLoading(true);

        try {
            const details = await dockerClientService.containers.get(previousContainerId);

            if (details) {
                const containerConfig: ContainerCreateOptions = {
                    name: `${details.Name.replace(/^\//, '')}_copy`,
                    Image: details.Config.Image,
                    Hostname: details.Config.Hostname,
                    Domainname: details.Config.Domainname,
                    User: details.Config.User,
                    Cmd: details.Config.Cmd || [],
                    Env: details.Config.Env || [],
                    ExposedPorts: details.Config.ExposedPorts || {},
                    Labels: details.Config.Labels || {},
                    HostConfig: {
                        Binds: details.HostConfig?.Binds || [],
                        PortBindings: details.HostConfig?.PortBindings || {},
                        RestartPolicy: details.HostConfig?.RestartPolicy || { Name: "no" },
                        NetworkMode: details.HostConfig?.NetworkMode || "bridge",
                        Devices: details.HostConfig?.Devices || [],
                        Privileged: details.HostConfig?.Privileged || false,
                        CapAdd: details.HostConfig?.CapAdd || [],
                        CapDrop: details.HostConfig?.CapDrop || [],
                    }
                };

                form.reset(containerConfig);

                const envVarsArray: KeyValuePair[] = [];
                containerConfig.Env?.forEach(env => {
                    const [key, ...valueParts] = env.split('=');
                    const value = valueParts.join('=');
                    envVarsArray.push({ key, value });
                });
                setEnvVars(envVarsArray);

                const portsArray: PortMapping[] = [];
                if (containerConfig.HostConfig?.PortBindings) {
                    Object.entries(containerConfig.HostConfig.PortBindings).forEach(([containerPortWithProto, hostBindings]) => {
                        const [containerPort, protocol = 'tcp'] = containerPortWithProto.split('/');
                        if (Array.isArray(hostBindings) && hostBindings.length > 0) {
                            hostBindings.forEach((binding: { HostPort?: string }) => {
                                portsArray.push({
                                    containerPort,
                                    hostPort: binding.HostPort || '',
                                    protocol: protocol as 'tcp' | 'udp'
                                });
                            });
                        } else {
                            portsArray.push({
                                containerPort,
                                hostPort: '',
                                protocol: protocol as 'tcp' | 'udp'
                            });
                        }
                    });
                }
                setPorts(portsArray);

                const volumesArray: VolumeMapping[] = [];
                containerConfig.HostConfig?.Binds?.forEach(bind => {
                    const parts = bind.split(':');
                    const hostPath = parts[0];
                    const containerPath = parts[1];
                    const readOnly = parts.length > 2 && parts[2] === 'ro';
                    volumesArray.push({ hostPath, containerPath, readOnly });
                });
                setVolumes(volumesArray);

                const labelsArray: KeyValuePair[] = [];
                if (containerConfig.Labels) {
                    Object.entries(containerConfig.Labels).forEach(([key, value]) => {
                        labelsArray.push({ key, value: value || '' });
                    });
                }
                setLabels(labelsArray);
            }
        } catch (error) {
            toast.error(`Failed to fetch container details: ${error}`);
        } finally {
            setLoading(false);
        }
    }, [previousContainerId, form]);

    const updateFormFromDefaultConfig = useCallback(() => {
        if (defaultConfig) {
            form.reset(defaultConfig);
            setEnvVars((defaultConfig.Env || []).map(env => {
                const [key, ...valueParts] = env.split('=');
                return { key, value: valueParts.join('=') };
            }));
            setPorts(Object.entries(defaultConfig.ExposedPorts || {}).map(([portWithProto]) => {
                const [containerPort, protocol = 'tcp'] = portWithProto.split('/');
                return { containerPort, hostPort: '', protocol: protocol as 'tcp' | 'udp' };
            }));
            setVolumes((defaultConfig.HostConfig?.Binds || []).map(bind => {
                const parts = bind.split(':');
                const hostPath = parts[0];
                const containerPath = parts[1];
                const readOnly = parts.length > 2 && parts[2] === 'ro';
                return { hostPath, containerPath, readOnly };
            }));
            setLabels(Object.entries(defaultConfig.Labels || {}).map(([key, value]) => ({
                key,
                value: value || ''
            })));
        }
    }, [defaultConfig, form]);

    useEffect(() => {
        if (open) {
            if (previousContainerId) {
                fetchPreviousContainerDetails().then();
            } else if (defaultConfig) {
                updateFormFromDefaultConfig();
            }
        }
    }, [open, previousContainerId, fetchPreviousContainerDetails, updateFormFromDefaultConfig, defaultConfig]);

    const handleSubmit = () => {
        const values = form.getValues();

        if (!values.Image || !values.name) {
            toast.error("Container name and image are required");
            return;
        }

        values.Env = envVars.filter(v => v.key.trim()).map(v => `${v.key}=${v.value}`);

        if (!values.ExposedPorts) values.ExposedPorts = {};
        if (!values.HostConfig) values.HostConfig = {};
        if (!values.HostConfig.PortBindings) values.HostConfig.PortBindings = {};

        ports.forEach(port => {
            if (port.containerPort && values.ExposedPorts && values.HostConfig?.PortBindings) {
                const containerPortWithProto = `${port.containerPort}/${port.protocol}`;
                values.ExposedPorts[containerPortWithProto] = {};

                if (port.hostPort) {
                    values.HostConfig.PortBindings[containerPortWithProto] = [
                        { HostPort: port.hostPort }
                    ];
                }
            }
        });

        if (values.HostConfig) {
            values.HostConfig.Binds = volumes
                .filter(v => v.hostPath && v.containerPath)
                .map(v => `${v.hostPath}:${v.containerPath}${v.readOnly ? ':ro' : ''}`);
        }

        if (!values.Labels) values.Labels = {};
        labels.filter(l => l.key.trim()).forEach(label => {
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
                        variant="outline"
                        className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:border-orange-300"
                        title="Duplicate container"
                    >
                        <Copy className="h-4 w-4"/>
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:border-green-300"
                        title="Duplicate container"
                    >
                        <Plus className="h-4 w-4"/>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[880px] h-[85vh] p-0 flex flex-col overflow-hidden border border-white/10 bg-[#0b111b]/85 supports-[backdrop-filter]:bg-[#0b111b]/55 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl backdrop-saturate-150 shadow-xl shadow-black/40">
                {/* Decorative glass overlays (non-interactive) */}
                <div className='pointer-events-none absolute inset-0'>
                    {/* Soft radial highlight */}
                    <div className='absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.12),transparent_65%)]' />
                    {/* Grain / noise */}
                    <div className='absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.6)_0px,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_3px)]' />
                    {/* Subtle top gradient edge */}
                    <div className='absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-white/10 to-transparent' />
                </div>
                <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,#1d4ed8,#3b82f6,#60a5fa)] drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                        {previousContainerId ? (
                            <>
                                <Copy className="h-5 w-5 text-orange-600"/>
                                Duplicate Container: {previousContainerName}
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 text-green-600"/>
                                Create New Container
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {previousContainerId ? "Modify container configuration. The container will be recreated with the new settings." :
                            "Configure the new container settings below. All fields are optional except for the container name and image."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0 px-6 relative">
                    <Tabs defaultValue="basic" className="flex flex-col h-full">
                        <TabsList className="grid w-full grid-cols-5 flex-shrink-0 mb-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
                            {['basic','env','ports','volumes','other'].map((tab) => (
                                <TabsTrigger
                                    key={tab}
                                    value={tab}
                                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-white/15 data-[state=active]:to-white/5 data-[state=active]:text-white/90 data-[state=active]:shadow-inner transition-all duration-300 text-sm tracking-wide uppercase data-[state=active]:backdrop-blur-sm hover:bg-white/5 rounded-xl">
                                    {tab}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="flex-1 min-h-0">
                            <ScrollArea className="h-full">
                                <div className="pr-4 pb-6 space-y-6">
                                    {/* Basic Tab */}
                                    <TabsContent value="basic" className="mt-0 space-y-4 focus-visible:outline-none">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35 }}
                                            className="group relative"
                                        >
                                            <Card className="relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.07]">
                                                <CardHeader>
                                                    <CardTitle className="text-[13px] tracking-wide uppercase text-white/70">Basic Configuration</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="name">Container Name*</Label>
                                                        <Input
                                                            id="name"
                                                            value={form.watch("name") || ""}
                                                            onChange={(e) => form.setValue("name", e.target.value)}
                                                            placeholder="my-container"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="image">Image*</Label>
                                                        <Input
                                                            id="image"
                                                            value={form.watch("Image") || ""}
                                                            onChange={(e) => form.setValue("Image", e.target.value)}
                                                            placeholder="nginx:latest"
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
                                                        className="mt-6 pt-5 border-t border-white/10 space-y-5"
                                                    >
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="hostname">Hostname</Label>
                                                                <Input
                                                                    id="hostname"
                                                                    value={form.watch("Hostname") || ""}
                                                                    onChange={(e) => form.setValue("Hostname", e.target.value)}
                                                                    placeholder="my-hostname"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="domainname">Domain Name</Label>
                                                                <Input
                                                                    id="domainname"
                                                                    value={form.watch("Domainname") || ""}
                                                                    onChange={(e) => form.setValue("Domainname", e.target.value)}
                                                                    placeholder="example.com"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="user">User</Label>
                                                            <Input
                                                                id="user"
                                                                value={form.watch("User") || ""}
                                                                onChange={(e) => form.setValue("User", e.target.value)}
                                                                placeholder="1000:1000 or username"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="workingdir">Working Directory</Label>
                                                            <Input
                                                                id="workingdir"
                                                                value={form.watch("WorkingDir") || ""}
                                                                onChange={(e) => form.setValue("WorkingDir", e.target.value)}
                                                                placeholder="/app"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="cmd">Command (one per line)</Label>
                                                            <textarea
                                                                id="cmd"
                                                                className="w-full min-h-[80px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                value={(form.watch("Cmd") || []).join('\n')}
                                                                onChange={(e) => form.setValue("Cmd", e.target.value.split('\n').filter(line => line.trim()))}
                                                                placeholder="npm\nstart"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="entrypoint">Entrypoint (one per
                                                                line)</Label>
                                                            <textarea
                                                                id="entrypoint"
                                                                className="w-full min-h-[60px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                value={Array.isArray(form.watch("Entrypoint")) ? ((form.watch("Entrypoint") as string[] || []).join('\n')) : (form.watch("Entrypoint") || "")}
                                                                onChange={(e) => form.setValue("Entrypoint", e.target.value.split('\n').filter(line => line.trim()))}
                                                                placeholder="/docker-entrypoint.sh"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    </TabsContent>

                                    {/* Environment Tab */}
                                    <TabsContent value="env" className="mt-4 space-y-6">
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y:0 }} transition={{ duration: 0.35 }} className='space-y-6'>
                                        <Card className="relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]">
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>Environment Variables</CardTitle>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEnvVars([...envVars, { key: "", value: "" }])}
                                                    className='hover:scale-[1.03] active:scale-[0.97] transition mb-3'
                                                >
                                                    <Plus className="h-4 w-4 mr-1"/>
                                                    Add Variable
                                                </Button>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {envVars.map((env, index) => (
                                                        <motion.div key={index} layout className="flex gap-2 items-center group/env">
                                                            <Input
                                                                placeholder="KEY"
                                                                value={env.key}
                                                                onChange={(e) => {
                                                                    const newEnvVars = [...envVars];
                                                                    newEnvVars[index].key = e.target.value;
                                                                    setEnvVars(newEnvVars);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <span>=</span>
                                                            <Input
                                                                placeholder="value"
                                                                value={env.value}
                                                                onChange={(e) => {
                                                                    const newEnvVars = [...envVars];
                                                                    newEnvVars[index].value = e.target.value;
                                                                    setEnvVars(newEnvVars);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEnvVars(envVars.filter((_, i) => i !== index))}
                                                                className='opacity-60 group-hover/env:opacity-100 transition'
                                                            >
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                    {envVars.length === 0 && (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No environment variables defined. Click "Add Variable" to
                                                            add one.
                                                        </p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]">
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>Labels</CardTitle>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setLabels([...labels, { key: "", value: "" }])}
                                                    className='hover:scale-[1.03] active:scale-[0.97] transition mb-3'
                                                >
                                                    <Plus className="h-4 w-4 mr-1"/>
                                                    Add Label
                                                </Button>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {labels.map((label, index) => (
                                                        <motion.div key={index} layout className="flex gap-2 items-center group/label">
                                                            <Input
                                                                placeholder="label.key"
                                                                value={label.key}
                                                                onChange={(e) => {
                                                                    const newLabels = [...labels];
                                                                    newLabels[index].key = e.target.value;
                                                                    setLabels(newLabels);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <span>=</span>
                                                            <Input
                                                                placeholder="value"
                                                                value={label.value}
                                                                onChange={(e) => {
                                                                    const newLabels = [...labels];
                                                                    newLabels[index].value = e.target.value;
                                                                    setLabels(newLabels);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setLabels(labels.filter((_, i) => i !== index))}
                                                                className='opacity-60 group-hover/label:opacity-100 transition'
                                                            >
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                    {labels.length === 0 && (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No labels defined. Click "Add Label" to add one.
                                                        </p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        </motion.div>
                                    </TabsContent>

                                    {/* Ports Tab */}
                                    <TabsContent value="ports" className="mt-4 space-y-4">
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y:0 }} transition={{ duration: 0.35 }}>
                                        <Card className="relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]">
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>Port Mappings</CardTitle>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPorts([...ports, { containerPort: "", hostPort: "", protocol: "tcp" }])}
                                                    className='hover:scale-[1.03] active:scale-[0.97] transition mb-3'
                                                >
                                                    <Plus className="h-4 w-4 mr-1"/>
                                                    Add Port
                                                </Button>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {ports.map((port, index) => (
                                                        <motion.div key={index} layout className="flex gap-2 items-center group/port">
                                                            <Input
                                                                placeholder="Host Port"
                                                                value={port.hostPort}
                                                                onChange={(e) => {
                                                                    const newPorts = [...ports];
                                                                    newPorts[index].hostPort = e.target.value;
                                                                    setPorts(newPorts);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <span>:</span>
                                                            <Input
                                                                placeholder="Container Port"
                                                                value={port.containerPort}
                                                                onChange={(e) => {
                                                                    const newPorts = [...ports];
                                                                    newPorts[index].containerPort = e.target.value;
                                                                    setPorts(newPorts);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <Select
                                                                value={port.protocol}
                                                                onValueChange={(value: 'tcp' | 'udp') => {
                                                                    const newPorts = [...ports];
                                                                    newPorts[index].protocol = value;
                                                                    setPorts(newPorts);
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-20">
                                                                    <SelectValue/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="tcp">TCP</SelectItem>
                                                                    <SelectItem value="udp">UDP</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setPorts(ports.filter((_, i) => i !== index))}
                                                                className='opacity-60 group-hover/port:opacity-100 transition'
                                                            >
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                    {ports.length === 0 && (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No port mappings defined. Click "Add Port" to add one.
                                                        </p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        </motion.div>
                                    </TabsContent>


                                    {/* Volumes Tab */}
                                    <TabsContent value="volumes" className="mt-4 space-y-4">
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y:0 }} transition={{ duration: 0.35 }}>
                                        <Card className="relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]">
                                            <CardHeader className="flex flex-row items-center justify-between">
                                                <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>Volume Mappings</CardTitle>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setVolumes([...volumes, { hostPath: "", containerPath: "", readOnly: false }])}
                                                    className='hover:scale-[1.03] active:scale-[0.97] transition mb-3'
                                                >
                                                    <Plus className="h-4 w-4 mr-1"/>
                                                    Add Volume
                                                </Button>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {volumes.map((volume, index) => (
                                                        <motion.div key={index} layout className="flex gap-2 items-center group/volume">
                                                            <Input
                                                                placeholder="Host Path"
                                                                value={volume.hostPath}
                                                                onChange={(e) => {
                                                                    const newVolumes = [...volumes];
                                                                    newVolumes[index].hostPath = e.target.value;
                                                                    setVolumes(newVolumes);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <span>:</span>
                                                            <Input
                                                                placeholder="Container Path"
                                                                value={volume.containerPath}
                                                                onChange={(e) => {
                                                                    const newVolumes = [...volumes];
                                                                    newVolumes[index].containerPath = e.target.value;
                                                                    setVolumes(newVolumes);
                                                                }}
                                                                className="flex-1"
                                                            />
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`readonly-${index}`}
                                                                    checked={volume.readOnly}
                                                                    onCheckedChange={(checked) => {
                                                                        const newVolumes = [...volumes];
                                                                        newVolumes[index].readOnly = !!checked;
                                                                        setVolumes(newVolumes);
                                                                    }}
                                                                />
                                                                <Label htmlFor={`readonly-${index}`}
                                                                       className="text-sm">RO</Label>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setVolumes(volumes.filter((_, i) => i !== index))}
                                                                className='opacity-60 group-hover/volume:opacity-100 transition'
                                                            >
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </motion.div>
                                                    ))}
                                                    {volumes.length === 0 && (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No volume mappings defined. Click "Add Volume" to add one.
                                                        </p>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        </motion.div>
                                    </TabsContent>

                                    {/* Other Tab */}
                                    <TabsContent value="other" className="mt-4 space-y-4">
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y:0 }} transition={{ duration: 0.35 }}>
                                        <Card className="relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]">
                                            <CardHeader>
                                                <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>Network & Security</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="restart-policy">Restart Policy</Label>
                                                        <Select
                                                            value={form.watch("HostConfig.RestartPolicy.Name") || "no"}
                                                            onValueChange={(value) => form.setValue("HostConfig.RestartPolicy.Name", value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {restartPolicies.map(policy => (
                                                                    <SelectItem key={policy} value={policy}>
                                                                        {policy}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="network-mode">Network Mode</Label>
                                                        <Select
                                                            value={form.watch("HostConfig.NetworkMode") || "bridge"}
                                                            onValueChange={(value) => form.setValue("HostConfig.NetworkMode", value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {networkModes.map(mode => (
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
                                                        className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/10"
                                                    >
                                                        <div className="space-y-2">
                                                            <Label htmlFor="max-retry">Max Retry Count</Label>
                                                            <Input
                                                                id="max-retry"
                                                                type="number"
                                                                value={form.watch("HostConfig.RestartPolicy.MaximumRetryCount") || ""}
                                                                onChange={(e) => form.setValue("HostConfig.RestartPolicy.MaximumRetryCount", parseInt(e.target.value) || 0)}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="pid-mode">PID Mode</Label>
                                                            <Input
                                                                id="pid-mode"
                                                                value={form.watch("HostConfig.PidMode") || ""}
                                                                onChange={(e) => form.setValue("HostConfig.PidMode", e.target.value)}
                                                                placeholder="host"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>

                                                <Separator/>

                                                <div className="space-y-4">
                                                    {advancedConfiguration && (
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <Label>Privileged Mode</Label>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Give extended privileges to this container
                                                                </p>
                                                            </div>
                                                            <Switch
                                                                checked={form.watch("HostConfig.Privileged") || false}
                                                                onCheckedChange={(checked) => form.setValue("HostConfig.Privileged", checked)}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label>Auto Remove</Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                Automatically remove container when it exits
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={form.watch("HostConfig.AutoRemove") || false}
                                                            onCheckedChange={(checked) => form.setValue("HostConfig.AutoRemove", checked)}
                                                        />
                                                    </div>

                                                    {previousContainerId && (
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <Label>Remove Current Container</Label>
                                                                <p className="text-sm text-muted-foreground">
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
                                                        className="mt-8 space-y-6 pt-6 border-t border-white/10"
                                                    >

                                                        <Separator/>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="memory">Memory Limit (MB)</Label>
                                                                <Input
                                                                    id="memory"
                                                                    type="number"
                                                                    value={form.watch("HostConfig.Memory") ? (form.watch("HostConfig.Memory") || 0) / 1024 / 1024 : ""}
                                                                    onChange={(e) => form.setValue("HostConfig.Memory", parseInt(e.target.value) * 1024 * 1024 || 0)}
                                                                    placeholder="512"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="cpu-shares">CPU Shares</Label>
                                                                <Input
                                                                    id="cpu-shares"
                                                                    type="number"
                                                                    value={form.watch("HostConfig.CpuShares") || ""}
                                                                    onChange={(e) => form.setValue("HostConfig.CpuShares", parseInt(e.target.value) || 0)}
                                                                    placeholder="1024"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="dns">DNS Servers (one per line)</Label>
                                                            <textarea
                                                                id="dns"
                                                                className="w-full min-h-[60px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                value={(form.watch("HostConfig.Dns") || []).join('\n')}
                                                                onChange={(e) => form.setValue("HostConfig.Dns", e.target.value.split('\n').filter(line => line.trim()))}
                                                                placeholder="8.8.8.8&#10;1.1.1.1"
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="extra-hosts">Extra Hosts (one per line,
                                                                format:
                                                                hostname:ip)</Label>
                                                            <textarea
                                                                id="extra-hosts"
                                                                className="w-full min-h-[60px] px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                value={(form.watch("HostConfig.ExtraHosts") || []).join('\n')}
                                                                onChange={(e) => form.setValue("HostConfig.ExtraHosts", e.target.value.split('\n').filter(line => line.trim()))}
                                                                placeholder="somehost:162.242.195.82&#10;otherhost:50.31.209.229"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>

                                            </CardContent>
                                        </Card>
                                        </motion.div>
                                    </TabsContent>


                                </div>
                            </ScrollArea>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="px-6 py-4 border-t border-white/10 bg-white/5 backdrop-blur-sm flex justify-between items-center w-full">
                    <div className="flex items-center space-x-2 w-full">
                        <Switch checked={advancedConfiguration} onCheckedChange={setAdvancedConfiguration}/>
                        <Label>Advanced Configuration</Label>
                    </div>
                    <div className="flex-shrink-0 space-x-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        {previousContainerId ? (
                            <Button
                                onClick={handleSubmit}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                disabled={loading || !form.getValues().Image || !form.getValues().name}
                            >
                                Duplicate Container
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={loading || !form.getValues().Image || !form.getValues().name}
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
