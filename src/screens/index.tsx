import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppState } from '../providers/AppStateProvider';
import { AppLifecycleState } from '../utils/state/app-state';
import { AppPreference } from '../../electron/services/storage/app/app.type';

import FormPage from '@/screens/LoginFormScreen';
import PendingPage from '@/screens/PendingScreen';
import HomePage from '@/screens/HomeScreen';
import FirstSetupScreen from '@/screens/FirstSetupScreen';

const variants = {
  initial: { opacity: 0, scale: 0.99 },
  enter: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.16,0.84,0.44,1] as any } },
  exit: { opacity: 0, scale: 1, transition: { duration: 0.18, ease: [0.4,0,1,1] as any } }
} as const;

export const AppScreens: React.FC = () => {
  const { lifecycle, connect, setMode, preference, disconnect } = useAppState();

  function render() {
    switch (lifecycle) {
      case AppLifecycleState.INIT:
        return <PendingPage />;
      case AppLifecycleState.DISCONNECTED:
        return <FormPage setIsConnected={() => connect()} />;
      case AppLifecycleState.CONNECTING:
        return <PendingPage />; // previous screen remains underneath due to controller caching
      case AppLifecycleState.UNCONFIGURED:
        return <FirstSetupScreen setAppMode={(m) => setMode(m)} />;
      case AppLifecycleState.READY:
        return <HomePage
          appMode={preference ?? AppPreference.NONE}
          onModeChange={(m) => setMode(m)}
          onDisconnect={() => disconnect()}
        />;
      case AppLifecycleState.ERROR:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500">An error occurred.</p>
            <button className="mt-4 px-4 py-2 rounded bg-gray-700 text-white" onClick={() => connect()}>Retry</button>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={lifecycle} variants={variants} initial="initial" animate="enter" exit="exit" className="flex-grow w-full h-full flex flex-col justify-center items-center overflow-hidden">
        {render()}
      </motion.div>
    </AnimatePresence>
  );
};
