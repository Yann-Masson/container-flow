import { getMySQLConnectionOptions } from "../../client.ts";
import mysql from "mysql2/promise";

export default async function waitMysql(retries: number = 10, delay: number = 5000): Promise<void> {
    const mysqlConnectionOptions = getMySQLConnectionOptions();

    for (let i = 0; i < retries; i++) {
        try {
            // Try to connect to the MySQL server
            const connection = await mysql.createConnection(mysqlConnectionOptions);
            await connection.end();
            console.log('MySQL is ready');
            return;
        } catch (error) {
            console.log(`MySQL not ready yet, retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('MySQL is not ready after multiple retries');
}

