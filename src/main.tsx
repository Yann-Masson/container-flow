import ReactDOM from 'react-dom/client';
import './index.css';
import App from "@/App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App/>
    </ThemeProvider>
);
