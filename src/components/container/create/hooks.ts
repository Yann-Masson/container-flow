import { useCallback, Dispatch, SetStateAction } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ContainerCreateOptions } from 'dockerode';
import { toast } from 'sonner';
import { dockerClientService } from '@/docker/docker-client.ts';
import { KeyValuePair, PortMapping, VolumeMapping } from './types.ts';

interface UseContainerDetailsProps {
    form: UseFormReturn<ContainerCreateOptions>;
    setEnvVars: Dispatch<SetStateAction<KeyValuePair[]>>;
    setPorts: Dispatch<SetStateAction<PortMapping[]>>;
    setVolumes: Dispatch<SetStateAction<VolumeMapping[]>>;
    setLabels: Dispatch<SetStateAction<KeyValuePair[]>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
}

export function useContainerDetails({
    form,
    setEnvVars,
    setPorts,
    setVolumes,
    setLabels,
    setLoading,
}: UseContainerDetailsProps) {
    const fetchPreviousContainerDetails = useCallback(
        async (previousContainerId: string) => {
            if (!previousContainerId) {
                toast.error('No previous container ID provided');
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
                            RestartPolicy: details.HostConfig?.RestartPolicy || { Name: 'no' },
                            NetworkMode: details.HostConfig?.NetworkMode || 'bridge',
                            Devices: details.HostConfig?.Devices || [],
                            Privileged: details.HostConfig?.Privileged || false,
                            CapAdd: details.HostConfig?.CapAdd || [],
                            CapDrop: details.HostConfig?.CapDrop || [],
                        },
                    };

                    form.reset(containerConfig);

                    // Parse environment variables
                    const envVarsArray: KeyValuePair[] = [];
                    containerConfig.Env?.forEach((env) => {
                        const [key, ...valueParts] = env.split('=');
                        const value = valueParts.join('=');
                        envVarsArray.push({ key, value });
                    });
                    setEnvVars(envVarsArray);

                    // Parse port bindings
                    const portsArray: PortMapping[] = [];
                    if (containerConfig.HostConfig?.PortBindings) {
                        Object.entries(containerConfig.HostConfig.PortBindings).forEach(
                            ([containerPortWithProto, hostBindings]) => {
                                const [containerPort, protocol = 'tcp'] =
                                    containerPortWithProto.split('/');
                                if (Array.isArray(hostBindings) && hostBindings.length > 0) {
                                    hostBindings.forEach((binding: { HostPort?: string }) => {
                                        portsArray.push({
                                            containerPort,
                                            hostPort: binding.HostPort || '',
                                            protocol: protocol as 'tcp' | 'udp',
                                        });
                                    });
                                } else {
                                    portsArray.push({
                                        containerPort,
                                        hostPort: '',
                                        protocol: protocol as 'tcp' | 'udp',
                                    });
                                }
                            },
                        );
                    }
                    setPorts(portsArray);

                    // Parse volume bindings
                    const volumesArray: VolumeMapping[] = [];
                    containerConfig.HostConfig?.Binds?.forEach((bind) => {
                        const parts = bind.split(':');
                        const hostPath = parts[0];
                        const containerPath = parts[1];
                        const readOnly = parts.length > 2 && parts[2] === 'ro';
                        volumesArray.push({ hostPath, containerPath, readOnly });
                    });
                    setVolumes(volumesArray);

                    // Parse labels
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
        },
        [form, setEnvVars, setPorts, setVolumes, setLabels, setLoading],
    );

    const updateFormFromDefaultConfig = useCallback(
        (defaultConfig: ContainerCreateOptions) => {
            if (defaultConfig) {
                form.reset(defaultConfig);
                setEnvVars(
                    (defaultConfig.Env || []).map((env) => {
                        const [key, ...valueParts] = env.split('=');
                        return { key, value: valueParts.join('=') };
                    }),
                );
                setPorts(
                    Object.entries(defaultConfig.ExposedPorts || {}).map(([portWithProto]) => {
                        const [containerPort, protocol = 'tcp'] = portWithProto.split('/');
                        return {
                            containerPort,
                            hostPort: '',
                            protocol: protocol as 'tcp' | 'udp',
                        };
                    }),
                );
                setVolumes(
                    (defaultConfig.HostConfig?.Binds || []).map((bind) => {
                        const parts = bind.split(':');
                        const hostPath = parts[0];
                        const containerPath = parts[1];
                        const readOnly = parts.length > 2 && parts[2] === 'ro';
                        return { hostPath, containerPath, readOnly };
                    }),
                );
                setLabels(
                    Object.entries(defaultConfig.Labels || {}).map(([key, value]) => ({
                        key,
                        value: value || '',
                    })),
                );
            }
        },
        [form, setEnvVars, setPorts, setVolumes, setLabels],
    );

    return {
        fetchPreviousContainerDetails,
        updateFormFromDefaultConfig,
    };
}
