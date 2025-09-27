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
        '--certificatesresolvers.letsencrypt.acme.storage=/etc/traefik/acme.json',
        '--certificatesresolvers.letsencrypt.acme.caserver=https://acme-v02.api.letsencrypt.org/directory',
        '--certificatesresolvers.letsencrypt.acme.tlschallenge=true',
        '--accesslog=true',
        // Prometheus metrics
        '--metrics.prometheus=true',
        '--metrics.prometheus.addEntryPointsLabels=true',
        '--metrics.prometheus.addServicesLabels=true',
        '--global.checknewversion=false',
        '--global.sendanonymoususage=false',
        '--entrypoints.websecure.http.tls.certResolver=letsencrypt',
        '--entrypoints.websecure.http.tls.domains[0].main=agence-lumia.com',
        '--entrypoints.websecure.http.tls.domains[0].sans=*.agence-lumia.com',
        '--entrypoints.websecure.http.tls.options=default',
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
    Entrypoint: [
        '/bin/sh',
        '-c',
        'mkdir -p /etc/traefik && touch /etc/traefik/acme.json && chmod 600 /etc/traefik/acme.json && traefik "$@"',
        '--',
    ],
    Labels: {
        'traefik.enable': 'true',

        // Middleware: Redirect HTTP to HTTPS
        'traefik.http.middlewares.redirect-to-https.redirectscheme.scheme': 'https',
        'traefik.http.middlewares.redirect-to-https.redirectscheme.permanent': 'true',

        // HTTP Catchall: Redirect all HTTP to HTTPS
        'traefik.http.routers.http-catchall.rule': 'hostregexp(`{host:.+}`)',
        'traefik.http.routers.http-catchall.entrypoints': 'web',
        'traefik.http.routers.http-catchall.middlewares': 'redirect-to-https',
        'traefik.http.routers.http-catchall.priority': '1',

        // Middleware: Redirect to agence-lumia.com
        'traefik.http.middlewares.redirect-to-agence-lumia.redirectregex.regex': '.*',
        'traefik.http.middlewares.redirect-to-agence-lumia.redirectregex.replacement': 'https://agence-lumia.com',
        'traefik.http.middlewares.redirect-to-agence-lumia.redirectregex.permanent': 'true',

        // HTTPS Catchall: redirect all unknown HTTPS traffic to agence-lumia.com
        'traefik.http.routers.https-catchall.rule': 'hostregexp(`{host:.+}`)',
        'traefik.http.routers.https-catchall.entrypoints': 'websecure',
        'traefik.http.routers.https-catchall.middlewares': 'redirect-to-agence-lumia',
        'traefik.http.routers.https-catchall.priority': '1',
        'traefik.http.routers.https-catchall.tls': 'true',
        'traefik.http.routers.https-catchall.tls.certresolver': 'letsencrypt',
    },
    HostConfig: {
        Binds: [
            '/var/run/docker.sock:/var/run/docker.sock',
            'traefik-acme:/etc/traefik',
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
