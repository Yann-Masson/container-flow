import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import SplitText from "./components/ui/SplitText.tsx";
import MetaBalls from "./components/ui/MetaBalls.tsx";
import BlurText from "./components/ui/BlurText.tsx";
import { getAppVersion } from "./utils/version.ts";

ReactDOM.createRoot(document.getElementById('root')!).render(
        <React.StrictMode>
            {/*<App/>*/}
            <div className="flex flex-col items-center justify-center min-h-screen">
                <SplitText
                        text="Container Flow"
                        className="text-3xl font-semibold text-center mb-8"
                        delay={10}
                        duration={2}
                        ease="elastic.out(1, 0.3)"
                        splitType="chars"
                        from={{ opacity: 0, y: 10 }}
                        to={{ opacity: 1, y: 0 }}
                        threshold={0.1}
                        textAlign="center"
                />

                <MetaBalls
                        color="#ffffff"
                        cursorBallColor="#ffffff"
                        cursorBallSize={2}
                        ballCount={15}
                        animationSize={30}
                        enableMouseInteraction={true}
                        enableTransparency={true}
                        hoverSmoothness={0.05}
                        clumpFactor={1}
                        speed={0.3}
                />

                <BlurText
                        text="⚠️ This app still in development ⚠️"
                        delay={150}
                        animateBy="words"
                        direction="top"
                        className="mx-16"
                />

                <p className='text-sm text-gray-400 bg-gray-800 rounded'>v{getAppVersion()}</p>
            </div>
        </React.StrictMode>,
);

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message);
});
