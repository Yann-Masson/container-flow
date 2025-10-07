export const domainConfig = {
  main: 'agence-lumia.com',
  internal: 'internal.agence-lumia.com',
  email: 'contact@agence-lumia.com',
  monitoring: 'monitoring.internal.agence-lumia.com',
} as const;

export function getFullDomain(subdomain: string, scope: 'main' | 'internal' = 'main'): string {
  const baseDomain = scope === 'main' ? domainConfig.main : domainConfig.internal;
  return `${subdomain}.${baseDomain}`;
}

export function getWildcardDomain(scope: 'main' | 'internal' = 'main'): string {
  const baseDomain = scope === 'main' ? domainConfig.main : domainConfig.internal;
  return `*.${baseDomain}`;
}
