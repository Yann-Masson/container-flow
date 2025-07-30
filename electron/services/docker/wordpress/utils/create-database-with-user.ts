import mysql from "mysql2/promise";

interface MySQLConnectionOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database?: string;
}

export default async function createDatabaseWithUser(
    connectionOptions: MySQLConnectionOptions,
    dbOptions: { dbName: string; dbUser: string; dbPassword: string }
): Promise<void> {
    const { dbName, dbUser, dbPassword } = dbOptions;

    console.log(`Creating database '${dbName}' and user '${dbUser}'...`);

    let connection;
    try {
        // Connect to MySQL
        connection = await mysql.createConnection({
            host: connectionOptions.host,
            port: connectionOptions.port,
            user: connectionOptions.user,
            password: connectionOptions.password,
        });

        // Create database
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

        // Create user and grant privileges
        await connection.execute(
            `CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${dbPassword}'`
        );

        await connection.execute(
            `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`
        );

        await connection.execute('FLUSH PRIVILEGES');

        console.log(`Database '${dbName}' and user '${dbUser}' created successfully`);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
