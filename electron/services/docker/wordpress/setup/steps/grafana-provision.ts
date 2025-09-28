import provisionGrafana from '../../../monitoring/provision-grafana';
import { 
  vpsHealthDashboard,
  containersDashboard,
  networkDashboard,
  databaseDashboard,
  traefikDashboard,
  highLevelOverviewDashboard
} from '../../../monitoring/dashboards';
import { EnsureContext } from './types';

export async function provisionGrafanaDashboards(ctx: EnsureContext): Promise<void> {
  const { progress } = ctx;
  try {
    progress?.('grafana-provision', 'starting', 'Provisioning Grafana datasource...');
    const candidateBases = [
      'https://monitoring.internal.agence-lumia.com',
      'http://grafana:3000',
    ];

    let lastError: Error | null = null;
    let result: any = null;
    for (const base of candidateBases) {
      try {
        result = await provisionGrafana({
          baseUrl: base,
          prometheusUrl: 'http://prometheus:9090',
          dashboards: [
            { title: 'VPS Health', uid: 'cf-vps', json: vpsHealthDashboard },
            { title: 'Containers', uid: 'cf-cont', json: containersDashboard },
            { title: 'Network', uid: 'cf-net', json: networkDashboard },
            { title: 'Database (MySQL)', uid: 'cf-db', json: databaseDashboard },
            { title: 'Traefik', uid: 'cf-traefik', json: traefikDashboard },
            { title: 'System Overview', uid: 'cf-high', json: highLevelOverviewDashboard },
          ],
          retry: { attempts: 40, intervalMs: 2000 },
          logger: (m: string) => console.log(m),
        });
        lastError = null;
        break;
      } catch (e) {
        lastError = e as Error;
        console.warn(`[Grafana Provision] Failed with base ${base}: ${lastError.message}`);
      }
    }
    if (lastError) throw lastError;
    progress?.('grafana-provision', 'success', `Grafana provisioned (created: ${result.created}, updated: ${result.updated}, dashboards: ${result.dashboardsImported})`);
  } catch (e) {
    console.error('Grafana provisioning failed', e);
    progress?.('grafana-provision', 'error', e instanceof Error ? e.message : 'Unknown error');
  }
}
