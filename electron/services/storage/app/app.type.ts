export enum AppPreference {
    NONE = "NONE",
    BASIC = "BASIC",
    WORDPRESS = "WORDPRESS",
}

export interface AppSavedConfig {
    preference: AppPreference;
}
