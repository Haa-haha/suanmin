import type { LineType, OracleInputs, OracleSession } from '../types/oracle';
import type { TrigramMapping } from './oracleAI';
import {
  buildChangedLines,
  buildHexagramLines,
  cast,
  normalizeSignals,
  trigramNumbersFromLines,
} from './oracleyiCore';

function formatLocalHour(dt: Date) {
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日 ${String(dt.getHours()).padStart(2, '0')}:00`;
}

export function createOracleSession(inputs: OracleInputs): OracleSession {
  const occurredAt = new Date(inputs.occurredAtIso);
  const normalizedSignals = normalizeSignals(inputs.method, inputs.signals);
  const baseCast = cast(inputs.method, normalizedSignals, occurredAt);
  const resolvedMovingLine =
    inputs.movingLine && inputs.movingLine >= 1 && inputs.movingLine <= 6
      ? inputs.movingLine
      : baseCast.movingLine;

  const baseLines = buildHexagramLines(baseCast.upperTrigramNumber, baseCast.lowerTrigramNumber);
  const changedLines = buildChangedLines(baseLines, resolvedMovingLine);

  const changedNums = trigramNumbersFromLines(changedLines);

  const reasons: string[] = [];
  if (inputs.method === 'number') {
    const a = Number(normalizedSignals[0] ?? 0);
    const b = Number(normalizedSignals[1] ?? 0);
    const c = Number(normalizedSignals[2] ?? 0);
    reasons.push(`数字：${a}、${b}、${c}`);
    reasons.push(`上卦：(${a}+${b})取八 → ${baseCast.upperTrigramNumber}`);
    reasons.push(`下卦：(${b}+${c})取八 → ${baseCast.lowerTrigramNumber}`);
    reasons.push(`动爻：(${a}+${b}+${c})取六 → ${baseCast.movingLine}`);
  }

  if (inputs.method === 'object') {
    const a = normalizedSignals[0] ?? '';
    const b = normalizedSignals[1] ?? '';
    const c = normalizedSignals[2] ?? '';
    reasons.push(`取象一：${a} → 上卦（数${baseCast.upperTrigramNumber}）`);
    reasons.push(`取象二：${b} → 下卦（数${baseCast.lowerTrigramNumber}）`);
    if (inputs.omen && inputs.omen !== '无' && inputs.movingLine) {
      reasons.push(`外应：${inputs.omen} → 动爻（第${resolvedMovingLine}爻）`);
    } else {
      reasons.push(`取象三：${c} → 动爻（第${resolvedMovingLine}爻）`);
    }
  }

  if (inputs.method === 'time') {
    const chosen = normalizedSignals[0] ? new Date(normalizedSignals[0]) : occurredAt;
    reasons.push(`所选时刻：${formatLocalHour(chosen)}`);
    reasons.push(`上卦：取数得 ${baseCast.upperTrigramNumber} ｜ 下卦：取数得 ${baseCast.lowerTrigramNumber}`);
    reasons.push(`动爻：取数得 第${baseCast.movingLine}爻`);
  }

  if (inputs.method === 'fate') {
    reasons.push(`此刻：${formatLocalHour(occurredAt)}`);
    reasons.push(`暗取时辰起卦（同时间起卦法）`);
    reasons.push(`上卦：${baseCast.upperTrigramNumber} ｜ 下卦：${baseCast.lowerTrigramNumber} ｜ 动爻：第${baseCast.movingLine}爻`);
  }

  return {
    inputs,
    lines: baseLines,
    changedLines,
    resolvedMovingLine,
    upperTrigramNumber: baseCast.upperTrigramNumber,
    lowerTrigramNumber: baseCast.lowerTrigramNumber,
    changedUpperTrigramNumber: changedNums.upperTrigramNumber,
    changedLowerTrigramNumber: changedNums.lowerTrigramNumber,
    reasons,
  };
}

export function createOracleSessionFromMapping(inputs: OracleInputs, mapping: TrigramMapping): OracleSession {
  const upperTrigramNumber = mapping.upper.trigramNumber;
  const lowerTrigramNumber = mapping.lower.trigramNumber;
  const resolvedMovingLine = inputs.movingLine ?? mapping.movingLine;

  const lines: LineType[] = buildHexagramLines(upperTrigramNumber, lowerTrigramNumber);
  const changedLines: LineType[] = buildChangedLines(lines, resolvedMovingLine);
  const changedNums = trigramNumbersFromLines(changedLines);

  const reasons: string[] = [
    `取象一：「${inputs.signals[0]}」→ ${mapping.upper.name}卦（${mapping.upper.reason}）`,
    `取象二：「${inputs.signals[1]}」→ ${mapping.lower.name}卦（${mapping.lower.reason}）`,
  ];
  if (inputs.signals.length > 2) {
    const label = inputs.omen ? '外应' : '取象三';
    reasons.push(`${label}：「${inputs.signals[2]}」→ ${mapping.third.name}卦（${mapping.third.reason}）`);
  }
  reasons.push(`动爻：第${resolvedMovingLine}爻（${mapping.movingLineReason}）`);

  return {
    inputs,
    lines,
    changedLines,
    resolvedMovingLine,
    upperTrigramNumber,
    lowerTrigramNumber,
    changedUpperTrigramNumber: changedNums.upperTrigramNumber,
    changedLowerTrigramNumber: changedNums.lowerTrigramNumber,
    reasons,
  };
}
