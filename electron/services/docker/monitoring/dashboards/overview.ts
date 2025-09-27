// High-level Overview Dashboard aggregating other domains.
export const highLevelOverviewDashboard = {
    uid: 'cf-high',
    title: 'System Overview',
    tags: ['containerflow', 'overview'],
    schemaVersion: 38,
    version: 1,
    refresh: '30s',
    time: { from: 'now-6h', to: 'now' },
    panels: [
        {
            id: 1,
            type: 'stat',
            title: 'Host CPU %',
            gridPos: { x: 0, y: 0, w: 3, h: 5 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))',
                    refId: 'A'
                }
            ],
            fieldConfig: { defaults: { unit: 'percent' } }
        },
        {
            id: 2,
            type: 'stat',
            title: 'Host Mem Used %',
            gridPos: { x: 3, y: 0, w: 3, h: 5 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))',
                    refId: 'A'
                }
            ],
            fieldConfig: { defaults: { unit: 'percent' } }
        },
        {
            id: 3,
            type: 'stat',
            title: 'Disk Usage % (Max)',
            gridPos: { x: 6, y: 0, w: 3, h: 5 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'max(100 * (1 - node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}))',
                    refId: 'A'
                }
            ],
            fieldConfig: { defaults: { unit: 'percent' } }
        },
        {
            id: 4,
            type: 'stat',
            title: 'Traefik RPS',
            gridPos: { x: 9, y: 0, w: 12, h: 5 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'sum(rate(traefik_service_requests_total[5m]))',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: { unit: 'reqps' }
            }
        },
        {
            id: 5,
            type: 'gauge',
            title: 'MySQL Conn Util %',
            gridPos: { x: 21, y: 0, w: 3, h: 5 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [{ expr:'100 * (mysql_global_status_threads_connected / mysql_global_variables_max_connections)', refId:'A' }],
            fieldConfig: {
                defaults: {
                    unit: 'percent',
                    thresholds: {
                        mode: 'percentage',
                        steps: [
                            { color: 'green', value: null },
                            { color: 'orange', value: 70 },
                            { color: 'red', value: 90 }
                        ]
                    }
                }
            }
        },
        {
            id: 6,
            type: 'timeseries',
            title: 'CPU & Load',
            gridPos: { x: 0, y: 5, w: 12, h: 9 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))',
                    legendFormat: 'CPU %',
                    refId: 'A'
                },
                {
                    expr: 'node_load1',
                    legendFormat: 'load1',
                    refId: 'B'
                }
            ]
        },
        {
            id: 7,
            type: 'timeseries',
            title: 'Top Container CPU %',
            gridPos: { x: 12, y: 5, w: 12, h: 9 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'topk(5, 100 * rate(container_cpu_usage_seconds_total{name!="",image!=""}[5m]))',
                    legendFormat: '{{name}}',
                    refId: 'A'
                }
            ]
        },
        {
            id: 8,
            type: 'timeseries',
            title: 'MySQL Queries /s',
            gridPos: { x: 0, y: 14, w: 12, h: 9 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'rate(mysql_global_status_queries[5m])',
                    legendFormat: 'queries',
                    refId: 'A'
                },
                {
                    expr: 'rate(mysql_global_status_questions[5m])',
                    legendFormat: 'questions',
                    refId: 'B'
                }
            ]
        },
        {
            id: 9,
            type: 'timeseries',
            title: 'Traefik Status 2xx/4xx/5xx',
            gridPos: { x: 12, y: 14, w: 12, h: 9 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'sum(rate(traefik_service_requests_total{code=~"2.."}[5m]))',
                    legendFormat: '2xx',
                    refId: 'A'
                },
                {
                    expr: 'sum(rate(traefik_service_requests_total{code=~"4.."}[5m]))',
                    legendFormat: '4xx',
                    refId: 'B'
                },
                {
                    expr: 'sum(rate(traefik_service_requests_total{code=~"5.."}[5m]))',
                    legendFormat: '5xx',
                    refId: 'C'
                }
            ]
        }
    ]
};

export default highLevelOverviewDashboard;
