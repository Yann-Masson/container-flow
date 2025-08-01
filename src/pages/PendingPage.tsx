import { Skeleton } from "@/components/ui/skeleton.tsx";

export default function PendingPage() {
    return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div
                        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 shadow-xl border border-gray-200 dark:border-gray-800 text-center">
                    <div
                            className="mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"
                             viewBox="0 0 24 24"
                             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                             strokeLinejoin="round" className="text-white animate-pulse">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <line x1="9" x2="15" y1="15" y2="15"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                        Container Flow
                    </h1>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full animate-pulse"/>
                        <div className="text-lg animate-pulse">Checking connection...</div>
                    </div>
                </div>
            </div>
    );
}