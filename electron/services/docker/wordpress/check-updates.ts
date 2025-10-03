import image from '../image';
import containers from '../containers';

const WORDPRESS_LABEL_KEY = 'container-flow.type';
const WORDPRESS_LABEL_VALUE = 'wordpress';

export const checkWordPressUpdates = async (): Promise<String[]> => {
    const latestImage = await image.get('wordpress', 'latest');

    const tagData = await latestImage.inspect();

    const allContainers = await containers.list();
    const wordpressContainers = allContainers.filter((container) => {
        const labels = container.Labels ?? {};
        return labels[WORDPRESS_LABEL_KEY] === WORDPRESS_LABEL_VALUE;
    });

    const outdatedContainerIds: String[] = [];

    for (const container of wordpressContainers) {
        const inspectInfo = await containers.getById(container.Id);

        if (inspectInfo.Image !== tagData.Id) {
            outdatedContainerIds.push(container.Id);
        }
    }

    return outdatedContainerIds;
};
