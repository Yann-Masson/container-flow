// Traefik Dashboard
export const traefikDashboard = {
    uid: 'cf-traefik',
    title: 'Traefik',
    tags: ['containerflow', 'traefik'],
    schemaVersion: 38,
    version: 1,
    refresh: '30s',
    time: { from: 'now-6h', to: 'now' },
    panels: [
        {
            id: 1,
            type: 'stat',
            title: 'Total RPS',
            gridPos: { x: 0, y: 0, w: 4, h: 6 },
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
            id: 2,
            type: 'stat',
            title: 'Global Error Rate %',
            gridPos: { x: 4, y: 0, w: 4, h: 6 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * (sum(rate(traefik_service_requests_total{code=~"4..|5.."}[5m])) / (sum(rate(traefik_service_requests_total[5m])) + 1e-9))',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: { unit: 'percent' }
            }
        },
        {
            id: 3,
            type: 'timeseries',
            title: 'Requests per Service (RPS)',
            gridPos: { x: 8, y: 0, w: 8, h: 6 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'sum by (service) (rate(traefik_service_requests_total[5m]))',
                    legendFormat: '{{service}}',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: { unit: 'reqps' }
            }
        },
        {
            id: 4,
            type: 'timeseries',
            title: 'Error Rate per Service %',
            gridPos: { x: 16, y: 0, w: 8, h: 6 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: '100 * (sum by (service) (rate(traefik_service_requests_total{code=~"4..|5.."}[5m])) / (sum by (service) (rate(traefik_service_requests_total[5m])) + 1e-9))',
                    legendFormat: '{{service}}',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: { unit: 'percent' }
            }
        },
        {
            id: 5,
            type: 'timeseries',
            title: 'Latency P95 per Service (s)',
            gridPos: { x: 0, y: 6, w: 12, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'histogram_quantile(0.95, sum by (le, service) (rate(traefik_service_request_duration_seconds_bucket[5m])))',
                    legendFormat: '{{service}}',
                    refId: 'A'
                }
            ]
        },
        {
            id: 6,
            type: 'timeseries',
            title: 'Latency Average per Service (s)',
            gridPos: { x: 12, y: 6, w: 12, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'sum by (service)(rate(traefik_service_request_duration_seconds_sum[5m])) / (sum by (service)(rate(traefik_service_request_duration_seconds_count[5m])) + 1e-9)',
                    legendFormat: '{{service}}',
                    refId: 'A'
                }
            ]
        },
        {
            id: 7,
            type: 'timeseries',
            title: 'Status Codes (2xx/4xx/5xx)',
            gridPos: { x: 0, y: 14, w: 12, h: 8 },
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
        },
        {
            id: 8,
            type: 'bargauge',
            title: 'Top Services by RPS',
            gridPos: { x: 12, y: 14, w: 12, h: 8 },
            datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
            targets: [
                {
                    expr: 'topk(5, sum by (service) (rate(traefik_service_requests_total[5m])))',
                    legendFormat: '{{service}}',
                    refId: 'A'
                }
            ],
            fieldConfig: {
                defaults: { unit: 'reqps' }
            }
        }
    ]
};

export default traefikDashboard;
