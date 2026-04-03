import { motion } from 'framer-motion';

interface CloudProps {
  className?: string;
  size?: number;
}

export function Cloud({ className = '', size = 140 }: CloudProps) {
  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <div 
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, transparent 70%)',
          transform: 'scale(1.2)',
        }}
      />
      
      <motion.div
        className="relative w-[70%] h-[70%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <g transform="translate(50,50)">
            <path d="M0 -49 A49 49 0 0 0 0 49 A24.5 24.5 0 0 1 0 0 A24.5 24.5 0 0 0 0 -49" fill="#18181b"/>
            <path d="M0 -49 A49 49 0 0 1 0 49 A24.5 24.5 0 0 1 0 0 A24.5 24.5 0 0 0 0 -49" fill="#fafafa"/>
            <circle cx="0" cy="-24.5" r="6" fill="#fafafa"/>
            <circle cx="0" cy="24.5" r="6" fill="#18181b"/>
            <circle cx="0" cy="0" r="49" fill="none" stroke="#18181b" strokeWidth="0.5"/>
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
}
