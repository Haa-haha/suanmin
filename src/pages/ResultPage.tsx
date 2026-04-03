import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from '../components/Cloud';
import { HexagramDiagram } from '../components/HexagramDiagram';
import type { OracleSession } from '../types/oracle';
import { getTrigramsFromHexagramNumbers } from '../lib/trigrams';
import { getHexagramByTrigrams } from '../lib/hexagrams';
import { interpretHexagram } from '../lib/oracleAI';

interface ResultPageProps {
  session: OracleSession;
  question: string;
  onRestart: () => void;
}

export function ResultPage({ session, question, onRestart }: ResultPageProps) {
  type Phase = 'thinking' | 'streaming' | 'done' | 'error';
  const [phase, setPhase] = useState<Phase>('thinking');
  const [thinkingText, setThinkingText] = useState('');
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const queueRef = useRef<string[]>([]);
  const drainingRef = useRef(false);
  const partialRef = useRef('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const trigrams = useMemo(() => getTrigramsFromHexagramNumbers(session.upperTrigramNumber, session.lowerTrigramNumber), [session.lowerTrigramNumber, session.upperTrigramNumber]);
  const changedTrigrams = useMemo(() => getTrigramsFromHexagramNumbers(session.changedUpperTrigramNumber, session.changedLowerTrigramNumber), [session.changedLowerTrigramNumber, session.changedUpperTrigramNumber]);
  const baseHex = useMemo(() => getHexagramByTrigrams(session.upperTrigramNumber, session.lowerTrigramNumber), [session.lowerTrigramNumber, session.upperTrigramNumber]);
  const changedHex = useMemo(() => getHexagramByTrigrams(session.changedUpperTrigramNumber, session.changedLowerTrigramNumber), [session.changedLowerTrigramNumber, session.changedUpperTrigramNumber]);

  const transformSummary = useMemo(() => {
    const changes: string[] = [];
    if (trigrams.upper.name !== changedTrigrams.upper.name) changes.push(`上卦由${trigrams.upper.name}（${trigrams.upper.image}·${trigrams.upper.nature}）变为${changedTrigrams.upper.name}（${changedTrigrams.upper.image}·${changedTrigrams.upper.nature}）`);
    if (trigrams.lower.name !== changedTrigrams.lower.name) changes.push(`下卦由${trigrams.lower.name}（${trigrams.lower.image}·${trigrams.lower.nature}）变为${changedTrigrams.lower.name}（${changedTrigrams.lower.image}·${changedTrigrams.lower.nature}）`);
    if (!changes.length) return '上下卦不变，变化落在用事之处，关键看动爻。';
    return `${changes.join('；')}。`;
  }, [changedTrigrams, trigrams]);

  const reasonLines = useMemo(() => session.reasons ?? [], [session.reasons]);

  const drainQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      drainingRef.current = false;
      return;
    }
    const next = queueRef.current.shift()!;
    setDisplayLines((prev) => [...prev, next]);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      drainQueue();
    }, 180);
  }, []);

  const pushLine = useCallback(
    (line: string) => {
      const trimmed = line.replace(/\r/g, '');

      let processed = trimmed;
      if (/^#{1,3}\s+/.test(processed)) {
        const title = processed
          .replace(/^#{1,3}\s+/, '')
          .replace(/[“”"]/g, '')
          .trim();
        if (!title) return;
        processed = `### ${title}`;
      }

      queueRef.current.push(processed);
      if (!drainingRef.current && queueRef.current.length > 0) {
        drainingRef.current = true;
        drainQueue();
      }
    },
    [drainQueue],
  );

  const handleChunk = useCallback(
    (text: string) => {
      if (phase === 'thinking') setPhase('streaming');
      partialRef.current += text;
      const parts = partialRef.current.split('\n');
      partialRef.current = parts.pop() || '';
      for (const part of parts) {
        pushLine(part);
      }
    },
    [phase, pushLine],
  );

  const flushRemaining = useCallback(() => {
    if (partialRef.current.trim()) {
      pushLine(partialRef.current);
      partialRef.current = '';
    }
  }, [pushLine]);

  useEffect(() => {
    if (!session) return;
    const hexagram = getHexagramByTrigrams(session.upperTrigramNumber, session.lowerTrigramNumber);
    const changedHexagram = getHexagramByTrigrams(session.changedUpperTrigramNumber, session.changedLowerTrigramNumber);
    interpretHexagram(
      {
        method: session.inputs.method,
        signals: session.inputs.signals,
        question: question || '',
        hexagramTitle: hexagram?.title || '未知',
        changedHexagramTitle: changedHexagram?.title || '未知',
        movingLine: session.resolvedMovingLine,
        reasons: session.reasons,
      },
      {
        onThinking: (text) => setThinkingText((prev) => prev + text),
        onChunk: handleChunk,
        onDone: () => {
          flushRemaining();
          setPhase('done');
        },
        onError: (err) => {
          setErrorMsg(err.message);
          setPhase('error');
        },
      },
    );
  }, [session]);

  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={index} className="text-[#d4a574] text-xl font-oracle mt-8 mb-3 border-b border-[#d4a574]/20 pb-2">
          {trimmed.slice(4)}
        </h3>
      );
    }
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={index} className="border-l-2 border-[#d4a574]/30 pl-4 text-zinc-700 italic my-2"> 
          {trimmed.slice(2)}
        </blockquote>
      );
    }
    if (trimmed.startsWith('- ')) {
      return (
        <div key={index} className="flex gap-2 my-1.5 ml-2">
          <span className="text-[#d4a574] mt-0.5 shrink-0">•</span>
          <span className="text-zinc-800 leading-relaxed">{trimmed.slice(2)}</span> 
        </div>
      );
    }
    if (trimmed.includes('**')) {
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={index} className="text-zinc-800 leading-relaxed my-1.5"> 
          {parts.map((part, pi) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pi} className="text-[#d4a574] font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={pi}>{part}</span>;
          })}
        </p>
      );
    }
    if (trimmed === '') {
      return <div key={index} className="h-3" />;
    }
    return (
      <p key={index} className="text-zinc-800 leading-relaxed my-1.5"> 
        {trimmed}
      </p>
    );
  };

  return (
    <motion.div ref={scrollRef} className="w-full h-full overflow-y-auto scrollbar-thin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <div className="min-h-full flex flex-col items-center px-6 py-12">
        <div className="mb-8"><Cloud size={80} /></div>
        <motion.div className="text-center mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
          <p className="font-ui text-xs tracking-[0.2em] text-zinc-400 mb-2">所问之事</p>
          <p className="font-oracle text-2xl text-black mb-8">"{question}"</p>

          <p className="font-ui text-xs tracking-[0.2em] text-zinc-400 mb-2">本卦</p>
          <p className="font-oracle text-3xl text-black mb-1">{baseHex.title}</p>
          <p className="font-ui text-xs text-zinc-500 mb-4">第{baseHex.number}卦</p>
          
          <div className="flex flex-col items-center justify-center space-y-1 mb-8">
            <p className="font-oracle text-sm text-zinc-600">上卦 {trigrams.upper.name}≡{trigrams.upper.image}（{trigrams.upper.nature}）</p>
            <p className="font-oracle text-sm text-zinc-600">下卦 {trigrams.lower.name}≡{trigrams.lower.image}（{trigrams.lower.nature}）</p>
          </div>

          <p className="font-ui text-xs tracking-[0.2em] text-zinc-400 mb-2">变卦 (动第{session.resolvedMovingLine}爻)</p>
          <p className="font-oracle text-xl text-black mb-1">{changedHex.title}</p>
          
          {reasonLines.length > 0 && (
            <div className="mt-8 space-y-1 opacity-60">
              {reasonLines.slice(0, 6).map((r, i) => (<p key={i} className="font-ui text-[10px] text-zinc-400">{r}</p>))}
            </div>
          )}
        </motion.div>
        <div className="mb-12 w-full max-w-lg flex items-center justify-center gap-6">
          <HexagramDiagram lines={session.lines} movingLine={session.resolvedMovingLine} size="sm" />
          <p className="font-oracle text-xl text-oracle-dim">→</p>
          <HexagramDiagram lines={session.changedLines} movingLine={session.resolvedMovingLine} size="sm" />
        </div>
        <div className="max-w-lg w-full">
          <div className="mt-4 space-y-1">
            {phase === 'thinking' && (
              <div className="text-center pt-2 pb-6">
                <p className="text-[#d4a574] text-lg font-oracle animate-pulse">正在解卦……</p>
                {thinkingText && <p className="text-[#6b6255] text-xs mt-4 max-w-md mx-auto truncate">{thinkingText.slice(-100)}</p>}
              </div>
            )}
            {(phase === 'streaming' || phase === 'done') && (
              <div className="space-y-1">
                {displayLines.map((line, i) => renderLine(line, i))}
                {phase === 'streaming' && <span className="inline-block w-2 h-4 bg-[#d4a574] animate-pulse ml-1" />}
              </div>
            )}
            {phase === 'error' && (
              <div className="text-center py-8">
                <p className="text-red-400 mb-2">解卦时遇到问题</p>
                <p className="text-[#6b6255] text-sm">{errorMsg}</p>
                <p className="text-[#8b7355] text-xs mt-4">请稍后重试</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="mt-16 flex items-center justify-center space-x-6">
            <button onClick={onRestart} className="font-ui text-sm text-zinc-500 hover:text-black transition-colors">重新起卦</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
