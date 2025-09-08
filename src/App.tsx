import { useEffect, useState } from 'react';
import { State } from "./types/state.ts";
import { Toaster } from "./components/ui/sonner";
import { dockerClientService } from "@/docker/docker-client.ts";
import { AppPreference } from "../electron/services/storage/app/app.type.ts";
import FormPage from "@/pages/FormPage.tsx";
import PendingPage from "@/pages/PendingPage.tsx";
import HomePage from "@/pages/HomePage.tsx";
import FirstSetupPage from "@/pages/FirstSetupPage.tsx";

export default function App() {
    const [isConnected, setIsConnected] = useState(State.LOADING);
    const [appMode, setAppMode] = useState(AppPreference.NONE);

    // Check connection status
    const checkConnection = async () => {
        try {
            setIsConnected(State.LOADING);
            const connected = await dockerClientService.connection.isConnected();

            console.log('Connection check response:', connected);

            if (connected) {
                setIsConnected(State.SUCCESS);
            } else {
                setIsConnected(State.IDLE);
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    };

    const retrieveAppMode = async () => {
        try {
            const mode = await window.electronAPI.storage.app.get();

            if (mode) {
                setAppMode(mode.preference);
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    };

    const handleModeChange = (newMode: AppPreference) => {
        setAppMode(newMode);
    };

    const handleDisconnect = () => {
        setIsConnected(State.IDLE);
    };

    // Check connection when component loads
    useEffect(() => {
        retrieveAppMode().then();
        checkConnection().then();
    }, []);

    return (
        <>
            <div
                className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 font-[family-name:var(--font-geist-sans)]'>
                {isConnected === State.IDLE ? (
                    <FormPage setIsConnected={setIsConnected}/>
                ) : isConnected === State.SUCCESS ? (
                    appMode === AppPreference.NONE ? (
                        <FirstSetupPage setAppMode={setAppMode}/>
                    ) : (
                        <HomePage
                            appMode={appMode}
                            onModeChange={handleModeChange}
                            onDisconnect={handleDisconnect}
                        />
                    )
                ) : (
                    <PendingPage/>
                )}
            </div>
            <Toaster/>
        </>
    );
}
