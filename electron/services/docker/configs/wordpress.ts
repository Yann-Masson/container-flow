import { ContainerCreateOptions } from 'dockerode';
import { domainConfig } from '../../../config/domains';

const wordpress: ContainerCreateOptions = {
    name: 'wordpress',
    Image: 'wordpress:latest',
    ExposedPorts: {
        '80/tcp': {},
    },
    HostConfig: {
        Binds: ['wordpress-data:/var/www/html'],
        PortBindings: {
            '80/tcp': [{ HostPort: '80' }],
        },
        RestartPolicy: {
            Name: 'always',
            MaximumRetryCount: 0,
        },
    },
    Env: [
        'WORDPRESS_DB_HOST=mysql:3306',
        'WORDPRESS_DB_USER=wordpress',
        'WORDPRESS_DB_PASSWORD=wordpress',
        'WORDPRESS_DB_NAME=wordpress',
        "WORDPRESS_CONFIG_EXTRA=define('WP_MEMORY_LIMIT','512M'); define('WP_MAX_MEMORY_LIMIT','512M'); @ini_set('max_execution_time','300');",
    ],
    Labels: {
        'traefik.enable': 'true',
        'traefik.http.routers.wordpress.rule': `Host("wordpress.${domainConfig.main}")`,
        'traefik.http.routers.wordpress.entrypoints': 'web',
        'traefik.http.services.wordpress.loadbalancer.server.port': '80',
    },
};

export default wordpress;
