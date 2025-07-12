import { defineConfig } from 'vite';
import path from 'node:path';
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
                        native({})
                    ],
                    build: {
                        lib: {
                            entry: 'electron/main.ts',
                            formats: ['es'],
                            fileName: () => 'main.js'
                        },
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
                        native({})
                    ],
                    build: {
                        lib: {
                            entry: 'electron/preload.ts',
                            formats: ['es'],
                            fileName: () => 'preload.mjs'
                        },
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
            // Ployfill the Electron and Node.js API for Renderer process.
            // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
            // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
            renderer: process.env.NODE_ENV === 'test'
                    // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
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
    }
});
