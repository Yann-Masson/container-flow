import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ExternalLink, BarChart3, Database, Network, Server } from 'lucide-react';
import { domainConfig } from '../../../electron/config/domains';

export default function MonitoringCard() {
    const monitoringUrl = `https://${domainConfig.monitoring}`;

    const openMonitoring = async () => {
        await window.electronAPI.system.openExternal(monitoringUrl);
    };

    const dashboards = [
        { name: 'System Overview', icon: BarChart3, uid: 'cf-high' },
        { name: 'VPS Health', icon: Server, uid: 'cf-vps' },
        { name: 'Containers', icon: Activity, uid: 'cf-cont' },
        { name: 'Network', icon: Network, uid: 'cf-net' },
        { name: 'Database', icon: Database, uid: 'cf-db' },
    ];

    const openDashboard = async (uid: string) => {
        await window.electronAPI.system.openExternal(`${monitoringUrl}/d/${uid}`);
    };

    return (
        <Card
            variant='glass'
            accent='glow'
            interactive={false}
            withHoverOverlay
            className='group relative overflow-hidden'
        >
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5 text-primary' />
                    Monitoring Dashboard
                </CardTitle>
                <CardDescription>
                    Access Grafana monitoring dashboards to track system health, containers, and
                    performance metrics.
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4 mt-3'>
                {/* Main Monitoring Button */}
                <Button
                    onClick={openMonitoring}
                    size='lg'
                    className='w-full group/btn'
                    variant='default'
                >
                    <Activity className='mr-2 h-4 w-4 hidden min-[350px]:inline' />
                    <span className='hidden min-[350px]:inline'>Open Grafana Dashboard</span>
                    <ExternalLink className='ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all hidden min-[350px]:inline' />

                    <ExternalLink className='block min-[350px]:hidden' />
                </Button>

                {/* Quick Access to Specific Dashboards */}
                <div className='space-y-2'>
                    <p className='text-xs font-medium text-muted-foreground'>
                        Quick access to dashboards:
                    </p>
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                        {dashboards.map((dashboard) => {
                            const Icon = dashboard.icon;
                            return (
                                <Button
                                    key={dashboard.uid}
                                    onClick={() => openDashboard(dashboard.uid)}
                                    variant='outline'
                                    size='sm'
                                    className='group/dash text-xs h-auto py-2 px-3'
                                >
                                    <Icon className='mr-1.5 h-3.5 w-3.5 shrink-0' />
                                    <span className='truncate'>{dashboard.name}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
