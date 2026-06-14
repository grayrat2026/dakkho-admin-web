'use client';

import { type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface AnimatedPageProps {
  children: ReactNode;
  keyProp?: string;
}

export function AnimatedPage({ children, keyProp }: AnimatedPageProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyProp}
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
