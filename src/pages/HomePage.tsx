import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { OracleMethod } from '../types/oracle';

const METHODS: { key: OracleMethod; label: string; desc: string }[] = [
  { key: 'number', label: '报数起卦', desc: '随心报出三个数字' },
  { key: 'object', label: '取象起卦', desc: '观察身边事物取象' },
  { key: 'time',   label: '时间起卦', desc: '以此刻时间推演' },
  { key: 'fate',   label: '天意起卦', desc: '放空心念，随缘而定' },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-950 text-amber-100/90 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl font-serif tracking-[0.3em] mb-2">梅花易数</h1>
        <p className="text-sm text-amber-500/40">心诚则灵，择一法起卦</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-3">
        {METHODS.map((m, i) => (
          <motion.button
            key={m.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate('/input', { state: { method: m.key } })}
            className="w-full text-left px-5 py-4 rounded-lg bg-amber-900/15 border border-amber-800/20 hover:bg-amber-900/30 hover:border-amber-700/30 transition-all group"
          >
            <div className="text-base font-medium text-amber-200 group-hover:text-amber-100 transition">
              {m.label}
            </div>
            <div className="text-xs text-amber-500/40 mt-0.5">{m.desc}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
