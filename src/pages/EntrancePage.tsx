import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from '../components/Cloud';

interface EntrancePageProps {
  onComplete: () => void;
}

const ENTRANCE_LINES = ['嗯，你来了？', '看来今日，有卦要起。'] as const;

export function EntrancePage({ onComplete }: EntrancePageProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showFirst, setShowFirst] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const firstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (firstTimerRef.current) clearTimeout(firstTimerRef.current);
    firstTimerRef.current = setTimeout(() => {
      setShowFirst(true);
    }, 650);
    return () => {
      if (firstTimerRef.current) clearTimeout(firstTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showSecond) return;
    const t = setTimeout(() => {
      setShowPrompt(true);
    }, 700);
    return () => clearTimeout(t);
  }, [showSecond]);

  const handleTap = () => {
    if (!showSecond) {
      setShowSecond(true);
      return;
    }

    onComplete();
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-start pt-[18vh] relative"
      onClick={handleTap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Cloud size={150} />

      <div className="mt-12 text-center max-w-md px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key="text-container"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {showFirst && (
              <motion.p
                key="line-1"
                initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                animate={{
                  opacity: showSecond ? 0.4 : 1,
                  y: 0,
                  filter: 'blur(0px)',
                }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className={showSecond ? "font-oracle text-2xl md:text-3xl text-zinc-400 leading-relaxed" : "font-oracle text-2xl md:text-3xl text-black leading-relaxed"}
              >
                {ENTRANCE_LINES[0]}
              </motion.p>
            )}

            {showSecond && (
              <motion.p
                key="line-2"
                initial={{ opacity: 0, y: 10, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="font-oracle text-2xl md:text-3xl text-black leading-relaxed"
              >
                {ENTRANCE_LINES[1]}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showPrompt && (
          <motion.div
            className="absolute bottom-16 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-ui text-sm text-oracle-dim animate-pulse-soft">
              轻触屏幕，继续
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
