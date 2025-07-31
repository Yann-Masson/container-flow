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

        let res: [mysql.QueryResult, mysql.FieldPacket[]];

        // 1. Drop existing user if exists to avoid password conflicts
        try {
            res = await connection.execute(`DROP USER IF EXISTS '${dbUser}'@'%'`);
            console.log(`Drop user result: ${JSON.stringify(res)}`);
        } catch (error) {
            console.log(`Drop user warning (normal if user doesn't exist): ${error}`);
        }

        // 2. Create database
        res = await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Database creation result: ${JSON.stringify(res)}`);

        // 3. Create user with new password
        res = await connection.execute(
            `CREATE USER '${dbUser}'@'%' IDENTIFIED BY '${dbPassword}'`
        );
        console.log(`User creation result: ${JSON.stringify(res)}`);

        // 4. Grant all privileges on the specific database
        res = await connection.execute(
            `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`
        );
        console.log(`Grant privileges result: ${JSON.stringify(res)}`);

        // 5. Flush privileges to ensure changes take effect immediately
        res = await connection.execute('FLUSH PRIVILEGES');
        console.log(`Flush privileges result: ${JSON.stringify(res)}`);

        // 6. Test the connection with the new user
        await testDatabaseConnection({
            host: connectionOptions.host,
            port: connectionOptions.port,
            user: dbUser,
            password: dbPassword,
            database: dbName
        });

        console.log(`Database '${dbName}' and user '${dbUser}' created successfully`);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Helper function to test the database connection
async function testDatabaseConnection(options: MySQLConnectionOptions): Promise<void> {
    let testConnection;
    try {
        console.log(`Testing connection for user '${options.user}' to database '${options.database}'...`);
        testConnection = await mysql.createConnection(options);

        // Try a simple query to ensure everything works
        await testConnection.execute('SELECT 1');
        console.log(`✅ Database connection test successful for user '${options.user}'`);
    } catch (error) {
        console.error(`❌ Database connection test failed for user '${options.user}':`, error);
        throw new Error(`Database connection test failed: ${error}`);
    } finally {
        if (testConnection) {
            await testConnection.end();
        }
    }
}
