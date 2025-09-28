import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import connectToNetwork from '../../../network/connect';
import mysqldExporterConfig from '../../../configs/mysqld-exporter';
import validate from '../../validate';
import { EnsureContext } from './types';

export async function ensureMysqlExporter(ctx: EnsureContext, metricsDsn: string | null): Promise<void> {
  const { force, progress } = ctx;
  progress?.('mysqld-exporter', 'starting', 'Checking MySQL exporter container...');
  const client = getClient();
  if (!client) throw new Error('Docker client not initialized');

  const existing = await getContainerByName('mysqld-exporter');

  // clone and inject DSN
  const exporterConfig = { ...mysqldExporterConfig };
  exporterConfig.Env = exporterConfig.Env ? [...exporterConfig.Env] : [];
  const dsn = metricsDsn || 'root:lumiarootpassword@(mysql:3306)/';
  exporterConfig.Env.push(`DATA_SOURCE_NAME=${dsn}`);
  exporterConfig.Cmd = exporterConfig.Cmd ? [...exporterConfig.Cmd] : [];
  exporterConfig.Cmd.push(`--mysqld.username=${metricsDsn ? metricsDsn.split('@')[0] : 'root'}`);

  if (existing) {
    const info = await client.getContainer(existing.id).inspect();
    if (!validate.containerConfig(info, exporterConfig)) {
      if (!force) {
        const msg = 'mysqld-exporter container exists but has invalid configuration. Use force=true to recreate.';
        progress?.('mysqld-exporter', 'error', msg);
        throw new Error(msg);
      }
      progress?.('mysqld-exporter', 'starting', 'Recreating invalid mysqld-exporter container...');
      await removeContainer(existing.id, { force: true, volume: true });
      const created = await createContainer(exporterConfig);
      await connectToNetwork('CF-WP', { Container: created.id });
      await startContainer(created.id);
      progress?.('mysqld-exporter', 'success', 'mysqld-exporter container recreated');
      return;
    }
    try { await connectToNetwork('CF-WP', { Container: existing.id }); } catch {}
    if (info.State.Status !== 'running') await startContainer(existing.id);
    progress?.('mysqld-exporter', 'success', 'mysqld-exporter container ready');
    return;
  }
  const created = await createContainer(exporterConfig);
  await connectToNetwork('CF-WP', { Container: created.id });
  await startContainer(created.id);
  progress?.('mysqld-exporter', 'success', 'mysqld-exporter container created');
  return;
}
