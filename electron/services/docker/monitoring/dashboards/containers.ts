// Containers Dashboard
// Focus on per-container CPU, Memory, Network
export const containersDashboard = {
    uid: 'cf-cont',
    title: 'Containers',
    tags: ['containerflow','containers'],
    schemaVersion: 38,
    version: 1,
    refresh: '30s',
    time: { from: 'now-6h', to: 'now' },
    panels: [
        {
            id: 1, type: 'timeseries', title: 'CPU Usage %', gridPos: { x:0,y:0,w:12,h:8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * (sum by (name) (rate(container_cpu_usage_seconds_total{name!="",image!=""}[5m])))',
                    legendFormat: '{{name}}',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: {
                    displayName: '${__field.labels.name}',
                    unit: 'percent'
                }
            }
        },
        {
            id: 2, type: 'timeseries', title: 'Memory RSS', gridPos: { x:12,y:0,w:12,h:8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    // Aggregate memory RSS by name to avoid duplicate series per container
                    expr: 'sum by (name) (container_memory_rss{name!="",image!=""})',
                    legendFormat: '{{name}}',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: {
                    unit: 'bytes',
                    displayName: '${__field.labels.name}'
                }
            }
        },
        {
            id: 3, type: 'bargauge', title: 'Container CPU %', gridPos: { x:0,y:8,w:12,h:8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * sum by (name) (rate(container_cpu_usage_seconds_total{name!="",image!=""}[5m]))',
                    legendFormat: '{{name}}',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: {
                    unit: 'percent',
                    displayName: '${__field.labels.name}',
                    thresholds: {
                        mode: 'percentage',
                        steps: [
                            { color: 'green', value: null },
                            { color: 'orange', value: 75 },
                            { color: 'red', value: 90 }
                        ]
                    },
                }
            },
            options: {
                orientation: 'horizontal',
                reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '' }
            }
        },
        {
            id: 4, type: 'bargauge', title: 'Container Memory', gridPos: { x:12,y:8,w:12,h:8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'sum by (name) (container_memory_rss{name!="",image!=""}) / 1024 / 1024',
                    legendFormat: '{{name}}',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: {
                    max: 1000,
                    unit: 'mbytes',
                    thresholds: {
                        mode: 'percentage',
                        steps: [
                            { color: 'green', value: null },
                            { color: 'orange', value: 50 },
                            { color: 'red', value: 80 }
                        ]
                    },
                    displayName: '${__field.labels.name}'
                }
            },
            options: {
                orientation: 'horizontal',
                reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '' }
            }
        },
        {
            id: 5, type: 'timeseries', title: 'Network RX/TX bytes/s (All)', gridPos: { x:0,y:16,w:24,h:8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                { expr: 'sum by (name) (rate(container_network_receive_bytes_total{name!="",image!=""}[5m]))', legendFormat: '{{name}} RX', refId: 'A' },
                { expr: 'sum by (name) (rate(container_network_transmit_bytes_total{name!="",image!=""}[5m]))', legendFormat: '{{name}} TX', refId: 'B' }
            ],
            fieldConfig: { defaults: { unit: 'Bps' } }
        }
    ]
};

export default containersDashboard;
