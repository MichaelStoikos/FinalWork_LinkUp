import { motion } from 'framer-motion';

/**
 * FadeInWrapper component that provides fade-in animation for child components.
 * Uses Framer Motion to animate opacity and vertical position transitions.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to animate
 * @param {...any} props - Additional props passed to motion.div
 * @returns {JSX.Element} The animated wrapper component
 */
export default function FadeInWrapper({ children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
} 