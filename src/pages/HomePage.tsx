import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import SettingsDialog from "@/components/SettingsDialog.tsx";
import { AppPreference } from "../../electron/services/storage/app/app.type";
import List from "@/features/list/List";
import WordPress from "@/features/wordpress/WordPress";

interface HomePageProps {
    appMode: AppPreference;
    onModeChange: (mode: AppPreference) => void;
    onDisconnect: () => void;
}

export default function HomePage({ appMode, onModeChange, onDisconnect }: HomePageProps) {

    const getModeComponent = (mode: AppPreference) => {
        switch (mode) {
            case AppPreference.WORDPRESS:
                return <WordPress />;
            case AppPreference.LIST:
                return <List />;
            default:
                return <div className="text-center text-gray-500 mt-20">Select a mode to get started</div>;
        }
    }

    return (
        <div className="container mx-auto max-w-6xl">
            <header className="flex flex-col md:flex-row justify-between items-center py-6">
                <div className="flex items-center mb-4 md:mb-0">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 p-1 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                             viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                             strokeLinejoin="round" className="text-white">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <line x1="9" x2="15" y1="15" y2="15"/>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                        Container Flow
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline"
                           className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1">
                        Connected to Docker server
                    </Badge>
                    <SettingsDialog
                        currentMode={appMode}
                        onModeChange={onModeChange}
                        onDisconnect={onDisconnect}
                    />
                </div>
            </header>

            <Separator className="my-4"/>

            {
                getModeComponent(appMode)
            }


            <footer className="mt-12 mb-4 text-center text-sm text-gray-500">
                <p>© 2025 Container Flow - Docker Management Platform</p>
            </footer>
        </div>
    );
}