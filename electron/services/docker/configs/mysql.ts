import { ContainerCreateOptions } from 'dockerode';

const mysql: ContainerCreateOptions = {
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
    Env: ['MYSQL_ROOT_PASSWORD=rootpassword'],
};

export default mysql;
