import { domainConfig } from '../../../config/domains';
import { ContainerCreateOptions } from 'dockerode';

/**
 * Grafana container configuration with environment-only provisioning.
 * Dashboards and datasource can be provisioned later via HTTP API (handled elsewhere in the app).
 */
const grafana: ContainerCreateOptions = {
    name: 'grafana',
    Image: 'grafana/grafana:11.1.4',
    ExposedPorts: {
        '3000/tcp': {},
    },
    HostConfig: {
        Binds: ['grafana-data:/var/lib/grafana'],
        PortBindings: {
            '3000/tcp': [{ HostIp: '127.0.0.1', HostPort: '3000' }],
        },
        RestartPolicy: { Name: 'always', MaximumRetryCount: 0 },
    },
    Env: [
        'GF_SECURITY_ADMIN_USER=admin',
        'GF_SECURITY_ADMIN_PASSWORD=admin',
        'GF_USERS_ALLOW_SIGN_UP=false',
        'GF_AUTH_ANONYMOUS_ENABLED=false',
        'GF_ANALYTICS_REPORTING_ENABLED=false',
        'GF_ANALYTICS_CHECK_FOR_UPDATES=false',
    ],
    Labels: {
        'com.containerflow.monitoring': 'true',
        'traefik.enable': 'true',
        'traefik.http.services.grafana.loadbalancer.server.port': '3000',
        // TLS router for HTTPS access
        'traefik.http.routers.grafana.rule': `Host(\`${domainConfig.monitoring}\`)`,
        'traefik.http.routers.grafana.entrypoints': 'websecure',
        'traefik.http.routers.grafana.tls': 'true',
        'traefik.http.routers.grafana.tls.certresolver': 'letsencrypt',
        'traefik.http.routers.grafana.priority': '100',
        // Plain HTTP router for non-TLS access
        'traefik.http.routers.grafana-http.rule': `Host(\`${domainConfig.monitoring}\`)`,
        'traefik.http.routers.grafana-http.entrypoints': 'web',
        'traefik.http.routers.grafana-http.service': 'grafana',
        'traefik.http.routers.grafana-http.priority': '90',
    },
};

export default grafana;
