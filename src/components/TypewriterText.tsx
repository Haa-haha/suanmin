import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  delay?: number;
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  className = '',
  onComplete,
  delay = 0,
}: TypewriterTextProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, delay + 600);
    return () => clearTimeout(timer);
  }, [delay, onComplete]);

  return (
    <motion.span
      initial={{ opacity: 0, filter: 'blur(2px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay: delay / 1000 }}
      className={className}
    >
      {text}
    </motion.span>
  );
}

interface AutoAdvanceLinesProps {
  lines: readonly string[];
  className?: string;
  fadedClassName?: string;
  autoAdvanceDelay?: number;
  tapToken?: number;
  tapAdvance?: boolean;
  onAllComplete?: () => void;
}

export function AutoAdvanceLines({
  lines,
  className = '',
  fadedClassName = '',
  tapToken,
  tapAdvance = true,
  onAllComplete,
}: AutoAdvanceLinesProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const lastProcessedTapRef = useRef(tapToken ?? 0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onAllCompleteRef = useRef(onAllComplete);
  const didCompleteRef = useRef(false);

  useEffect(() => {
    onAllCompleteRef.current = onAllComplete;
  }, [onAllComplete]);

  useEffect(() => {
    setVisibleCount(0);
    didCompleteRef.current = false;
  }, [lines]);

    useEffect(() => {
    if (lines.length === 0) return;

    if (visibleCount >= lines.length - 1) {
      if (!didCompleteRef.current) {
        didCompleteRef.current = true;
        onAllCompleteRef.current?.();
      }
      return;
    }

    const currentLine = lines[visibleCount];
      const delay = 450 + currentLine.length * 85;

    timerRef.current = setTimeout(() => {
      setVisibleCount(prev => {
        return Math.min(prev + 1, lines.length - 1);
      });
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visibleCount, lines]);

  useEffect(() => {
    if (tapToken === undefined || tapToken === 0 || !tapAdvance) return;
    
    if (tapToken <= lastProcessedTapRef.current) return;
    
    lastProcessedTapRef.current = tapToken;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setVisibleCount(prev => {
      if (lines.length === 0) return prev;
      return Math.min(prev + 1, lines.length - 1);
    });
  }, [tapToken, tapAdvance, lines.length]);

  return (
    <div className="space-y-8">
      {lines.map((line, idx) => {
        const isVisible = lines.length > 0 && idx <= visibleCount;
        const isPast = lines.length > 0 && idx < visibleCount;
        
        if (!isVisible) return null;

        return (
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
            animate={{ 
              opacity: isPast ? 0.4 : 1, 
              y: 0, 
              filter: 'blur(0px)' 
            }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            className={isPast ? fadedClassName : className}
          >
            {line}
          </motion.p>
        );
      })}
    </div>
  );
}
