import { getClient } from '../../../client';
import { create as createContainer } from '../../../containers/create';
import { start as startContainer } from '../../../containers/start';
import { remove as removeContainer } from '../../../containers/remove';
import { getByName as getContainerByName } from '../../../containers/get-by-name';
import connectToNetwork from '../../../network/connect';
import mysqlConfigModule from '../../../configs/mysql';
import passwordManager from '../../../../runtime/passwords';
import validate from '../../validate';
import { EnsureContext } from './types';

export async function ensureMySQL(ctx: EnsureContext): Promise<void> {
  const { force, progress } = ctx;
  progress?.('mysql', 'starting', 'Checking MySQL container...');

  const client = getClient();
  if (!client) throw new Error('Docker client not initialized');

  const existing = await getContainerByName('mysql');
  const rootPassword = passwordManager.getState().root?.password;
  
  if (existing) {
    const container = client.getContainer(existing.id);
    const info = await container.inspect();
    // Build expected config only if we have a root password; otherwise skip strict validation (user will be prompted)
    const expected = rootPassword ? mysqlConfigModule.buildMySqlConfig(rootPassword) : undefined;
    if (expected && !validate.containerConfig(info, expected)) {
      if (!force) {
        const msg = 'MySQL container exists but has invalid configuration. Use force=true to recreate.';
        progress?.('mysql', 'error', msg);
        throw new Error(msg);
      }
      progress?.('mysql', 'starting', 'Removing invalid MySQL configuration...');
      if (!rootPassword) {
        throw new Error('Root password missing; cannot recreate MySQL. Provide credentials first.');
      }
      await removeContainer(existing.id, { force: true, volume: true });
      const created = await createContainer(expected);
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

  if (!rootPassword) {
    const msg = 'Root password not set; cannot create MySQL container.';
    progress?.('mysql', 'error', msg);
    throw new Error(msg);
  }

  const mysqlConfig = mysqlConfigModule.buildMySqlConfig(rootPassword);
  const created = await createContainer(mysqlConfig);
  await connectToNetwork('CF-WP', { Container: created.id });
  await startContainer(created.id);
  progress?.('mysql', 'success', 'MySQL container created');
  return;
}
