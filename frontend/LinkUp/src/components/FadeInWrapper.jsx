import { motion } from 'framer-motion';

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