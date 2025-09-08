import ReactDOM from 'react-dom/client';
import './index.css';
import App from "@/App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { TooltipProvider } from './components/ui/tooltip';
import { Provider } from 'react-redux';
import { store } from './store';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
        <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
            <TooltipProvider>
                <App/>
            </TooltipProvider>
        </ThemeProvider>
    </Provider>
);
