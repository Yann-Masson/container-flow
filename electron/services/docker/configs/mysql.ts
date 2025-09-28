import { ContainerCreateOptions } from 'dockerode';

export function buildMySqlConfig(rootPassword: string): ContainerCreateOptions {
    return {
        name: 'mysql',
        Image: 'mysql:5.7',
        ExposedPorts: {
            '3306/tcp': {},
        },
        HostConfig: {
            Binds: [`mysql-data:/var/lib/mysql`],
            PortBindings: {
                '3306/tcp': [{ HostPort: '3306' }],
            },
            RestartPolicy: {
                Name: 'always',
                MaximumRetryCount: 0,
            },
        },
        Env: [
            `MYSQL_ROOT_PASSWORD=${rootPassword}`,
            // Allow root access from other containers (needed for mysqld-exporter DSN root@mysql)
            'MYSQL_ROOT_HOST=%'
        ],
    };
}

export default { buildMySqlConfig };
