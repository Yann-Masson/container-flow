import { Toaster } from './components/ui/sonner';
import { ScrollArea } from './components/ui/scroll-area';
import { AppStateProvider } from './providers/AppStateProvider';
import { AppScreens } from './screens';

export default function App() {
    return (
        <AppStateProvider>
            <div className='relative h-screen w-screen'>
                <div
                    className='fixed top-0 left-0 right-0 h-[40px] z-[9999]'
                    style={
                        {
                            appRegion: 'drag',
                            background:
                                'linear-gradient(to bottom, rgba(13, 18, 32, 0.95) 0%, rgba(13, 18, 32, 0.7) 50%, transparent 100%)',
                        } as React.CSSProperties
                    }
                />

                <div className='h-screen w-screen select-none flex flex-col items-center justify-center min-[250px]:hidden overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 pt-12 font-[family-name:var(--font-geist-sans)]'>
                    <h1 className='text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100 text-center'>
                        Container Flow
                    </h1>
                    <p className='text-center text-gray-500 px-4'>
                        Container Flow is designed for screens wider than 250px. Please resize your
                        window.
                    </p>
                </div>

                <ScrollArea className='h-screen w-screen select-none overflow-hidden hidden min-[250px]:flex'>
                    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 pt-12 font-[family-name:var(--font-geist-sans)]'>
                        <div className='flex-grow w-full h-full flex flex-col justify-center items-center'>
                            <AppScreens />
                        </div>
                        <footer className='mt-8 mb-4 text-center text-sm text-gray-500'>
                            <p>© 2025 Container Flow - Docker Management Platform</p>
                        </footer>
                    </div>
                </ScrollArea>
            </div>
            <Toaster />
        </AppStateProvider>
    );
}
