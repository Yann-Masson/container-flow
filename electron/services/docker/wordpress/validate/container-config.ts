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

    // Labels in the expected config should match those in the container
    const expectedLabels = expectedConfig.Labels || {};
    const actualLabels = containerInfo.Config?.Labels || {};

    for (const [key, value] of Object.entries(expectedLabels)) {
        if (actualLabels[key] !== value) {
            console.warn(`Container label mismatch for ${key}: expected ${value}, got ${actualLabels[key]}`);
            return false;
        }
    }

    // Environment variables in the expected config should match those in the container
    const expectedEnv = expectedConfig.Env || [];
    const actualEnv = containerInfo.Config?.Env || [];

    for (let i = 0; i < expectedEnv.length; i++) {
        if (!actualEnv.includes(expectedEnv[i])) {
            console.warn(`Container environment variable mismatch: expected ${expectedEnv[i]} not found in actual env`);
            return false;
        }
    }

    // If cmd is specified in expected config, check it matches
    if (expectedConfig.Cmd) {
        const expectedCmd = Array.isArray(expectedConfig.Cmd) ? expectedConfig.Cmd : [expectedConfig.Cmd];
        const actualCmd = containerInfo.Config?.Cmd || [];

        if (expectedCmd.length !== actualCmd.length) {
            console.warn(`Container command length mismatch: expected ${expectedCmd.length}, got ${actualCmd.length}`);
            return false;
        }

        for (let i = 0; i < expectedCmd.length; i++) {
            if (expectedCmd[i] !== actualCmd[i]) {
                console.warn(`Container command mismatch at index ${i}: expected ${expectedCmd[i]}, got ${actualCmd[i]}`);
                return false;
            }
        }
    }

    return true;
}
