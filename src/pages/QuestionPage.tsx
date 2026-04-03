import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from '../components/Cloud';
import { TypewriterText } from '../components/TypewriterText';

interface QuestionPageProps {
  onSubmit: (question: string) => void;
}

export function QuestionPage({ onSubmit }: QuestionPageProps) {
  const [question, setQuestion] = useState('');
  const [showInput, setShowInput] = useState(true);
  const [showOracleResponse, setShowOracleResponse] = useState(false);
  const maxLength = 200;

  const handleSubmit = () => {
    if (question.trim()) {
      setShowInput(false);
        setTimeout(() => {
          setShowOracleResponse(true);
        }, 850);
        setTimeout(() => {
          onSubmit(question);
        }, 3350);
    }
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-start pt-[14vh] relative px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Cloud size={100} />

        <AnimatePresence mode="wait">
        {showInput && (
          <motion.div
            className="mt-10 w-full max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            <motion.p
              className="font-oracle text-xl md:text-2xl text-black text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <TypewriterText
                text="告诉我，你心中挂念的是什么事？"
                speed={55}
                showCursor={false}
              />
            </motion.p>

            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, maxLength))}
                placeholder="我该不该接受这份新工作？"
                className="w-full h-32 bg-zinc-50 border border-zinc-200 rounded-sm p-4 font-oracle text-lg text-black placeholder:text-zinc-400/50 resize-none focus:border-zinc-400 transition-colors"
                autoFocus
              />
              <div className="absolute bottom-3 right-3 font-ui text-xs text-zinc-400">
                {question.length}/{maxLength}
              </div>
            </motion.div>

            <motion.p
              className="font-ui text-xs text-zinc-500 text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              说得越具体，我看得越清楚。
            </motion.p>

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2 }}
            >
              <button
                onClick={handleSubmit}
                disabled={!question.trim()}
                className="font-oracle text-lg text-zinc-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                请 Oracle 解读 →
              </button>
            </motion.div>
          </motion.div>
        )}
          {!showInput && showOracleResponse && (
            <motion.div
              key="oracle"
              className="mt-10 w-full max-w-md flex-1 flex items-center justify-center text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <p className="font-oracle text-xl md:text-2xl text-black">
                <TypewriterText
                  text="我明白了。让我为你解读……"
                  speed={50}
                  showCursor
                />
              </p>
            </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
}
