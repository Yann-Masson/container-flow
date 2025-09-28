import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import connectToNetwork from '../../../network/connect';
import grafanaConfig from '../../../configs/grafana';
import validate from '../../validate';
import { EnsureContext } from './types';

export async function ensureGrafana(ctx: EnsureContext): Promise<void> {
  const { force, progress } = ctx;
  progress?.('grafana', 'starting', 'Checking Grafana container...');
  const client = getClient();
  if (!client) throw new Error('Docker client not initialized');

  const existing = await getContainerByName('grafana');
  if (existing) {
    const info = await client.getContainer(existing.id).inspect();
    if (!validate.containerConfig(info, grafanaConfig)) {
      if (!force) {
        const msg = 'Grafana container exists but has invalid configuration. Use force=true to recreate.';
        progress?.('grafana', 'error', msg);
        throw new Error(msg);
      }
      progress?.('grafana', 'starting', 'Recreating invalid Grafana container...');
      await removeContainer(existing.id, { force: true, volume: true });
      const created = await createContainer(grafanaConfig);
      await connectToNetwork('CF-WP', { Container: created.id });
      await startContainer(created.id);
      progress?.('grafana', 'success', 'Grafana container recreated');
      return;
    }
    try { await connectToNetwork('CF-WP', { Container: existing.id }); } catch {}
    if (info.State.Status !== 'running') await startContainer(existing.id);
    progress?.('grafana', 'success', 'Grafana container ready');
    return;
  }
  const created = await createContainer(grafanaConfig);
  await connectToNetwork('CF-WP', { Container: created.id });
  await startContainer(created.id);
  progress?.('grafana', 'success', 'Grafana container created');
  return;
}
