import { ContainerCreateOptions } from 'dockerode';

/**
 * cAdvisor exposes container-level metrics for Prometheus.
 * Requires access to host kernel and Docker state paths.
 */
const cadvisor: ContainerCreateOptions = {
  name: 'cadvisor',
  Image: 'gcr.io/cadvisor/cadvisor:v0.49.1',
  ExposedPorts: {
    '8080/tcp': {},
  },
  HostConfig: {
    Binds: [
      '/:/rootfs:ro',
      '/var/run:/var/run:ro',
      '/sys:/sys:ro',
      '/var/lib/docker/:/var/lib/docker:ro',
      '/cgroup:/cgroup:ro'
    ],
    PortBindings: {
      '8080/tcp': [{ HostPort: '8081' }],
    },
    Privileged: true,
    RestartPolicy: { Name: 'always', MaximumRetryCount: 0 },
  },
  Labels: {
    'com.containerflow.monitoring': 'true',
  },
};

export default cadvisor;
