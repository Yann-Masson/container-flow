import mysql from "mysql2/promise";

interface MySQLConnectionOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database?: string;
}

export default async function deleteDatabaseAndUser(
    connectionOptions: MySQLConnectionOptions,
    dbOptions: { dbName: string; dbUser: string }
): Promise<void> {
    const { dbName, dbUser } = dbOptions;

    console.log(`Deleting database '${dbName}' and user '${dbUser}'...`);

    let connection;
    try {
        // Connect to MySQL
        connection = await mysql.createConnection({
            host: connectionOptions.host,
            port: connectionOptions.port,
            user: connectionOptions.user,
            password: connectionOptions.password,
        });

        let res: [mysql.QueryResult, mysql.FieldPacket[]];

        // 1. Drop database if exists
        try {
            res = await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
            console.log(`Database deletion result: ${JSON.stringify(res)}`);
        } catch (error) {
            console.log(`Database deletion warning: ${error}`);
        }

        // 2. Drop user if exists
        try {
            res = await connection.execute(`DROP USER IF EXISTS '${dbUser}'@'%'`);
            console.log(`User deletion result: ${JSON.stringify(res)}`);
        } catch (error) {
            console.log(`User deletion warning: ${error}`);
        }

        // 3. Flush privileges to ensure changes take effect
        await connection.execute('FLUSH PRIVILEGES');
        console.log('MySQL privileges flushed');

    } catch (error) {
        console.error('Error deleting database and user:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
