export enum AppPreference {
    NONE = "NONE",
    LIST = "LIST",
    WORDPRESS = "WORDPRESS",
}

export interface AppSavedConfig {
    preference: AppPreference;
    /** Optional persisted Grafana credentials (username/password) */
    grafanaCredentials?: { username: string; password: string };
}
