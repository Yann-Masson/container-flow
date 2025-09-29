import { ensureNetwork } from './steps/network';
import { ensureTraefik } from './steps/traefik';
import { ensureMySQL } from './steps/mysql';
import { waitMySQLReady } from './steps/mysql-wait';
import { ensureMysqlMetricsUser } from './steps/mysql-metrics-user';
import { ensureCadvisor } from './steps/cadvisor';
import { ensureMysqlExporter } from './steps/mysqld-exporter';
import { ensureNodeExporter } from './steps/node-exporter';
import { ensurePrometheus } from './steps/prometheus';
import { ensureGrafana } from './steps/grafana';
import { provisionGrafanaDashboards } from './steps/grafana-provision';
import type { ProgressCallback, SetupOptions } from './steps/types';

export default async function setup(
    options: SetupOptions = {},
    progressCallback?: ProgressCallback,
): Promise<boolean> {
    const { force = false, grafanaAuth } = options;
    console.log('Starting WordPress infrastructure setup (refactored)...');

    try {
    const ctx = { force, progress: progressCallback, grafanaAuth };

        await ensureNetwork(ctx);
        await ensureTraefik(ctx);
        await ensureMySQL(ctx);
        await waitMySQLReady(ctx);
        const metricsDsn = await ensureMysqlMetricsUser(ctx);

        // Monitoring stack
        await ensureCadvisor(ctx);
        await ensureMysqlExporter(ctx, metricsDsn);
        await ensureNodeExporter(ctx);
        await ensurePrometheus(ctx);
        await ensureGrafana(ctx);

        await provisionGrafanaDashboards(ctx);

        console.log('WordPress infrastructure setup completed successfully!');
        return true;
    } catch (error) {
        console.error('Error during WordPress infrastructure setup:', error);
        progressCallback?.(
            'setup',
            'error',
            `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return false; // Do not throw; caller inspects boolean now
    }
}
