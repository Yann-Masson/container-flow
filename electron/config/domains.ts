const main = 'yann-masson.fr';

export const domainConfig = {
    main,
    internal: 'internal.' + main,
    email: 'contact@' + main,
    monitoring: 'monitoring.internal.' + main,
} as const;

export function getFullDomain(subdomain: string, scope: 'main' | 'internal' = 'main'): string {
    const baseDomain = scope === 'main' ? domainConfig.main : domainConfig.internal;
    return `${subdomain}.${baseDomain}`;
}

export function getWildcardDomain(scope: 'main' | 'internal' = 'main'): string {
    const baseDomain = scope === 'main' ? domainConfig.main : domainConfig.internal;
    return `*.${baseDomain}`;
}
