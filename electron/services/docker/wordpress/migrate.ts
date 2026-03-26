import setup from './setup';
import containers from '../containers';
import { updateWordPressContainer } from './update';
import type { ProgressCallback, SetupOptions } from './setup/steps/types';

const WORDPRESS_LABEL_KEY = 'container-flow.type';
const WORDPRESS_LABEL_VALUE = 'wordpress';

export interface WordPressMigrationOptions {
    forceInfra?: boolean;
    grafanaAuth?: SetupOptions['grafanaAuth'];
}

export interface WordPressMigrationResult {
    migratedCount: number;
    migratedContainerIds: string[];
}

export const migrateWordPressStack = async (
    options: WordPressMigrationOptions = {},
    progressCallback?: ProgressCallback,
): Promise<WordPressMigrationResult> => {
    const { forceInfra = true, grafanaAuth } = options;

    progressCallback?.(
        'migration',
        'starting',
        'Running infrastructure reconciliation before container migration...',
    );

    const setupOk = await setup({ force: forceInfra, grafanaAuth });
    if (!setupOk) {
        throw new Error('Infrastructure setup failed during migration');
    }

    const allContainers = await containers.list();
    const wordpressContainers = allContainers.filter((container) => {
        const labels = container.Labels ?? {};
        return labels[WORDPRESS_LABEL_KEY] === WORDPRESS_LABEL_VALUE;
    });

    const migratedContainerIds: string[] = [];

    for (const container of wordpressContainers) {
        const containerName = container.Names?.[0]?.replace(/^\/+/, '') ?? container.Id;
        progressCallback?.(
            'migration',
            'starting',
            `Migrating WordPress container ${containerName}...`,
        );

        const result = await updateWordPressContainer(container.Id);
        migratedContainerIds.push(result.container.Id);

        progressCallback?.(
            'migration',
            'success',
            `Migrated WordPress container ${containerName}`,
        );
    }

    progressCallback?.(
        'migration',
        'success',
        `Migration completed for ${migratedContainerIds.length} WordPress container(s).`,
    );

    return {
        migratedCount: migratedContainerIds.length,
        migratedContainerIds,
    };
};

export default migrateWordPressStack;
