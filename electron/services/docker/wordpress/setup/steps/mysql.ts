import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import connectToNetwork from '../../../network/connect';
import mysqlConfig from '../../../configs/mysql';
import validate from '../../validate';
import { EnsureContext } from './types';

export async function ensureMySQL(ctx: EnsureContext): Promise<void> {
  const { force, progress } = ctx;
  progress?.('mysql', 'starting', 'Checking MySQL container...');

  const client = getClient();
  if (!client) throw new Error('Docker client not initialized');

  const existing = await getContainerByName('mysql');
  if (existing) {
    const container = client.getContainer(existing.id);
    const info = await container.inspect();
    if (!validate.containerConfig(info, mysqlConfig)) {
      if (!force) {
        const msg = 'MySQL container exists but has invalid configuration. Use force=true to recreate.';
        progress?.('mysql', 'error', msg);
        throw new Error(msg);
      }
      progress?.('mysql', 'starting', 'Removing invalid MySQL configuration...');
      await removeContainer(existing.id, { force: true, volume: true });
      const created = await createContainer(mysqlConfig);
      await connectToNetwork('CF-WP', { Container: created.id });
      await startContainer(created.id);
      progress?.('mysql', 'success', 'MySQL container recreated');
      return;
    }
    try { await connectToNetwork('CF-WP', { Container: existing.id }); } catch {}
    if (info.State.Status !== 'running') await startContainer(existing.id);
    progress?.('mysql', 'success', 'MySQL container ready');
    return;
  }

  const created = await createContainer(mysqlConfig);
  await connectToNetwork('CF-WP', { Container: created.id });
  await startContainer(created.id);
  progress?.('mysql', 'success', 'MySQL container created');
  return;
}
