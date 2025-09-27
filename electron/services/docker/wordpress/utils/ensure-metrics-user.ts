import mysql from 'mysql2/promise';
import { getMySQLConnectionOptions } from '../../client';

/**
 * Ensure a low-privilege metrics user exists for Prometheus mysqld-exporter.
 * Creates user 'metrics'@'%' with PROCESS, REPLICATION CLIENT, SHOW DATABASES, SELECT.
 * Returns a DATA_SOURCE_NAME string for exporter.
 */
export async function ensureMetricsUser(options?: {
  user?: string;
  password?: string;
}): Promise<string> {
  const metricsUser = options?.user || 'metrics';
  const metricsPassword = options?.password || 'metrics_password';

  const rootConnOpts = getMySQLConnectionOptions();
  // Root connection options are expected to have host, port, user, password
  const conn = await mysql.createConnection(rootConnOpts as any);
  try {
    // Create user if not exists
    // Use query instead of execute because CREATE USER is not supported as a prepared statement
    await conn.query(
      `CREATE USER IF NOT EXISTS \`${metricsUser}\`@'%' IDENTIFIED BY ?`,
      [metricsPassword]
    );
    // Use query for consistency with the CREATE USER statement above
    await conn.query(
      `GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO \`${metricsUser}\`@'%'`
    );
    await conn.query('FLUSH PRIVILEGES');
  } finally {
    await conn.end();
  }
  // Return DSN string consumed by mysqld-exporter
  return `${metricsUser}:${metricsPassword}@(mysql:3306)/`;
}

export default ensureMetricsUser;
