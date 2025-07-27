import { ContainerCreateOptions } from 'dockerode';

const traefik: ContainerCreateOptions = {
    name: 'traefik',
    Image: 'traefik:v2.11',
    Cmd: [
        '--entrypoints.web.address=:80',
        '--entrypoints.websecure.address=:443',
        '--api.dashboard=true',
        '--providers.docker=true',
        '--providers.docker.exposedByDefault=false',
        '--certificatesresolvers.letsencrypt.acme.email=contact@agence-lumia.com',
        '--certificatesresolvers.letsencrypt.acme.storage=/etc/traefik/acme/acme.json',
        '--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web',
        '--certificatesresolvers.letsencrypt.acme.httpchallenge=true',
        '--certificatesresolvers.letsencrypt.acme.caserver=https://acme-v02.api.letsencrypt.org/directory',
        '--accesslog=true',
        '--global.checknewversion=false',
        '--global.sendanonymoususage=false',
    ],
    ExposedPorts: {
        '80/tcp': {},
        '443/tcp': {},
        '8080/tcp': {},
    },
    Volumes: {
        '/var/run/docker.sock': {
            Host: {},
            Type: 'bind',
        },
    },
    Entrypoint: ['/bin/sh', '-c', 'mkdir -p /etc/traefik/acme && touch /etc/traefik/acme/acme.json && chmod 600 /etc/traefik/acme/acme.json && traefik "$@"', '--'],
    Labels: {
        'traefik.enable': 'true',

        'traefik.http.middlewares.redirect-to-https.redirectscheme.scheme': 'https',
        'traefik.http.middlewares.redirect-to-https.redirectscheme.permanent': 'true',

        'traefik.http.routers.http-catchall.rule': 'hostregexp(`{host:.+}`)',
        'traefik.http.routers.http-catchall.entrypoints': 'web',
        'traefik.http.routers.http-catchall.middlewares': 'redirect-to-https',
        'traefik.http.routers.http-catchall.priority': '1',
    },
    HostConfig: {
        Binds: [
            '/var/run/docker.sock:/var/run/docker.sock',
            'traefik-acme:/etc/traefik/acme',
        ],
        PortBindings: {
            '80/tcp': [{ HostPort: '80' }],
            '8080/tcp': [{ HostPort: '8080' }],
            '443/tcp': [{ HostPort: '443' }],
        },
        RestartPolicy: {
            Name: 'always',
            MaximumRetryCount: 0,
        },
    },
};

export default traefik;
