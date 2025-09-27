import { ContainerCreateOptions } from 'dockerode';

/**
 * MySQLd exporter for Prometheus.
 * Exposes metrics on :9104. Requires DATA_SOURCE_NAME env referencing mysql container.
 */
const mysqldExporter: ContainerCreateOptions = {
  name: 'mysqld-exporter',
  Image: 'prom/mysqld-exporter:v0.17.2',
  ExposedPorts: {
    '9104/tcp': {},
  },
  HostConfig: {
    RestartPolicy: { Name: 'always', MaximumRetryCount: 0 },
  },
  Cmd: [
    "--collect.global_status",
    "--collect.info_schema.tables",
    "--collect.info_schema.innodb_metrics",
    "--collect.info_schema.processlist",
    "--mysqld.address=mysql:3306"
  ],
  Env: [],
  Labels: {
    'com.containerflow.monitoring': 'true',
  },
};

export default mysqldExporter;
