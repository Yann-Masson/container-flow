import provisionGrafana from '../../../monitoring/provision-grafana';
import {
    vpsHealthDashboard,
    containersDashboard,
    networkDashboard,
    databaseDashboard,
    traefikDashboard,
    highLevelOverviewDashboard,
} from '../../../monitoring/dashboards';
import { EnsureContext } from './types';
import getAppConfig from '../../../../storage/app/get';
import saveAppConfig from '../../../../storage/app/save';

export async function provisionGrafanaDashboards(ctx: EnsureContext): Promise<void> {
    const { progress, grafanaAuth } = ctx;
    try {
        progress?.('grafana-provision', 'starting', 'Provisioning Grafana datasource...');

        const stored = getAppConfig();

        const storedUsername = stored.grafanaCredentials?.username?.trim();
        const authUsername = grafanaAuth?.username?.trim();
        const usedUsername =
            authUsername && authUsername.length > 0
                ? authUsername
                : storedUsername && storedUsername.length > 0
                ? storedUsername
                : 'admin';

        const storedPassword = stored.grafanaCredentials?.password?.trim();
        const authPassword = grafanaAuth?.password?.trim();
        const usedPassword =
            authPassword && authPassword.length > 0
                ? authPassword
                : storedPassword && storedPassword.length > 0
                ? storedPassword
                : 'admin';

        const result = await provisionGrafana({
            baseUrl: 'https://monitoring.internal.agence-lumia.com',
            username: usedUsername,
            password: usedPassword,
            datasourceName: 'Prometheus',
            datasourceUrl: 'http://prometheus:9090',
            dashboards: [
                { title: 'VPS Health', uid: 'cf-vps', json: vpsHealthDashboard },
                { title: 'Containers', uid: 'cf-cont', json: containersDashboard },
                { title: 'Network', uid: 'cf-net', json: networkDashboard },
                { title: 'Database (MySQL)', uid: 'cf-db', json: databaseDashboard },
                { title: 'Traefik', uid: 'cf-traefik', json: traefikDashboard },
                { title: 'System Overview', uid: 'cf-high', json: highLevelOverviewDashboard },
            ],
            retry: { attempts: 40, intervalMs: 2000 },
        });

        if (
            stored.grafanaCredentials?.username !== usedUsername ||
            stored.grafanaCredentials?.password !== usedPassword
        ) {
            saveAppConfig({
                ...stored,
                grafanaCredentials: {
                    username: usedUsername,
                    password: usedPassword,
                },
            });
        }

        const actions = [result.created && 'created', result.updated && 'updated']
            .filter(Boolean)
            .join('/');

        const imported =
            (result.dashboardsImported ?? 0) > 0
                ? `, ${result.dashboardsImported} dashboards imported`
                : '';

        const summary = actions ? `${actions}${imported}` : 'no changes';

        progress?.('grafana-provision', 'success', `Grafana provisioned (${summary})`);
    } catch (e) {
        console.error('Grafana provisioning failed', e);
        progress?.('grafana-provision', 'error', e instanceof Error ? e.message : 'Unknown error');
        throw e;
    }
}
