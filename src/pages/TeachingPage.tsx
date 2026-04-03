import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from '../components/Cloud';
import { AutoAdvanceLines } from '../components/TypewriterText';

interface TeachingPageProps {
  onContinue: () => void;
}

const TEACHING_LINES = [
  '三千年前，东方一位先知发现：',
  '天地之间，没有偶然。',
  '你路过的那座山，凝望过的那条河，',
  '飘落在肩头的那片叶，转角遇见的那个人，',
  '都是天意写给你的信。',
] as const;

export function TeachingPage({ onContinue }: TeachingPageProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [tapToken, setTapToken] = useState(0);

  const handleTap = () => {
    // If the prompt is showing, we are ready to move to next page
    if (showPrompt) {
      onContinue();
      return;
    }

    // Only increment tapToken if we are not done yet
    setTapToken((v) => v + 1);
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-start pt-[10vh] relative px-6"
      onClick={handleTap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Cloud size={120} />

      <div className="mt-8 text-center max-w-lg">
        <AutoAdvanceLines
          lines={TEACHING_LINES}
          tapToken={tapToken}
          tapAdvance={true}
          className="font-oracle text-xl md:text-2xl text-black leading-relaxed"
          fadedClassName="font-oracle text-xl md:text-2xl text-zinc-400 leading-relaxed"
          onAllComplete={() => setShowPrompt(true)}
        />
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
            <p className="font-ui text-sm text-oracle-dim animate-pulse-soft">轻触屏幕，继续</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
