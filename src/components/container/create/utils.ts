import { ContainerCreateOptions } from 'dockerode';

export function getButtonStyle(defaultConfig?: ContainerCreateOptions): string {
    const name = defaultConfig?.name?.toLowerCase();

    if (name?.includes('nginx'))
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:text-green-900';
    if (name?.includes('mysql') || name?.includes('mariadb'))
        return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 hover:text-orange-900';
    if (name?.includes('postgres'))
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 hover:text-blue-900';
    if (name?.includes('redis'))
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 hover:text-red-900';
    if (name?.includes('mongo'))
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 hover:text-emerald-900';
    if (name?.includes('traefik'))
        return 'bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-200 hover:text-cyan-900';
    if (name?.includes('wordpress'))
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200 hover:text-indigo-900';
    if (name?.includes('grafana'))
        return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 hover:text-amber-900';
    if (name?.includes('prometheus'))
        return 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 hover:text-rose-900';
    if (name?.includes('cadvisor') || name?.includes('exporter'))
        return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 hover:text-purple-900';
    if (name?.includes('node'))
        return 'bg-lime-100 text-lime-800 border-lime-300 hover:bg-lime-200 hover:text-lime-900';
    if (name?.includes('rabbitmq'))
        return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 hover:bg-fuchsia-200 hover:text-fuchsia-900';
    if (name?.includes('elasticsearch'))
        return 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200 hover:text-teal-900';
    return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 hover:text-blue-900';
}
