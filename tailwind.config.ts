import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Onest', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            backgroundColor: {
                'default': '#000000',
            },
            colors: {
                background: '#000000',
            }
        },
    },
    plugins: [],
};

export default config;
