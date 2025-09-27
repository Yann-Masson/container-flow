import { ContainerCreateOptions } from 'dockerode';

/**
 * Prometheus Node Exporter for host-level metrics.
 * Mounts /proc and /sys (read-only) plus root fs (read-only) to expose CPU, memory, disk, filesystem usage, etc.
 * We disable unnecessary collectors to keep noise low; adjust as needed.
 */
const nodeExporter: ContainerCreateOptions = {
  name: 'node-exporter',
  Image: 'prom/node-exporter:v1.8.1',
  ExposedPorts: { '9100/tcp': {} },
  HostConfig: {
    Binds: [
      '/proc:/host/proc:ro',
      '/sys:/host/sys:ro',
      '/:/rootfs:ro'
    ],
    NetworkMode: 'bridge',
    RestartPolicy: { Name: 'always', MaximumRetryCount: 0 },
  },
  Cmd: [
    '--path.procfs=/host/proc',
    '--path.sysfs=/host/sys',
    '--path.rootfs=/rootfs',
    '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($|/)',
  ],
  Labels: {
    'com.containerflow.monitoring': 'true'
  }
};

export default nodeExporter;
