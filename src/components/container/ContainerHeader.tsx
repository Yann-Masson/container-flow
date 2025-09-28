import { State } from "@/utils/state/basic-state";
import { Button } from "@/components/ui/button.tsx";
import { RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';
import InfoChip from "../ui/info-chip";

interface ContainerHeaderProps {
    state: State;
    refreshFunction?: () => Promise<void>;
    running?: number;
    stopped?: number;
}

export function ContainerHeader({ state, refreshFunction, running, stopped }: ContainerHeaderProps) {
    // Track previous state to determine slide direction
    const prevStateRef = useRef<State>(state);
    useEffect(() => { prevStateRef.current = state; }, [state]);
    const prev = prevStateRef.current;
    // direction: 1 means loading -> success (new slides from right, old to left)
    // direction: -1 means success -> loading (new slides from left, old to right)
    const direction = prev === State.LOADING && state === State.SUCCESS
        ? 1
        : (prev === State.SUCCESS && state === State.LOADING ? -1 : 0);
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.020 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="mb-6 relative overflow-hidden rounded-xl group"
        >
            {/* Background layers (distinct glass style: subtle diagonal shimmer & grid) */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/15 via-white/5 to-white/10 dark:from-white/10 dark:via-white/[0.04] dark:to-white/5 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.4)]" />
            <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay [mask-image:radial-gradient(circle_at_30%_20%,white,transparent_70%)] bg-[linear-gradient(120deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0)_35%,rgba(255,255,255,0)_65%,rgba(255,255,255,0.15)_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_70%_30%,#60a5fa,transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_14px,rgba(255,255,255,0.18)_15px,rgba(255,255,255,0.18)_16px)]" />

            <motion.div
                whileHover={{ scale: 1.010 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-5 will-change-transform"
            >
                <div className="flex flex-col gap-4 w-full">
                    {/* Quick Info Chips */}
                    <div className="relative min-h-[30px] flex items-center">
                        <AnimatePresence custom={direction} mode="popLayout" initial={false}>
                            <motion.div
                                key={state === State.LOADING ? 'loading' : `stats-${running}-${stopped}`}
                                custom={direction}
                                variants={{
                                    enter: (dir: number) => ({
                                        x: dir === 1 ? 40 : dir === -1 ? -40 : 0,
                                        opacity: 0,
                                        position: 'absolute',
                                        top: 0,
                                        left: 0
                                    }),
                                    center: {
                                        x: 0,
                                        opacity: 1,
                                        position: 'static'
                                    },
                                    exit: (dir: number) => ({
                                        x: dir === 1 ? -40 : dir === -1 ? 40 : 0,
                                        opacity: 0,
                                        position: 'absolute',
                                        top: 0,
                                        left: 0
                                    })
                                }}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.7 }}
                                className="inline-flex items-center gap-2"
                                layout
                            >
                                {state === State.LOADING && (
                                    <InfoChip label="Loading…" value="" tone="info" pulse />
                                )}
                                {state === State.SUCCESS && (
                                    <>
                                        {typeof running === 'number' && (
                                            <motion.div
                                                key={`running-${running}`}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.04, duration: 0.25 }}
                                            >
                                                <InfoChip label="Running" value={running} tone="success" />
                                            </motion.div>
                                        )}
                                        {typeof stopped === 'number' && (
                                            <motion.div
                                                key={`stopped-${stopped}`}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1, duration: 0.25 }}
                                            >
                                                <InfoChip label="Stopped" value={stopped} tone="warning" />
                                            </motion.div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto md:ml-auto">
                    <Button
                        variant="outline"
                        onClick={refreshFunction}
                        disabled={state === State.LOADING}
                        className="relative group border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/20 text-foreground/90 backdrop-blur-md transition"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${state === State.LOADING ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                        />
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
