import { getClient } from '../client';
import { create as createContainer } from '../containers/create';
import { start as startContainer } from '../containers/start';
import { remove as removeContainer } from '../containers/remove';
import { getByName as getContainerByName } from '../containers/get-by-name';
import createNetwork from '../network/create';
import connectToNetwork from '../network/connect';
import inspectNetwork from '../network/inspect';
import listNetworks from '../network/list';
import removeNetwork from '../network/remove';
import traefik from '../configs/traefik';
import mysqlConfig from '../configs/mysql';
import prometheusConfig from '../configs/prometheus';
import grafanaConfig from '../configs/grafana';
import cadvisorConfig from '../configs/cadvisor';
import mysqldExporterConfig from '../configs/mysqld-exporter';
import nodeExporterConfig from '../configs/node-exporter';
import validate from "./validate";
import utils from "./utils";
import provisionGrafana from '../../docker/monitoring/provision-grafana';
import containerOverviewDashboard from '../../docker/monitoring/dashboards/container-overview';

// Event emitter for setup progress
type ProgressCallback = (step: string, status: 'starting' | 'success' | 'error', message?: string) => void;

// Configuration validate interface
interface SetupOptions {
    force?: boolean;
}

/**
 * Setup the complete WordPress infrastructure
 * Creates network, Traefik and MySQL containers
 */
export default async function setup(
    options: SetupOptions = {},
    progressCallback?: ProgressCallback
): Promise<{
    network: { id: string; name: string };
    traefik: { id: string; name: string };
    mysql: { id: string; name: string };
    monitoring: {
        cadvisor: { id: string; name: string };
        mysqldExporter: { id: string; name: string };
        nodeExporter: { id: string; name: string };
        prometheus: { id: string; name: string };
        grafana: { id: string; name: string };
    };
}> {
    const client = getClient();
    if (!client) {
        throw new Error('Docker client not initialized');
    }

    const { force = false } = options;

    console.log('Starting WordPress infrastructure setup...');
    progressCallback?.('setup', 'starting', 'Starting WordPress infrastructure setup...');

    try {
        let network: { id: string; name?: string };
        let traefikContainer: { id: string; name?: string };
        let mysqlContainer: { id: string; name?: string };
        let cadvisorContainer: { id: string; name?: string };
        let mysqldExporterContainer: { id: string; name?: string };
    let nodeExporterContainer: { id: string; name?: string };
        let prometheusContainer: { id: string; name?: string };
        let grafanaContainer: { id: string; name?: string };

        // 1. Check and handle network 'CF-WP'
        progressCallback?.('network', 'starting', 'Checking network CF-WP...');
        console.log('Checking network CF-WP...');

        const existingNetworks = await listNetworks({ filters: { name: ['CF-WP'] } });
        const existingNetwork = existingNetworks.find(n => n.Name === 'CF-WP');

        if (existingNetwork) {
            console.log('Network CF-WP already exists, validating configuration...');
            const networkInfo = await inspectNetwork('CF-WP');

            if (!validate.networkConfig(networkInfo)) {
                if (force) {
                    console.log('Invalid network configuration, removing and recreating...');
                    progressCallback?.('network', 'starting', 'Removing invalid network configuration...');
                    await removeNetwork('CF-WP', true);
                    network = await createNetwork({
                        Name: 'CF-WP',
                        Driver: 'bridge',
                    });
                } else {
                    const error = new Error('Network CF-WP exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('network', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('Network CF-WP configuration is valid');
                network = { id: existingNetwork.Id, name: 'CF-WP' };
            }
        } else {
            console.log('Creating network CF-WP...');
            network = await createNetwork({
                Name: 'CF-WP',
                Driver: 'bridge',
            });
        }
        progressCallback?.('network', 'success', 'Network CF-WP ready');

        // 2. Check and handle Traefik container
        progressCallback?.('traefik', 'starting', 'Checking Traefik container...');
        console.log('Checking Traefik container...');

        const existingTraefik = await getContainerByName('traefik');

        if (existingTraefik) {
            console.log('Traefik container already exists, validating configuration...');
            const container = client.getContainer(existingTraefik.id);
            const containerInfo = await container.inspect();

            if (!validate.containerConfig(containerInfo, traefik)) {
                if (force) {
                    console.log('Invalid Traefik configuration, removing and recreating...');
                    progressCallback?.('traefik', 'starting', 'Removing invalid Traefik configuration...');
                    await removeContainer(existingTraefik.id, { force: true, volume: true });
                    traefikContainer = await createContainer(traefik);
                    await connectToNetwork('CF-WP', { Container: traefikContainer.id });
                    await startContainer(traefikContainer.id);
                } else {
                    const error = new Error('Traefik container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('traefik', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('Traefik container configuration is valid');
                traefikContainer = existingTraefik;
                // Ensure it's connected to the network
                try {
                    await connectToNetwork('CF-WP', { Container: traefikContainer.id });
                } catch (error) {
                    // Container might already be connected, ignore the error
                    console.log('Container might already be connected to network');
                }
                // Ensure it's started
                if (containerInfo.State.Status !== 'running') {
                    await startContainer(traefikContainer.id);
                }
            }
        } else {
            console.log('Creating Traefik container...');
            traefikContainer = await createContainer(traefik);
            await connectToNetwork('CF-WP', { Container: traefikContainer.id });
            await startContainer(traefikContainer.id);
        }
        progressCallback?.('traefik', 'success', 'Traefik container ready');

        // 3. Check and handle MySQL container
        progressCallback?.('mysql', 'starting', 'Checking MySQL container...');
        console.log('Checking MySQL container...');

        const existingMySQL = await getContainerByName('mysql');

        if (existingMySQL) {
            console.log('MySQL container already exists, validating configuration...');
            const container = client.getContainer(existingMySQL.id);
            const containerInfo = await container.inspect();

            if (!validate.containerConfig(containerInfo, mysqlConfig)) {
                if (force) {
                    console.log('Invalid MySQL configuration, removing and recreating...');
                    progressCallback?.('mysql', 'starting', 'Removing invalid MySQL configuration...');
                    await removeContainer(existingMySQL.id, { force: true, volume: true });
                    mysqlContainer = await createContainer(mysqlConfig);
                    await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
                    await startContainer(mysqlContainer.id);
                } else {
                    const error = new Error('MySQL container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('mysql', 'error', error.message);
                    throw error;
                }
            } else {
                console.log('MySQL container configuration is valid');
                mysqlContainer = existingMySQL;
                // Ensure it's connected to the network
                try {
                    await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
                } catch (error) {
                    // Container might already be connected, ignore the error
                    console.log('Container might already be connected to network');
                }
                // Ensure it's started
                if (containerInfo.State.Status !== 'running') {
                    await startContainer(mysqlContainer.id);
                }
            }
        } else {
            console.log('Creating MySQL container...');
            mysqlContainer = await createContainer(mysqlConfig);
            await connectToNetwork('CF-WP', { Container: mysqlContainer.id });
            await startContainer(mysqlContainer.id);
        }
        progressCallback?.('mysql', 'success', 'MySQL container ready');

        progressCallback?.('mysql-ready', 'starting', 'Waiting for MySQL to be ready...');
        console.log('Waiting for MySQL to be ready...');
        await utils.waitMysql();
        progressCallback?.('mysql-ready', 'success', 'MySQL is ready');

        // 4. Monitoring stack (always enabled)
        // cAdvisor
        progressCallback?.('cadvisor', 'starting', 'Checking cAdvisor container...');
        console.log('Checking cAdvisor container...');
        const existingCadvisor = await getContainerByName('cadvisor');
        if (existingCadvisor) {
            console.log('cAdvisor container already exists, validating configuration...');
            const container = client.getContainer(existingCadvisor.id);
            const containerInfo = await container.inspect();
            if (!validate.containerConfig(containerInfo, cadvisorConfig)) {
                if (force) {
                    console.log('Invalid cAdvisor configuration, removing and recreating...');
                    progressCallback?.('cadvisor', 'starting', 'Recreating invalid cAdvisor container...');
                    await removeContainer(existingCadvisor.id, { force: true, volume: true });
                    cadvisorContainer = await createContainer(cadvisorConfig);
                    await connectToNetwork('CF-WP', { Container: cadvisorContainer.id });
                    await startContainer(cadvisorContainer.id);
                } else {
                    const error = new Error('cAdvisor container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('cadvisor', 'error', error.message);
                    throw error;
                }
            } else {
                cadvisorContainer = existingCadvisor;
                try { await connectToNetwork('CF-WP', { Container: cadvisorContainer.id }); } catch {}
                const containerInfoState = await client.getContainer(cadvisorContainer.id).inspect();
                if (containerInfoState.State.Status !== 'running') await startContainer(cadvisorContainer.id);
            }
        } else {
            console.log('Creating cAdvisor container...');
            cadvisorContainer = await createContainer(cadvisorConfig);
            await connectToNetwork('CF-WP', { Container: cadvisorContainer.id });
            await startContainer(cadvisorContainer.id);
        }
        progressCallback?.('cadvisor', 'success', 'cAdvisor container ready');

        // MySQL Exporter
        progressCallback?.('mysqld-exporter', 'starting', 'Checking MySQL exporter container...');
        console.log('Checking MySQL exporter container...');
        const existingMysqlExporter = await getContainerByName('mysqld-exporter');
        if (existingMysqlExporter) {
            const container = client.getContainer(existingMysqlExporter.id);
            const containerInfo = await container.inspect();
            if (!validate.containerConfig(containerInfo, mysqldExporterConfig)) {
                if (force) {
                    console.log('Invalid mysqld-exporter configuration, removing and recreating...');
                    progressCallback?.('mysqld-exporter', 'starting', 'Recreating invalid mysqld-exporter container...');
                    await removeContainer(existingMysqlExporter.id, { force: true, volume: true });
                    mysqldExporterContainer = await createContainer(mysqldExporterConfig);
                    await connectToNetwork('CF-WP', { Container: mysqldExporterContainer.id });
                    await startContainer(mysqldExporterContainer.id);
                } else {
                    const error = new Error('mysqld-exporter container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('mysqld-exporter', 'error', error.message);
                    throw error;
                }
            } else {
                mysqldExporterContainer = existingMysqlExporter;
                try { await connectToNetwork('CF-WP', { Container: mysqldExporterContainer.id }); } catch {}
                const containerInfoState = await client.getContainer(mysqldExporterContainer.id).inspect();
                if (containerInfoState.State.Status !== 'running') await startContainer(mysqldExporterContainer.id);
            }
        } else {
            console.log('Creating mysqld-exporter container...');
            mysqldExporterContainer = await createContainer(mysqldExporterConfig);
            await connectToNetwork('CF-WP', { Container: mysqldExporterContainer.id });
            await startContainer(mysqldExporterContainer.id);
        }
        progressCallback?.('mysqld-exporter', 'success', 'MySQL exporter container ready');

        // Node Exporter (host metrics)
        progressCallback?.('node-exporter', 'starting', 'Checking node-exporter container...');
        console.log('Checking node-exporter container...');
        const existingNodeExporter = await getContainerByName('node-exporter');
        if (existingNodeExporter) {
            const container = client.getContainer(existingNodeExporter.id);
            const containerInfo = await container.inspect();
            if (!validate.containerConfig(containerInfo, nodeExporterConfig)) {
                if (force) {
                    console.log('Invalid node-exporter configuration, removing and recreating...');
                    progressCallback?.('node-exporter', 'starting', 'Recreating invalid node-exporter container...');
                    await removeContainer(existingNodeExporter.id, { force: true, volume: true });
                    nodeExporterContainer = await createContainer(nodeExporterConfig);
                    // node-exporter runs in host/bridge network, still connect for consistency if needed
                    try { await connectToNetwork('CF-WP', { Container: nodeExporterContainer.id }); } catch {}
                    await startContainer(nodeExporterContainer.id);
                } else {
                    const error = new Error('node-exporter container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('node-exporter', 'error', error.message);
                    throw error;
                }
            } else {
                nodeExporterContainer = existingNodeExporter;
                try { await connectToNetwork('CF-WP', { Container: nodeExporterContainer.id }); } catch {}
                const containerInfoState = await client.getContainer(nodeExporterContainer.id).inspect();
                if (containerInfoState.State.Status !== 'running') await startContainer(nodeExporterContainer.id);
            }
        } else {
            console.log('Creating node-exporter container...');
            nodeExporterContainer = await createContainer(nodeExporterConfig);
            try { await connectToNetwork('CF-WP', { Container: nodeExporterContainer.id }); } catch {}
            await startContainer(nodeExporterContainer.id);
        }
        progressCallback?.('node-exporter', 'success', 'node-exporter container ready');

        // Prometheus
        progressCallback?.('prometheus', 'starting', 'Checking Prometheus container...');
        console.log('Checking Prometheus container...');
        const existingPrometheus = await getContainerByName('prometheus');
        if (existingPrometheus) {
            const container = client.getContainer(existingPrometheus.id);
            const containerInfo = await container.inspect();
            if (!validate.containerConfig(containerInfo, prometheusConfig)) {
                if (force) {
                    console.log('Invalid Prometheus configuration, removing and recreating...');
                    progressCallback?.('prometheus', 'starting', 'Recreating invalid Prometheus container...');
                    await removeContainer(existingPrometheus.id, { force: true, volume: true });
                    prometheusContainer = await createContainer(prometheusConfig);
                    await connectToNetwork('CF-WP', { Container: prometheusContainer.id });
                    await startContainer(prometheusContainer.id);
                } else {
                    const error = new Error('Prometheus container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('prometheus', 'error', error.message);
                    throw error;
                }
            } else {
                prometheusContainer = existingPrometheus;
                try { await connectToNetwork('CF-WP', { Container: prometheusContainer.id }); } catch {}
                const containerInfoState = await client.getContainer(prometheusContainer.id).inspect();
                if (containerInfoState.State.Status !== 'running') await startContainer(prometheusContainer.id);
            }
        } else {
            console.log('Creating Prometheus container...');
            prometheusContainer = await createContainer(prometheusConfig);
            await connectToNetwork('CF-WP', { Container: prometheusContainer.id });
            await startContainer(prometheusContainer.id);
        }
        progressCallback?.('prometheus', 'success', 'Prometheus container ready');

        // Grafana
        progressCallback?.('grafana', 'starting', 'Checking Grafana container...');
        console.log('Checking Grafana container...');
        const existingGrafana = await getContainerByName('grafana');
        if (existingGrafana) {
            const container = client.getContainer(existingGrafana.id);
            const containerInfo = await container.inspect();
            if (!validate.containerConfig(containerInfo, grafanaConfig)) {
                if (force) {
                    console.log('Invalid Grafana configuration, removing and recreating...');
                    progressCallback?.('grafana', 'starting', 'Recreating invalid Grafana container...');
                    await removeContainer(existingGrafana.id, { force: true, volume: true });
                    grafanaContainer = await createContainer(grafanaConfig);
                    await connectToNetwork('CF-WP', { Container: grafanaContainer.id });
                    await startContainer(grafanaContainer.id);
                } else {
                    const error = new Error('Grafana container exists but has invalid configuration. Use force=true to recreate.');
                    progressCallback?.('grafana', 'error', error.message);
                    throw error;
                }
            } else {
                grafanaContainer = existingGrafana;
                try { await connectToNetwork('CF-WP', { Container: grafanaContainer.id }); } catch {}
                const containerInfoState = await client.getContainer(grafanaContainer.id).inspect();
                if (containerInfoState.State.Status !== 'running') await startContainer(grafanaContainer.id);
            }
        } else {
            console.log('Creating Grafana container...');
            grafanaContainer = await createContainer(grafanaConfig);
            await connectToNetwork('CF-WP', { Container: grafanaContainer.id });
            await startContainer(grafanaContainer.id);
        }
        progressCallback?.('grafana', 'success', 'Grafana container ready');

        // Provision Grafana (datasource + future dashboards) asynchronously
        await (async () => {
            try {
                progressCallback?.('grafana-provision', 'starting', 'Provisioning Grafana datasource...');
                // Since we removed the host port binding for Grafana and now rely on Traefik,
                // use the public (or internal) HTTPS domain. If the domain is not resolvable
                // from the host environment (e.g. no DNS pointing back yet), provisioning may fail.
                // Fallback strategy: attempt domain first, then localhost via direct container IP if needed.
                const candidateBases = [
                    'https://monitoring.internal.agence-lumia.com',
                    'http://grafana:3000', // internal network DNS
                ];

                let lastError: Error | null = null;
                let result: any = null;
                for (const base of candidateBases) {
                    try {
                        console.log(`[Grafana Provision] Trying baseUrl: ${base}`);
                        result = await provisionGrafana({
                            baseUrl: base,
                            prometheusUrl: 'http://prometheus:9090',
                            dashboards: [
                                {
                                    title: 'Container Flow Overview',
                                    uid: 'cf-overview',
                                    json: containerOverviewDashboard,
                                }
                            ],
                            retry: { attempts: 40, intervalMs: 2000 },
                            logger: (m) => console.log(m),
                        });
                        lastError = null;
                        break;
                    } catch (e) {
                        lastError = e as Error;
                        console.warn(`[Grafana Provision] Failed with base ${base}: ${lastError.message}`);
                    }
                }
                if (lastError) throw lastError;
                progressCallback?.('grafana-provision', 'success', `Grafana provisioned (created: ${result.created}, updated: ${result.updated}, dashboards: ${result.dashboardsImported})`);
            } catch (e) {
                console.error('Grafana provisioning failed', e);
                progressCallback?.('grafana-provision', 'error', e instanceof Error ? e.message : 'Unknown error');
            }
        })();

        console.log('WordPress infrastructure setup completed successfully!');
        progressCallback?.('setup', 'success', 'WordPress infrastructure + monitoring stack completed successfully!');

        return {
            network: { id: network.id, name: 'CF-WP' },
            traefik: { id: traefikContainer.id, name: traefik.name || 'traefik' },
            mysql: { id: mysqlContainer.id, name: mysqlConfig.name || 'mysql' },
            monitoring: {
                cadvisor: { id: cadvisorContainer.id, name: cadvisorConfig.name || 'cadvisor' },
                mysqldExporter: { id: mysqldExporterContainer.id, name: mysqldExporterConfig.name || 'mysqld-exporter' },
                nodeExporter: { id: nodeExporterContainer.id, name: nodeExporterConfig.name || 'node-exporter' },
                prometheus: { id: prometheusContainer.id, name: prometheusConfig.name || 'prometheus' },
                grafana: { id: grafanaContainer.id, name: grafanaConfig.name || 'grafana' },
            },
        };
    } catch (error) {
        console.error('Error during WordPress infrastructure setup:', error);
        progressCallback?.('setup', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
}
