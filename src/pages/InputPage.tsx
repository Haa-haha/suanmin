import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud } from '../components/Cloud';
import { AutoAdvanceLines } from '../components/TypewriterText';
import { mapObjectsToTrigrams } from '../lib/oracleAI';
import { createOracleSession, createOracleSessionFromMapping } from '../lib/oracleSession';
import type { OracleInputs, OracleMethod, OracleSession } from '../types/oracle';

interface InputPageProps {
  choiceType: OracleMethod;
  onComplete: (inputs: OracleInputs, session?: OracleSession) => void;
}

type ObjectStep = 'signal1' | 'signal2' | 'omenAsk' | 'omenInput' | 'signal3' | 'mapping';

export function InputPage({ choiceType, onComplete }: InputPageProps) {
  const [introComplete, setIntroComplete] = useState(false);
  const [showCollector, setShowCollector] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tapToken, setTapToken] = useState(0);
  const [signals, setSignals] = useState<string[]>([]);
  const [signalIndex, setSignalIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [objectStep, setObjectStep] = useState<ObjectStep>('signal1');
  const [omen, setOmen] = useState('');
  const [mappingText, setMappingText] = useState('');
  const [showNowTime, setShowNowTime] = useState(false);
  const [fateIso, setFateIso] = useState<string | null>(null);
  const [fateInputs, setFateInputs] = useState<OracleInputs | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [selectedHour, setSelectedHour] = useState<number>(() => new Date().getHours());
  const [numberError, setNumberError] = useState('');

  useEffect(() => {
    if (choiceType !== 'time') return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [choiceType]);

  useEffect(() => {
    if (!introComplete) return;
    if (choiceType === 'fate') return;
    if (choiceType === 'time') {
      setShowCollector(true);
      return;
    }
    const t = setTimeout(() => setShowCollector(true), 600);
    return () => clearTimeout(t);
  }, [choiceType, introComplete]);

  useEffect(() => {
    if (choiceType !== 'time') return;
    if (introComplete) setShowCollector(true);
  }, [choiceType, introComplete]);

  useEffect(() => {
    setShowNowTime(false);
    setFateIso(null);
    setFateInputs(null);
    setSignals([]);
    setSignalIndex(0);
    setCurrentInput('');
    setObjectStep('signal1');
    setOmen('');
    setMappingText('');
    setNumberError('');
  }, [choiceType]);

  const commitLockRef = useRef(false);

  useEffect(() => {
    commitLockRef.current = false;
  }, [choiceType]);

  const desiredSignalCount = useMemo(() => {
    if (choiceType === 'number') return 3;
    if (choiceType === 'object') return 3;
    if (choiceType === 'time') return 1;
    return 0;
  }, [choiceType]);

  const introLines = useMemo(() => {
    if (choiceType === 'number') return ['几个数字。', '是时钟上的、车牌上的、收据上的三个数字？'];
    if (choiceType === 'object') return ['你看到的事物。', '是眼前的咖啡、台灯、鲜花？'];
    if (choiceType === 'time') return ['一个和你事情有关的时间。', '你记得相遇的、离别的、那件事发生的时间吗？', '选择一个时刻（精确到时）'];
    return ['让天意决定。', '此刻即是天意。'];
  }, [choiceType]);

  const handleTap = () => {
    if (choiceType === 'fate' && showConfirmation && fateInputs) {
      onComplete(fateInputs);
      return;
    }
    if (!introComplete) {
      setTapToken((v) => v + 1);
      return;
    }
    if (!showCollector && !showConfirmation && choiceType !== 'fate') setShowCollector(true);
    if (choiceType === 'fate' && !showConfirmation) {
      const inputs: OracleInputs = { method: 'fate', signals: [], omen: '无', movingLine: null, occurredAtIso: new Date().toISOString() };
      setShowConfirmation(true);
      setFateIso(inputs.occurredAtIso);
      setFateInputs(inputs);
      setTimeout(() => onComplete(inputs), 900);
    }
  };

  const collectorTitle = useMemo(() => {
    if (choiceType === 'number') return '几个数字';
    if (choiceType === 'object') return '你看到的事物';
    if (choiceType === 'time') return '一个和你事情有关的时间';
    return '让天意决定';
  }, [choiceType]);

  const collectorPrompt = useMemo(() => {
    if (choiceType === 'number') {
      if (signalIndex === 0) return '第1个数字（或一个三位数）';
      return `第${signalIndex + 1}个数字`;
    }
    if (choiceType === 'object') {
      if (objectStep === 'omenAsk') return '外应';
      if (objectStep === 'omenInput') return '你看到了什么外应？';
      return `第${signalIndex + 1}样事物`;
    }
    if (choiceType === 'time') return '选择一个时刻（精确到时）';
    return '';
  }, [choiceType, signalIndex, objectStep]);

  const collectorHint = useMemo(() => {
    if (choiceType === 'number') return '时钟、车牌、收据上；任意三个都算';
    if (choiceType === 'object') {
      if (objectStep === 'omenAsk') return '外应是你起卦时无意中看到、听到的异常事物——比如突然飞来的鸟、门外的争吵声、掉落的杯子。若没有留意到，跳过即可。';
      if (objectStep === 'omenInput') return '简单描述你注意到的事物，比如：一只鸟飞过、门外有争吵声';
      return '咖啡、台灯、鲜花；你第一眼认出的都算';
    }
    if (choiceType === 'time') return '若想不到，就用此刻。';
    return '';
  }, [choiceType, objectStep]);

  const placeholder = useMemo(() => {
    if (choiceType === 'number') return '输入一位数字，或输入三位数';
    if (choiceType === 'object') {
      if (objectStep === 'omenInput') return '比如：一只鸟飞过窗前';
      if (signalIndex === 0) return '比如：咖啡';
      if (signalIndex === 1) return '比如：台灯';
      return '比如：鲜花';
    }
    return '';
  }, [choiceType, signalIndex, objectStep]);

  const handleObjectSignalSubmit = (value: string) => {
    if (objectStep === 'signal1') {
      setSignals((prev) => [...prev, value]);
      setSignalIndex(1);
      setObjectStep('signal2');
    } else if (objectStep === 'signal2') {
      setSignals((prev) => [...prev, value]);
      setObjectStep('omenAsk');
    } else if (objectStep === 'omenInput') {
      setOmen(value);
      setSignals((prev) => [...prev, value]);
      startObjectMapping([...signals, value], value);
    } else if (objectStep === 'signal3') {
      setSignals((prev) => [...prev, value]);
      startObjectMapping([...signals, value], '');
    }
  };

  const handleOmenYes = () => setObjectStep('omenInput');
  const handleOmenSkip = () => {
    setObjectStep('signal3');
    setSignalIndex(2);
  };

  const startObjectMapping = async (allSignals: string[], omenValue: string) => {
    setObjectStep('mapping');
    setMappingText('万物皆有象，正在观象……');
    const inputs: OracleInputs = {
      method: 'object',
      signals: allSignals,
      omen: omenValue,
      movingLine: null,
      occurredAtIso: new Date().toISOString(),
    };
    try {
      const mapping = await mapObjectsToTrigrams(allSignals);
      const session = createOracleSessionFromMapping(inputs, mapping);
      onComplete(inputs, session);
    } catch (err) {
      console.error('LLM mapping failed, falling back to local:', err);
      const session = createOracleSession(inputs);
      onComplete(inputs, session);
    }
  };

  const commitSignal = () => {
    const trimmed = currentInput.trim();
    if (choiceType === 'number') {
      if (!trimmed) return;
      if (!/^\d+$/.test(trimmed)) {
        setNumberError('请输入数字');
        return;
      }
      setNumberError('');
    }
    if (choiceType === 'object') {
      if (!trimmed) return;
      setCurrentInput('');
      handleObjectSignalSubmit(trimmed);
      return;
    }
    if (!trimmed) return;
    if (choiceType === 'number' && signalIndex === 0 && /^\d{3}$/.test(trimmed)) {
      const digits = trimmed.split('');
      setSignals(digits);
      setCurrentInput('');
      setShowConfirmation(true);
      const inputs: OracleInputs = { method: choiceType, signals: digits, omen: '无', movingLine: null, occurredAtIso: new Date().toISOString() };
      setTimeout(() => onComplete(inputs), 900);
      return;
    }
    const next = [...signals, trimmed];
    setSignals(next);
    setCurrentInput('');
    if (next.length >= desiredSignalCount) {
      setShowConfirmation(true);
      const inputs: OracleInputs = { method: choiceType, signals: next, omen: '无', movingLine: null, occurredAtIso: new Date().toISOString() };
      setTimeout(() => onComplete(inputs), 900);
      return;
    }
    setSignalIndex(next.length);
  };

  const commitTime = () => {
    if (commitLockRef.current) return;
    commitLockRef.current = true;
    const dt = new Date(`${selectedDate}T${String(selectedHour).padStart(2, '0')}:00:00`);
    const iso = Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
    const inputs: OracleInputs = { method: 'time', signals: [iso], omen: '无', movingLine: null, occurredAtIso: new Date().toISOString() };
    onComplete(inputs);
  };

  useEffect(() => {
    if (choiceType !== 'fate') return;
    if (!introComplete) return;
    if (showConfirmation) return;
    if (commitLockRef.current) return;
    commitLockRef.current = true;
    const iso = new Date().toISOString();
    setFateIso(iso);
    setShowConfirmation(true);
    const inputs: OracleInputs = { method: 'fate', signals: [], omen: '无', movingLine: null, occurredAtIso: iso };
    setFateInputs(inputs);
    const t = setTimeout(() => onComplete(inputs), 900);
    return () => clearTimeout(t);
  }, [choiceType, introComplete, onComplete, showConfirmation]);

  const currentTimeText = useMemo(() => {
    const y = now.getFullYear(); const m = now.getMonth() + 1; const d = now.getDate();
    const hh = String(now.getHours()).padStart(2, '0'); const mm = String(now.getMinutes()).padStart(2, '0');
    return `${y}年${m}月${d}日 ${hh}:${mm}`;
  }, [now]);

  const selectedTimeText = useMemo(() => {
    if (choiceType !== 'time') return '';
    const parts = selectedDate.split('-');
    const y = parts[0] || '';
    const m = parts[1] || '';
    const d = parts[2] || '';
    return `${Number(y)}年${Number(m)}月${Number(d)}日 ${String(selectedHour).padStart(2, '0')}:00`;
  }, [choiceType, selectedDate, selectedHour]);

  const renderCollector = () => {
    if (!showCollector || showConfirmation) return null;

      if (choiceType === 'time') {
        return (
          <motion.div
            key="time-collector"
            className="mt-4 w-full max-w-md"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-6 py-6 shadow-[0_6px_30px_rgba(0,0,0,0.06)]">
              <div className="w-full flex items-end justify-between gap-6">
                <div className="flex flex-col">
                  <p className="font-ui text-[11px] tracking-[0.16em] text-zinc-500">日期</p>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-2 w-[200px] h-12 font-oracle text-xl text-black bg-transparent border-b-2 border-zinc-300 pb-3 focus:border-zinc-700 transition-colors"
                  />
                </div>

                <div className="flex flex-col items-end">
                  <p className="font-ui text-[11px] tracking-[0.16em] text-zinc-500">小时</p>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    className="mt-2 w-[110px] h-12 font-oracle text-xl text-black bg-transparent border-b-2 border-zinc-300 pb-3 focus:border-zinc-700 transition-colors"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                      <option key={h} value={h} className="bg-white">
                        {String(h).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            <button
              onClick={() => {
                const d = new Date();
                setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                setSelectedHour(d.getHours());
                setShowNowTime(true);
                  setTimeout(() => {
                    commitTime();
                  }, 650);
              }}
                className="mt-6 font-ui text-sm text-zinc-500 hover:text-black transition-colors"
            >
              若想不到，就用此刻
            </button>
            {showNowTime && (
                <div className="mt-3 text-center">
                <p className="font-ui text-xs text-zinc-400">此刻</p>
                  <p className="font-oracle text-lg text-black mt-1">{currentTimeText}</p>
              </div>
            )}
              <button
                onClick={commitTime}
                className="mt-6 w-full h-11 rounded-full bg-black text-white font-ui text-sm tracking-[0.18em] hover:bg-zinc-800 transition-colors"
              >
                确认
              </button>
          </div>
        </motion.div>
      );
    }

    if (choiceType === 'object' && objectStep === 'omenAsk') {
      return (
        <motion.div key="omen-ask" className="mt-10 w-full max-w-md" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {objectStep === 'omenAsk' && (
            <div className="text-center space-y-6">
              <p className="text-[#d4a574] text-lg font-oracle">
                取象二已录，在此期间你是否注意到什么特别的事物？
              </p>
              <p className="text-[#8b7355] text-sm">
                （如看到飞鸟、听到声响、注意到某个物品等，这称为「外应」）
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleOmenYes}
                  className="px-6 py-3 bg-[#d4a574]/10 border border-[#d4a574]/30 text-[#d4a574] rounded-lg hover:bg-[#d4a574]/20 transition-colors"
                >
                  有，我注意到了
                </button>
                <button
                  onClick={handleOmenSkip}
                  className="px-6 py-3 bg-[#6b6255]/10 border border-[#6b6255]/30 text-[#8b7355] rounded-lg hover:bg-[#6b6255]/20 transition-colors"
                >
                  没有，跳过
                </button>
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    if (choiceType === 'object' && objectStep === 'mapping') {
      return (
        <motion.div key="mapping" className="mt-10 w-full max-w-md" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {objectStep === 'mapping' && (
            <div className="text-center space-y-4">
              <p className="text-[#d4a574] text-lg font-oracle animate-pulse">{mappingText}</p>
              <div className="flex justify-center gap-2">
                {signals.map((s, i) => (
                  <span key={i} className="text-[#8b7355] text-sm">「{s}」{i < signals.length - 1 ? '·' : ''}</span>
                ))}
              </div>
              {omen && <p className="text-[#6b6255] text-xs">外应：{omen}</p>}
            </div>
          )}
        </motion.div>
      );
    }

    if (choiceType === 'object' && objectStep === 'omenInput') {
      return (
        <motion.div key="omen-input" className="mt-10 w-full max-w-md" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="text-center">
            <p className="font-ui text-xs tracking-[0.2em] text-zinc-500">{collectorTitle}</p>
            <p className="font-oracle text-2xl text-black mt-3">{collectorPrompt}</p>
            <p className="font-ui text-xs text-zinc-500 mt-3">{collectorHint}</p>
          </div>
          <div className="mt-10 flex flex-col items-center">
            <div className="relative w-full">
              <input value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commitSignal()} placeholder={placeholder} className="w-full font-oracle text-2xl md:text-3xl text-black text-center bg-transparent border-b border-zinc-200 pb-2 focus:border-zinc-400 transition-colors placeholder:text-zinc-400/60" autoFocus />
            </div>
              <button onClick={commitSignal} className="mt-8 font-ui text-sm text-zinc-600 hover:text-black transition-colors">确认</button>
          </div>
        </motion.div>
      );
    }

      return (
        <motion.div className="mt-10 w-full max-w-md" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <div className="text-center">
          <p className="font-ui text-xs tracking-[0.2em] text-zinc-500">{collectorTitle}</p>
          <p className="font-oracle text-2xl text-black mt-3">{collectorPrompt}</p>
          <p className="font-ui text-xs text-zinc-500 mt-3">{collectorHint}</p>
        </div>
        <div className="mt-10 flex flex-col items-center">
          <div className="relative w-full">
            <input value={currentInput} onChange={(e) => { setCurrentInput(e.target.value); if (choiceType === 'number' && numberError) setNumberError(''); }} onKeyDown={(e) => e.key === 'Enter' && commitSignal()} placeholder={placeholder} className="w-full font-oracle text-2xl md:text-3xl text-black text-center bg-transparent border-b border-zinc-200 pb-2 focus:border-zinc-400 transition-colors placeholder:text-zinc-400/60" autoFocus />
          </div>
          {choiceType === 'number' && numberError && (
            <p className="mt-3 font-ui text-xs text-red-500">{numberError}</p>
          )}
            <button onClick={commitSignal} className="mt-8 font-ui text-sm text-zinc-600 hover:text-black transition-colors">确认</button>
        </div>
      </motion.div>
    );
  };

    return (
      <motion.div className="w-full h-full flex flex-col items-center justify-start pt-[10vh] relative px-6" onClick={handleTap} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
        <Cloud size={120} />
        <div className="mt-8 text-center max-w-lg">
        <AutoAdvanceLines
          lines={introLines}
          tapToken={tapToken}
          tapAdvance={true}
          className="font-oracle text-xl md:text-2xl text-black leading-relaxed"
          fadedClassName="font-oracle text-xl md:text-2xl text-zinc-400 leading-relaxed"
          onAllComplete={() => setIntroComplete(true)}
        />
      </div>
      <AnimatePresence mode="wait">{renderCollector()}</AnimatePresence>
      <AnimatePresence>
          {introComplete && !showCollector && choiceType !== 'fate' && (
            <motion.div className="absolute bottom-16 left-0 right-0 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <p className="font-ui text-sm text-zinc-400 animate-pulse-soft">轻触屏幕，继续</p>
            </motion.div>
          )}
      </AnimatePresence>
      <AnimatePresence>
          {showConfirmation && (
            <motion.div className="mt-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
              {choiceType === 'fate' && fateIso && (
                <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-[0_6px_30px_rgba(0,0,0,0.06)]">
                  <p className="font-ui text-[11px] tracking-[0.16em] text-zinc-500">此刻</p>
                  <p className="font-oracle text-2xl text-black mt-3">
                    {new Date(fateIso).getFullYear()}年{new Date(fateIso).getMonth() + 1}月{new Date(fateIso).getDate()}日 {String(new Date(fateIso).getHours()).padStart(2, '0')}:{String(new Date(fateIso).getMinutes()).padStart(2, '0')}
                  </p>
                  <p className="font-ui text-xs text-zinc-400 mt-4">轻触屏幕，立即起卦</p>
                </div>
              )}
              {choiceType !== 'fate' && <p className="font-oracle text-xl text-black">好。我收到了。</p>}
            </motion.div>
          )}
      </AnimatePresence>
    </motion.div>
  );
}
