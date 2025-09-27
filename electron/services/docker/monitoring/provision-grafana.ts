export interface ProvisionGrafanaOptions {
  baseUrl?: string; // e.g., http://localhost:3000 or through SSH tunnel
  username?: string; // admin
  password?: string; // admin
  prometheusUrl?: string; // internal URL inside network (prometheus:9090)
  datasourceName?: string; // Prometheus
  retry?: { attempts: number; intervalMs: number }; // readiness attempts
  dashboards?: Array<{
    title: string;
    uid?: string;
    json: any; // full dashboard JSON structure
    folderId?: number; // 0 = General
  }>;
  logger?: (msg: string) => void;
}

interface ProvisionResult {
  created: boolean;
  updated: boolean;
  datasourceId: number;
  dashboardsImported: number;
}

/**
 * Provision Grafana: ensure Prometheus datasource + optional dashboards.
 * Idempotent & safe to call multiple times.
 */
export async function provisionGrafana(opts: ProvisionGrafanaOptions = {}): Promise<ProvisionResult> {
  const {
    baseUrl = 'http://localhost:3000',
    username = 'admin',
    password = '!Ee26YYcC$n^NbZE9zFR',
    prometheusUrl = 'http://prometheus:9090',
    datasourceName = 'Prometheus',
    retry = { attempts: 30, intervalMs: 2000 },
    dashboards = [],
    logger = () => {},
  } = opts;

  logger(`[Grafana] Waiting for availability at ${baseUrl}`);
  for (let i = 0; i < retry.attempts; i++) {
    try {
      const r = await fetch(`${baseUrl}/api/health`);
      if (r.ok) break;
    } catch (e) {
      // ignore until attempts exhausted
    }
    if (i === retry.attempts - 1) {
      throw new Error(`Grafana not ready after ${retry.attempts} attempts`);
    }
    await new Promise(res => setTimeout(res, retry.intervalMs));
  }
  // Basic auth header
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  const headers = { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' };

  let created = false;
  let updated = false;
  let finalInfo: any = null;

  logger('[Grafana] Checking existing datasource');
  let dsResp = await fetch(`${baseUrl}/api/datasources/name/${encodeURIComponent(datasourceName)}`, { headers });

  if (dsResp.status === 200) {
    finalInfo = await dsResp.json(); // parse ONCE
  } else if (dsResp.status === 404) {
    logger('[Grafana] Creating Prometheus datasource');
    const createResp = await fetch(`${baseUrl}/api/datasources`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: datasourceName,
        type: 'prometheus',
        access: 'proxy',
        url: prometheusUrl,
        basicAuth: false,
        isDefault: true,
        editable: true,
      }),
    });
    if (!createResp.ok) {
      throw new Error(`[Grafana] Failed to create datasource: ${createResp.status} ${await createResp.text()}`);
    }
    created = true;
    // fetch again to obtain full info
    dsResp = await fetch(`${baseUrl}/api/datasources/name/${encodeURIComponent(datasourceName)}`, { headers });
    if (!dsResp.ok) {
      throw new Error(`[Grafana] Failed to fetch created datasource: ${dsResp.status}`);
    }
    finalInfo = await dsResp.json();
  } else if (dsResp.status === 401) {
    throw new Error('[Grafana] Failed querying datasource: 401 Unauthorized. The admin credentials used are invalid.');
  } else {
    throw new Error(`[Grafana] Failed querying datasource: ${dsResp.status}`);
  }

  // Update URL if it changed (e.g., prometheus service address changed)
  if (!created && finalInfo.url !== prometheusUrl) {
    logger('[Grafana] Updating datasource URL');
    const upd = await fetch(`${baseUrl}/api/datasources/${finalInfo.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...finalInfo,
        url: prometheusUrl,
      }),
    });
    if (!upd.ok) {
      throw new Error(`[Grafana] Failed to update datasource: ${upd.status} ${await upd.text()}`);
    }
    updated = true;
    const refreshed = await fetch(`${baseUrl}/api/datasources/name/${encodeURIComponent(datasourceName)}`, { headers });
    if (refreshed.ok) {
      finalInfo = await refreshed.json();
    }
  }

  let dashboardsImported = 0;

  // Some dashboard JSONs may carry placeholder datasource references with uid: 'PROMETHEUS_DS'.
  // Replace them dynamically with the real datasource UID.
  const patchDashboardDatasources = (dash: any) => {
    if (!dash || typeof dash !== 'object') return dash;
    const traverse = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.forEach(traverse);
      } else if (obj && typeof obj === 'object') {
        if (obj.datasource && typeof obj.datasource === 'object') {
          if (obj.datasource.uid === 'PROMETHEUS_DS') {
            obj.datasource.uid = finalInfo.uid || finalInfo.id?.toString();
            obj.datasource.type = 'prometheus';
          }
        }
        Object.values(obj).forEach(traverse);
      }
    };
    traverse(dash);
    return dash;
  };

  for (const dash of dashboards) {
    try {
      logger(`[Grafana] Importing dashboard: ${dash.title}`);
      const dashboardPatched = patchDashboardDatasources({ ...dash.json, title: dash.title, uid: dash.uid });
      const payload = {
        dashboard: dashboardPatched,
        overwrite: true,
        folderId: dash.folderId ?? 0,
        message: 'Automated provisioning',
      };

      const alreadyExistsResp = await fetch(`${baseUrl}/api/dashboards/uid/${encodeURIComponent(dash.uid || dashboardPatched.uid)}`, { headers });
      if (alreadyExistsResp.ok) {
        continue;
      }

      const r = await fetch(`${baseUrl}/api/dashboards/db`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        logger(`[Grafana] Dashboard import failed (${dash.title}): ${r.status} ${await r.text()}`);
        continue;
      }
      dashboardsImported++;
    } catch (err) {
      logger(`[Grafana] Dashboard import error (${dash.title}): ${(err as Error).message}`);
    }
  }

  logger('[Grafana] Provisioning complete');
  return { created, updated, datasourceId: finalInfo.id, dashboardsImported };
}

export default provisionGrafana;
