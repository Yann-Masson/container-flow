export interface KeyValuePair {
    key: string;
    value: string;
}

export interface PortMapping {
    containerPort: string;
    hostPort: string;
    protocol: 'tcp' | 'udp';
}

export interface VolumeMapping {
    hostPath: string;
    containerPath: string;
    readOnly: boolean;
}
