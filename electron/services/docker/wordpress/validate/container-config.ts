import { ContainerCreateOptions, ContainerInspectInfo } from "dockerode";

export default function containerConfig(containerInfo: ContainerInspectInfo, expectedConfig: ContainerCreateOptions) {
    // Basic validation - check image and key environment variables
    // Docker stores images as SHA256 hashes after pulling, so we need to check the RepoTags
    const expectedImage = expectedConfig.Image;
    const actualImage = containerInfo.Image;
    const repoTags = containerInfo.Config?.Image || '';

    // Check if the image matches either by name or if the RepoTags contain the expected image
    const imageMatches = actualImage === expectedImage ||
        repoTags === expectedImage ||
        (actualImage.startsWith('sha256:') && repoTags === expectedImage);

    if (!imageMatches) {
        console.warn(`Container image mismatch: expected ${expectedImage}, got ${actualImage} (RepoTags: ${repoTags})`);
        return false;
    }

    // For MySQL, check if root password env is set
    if (expectedConfig.name === 'mysql') {
        return containerInfo.Config?.Env?.some((env: string) =>
            env.startsWith('MYSQL_ROOT_PASSWORD=')
        ) ?? false;
    }

    // For Traefik, check if it has the required labels
    if (expectedConfig.name === 'traefik') {
        const labels = containerInfo.Config?.Labels || {};
        return labels['traefik.enable'] === 'true';
    }

    return true;
}
