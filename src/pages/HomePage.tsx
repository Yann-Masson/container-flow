import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import SettingsDialog from "@/components/SettingsDialog.tsx";
import { AppPreference } from "../../electron/services/storage/app/app.type";
import List from "@/features/list/List";
import WordPress from "@/features/wordpress/WordPress";
import ContainerFlowSvg from '../../assets/icons/container-flow.svg';

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
        <div className="container mx-auto max-w-6xl px-4 flex flex-col flex-grow h-full">
            <header className="flex flex-col sm:flex-row justify-between items-center py-6">
                <div className="flex items-center mb-4 sm:mb-0 space-x-3">
                    <img src={ContainerFlowSvg} alt="Container Flow" className="w-12 h-12"/>
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
        </div>
    );
}