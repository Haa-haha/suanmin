import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from '../components/Cloud';
import { TypewriterText } from '../components/TypewriterText';
import { HexagramDiagram } from '../components/HexagramDiagram';
import type { LineType, OracleSession } from '../types/oracle';
import { getTrigramsFromHexagramNumbers, TRIGRAMS_BY_NUMBER } from '../lib/trigrams';
import { getHexagramByTrigrams } from '../lib/hexagrams';

interface CastingPageProps {
  session: OracleSession;
  onContinue: () => void;
}

export function CastingPage({ session, onContinue }: CastingPageProps) {
  const [oracleLine, setOracleLine] = useState(0);
  const [showOracle, setShowOracle] = useState(false);
  const [visibleLines, setVisibleLines] = useState<LineType[]>([]);
  const [showHexagramInfo, setShowHexagramInfo] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [changePhase, setChangePhase] = useState<0 | 1 | 2>(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setShowOracle(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (oracleLine !== 1) return;
    if (startedRef.current) return;
    startedRef.current = true;

    const delay = 1400;
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    session.lines.forEach((line, idx) => {
      const t = setTimeout(() => {
        setVisibleLines((prev) => [...prev, line]);
      }, delay + idx * 600);
      timeoutsRef.current.push(t);
    });

    timeoutsRef.current.push(
      setTimeout(() => {
        setShowHexagramInfo(true);
      }, delay + session.lines.length * 600 + 500),
    );

    timeoutsRef.current.push(
      setTimeout(() => {
        setShowMeaning(true);
      }, delay + session.lines.length * 600 + 1600),
    );

    timeoutsRef.current.push(
      setTimeout(() => {
        setShowContinuePrompt(true);
      }, delay + session.lines.length * 600 + 3200),
    );

    timeoutsRef.current.push(
      setTimeout(() => {
        setShowChange(true);
        setChangePhase(1);
      }, delay + session.lines.length * 600 + 1100),
    );
  }, [oracleLine, session.lines]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!showChange) return;
    if (changePhase !== 1) return;
    const t = setTimeout(() => setChangePhase(2), 800);
    return () => clearTimeout(t);
  }, [changePhase, showChange]);

  const baseHex = useMemo(() => {
    if (visibleLines.length !== 6) return null;
    return getHexagramByTrigrams(session.upperTrigramNumber, session.lowerTrigramNumber);
  }, [session.lowerTrigramNumber, session.upperTrigramNumber, visibleLines.length]);

  const changedHex = useMemo(() => {
    if (visibleLines.length !== 6) return null;
    return getHexagramByTrigrams(session.changedUpperTrigramNumber, session.changedLowerTrigramNumber);
  }, [session.changedLowerTrigramNumber, session.changedUpperTrigramNumber, visibleLines.length]);

  const trigrams = useMemo(() => {
    if (visibleLines.length !== 6) return null;
    return getTrigramsFromHexagramNumbers(session.upperTrigramNumber, session.lowerTrigramNumber);
  }, [session.lowerTrigramNumber, session.upperTrigramNumber, visibleLines.length]);

  const changedTrigrams = useMemo(() => {
    if (visibleLines.length !== 6) return null;
    return getTrigramsFromHexagramNumbers(session.changedUpperTrigramNumber, session.changedLowerTrigramNumber);
  }, [session.changedLowerTrigramNumber, session.changedUpperTrigramNumber, visibleLines.length]);

  const transformSummary = useMemo(() => {
    if (!baseHex || !changedHex) return '';
    const upperFrom = TRIGRAMS_BY_NUMBER[baseHex.upper];
    const upperTo = TRIGRAMS_BY_NUMBER[changedHex.upper];
    const lowerFrom = TRIGRAMS_BY_NUMBER[baseHex.lower];
    const lowerTo = TRIGRAMS_BY_NUMBER[changedHex.lower];

    const changes: string[] = [];
    if (upperFrom && upperTo && upperFrom.number !== upperTo.number) {
      changes.push(`上卦由${upperFrom.name}（${upperFrom.image}·${upperFrom.nature}）变为${upperTo.name}（${upperTo.image}·${upperTo.nature}）`);
    }
    if (lowerFrom && lowerTo && lowerFrom.number !== lowerTo.number) {
      changes.push(`下卦由${lowerFrom.name}（${lowerFrom.image}·${lowerFrom.nature}）变为${lowerTo.name}（${lowerTo.image}·${lowerTo.nature}）`);
    }
    if (!changes.length) {
      changes.push('上下卦不变，所变在用事之处');
    }
    return changes.join('；');
  }, [baseHex, changedHex]);

  const reasonLines = useMemo(() => {
    const lines: string[] = [];
    const upper = TRIGRAMS_BY_NUMBER[session.upperTrigramNumber];
    const lower = TRIGRAMS_BY_NUMBER[session.lowerTrigramNumber];

    if (upper && lower) {
      lines.push(`上卦：${upper.name}≡${upper.image}（${upper.image}·${upper.nature}）`);
      lines.push(`下卦：${lower.name}≡${lower.image}（${lower.image}·${lower.nature}）`);
    }

    if (session.inputs.method === 'time') {
      const chosen = session.inputs.signals[0] ? new Date(session.inputs.signals[0]) : new Date(session.inputs.occurredAtIso);
      lines.unshift(
        `所选时刻：${chosen.getFullYear()}年${chosen.getMonth() + 1}月${chosen.getDate()}日 ${String(chosen.getHours()).padStart(2, '0')}:${String(chosen.getMinutes()).padStart(2, '0')}`,
      );
      lines.push(`动爻：第${session.resolvedMovingLine}爻（随时辰取数）`);
      return lines;
    }

    if (session.inputs.method === 'object') {
      const a = session.inputs.signals[0] ?? '';
      const b = session.inputs.signals[1] ?? '';
      const c = session.inputs.signals[2] ?? '';
      const out: string[] = [];
      if (upper) out.push(`取象一：${a} → 上卦 ${upper.name}≡${upper.image}`);
      if (lower) out.push(`取象二：${b} → 下卦 ${lower.name}≡${lower.image}`);
      out.push(`取象三：${c} → 动爻 第${session.resolvedMovingLine}爻`);
      return [...out, ...lines];
    }

    if (session.inputs.method === 'number') {
      const [a, b, c] = session.inputs.signals.slice(0, 3);
      lines.unshift(`数字：${a}、${b}、${c}`);
      lines.push(`动爻：第${session.resolvedMovingLine}爻`);
      return lines;
    }

    if (session.inputs.method === 'fate') {
      const dt = new Date(session.inputs.occurredAtIso);
      lines.unshift(
        `此刻：${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日 ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
      );
      lines.push(`动爻：第${session.resolvedMovingLine}爻（暗取时辰）`);
      return lines;
    }

    return lines;
  }, [session.inputs.method, session.inputs.occurredAtIso, session.inputs.signals, session.lowerTrigramNumber, session.resolvedMovingLine, session.upperTrigramNumber]);

  const primarySignalText = useMemo(() => {
    if (session.inputs.method === 'fate') return '天意';
    if (session.inputs.method === 'time') {
      const chosen = session.inputs.signals[0]
        ? new Date(session.inputs.signals[0])
        : new Date(session.inputs.occurredAtIso);
      return `${chosen.getFullYear()}年${chosen.getMonth() + 1}月${chosen.getDate()}日 ${String(chosen.getHours()).padStart(2, '0')}:${String(chosen.getMinutes()).padStart(2, '0')}`;
    }
    return session.inputs.signals.join(' · ');
  }, [session.inputs.method, session.inputs.occurredAtIso, session.inputs.signals]);

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-start relative px-6 pt-[8vh] overflow-y-auto"
      onClick={() => {
        if (showContinuePrompt) onContinue();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        animate={{
          scale: visibleLines.length === 6 ? 1.08 : 1,
        }}
        transition={{ duration: 1 }}
      >
        <Cloud size={100} />
      </motion.div>

      <div className="mt-8 text-center">
        {oracleLine === 0 && showOracle && (
          <motion.p
            className="font-oracle text-xl md:text-2xl text-oracle-paper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TypewriterText
              text="且慢——让我看看天机……"
              speed={130}
              onComplete={() => setOracleLine(1)}
              showCursor
            />
          </motion.p>
        )}
      </div>

      <AnimatePresence>
        {oracleLine === 1 && (
          <motion.div
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-12">
                <p className="font-ui text-xs tracking-[0.2em] text-zinc-400 mb-2">起卦所凭</p>
                <p className="font-oracle text-base text-zinc-600">{primarySignalText}</p>
                {session.inputs.method !== 'number' && session.inputs.omen && session.inputs.omen !== '无' && (
                  <p className="font-oracle text-sm text-zinc-500 mt-2">外应：{session.inputs.omen}</p>
                )}
                {reasonLines.length > 0 && (
                  <div className="mt-6 space-y-1 opacity-60">
                    {reasonLines.map((r, i) => (
                      <p key={i} className="font-ui text-[10px] text-zinc-400">
                        {r}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {visibleLines.length === 6 && (
        <div className="mt-10 w-full max-w-2xl flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <p className="font-ui text-xs tracking-[0.2em] text-zinc-400 mb-4">本卦</p>
            <HexagramDiagram lines={session.lines} movingLine={session.resolvedMovingLine} size="md" />
            <p className="font-oracle text-lg text-black mt-4">{baseHex?.title}</p>
          </div>
          <div className="flex flex-col items-center justify-center mt-8">
            <p className="font-oracle text-2xl text-zinc-300">→</p>
            <p className="font-ui text-[10px] tracking-[0.1em] text-zinc-400 mt-2">动第{session.resolvedMovingLine}爻</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="font-ui text-xs tracking-[0.2em] text-zinc-400 mb-4">变卦</p>
            <HexagramDiagram
              lines={changePhase === 2 ? session.changedLines : session.lines}
              movingLine={session.resolvedMovingLine}
              size="md"
              animateKey={changePhase}
            />
            <p className="font-oracle text-lg text-black mt-4">{changedHex?.title}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showHexagramInfo && (
          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-oracle text-4xl text-black mb-8">
              卦象已成——
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHexagramInfo && trigrams && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-oracle text-sm text-oracle-dim">
              上卦{trigrams.upper.name}≡{trigrams.upper.image}（{trigrams.upper.image}·{trigrams.upper.nature}）
            </p>
            <p className="font-oracle text-sm text-oracle-dim mt-1">
              下卦{trigrams.lower.name}≡{trigrams.lower.image}（{trigrams.lower.image}·{trigrams.lower.nature}）
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHexagramInfo && changedTrigrams && (
          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="font-ui text-xs tracking-[0.2em] text-oracle-dim">变卦</p>
            <p className="font-oracle text-sm text-oracle-dim mt-2">
              {changedHex?.title}（第{changedHex?.number}卦）
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHexagramInfo && showChange && visibleLines.length === 6 && (
          <motion.div
            className="mt-8 w-full max-w-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-12">
              <p className="font-ui text-xs tracking-[0.2em] text-zinc-400 mb-4">卦象演变</p>
              <div className="space-y-2">
                <p className="font-oracle text-sm text-zinc-600">{transformSummary}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMeaning && (
          <motion.div
              className="mt-10 w-full max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
              <div className="w-full rounded-2xl border border-zinc-200 bg-white px-6 py-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
                <div className="text-center">
                  <p className="font-ui text-xs tracking-[0.2em] text-zinc-400">卦象解析</p>
                  <p className="font-oracle text-xl md:text-2xl text-black mt-3">
                    {baseHex?.title} → {changedHex?.title}
                  </p>
                  <p className="font-ui text-xs text-zinc-400 mt-3">动第{session.resolvedMovingLine}爻</p>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-5 py-5">
                    <p className="font-ui text-xs tracking-[0.2em] text-zinc-400">本卦</p>
                    <p className="font-oracle text-lg text-black mt-3">
                      {baseHex?.title}{baseHex?.number ? `（第${baseHex.number}卦）` : ''}
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="font-oracle text-sm text-zinc-700">
                        上卦：{trigrams?.upper.name}＝{trigrams?.upper.image}（{trigrams?.upper.nature}）
                      </p>
                      <p className="font-oracle text-sm text-zinc-700">
                        下卦：{trigrams?.lower.name}＝{trigrams?.lower.image}（{trigrams?.lower.nature}）
                      </p>
                      <p className="font-oracle text-sm text-zinc-600 leading-relaxed pt-2">
                        关键词：先看“势”，再看“时”。你现在的难点，多半卡在节奏与取舍。
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-5 py-5">
                    <p className="font-ui text-xs tracking-[0.2em] text-zinc-400">变卦</p>
                    <p className="font-oracle text-lg text-black mt-3">
                      {changedHex?.title}{changedHex?.number ? `（第${changedHex.number}卦）` : ''}
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="font-oracle text-sm text-zinc-700">
                        上卦：{changedTrigrams?.upper.name}＝{changedTrigrams?.upper.image}（{changedTrigrams?.upper.nature}）
                      </p>
                      <p className="font-oracle text-sm text-zinc-700">
                        下卦：{changedTrigrams?.lower.name}＝{changedTrigrams?.lower.image}（{changedTrigrams?.lower.nature}）
                      </p>
                      <p className="font-oracle text-sm text-zinc-600 leading-relaxed pt-2">
                        变化提示：{transformSummary}。路子要换，但不是推翻，是“把力用在对的地方”。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-zinc-200 bg-white px-5 py-4">
                  <p className="font-ui text-xs tracking-[0.2em] text-zinc-400">一句话</p>
                  <p className="font-oracle text-base text-black mt-2 leading-relaxed">
                    先把局面稳定住，再用更柔软、更合适的方式推进。
                  </p>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContinuePrompt && (
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-oracle text-2xl text-black">我已看清卦象。</p>
            <p className="font-ui text-sm text-zinc-400 mt-3 animate-pulse-soft">轻触屏幕，写下你的问题</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
