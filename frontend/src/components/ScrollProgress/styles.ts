import { motion } from 'framer-motion';
import styled from 'styled-components';

export const Bar = styled(motion.div)`
  transform-origin: 0 50%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: var(--gold);
  z-index: 80;
  pointer-events: none;
  box-shadow: 0 1px 0 var(--brown);
`;
