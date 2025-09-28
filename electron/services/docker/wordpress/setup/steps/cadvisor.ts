import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import connectToNetwork from '../../../network/connect';
import cadvisorConfig from '../../../configs/cadvisor';
import validate from '../../validate';
import { EnsureContext } from './types';

export async function ensureCadvisor(ctx: EnsureContext): Promise<void> {
  const { force, progress } = ctx;
  progress?.('cadvisor', 'starting', 'Checking cAdvisor container...');
  const client = getClient();
  if (!client) throw new Error('Docker client not initialized');

  const existing = await getContainerByName('cadvisor');
  if (existing) {
    const info = await client.getContainer(existing.id).inspect();
    if (!validate.containerConfig(info, cadvisorConfig)) {
      if (!force) {
        const msg = 'cAdvisor container exists but has invalid configuration. Use force=true to recreate.';
        progress?.('cadvisor', 'error', msg);
        throw new Error(msg);
      }
      progress?.('cadvisor', 'starting', 'Recreating invalid cAdvisor container...');
      await removeContainer(existing.id, { force: true, volume: true });
      const created = await createContainer(cadvisorConfig);
      await connectToNetwork('CF-WP', { Container: created.id });
      await startContainer(created.id);
      progress?.('cadvisor', 'success', 'cAdvisor container recreated');
      return;
    }
    try { await connectToNetwork('CF-WP', { Container: existing.id }); } catch {}
    if (info.State.Status !== 'running') await startContainer(existing.id);
    progress?.('cadvisor', 'success', 'cAdvisor container ready');
    return;
  }
  const created = await createContainer(cadvisorConfig);
  await connectToNetwork('CF-WP', { Container: created.id });
  await startContainer(created.id);
  progress?.('cadvisor', 'success', 'cAdvisor container created');
  return;
}
