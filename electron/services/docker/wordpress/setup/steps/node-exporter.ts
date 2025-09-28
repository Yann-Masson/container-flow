import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import connectToNetwork from '../../../network/connect';
import nodeExporterConfig from '../../../configs/node-exporter';
import validate from '../../validate';
import { EnsureContext } from './types';

export async function ensureNodeExporter(ctx: EnsureContext): Promise<void> {
  const { force, progress } = ctx;
  progress?.('node-exporter', 'starting', 'Checking node-exporter container...');
  const client = getClient();
  if (!client) throw new Error('Docker client not initialized');

  const existing = await getContainerByName('node-exporter');
  if (existing) {
    const info = await client.getContainer(existing.id).inspect();
    if (!validate.containerConfig(info, nodeExporterConfig)) {
      if (!force) {
        const msg = 'node-exporter container exists but has invalid configuration. Use force=true to recreate.';
        progress?.('node-exporter', 'error', msg);
        throw new Error(msg);
      }
      progress?.('node-exporter', 'starting', 'Recreating invalid node-exporter container...');
      await removeContainer(existing.id, { force: true, volume: true });
      const created = await createContainer(nodeExporterConfig);
      try { await connectToNetwork('CF-WP', { Container: created.id }); } catch {}
      await startContainer(created.id);
      progress?.('node-exporter', 'success', 'node-exporter container recreated');
      return;
    }
    try { await connectToNetwork('CF-WP', { Container: existing.id }); } catch {}
    if (info.State.Status !== 'running') await startContainer(existing.id);
    progress?.('node-exporter', 'success', 'node-exporter container ready');
    return;
  }
  const created = await createContainer(nodeExporterConfig);
  try { await connectToNetwork('CF-WP', { Container: created.id }); } catch {}
  await startContainer(created.id);
  progress?.('node-exporter', 'success', 'node-exporter container created');
  return;
}
