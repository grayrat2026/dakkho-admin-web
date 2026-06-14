// Framer Motion animation presets for Dakkho Instructor Site — Premium Edition

export const pageTransition = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)' },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
};

export const springEntrance = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

export const springPop = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 25,
};

export const staggerChildren = (index: number, base = 0.05) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: index * base, duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
});

export const staggerFromLeft = (index: number, base = 0.03) => ({
  initial: { opacity: 0, x: -20, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { delay: index * base, duration: 0.4 },
  },
});

export const hoverLift = {
  whileHover: { scale: 1.02, y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } },
  whileTap: { scale: 0.98 },
};

export const cardTilt = {
  whileHover: {
    rotateX: 2,
    rotateY: -2,
    scale: 1.01,
    transition: { duration: 0.3 },
  },
};

export const sidebarActiveIndicator = {
  layoutId: 'sidebar-active-indicator',
  transition: { type: 'spring', stiffness: 350, damping: 30 },
};

export const bottomNavIndicator = {
  layoutId: 'bottomnav-indicator',
  transition: { type: 'spring', stiffness: 400, damping: 30 },
};

export const collapseExpand = {
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
};

export const pulseDot = {
  animate: {
    scale: [1, 1.8, 1],
    opacity: [0.6, 0, 0.6],
  },
  transition: { duration: 2, repeat: Infinity },
};

export const floatAnimation = {
  animate: { y: [0, -8, 0] },
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
};

export const spotlightExpand = {
  initial: { clipPath: 'circle(0% at 50% 50%)' },
  animate: { clipPath: 'circle(100% at 50% 50%)' },
  transition: { type: 'spring', stiffness: 200, damping: 25 },
};

export const toastSlideIn = {
  initial: { x: 300, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { x: 300, opacity: 0, transition: { duration: 0.2 } },
};

export const tabIndicator = {
  layoutId: 'tab-indicator',
  transition: { type: 'spring', stiffness: 350, damping: 30 },
};

// Premium entrance with glow
export const premiumEntrance = {
  initial: { opacity: 0, y: 20, scale: 0.98, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    filter: 'blur(3px)',
    transition: { duration: 0.2 },
  },
};
