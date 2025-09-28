import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import connectToNetwork from '../../../network/connect';
import traefikConfig from '../../../configs/traefik';
import validate from '../../validate';
import { EnsureContext } from './types';

export async function ensureTraefik(ctx: EnsureContext): Promise<void> {
  const { force, progress } = ctx;
  progress?.('traefik', 'starting', 'Checking Traefik container...');

  const client = getClient();
  if (!client) throw new Error('Docker client not initialized');

  const existing = await getContainerByName('traefik');
  if (existing) {
    const container = client.getContainer(existing.id);
    const info = await container.inspect();
    if (!validate.containerConfig(info, traefikConfig)) {
      if (!force) {
        const msg = 'Traefik container exists but has invalid configuration. Use force=true to recreate.';
        progress?.('traefik', 'error', msg);
        throw new Error(msg);
      }
      progress?.('traefik', 'starting', 'Removing invalid Traefik configuration...');
      await removeContainer(existing.id, { force: true, volume: true });
      const created = await createContainer(traefikConfig);
      await connectToNetwork('CF-WP', { Container: created.id });
      await startContainer(created.id);
      progress?.('traefik', 'success', 'Traefik container recreated');
      return;
    }
    try { await connectToNetwork('CF-WP', { Container: existing.id }); } catch {}
    if (info.State.Status !== 'running') await startContainer(existing.id);
    progress?.('traefik', 'success', 'Traefik container ready');
    return;
  }

  const created = await createContainer(traefikConfig);
  await connectToNetwork('CF-WP', { Container: created.id });
  await startContainer(created.id);
  progress?.('traefik', 'success', 'Traefik container created');
  return;
}
