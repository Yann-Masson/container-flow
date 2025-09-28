import utils from '../../utils';
import { EnsureContext } from './types';

export async function waitMySQLReady(ctx: EnsureContext): Promise<void> {
  ctx.progress?.('mysql-ready', 'starting', 'Waiting for MySQL to be ready...');
  await utils.waitMysql();
  ctx.progress?.('mysql-ready', 'success', 'MySQL is ready');
}
