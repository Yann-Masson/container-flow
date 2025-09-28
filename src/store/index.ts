import { configureStore } from '@reduxjs/toolkit';
import containerReducer from './slices/wordpressSlice';
import genericContainerReducer from './slices/containerSlice';
import wordpressSetupReducer from './slices/wordpressSetupSlice';

export const store = configureStore({
    reducer: {
    containers: containerReducer,
    genericContainers: genericContainerReducer,
        wordpressSetup: wordpressSetupReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['containers/fetchContainers/fulfilled'],
                // Ignore these field paths in all actions
                ignoredActionsPaths: ['payload.containers'],
                // Ignore these paths in the state
                ignoredPaths: ['containers.containers', 'containers.services.containers'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
