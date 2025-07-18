import { defineConfig } from 'vite';
import path from 'path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';
import { fileURLToPath } from "node:url";
import native from 'vite-plugin-native';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
    },
    plugins: [
        react(),
        tailwindcss(),
        native({}),
        electron({
            main: {
                // Shortcut of `build.lib.entry`.
                entry: 'electron/main.ts',
                vite: {
                    plugins: [
                        native({
                            forceCopyIfUnbuilt: true,
                            webpack: {}
                        })
                    ],
                    build: {
                        rollupOptions: {
                            external: [
                                'electron',
                                'cpu-features',
                                'bcrypt',
                                'kerberos',
                                'libsodium-wrappers'
                            ]
                        },
                        minify: false
                    },
                    define: {
                        '__dirname': 'import.meta.dirname',
                        '__filename': 'import.meta.filename'
                    }
                }
            },
            preload: {
                // Shortcut of `build.rollupOptions.input`.
                // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
                input: path.join(__dirname, 'electron/preload.ts'),
                vite: {
                    plugins: [
                        native({
                            forceCopyIfUnbuilt: true,
                            webpack: {}
                        })
                    ],
                    build: {
                        rollupOptions: {
                            external: [
                                'electron',
                                'cpu-features',
                                'bcrypt',
                                'kerberos',
                                'libsodium-wrappers'
                            ]
                        },
                        minify: false
                    }
                }
            },
            renderer: process.env.NODE_ENV === 'test'
                ? undefined
                : {},
        }),
    ],
    build: {
        rollupOptions: {
            external: [
                'cpu-features',
                'bcrypt',
                'kerberos',
                'libsodium-wrappers',
            ]
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    }
});
