import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface InfoChipProps {
    label: string;
    value: string | number;
    tone?: 'neutral' | 'success' | 'warning' | 'info';
    pulse?: boolean;
}

const toneStyles: Record<NonNullable<InfoChipProps['tone']>, string> = {
    neutral: 'bg-white/10 text-white/80 border-white/20',
    success: 'bg-emerald-400/15 text-emerald-300 border-emerald-300/30',
    warning: 'bg-amber-400/15 text-amber-300 border-amber-300/30',
    info: 'bg-sky-400/15 text-sky-300 border-sky-300/30',
};

export default function InfoChip({ label, value, tone = 'neutral', pulse }: InfoChipProps) {
    const previous = useRef<string | number>(value);
    useEffect(() => { previous.current = value; }, [value]);

    const displayValue = value;

    return (
        <motion.span
            layout
            initial={{ opacity: 0, y: -6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${toneStyles[tone]} ${pulse ? 'animate-pulse' : ''}`}
        >
            <span className="opacity-70" data-chip-label>{label}</span>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={displayValue}
                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
                    transition={{ duration: 0.25 }}
                    className="font-semibold tracking-wide tabular-nums"
                    data-previous={previous.current}
                    data-chip-value
                >
                    {displayValue}
                </motion.span>
            </AnimatePresence>
        </motion.span>
    );
}
