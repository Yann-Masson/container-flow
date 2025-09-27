// Auto-generated Container Flow Overview Grafana dashboard definition.
// Focus: CPU, Memory, Storage, Network, MySQL, Traefik basic request rates.
// Assumes cAdvisor, mysqld-exporter, Traefik Prometheus metrics are available.

export const containerOverviewDashboard = {
  __inputs: [],
  __requires: [
    { type: 'grafana', id: 'grafana', name: 'Grafana', version: '11.x' },
    { type: 'panel', id: 'timeseries', name: 'Time series', version: '' },
    { type: 'panel', id: 'stat', name: 'Stat', version: '' },
    { type: 'panel', id: 'bargauge', name: 'Bar gauge', version: '' },
  ],
  editable: true,
  graphTooltip: 0,
  schemaVersion: 38,
  style: 'dark',
  tags: ['containerflow'],
  timezone: 'browser',
  title: 'Container Flow Overview',
  uid: 'cf-overview',
  version: 4,
  time: { from: 'now-6h', to: 'now' },
  refresh: '30s',
  panels: [
    {
      id: 13,
      title: 'CPU Usage %',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 0, y: 0, w: 4, h: 4 },
      fieldConfig: { defaults: { unit: 'percent', decimals: 2 }, overrides: [] },
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      targets: [
        { expr: '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)', refId: 'A' }
      ]
    },
    {
      id: 12,
      title: 'Memory Usage %',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 4, y: 0, w: 4, h: 4 },
      fieldConfig: { defaults: { unit: 'percent', decimals: 2 }, overrides: [] },
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      targets: [
        { expr: '(((sum(node_memory_MemTotal_bytes) - sum(node_memory_MemAvailable_bytes)) / sum(node_memory_MemTotal_bytes)) * 100) OR on() (((sum(container_memory_rss{image!=""})) / sum(machine_memory_bytes)) * 100)', refId: 'A' }
      ]
    },
    {
      id: 8,
      title: 'Total CPU % (All Containers)',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 8, y: 0, w: 4, h: 4 },
      fieldConfig: { defaults: { unit: 'percent', decimals: 2 }, overrides: [] },
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      targets: [
        { expr: 'sum(rate(container_cpu_usage_seconds_total{image!=""}[5m]) * 100)', refId: 'A' }
      ]
    },
    {
      id: 9,
      title: 'Total Memory RSS (All Containers)',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 12, y: 0, w: 4, h: 4 },
      fieldConfig: { defaults: { unit: 'bytes', decimals: 1 }, overrides: [] },
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      targets: [
        { expr: 'sum(container_memory_rss{image!=""})', refId: 'A' }
      ]
    },
    {
      id: 15,
      title: 'Root FS Usage %',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 16, y: 0, w: 4, h: 4 },
      fieldConfig: { defaults: { unit: 'percent', decimals: 2 }, overrides: [] },
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      targets: [
        { expr: '((1 - (sum(node_filesystem_avail_bytes{mountpoint="/",fstype!~"tmpfs|overlay"}) / sum(node_filesystem_size_bytes{mountpoint="/",fstype!~"tmpfs|overlay"}))) * 100) OR on() vector(0)', refId: 'A' }
      ]
    },
    {
      id: 16,
      title: 'Swap Usage %',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 20, y: 0, w: 4, h: 4 },
      fieldConfig: { defaults: { unit: 'percent', decimals: 2 }, overrides: [] },
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      targets: [
        { expr: '(((node_memory_SwapTotal_bytes - node_memory_SwapFree_bytes) / node_memory_SwapTotal_bytes) * 100) OR on() vector(0)', refId: 'A' }
      ]
    },

    // Row 1: Load & HTTP Errors
    {
      id: 14,
      title: 'Host Load (1m / 5m % of cores)',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 0, y: 4, w: 12, h: 6 },
      fieldConfig: { defaults: { unit: 'percent', decimals: 1 }, overrides: [] },
      options: { legend: { showLegend: true }, tooltip: { mode: 'multi' } },
      targets: [
        { expr: '(node_load1 / count(node_cpu_seconds_total{mode="idle"})) * 100', legendFormat: 'load1%', refId: 'A' },
        { expr: '(node_load5 / count(node_cpu_seconds_total{mode="idle"})) * 100', legendFormat: 'load5%', refId: 'B' }
      ]
    },
    {
      id: 7,
      title: 'HTTP Error Rates (Traefik)',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 12, y: 4, w: 12, h: 6 },
      fieldConfig: { defaults: { unit: 'reqps', decimals: 3 }, overrides: [] },
      options: { legend: { showLegend: true }, tooltip: { mode: 'multi' } },
      targets: [
        { expr: '(sum(rate(traefik_service_requests_total{code=~"4.."}[5m])) OR on() vector(0))', legendFormat: '4xx', refId: 'A' },
        { expr: '(sum(rate(traefik_service_requests_total{code=~"5.."}[5m])) OR on() vector(0))', legendFormat: '5xx', refId: 'B' }
      ]
    },

    // Row 2: Container CPU/Memory detail
    {
      id: 1,
      title: 'CPU Usage % (Top Containers)',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 0, y: 10, w: 12, h: 8 },
      fieldConfig: { defaults: { unit: 'percent', decimals: 2 }, overrides: [] },
      options: { legend: { showLegend: true }, tooltip: { mode: 'single' } },
      targets: [
        { expr: 'sum by (container) (rate(container_cpu_usage_seconds_total{image!="",container!="POD"}[5m]) * 100)', legendFormat: '{{container}}', refId: 'A' }
      ]
    },
    {
      id: 2,
      title: 'Memory Usage (RSS) by Container',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 12, y: 10, w: 12, h: 8 },
      fieldConfig: { defaults: { unit: 'bytes', decimals: 1 }, overrides: [] },
      options: { legend: { showLegend: true }, tooltip: { mode: 'single' } },
      targets: [
        { expr: 'sum by (name) (container_memory_rss{image!="",container!="POD"})', legendFormat: '{{name}}', refId: 'A' }
      ]
    },

    // Row 3: Network & Disk
    {
      id: 3,
      title: 'Network RX/TX Bytes per Second (Containers)',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 0, y: 18, w: 12, h: 8 },
      fieldConfig: { defaults: { unit: 'Bps', decimals: 1 }, overrides: [] },
      options: { legend: { showLegend: true }, tooltip: { mode: 'multi' } },
      targets: [
        { expr: 'sum by (container) (rate(container_network_receive_bytes_total{image!=""}[5m]))', legendFormat: '{{container}} RX', refId: 'A' },
        { expr: 'sum by (container) (rate(container_network_transmit_bytes_total{image!=""}[5m]))', legendFormat: '{{container}} TX', refId: 'B' }
      ]
    },
    {
      id: 17,
      title: 'Disk IO Bytes/s (Reads / Writes)',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 12, y: 18, w: 12, h: 8 },
      fieldConfig: { defaults: { unit: 'Bps', decimals: 1 }, overrides: [] },
      options: { legend: { showLegend: true }, tooltip: { mode: 'multi' } },
      targets: [
        { expr: 'sum by (device) (rate(node_disk_read_bytes_total{device!~"loop.*|ram.*"}[5m]))', legendFormat: '{{device}} read', refId: 'A' },
        { expr: 'sum by (device) (rate(node_disk_written_bytes_total{device!~"loop.*|ram.*"}[5m]))', legendFormat: '{{device}} write', refId: 'B' }
      ]
    },

    // Row 4: MySQL
    {
      id: 5,
      title: 'MySQL Connections',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 0, y: 26, w: 12, h: 6 },
      fieldConfig: { defaults: { unit: 'connections', decimals: 0 }, overrides: [] },
      options: { legend: { showLegend: false }, tooltip: { mode: 'single' } },
      targets: [
        { expr: 'mysql_global_status_threads_connected OR on() vector(0)', legendFormat: 'threads_connected', refId: 'A' }
      ]
    },
    {
      id: 6,
      title: 'MySQL Questions per Second',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 12, y: 26, w: 12, h: 6 },
      fieldConfig: { defaults: { unit: 'qps', decimals: 2 }, overrides: [] },
      options: { legend: { showLegend: false }, tooltip: { mode: 'single' } },
      targets: [
        { expr: '(rate(mysql_global_status_questions[5m]) OR on() vector(0))', legendFormat: 'questions/s', refId: 'A' }
      ]
    },

    // Row 5: Remaining & uptime
    {
      id: 10,
      title: 'Total Network RX Bytes/s',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 0, y: 32, w: 6, h: 4 },
      fieldConfig: { defaults: { unit: 'Bps', decimals: 1 }, overrides: [] },
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      targets: [
        { expr: 'sum(rate(container_network_receive_bytes_total{image!=""}[5m]))', refId: 'A' }
      ]
    },
    {
      id: 11,
      title: 'Total Network TX Bytes/s',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 6, y: 32, w: 6, h: 4 },
      fieldConfig: { defaults: { unit: 'Bps', decimals: 1 }, overrides: [] },
      options: { reduceOptions: { calcs: ['lastNotNull'] } },
      targets: [
        { expr: 'sum(rate(container_network_transmit_bytes_total{image!=""}[5m]))', refId: 'A' }
      ]
    },
    {
      id: 4,
      title: 'Filesystem Usage (Bytes) by Container',
      type: 'timeseries',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 12, y: 32, w: 6, h: 4 },
      fieldConfig: { defaults: { unit: 'bytes', decimals: 1 }, overrides: [] },
      options: { legend: { showLegend: false }, tooltip: { mode: 'single' } },
      targets: [
        { expr: 'sum by (container) (container_fs_usage_bytes{image!=""})', legendFormat: '{{container}}', refId: 'A' }
      ]
    },
    {
      id: 18,
      title: 'Host Uptime & Steal %',
      type: 'stat',
      datasource: { type: 'prometheus', uid: 'PROMETHEUS_DS' },
      gridPos: { x: 18, y: 32, w: 6, h: 4 },
      fieldConfig: { defaults: { unit: 's', decimals: 0 }, overrides: [ { matcher: { id: 'byName', options: 'steal_pct' }, properties: [ { id: 'unit', value: 'percent' }, { id: 'decimals', value: 2 } ] } ] },
      options: { reduceOptions: { calcs: ['lastNotNull'] }, orientation: 'auto', textMode: 'value_and_name' },
      targets: [
        { expr: 'node_time_seconds - node_boot_time_seconds', refId: 'A', legendFormat: 'uptime_seconds' },
        { expr: '(avg(rate(node_cpu_seconds_total{mode="steal"}[5m])) * 100) OR on() vector(0)', refId: 'B', legendFormat: 'steal_pct' }
      ]
    }
  ],
};

export default containerOverviewDashboard;
