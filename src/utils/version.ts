export const getAppVersion = (): string => {
    return import.meta.env.PACKAGE_VERSION || 'x.x.x';
};
