import { Skeleton } from "@/components/ui/skeleton.tsx";
import ContainerFlowSvg from '../../assets/icons/container-flow.svg';

export default function PendingScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-gray-200 dark:border-gray-800 text-center">
                <div className="flex flex-row gap-4 items-center justify-center">
                    <img src={ContainerFlowSvg} alt="Container Flow" className="w-20 h-20"/>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                        Container Flow
                    </h1>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full animate-pulse"/>
                    <div className="text-lg animate-pulse">Checking connection...</div>
                </div>
            </div>
        </div>
    );
}