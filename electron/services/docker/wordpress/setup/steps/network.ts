import createNetwork from '../../../network/create';
import inspectNetwork from '../../../network/inspect';
import listNetworks from '../../../network/list';
import removeNetwork from '../../../network/remove';
import validate from '../../validate';
import { EnsureContext } from './types';

/** Ensure CF-WP docker network exists with valid configuration */
export async function ensureNetwork(ctx: EnsureContext): Promise<void> {
  const { force, progress } = ctx;
  progress?.('network', 'starting', 'Checking network CF-WP...');

  const existingNetworks = await listNetworks({ filters: { name: ['CF-WP'] } });
  const existingNetwork = existingNetworks.find(n => n.Name === 'CF-WP');

  if (existingNetwork) {
    const networkInfo = await inspectNetwork('CF-WP');
    if (!validate.networkConfig(networkInfo)) {
      if (!force) {
        const msg = 'Network CF-WP exists but has invalid configuration. Use force=true to recreate.';
        progress?.('network', 'error', msg);
        throw new Error(msg);
      }
      progress?.('network', 'starting', 'Removing invalid network configuration...');
      await removeNetwork('CF-WP', true);
  await createNetwork({ Name: 'CF-WP', Driver: 'bridge' });
      progress?.('network', 'success', 'Network CF-WP recreated');
      return;
    }
    progress?.('network', 'success', 'Network CF-WP ready');
    return;
  }

  await createNetwork({ Name: 'CF-WP', Driver: 'bridge' });
  progress?.('network', 'success', 'Network CF-WP created');
  return;
}
