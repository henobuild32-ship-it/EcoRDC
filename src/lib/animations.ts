import type { Variants, Transition } from 'framer-motion';

/** Shared cubic-bezier easing curve */
export const smoothEase: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: smoothEase } },
};

export const itemVariantsSlow: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: smoothEase } },
};

export const slideVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: smoothEase } },
};

export const showVariants: Variants = {
  hide: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: smoothEase } },
};
