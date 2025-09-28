import ensureMetricsUser from '../../utils/ensure-metrics-user';
import { EnsureContext } from './types';

export async function ensureMysqlMetricsUser(ctx: EnsureContext): Promise<string | null> {
  ctx.progress?.('mysql-metrics-user', 'starting', 'Ensuring MySQL metrics user exists...');
  try {
    const dsn = await ensureMetricsUser();
    ctx.progress?.('mysql-metrics-user', 'success', 'Metrics user ensured');
    return dsn;
  } catch (e) {
    ctx.progress?.('mysql-metrics-user', 'error', `Failed to ensure metrics user: ${e instanceof Error ? e.message : 'Unknown error'}`);
    console.warn('Failed to ensure metrics user, will fallback to root credentials if available', e);
    return null;
  }
}
