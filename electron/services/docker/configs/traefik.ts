import { ContainerCreateOptions } from 'dockerode';

const traefik: ContainerCreateOptions = {
    name: 'traefik',
    Image: 'traefik:v2.11',
    Cmd: [
        '--entrypoints.web.address=:80',
        '--api.dashboard=true',
        '--providers.docker=true',
        '--providers.docker.exposedByDefault=false',
    ],
    ExposedPorts: {
        '80/tcp': {},
        '8080/tcp': {},
    },
    Volumes: {
        '/var/run/docker.sock': {
            Host: {},
            Type: 'bind',
        },
    },
    Labels: {
        'traefik.enable': 'true',
        'traefik.http.routers.traefik.rule': 'Host("traefik.agence-lumia.com")',
        'traefik.http.routers.traefik.service': 'api@internal',
        'traefik.http.routers.traefik.entrypoints': 'web',
    },
    HostConfig: {
        Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
        PortBindings: {
            '80/tcp': [{ HostPort: '80' }],
            '8080/tcp': [{ HostPort: '8080' }],
        },
        RestartPolicy: {
            Name: 'always',
            MaximumRetryCount: 0,
        },
    },
};

export default traefik;
