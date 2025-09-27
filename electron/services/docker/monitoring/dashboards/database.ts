// Database (MySQL) Dashboard - Simplified & User-Friendly
export const databaseDashboard = {
  uid: 'cf-db',
  title: 'Database (MySQL)',
  tags: ['containerflow','mysql'],
  schemaVersion: 38,
  version: 1,
  refresh: '30s',
  time: { from: 'now-6h', to: 'now' },
  panels: [
    // Active connections
    {
      id: 1, type: 'stat', title: 'Active Connections',
      gridPos: { x:0,y:0,w:6,h:6 },
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      targets: [{ expr:'mysql_global_status_threads_connected', refId:'A' }],
      fieldConfig: { defaults: { unit:'none' } }
    },
    // Connection usage %
    {
        id: 2, type: 'gauge', title: 'Connection Utilization %',
        gridPos: { x:6,y:0,w:6,h:6 },
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
    // Database size
    {
        id: 3, type: 'stat', title: 'Database size',
        gridPos: { x:12,y:0,w:12,h:6 },
        datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
        targets: [{ expr:'mysql_global_status_innodb_page_size', refId:'A' }],
        fieldConfig: {
            defaults: {
                unit:'kbytes',
                thresholds: {
                    steps: [
                        { color: 'green', value: null }
                    ]
            }
            }
        },
    },
    // Read vs Write ops
    {
      id: 4, type: 'timeseries', title: 'Database Operations',
      gridPos: { x:0,y:6,w:24,h:8 },
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      targets: [
        { expr:'rate(mysql_global_status_innodb_row_ops_total[5m])', legendFormat:'{{operation}}', refId:'A' },
      ],
      fieldConfig: { defaults: { unit:'ops' } }
    },
    // Errors (Slow queries)
    {
      id: 5, type: 'timeseries', title: 'Slow Queries /s',
      gridPos: { x:0,y:14,w:24,h:6 },
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      targets: [{ expr:'rate(mysql_global_status_slow_queries[15m])', legendFormat:'slow queries', refId:'A' }],
      fieldConfig: { defaults: { unit:'ops' } }
    }
  ]
};

export default databaseDashboard;
