import { Variants } from 'framer-motion';

export const contentVariants: Variants = {
  collapsed: { height: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeInOut' } },
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
      opacity: { duration: 0.25, delay: 0.05 },
      when: 'beforeChildren',
      staggerChildren: 0.05
    }
  }
};

export const listVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

export const itemVariants: Variants = {
  hidden: { y: 8, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  }
};
