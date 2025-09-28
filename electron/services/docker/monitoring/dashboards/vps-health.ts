// VPS Health Dashboard
// Key host metrics: CPU, Memory, Load, Disk, Network.
export const vpsHealthDashboard = {
    uid: 'cf-vps',
    title: 'VPS Health',
    tags: ['containerflow', 'vps'],
    timezone: 'browser',
    schemaVersion: 38,
    version: 1,
    refresh: '30s',
    time: { from: 'now-6h', to: 'now' },

    panels: [
        // CPU Utilization per core
        {
            type: 'timeseries',
            title: 'CPU Usage per Core %',
            id: 1,
            gridPos: { x: 0, y: 0, w: 12, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * (1 - rate(node_cpu_seconds_total{mode="idle"}[1m]))',
                    legendFormat: '{{cpu}}',
                    refId: 'A'
                }
            ]
        },

        // Memory usage time series
        {
            type: 'timeseries',
            title: 'Memory Usage',
            id: 2,
            gridPos: { x: 12, y: 0, w: 12, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * ( (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes )',
                    refId: 'A',
                    legendFormat: 'Used'
                }
            ],
            fieldConfig: {
                defaults: {
                    unit: 'percent',
                    thresholds: {
                        mode: 'percentage',
                        steps: [
                            { color: 'green', value: 0 },
                            { color: 'yellow', value: 70 },
                            { color: 'red', value: 85 }
                        ]
                    }
                }
            }
        },

        // Disk usage (root filesystem only)
        {
            type: 'stat',
            title: 'Storage Used % (root)',
            id: 3,
            gridPos: { x: 0, y: 8, w: 2, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
            {
                expr: '100 * (1 - (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay",mountpoint="/"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay",mountpoint="/"}))',
                legendFormat: '/',
                refId: 'A'
            }
            ],
            fieldConfig: {
                defaults: {
                    unit: 'percent',
                    thresholds: {
                        mode: 'percentage',
                        steps: [
                            { color: 'green', value: 0 },
                            { color: 'yellow', value: 70 },
                            { color: 'red', value: 85 }
                        ]
                    }
                }
            },
            options: {
                orientation: 'vertical',
            }
        },

        // Disk IO
        {
            type: 'timeseries',
            title: 'Disk IO Read/Write Ops/s',
            id: 4,
            gridPos: { x: 2, y: 8, w: 9, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                { expr: 'rate(node_disk_reads_completed_total[5m])', legendFormat: 'reads', refId: 'A' },
                { expr: 'rate(node_disk_writes_completed_total[5m])', legendFormat: 'writes', refId: 'B' }
            ]
        },

        // Network bandwidth
        {
            type: 'timeseries',
            title: 'Network In/Out bits/s',
            id: 5,
            gridPos: { x: 11, y: 8, w: 9, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '8 * sum(rate(node_network_receive_bytes_total{device!~"lo|docker.*|veth.*|br.*"}[5m]))',
                    legendFormat: 'in',
                    refId: 'A'
                },
                {
                    expr: '8 * sum(rate(node_network_transmit_bytes_total{device!~"lo|docker.*|veth.*|br.*"}[5m]))',
                    legendFormat: 'out',
                    refId: 'B'
                }
            ],
            fieldConfig: { defaults: { unit: 'bps' } }
        },

        // Memory Breakdown
        {
            type: 'stat',
            title: 'Memory Used %',
            id: 6,
            gridPos: { x: 20, y: 8, w: 4, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * ( (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes )',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: {
                    unit: 'percent',
                    thresholds: {
                        mode: 'percentage',
                        steps: [
                            { color: 'green', value: 0 },
                            { color: 'yellow', value: 70 },
                            { color: 'red', value: 85 }
                        ]
                    }
                }
            }
        },
    ]
};

export default vpsHealthDashboard;
