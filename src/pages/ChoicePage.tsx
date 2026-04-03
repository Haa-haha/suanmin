import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from '../components/Cloud';
import { AutoAdvanceLines } from '../components/TypewriterText';
import type { OracleMethod } from '../types/oracle';

interface ChoicePageProps {
  onSelectChoice: (choice: OracleMethod) => void;
}

const CHOICE_INTRO_LINES = ['现在，这些碎片正在拼成一个卦象。', '你要不要，拆开看看？'] as const;

const choices: { type: OracleMethod; title: string; subtitle: string }[] = [
  {
    type: 'number',
    title: '几个数字',
    subtitle: '是时钟上的、车牌上的、收据上的三个数字？',
  },
  {
    type: 'object',
    title: '你看到的事物',
    subtitle: '是眼前的咖啡、台灯、鲜花？',
  },
  {
    type: 'time',
    title: '一个和你事情有关的时间',
    subtitle: '你记得相遇的、离别的、那件事发生的时间吗？精确到时',
  },
  {
    type: 'fate',
    title: '让天意决定',
    subtitle: '或是此刻即是天意',
  },
];

export function ChoicePage({ onSelectChoice }: ChoicePageProps) {
  const [selectedChoice, setSelectedChoice] = useState<OracleMethod | null>(null);
  const [tapToken, setTapToken] = useState(0);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [showChoices, setShowChoices] = useState(false);

  const handleChoiceClick = (choice: OracleMethod) => {
    if (selectedChoice) return;
    setSelectedChoice(choice);
    setTimeout(() => {
      onSelectChoice(choice);
    }, 700);
  };

  const handleTap = () => {
    // Only increment tap token to advance text if intro is not complete
    if (!isIntroComplete) {
      setTapToken((v) => v + 1);
    } else if (!showChoices) {
      setShowChoices(true);
    }
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

      <motion.div
        className="mt-8 text-center max-w-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <AutoAdvanceLines
          lines={CHOICE_INTRO_LINES}
          tapToken={tapToken}
          tapAdvance={true}
          className="font-oracle text-2xl md:text-3xl text-black leading-relaxed"
          fadedClassName="font-oracle text-2xl md:text-3xl text-zinc-400 leading-relaxed"
          onAllComplete={() => {
            setIsIntroComplete(true);
            setTimeout(() => {
              if (!showChoices) setShowChoices(true);
            }, 800);
          }}
        />
      </motion.div>

      <AnimatePresence>
        {showChoices && (
          <motion.div
            className="mt-12 flex flex-col items-center space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {choices.map((choice) => (
              <motion.button
                key={choice.type}
                className="group text-center"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChoiceClick(choice.type);
                }}
                disabled={selectedChoice !== null}
              >
                <span
                  className={`font-oracle text-xl md:text-2xl transition-all duration-300 ${
                    selectedChoice === choice.type
                      ? 'text-black font-medium'
                      : 'text-zinc-600 group-hover:text-black'
                  }`}
                >
                  {choice.title}
                </span>
                <p className="font-ui text-xs md:text-sm text-zinc-400 mt-2">{choice.subtitle}</p>
              </motion.button>
            ))}
            <p className="font-ui text-xs text-oracle-dim mt-2">请选择一种起卦方式</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isIntroComplete && !showChoices && (
          <motion.div
            className="absolute bottom-16 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-ui text-sm text-oracle-dim animate-pulse-soft">轻触屏幕，拆开看看</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
