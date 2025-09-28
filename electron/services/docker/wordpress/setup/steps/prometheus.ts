import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import connectToNetwork from '../../../network/connect';
import prometheusConfig from '../../../configs/prometheus';
import validate from '../../validate';
import { EnsureContext } from './types';

export async function ensurePrometheus(ctx: EnsureContext): Promise<void> {
  const { force, progress } = ctx;
  progress?.('prometheus', 'starting', 'Checking Prometheus container...');
  const client = getClient();
  if (!client) throw new Error('Docker client not initialized');

  const existing = await getContainerByName('prometheus');
  if (existing) {
    const info = await client.getContainer(existing.id).inspect();
    if (!validate.containerConfig(info, prometheusConfig)) {
      if (!force) {
        const msg = 'Prometheus container exists but has invalid configuration. Use force=true to recreate.';
        progress?.('prometheus', 'error', msg);
        throw new Error(msg);
      }
      progress?.('prometheus', 'starting', 'Recreating invalid Prometheus container...');
      await removeContainer(existing.id, { force: true, volume: true });
      const created = await createContainer(prometheusConfig);
      await connectToNetwork('CF-WP', { Container: created.id });
      await startContainer(created.id);
      progress?.('prometheus', 'success', 'Prometheus container recreated');
      return;
    }
    try { await connectToNetwork('CF-WP', { Container: existing.id }); } catch {}
    if (info.State.Status !== 'running') await startContainer(existing.id);
    progress?.('prometheus', 'success', 'Prometheus container ready');
    return;
  }
  const created = await createContainer(prometheusConfig);
  await connectToNetwork('CF-WP', { Container: created.id });
  await startContainer(created.id);
  progress?.('prometheus', 'success', 'Prometheus container created');
  return;
}
