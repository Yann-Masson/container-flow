export enum AppPreference {
    NONE = "NONE",
    LIST = "LIST",
    WORDPRESS = "WORDPRESS",
}

export interface AppSavedConfig {
    preference: AppPreference;
}
