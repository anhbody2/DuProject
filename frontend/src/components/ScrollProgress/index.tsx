import { useScroll, useSpring } from 'framer-motion';
import { Bar } from './styles';

/** Gold reading-progress bar pinned to the top of the viewport. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return <Bar style={{ scaleX }} />;
}
