import { ContainerCreateOptions } from 'dockerode';

/**
 * MySQLd exporter for Prometheus.
 * Exposes metrics on :9104. Requires DATA_SOURCE_NAME env referencing mysql container.
 */
const mysqldExporter: ContainerCreateOptions = {
  name: 'mysqld-exporter',
  Image: 'prom/mysqld-exporter:v0.15.1',
  ExposedPorts: {
    '9104/tcp': {},
  },
  HostConfig: {
    RestartPolicy: { Name: 'always', MaximumRetryCount: 0 },
  },
  Env: [
    // root password must match mysql container configuration
    'DATA_SOURCE_NAME=root:rootpassword@(mysql:3306)/'
  ],
  Labels: {
    'com.containerflow.monitoring': 'true',
  },
};

export default mysqldExporter;
