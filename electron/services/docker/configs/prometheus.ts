import { ContainerCreateOptions } from 'dockerode';

/**
 * Prometheus container configuration.
 * We generate prometheus.yml dynamically inside the container via a shell heredoc.
 * This avoids placing a config file on the local machine while still supporting static scrape targets.
 */
const prometheus: ContainerCreateOptions = {
  name: 'prometheus',
  Image: 'prom/prometheus:v2.53.0',
  ExposedPorts: {
    '9090/tcp': {},
  },
  // We must override the image entrypoint (which is /bin/prometheus) to run a shell
  // that generates the config file first. Previously we placed '/bin/sh -c' inside
  // Cmd only, which Docker passed as arguments to the original entrypoint causing
  // Prometheus to see '/bin/sh' as an unexpected flag (error: unexpected /bin/sh).
  Entrypoint: ['/bin/sh','-c'],
  Cmd: [(
    [
      'set -e',
      'mkdir -p /etc/prometheus',
      'cat > /etc/prometheus/prometheus.yml <<EOF',
      'global:',
      '  scrape_interval: ${SCRAPE_INTERVAL:-15s}',
      'scrape_configs:',
      '  - job_name: cadvisor',
      '    static_configs:',
      '      - targets: ["${TARGET_CADVISOR:-cadvisor:8080}"]',
      '  - job_name: traefik',
      '    static_configs:',
      '      - targets: ["${TARGET_TRAEFIK:-traefik:8080}"]',
      '  - job_name: mysql',
      '    static_configs:',
      '      - targets: ["${TARGET_MYSQL_EXPORTER:-mysqld-exporter:9104}"]',
  '  - job_name: node',
  '    static_configs:',
  '      - targets: ["${TARGET_NODE_EXPORTER:-node-exporter:9100}"]',
      'EOF',
      // Exec Prometheus as PID 1 with desired flags
      'exec /bin/prometheus --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.path=/prometheus --web.enable-lifecycle'
    ].join('\n')
  )],
  HostConfig: {
    Binds: [
      // Volume for TSDB persistence
      'prometheus-data:/prometheus'
    ],
    PortBindings: {
      '9090/tcp': [{ HostPort: '9090' }],
    },
    RestartPolicy: { Name: 'always', MaximumRetryCount: 0 },
  },
  Env: [
    'SCRAPE_INTERVAL=15s',
    'TARGET_CADVISOR=cadvisor:8080',
    'TARGET_TRAEFIK=traefik:8080',
    'TARGET_MYSQL_EXPORTER=mysqld-exporter:9104',
    'TARGET_NODE_EXPORTER=node-exporter:9100',
  ],
  Labels: {
    'com.containerflow.monitoring': 'true',
  },
};

export default prometheus;
