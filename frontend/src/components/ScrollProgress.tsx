'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/** Gold reading-progress bar pinned to the top of the viewport. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{
        scaleX, transformOrigin: '0 50%', position: 'fixed', top: 0, left: 0, right: 0, height: 5,
        background: 'var(--gold)', zIndex: 80, pointerEvents: 'none', boxShadow: '0 1px 0 var(--brown)',
      }}
    />
  );
}
