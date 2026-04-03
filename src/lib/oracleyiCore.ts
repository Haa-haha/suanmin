import { Solar } from 'lunar-javascript';
import type { LineType, OracleMethod } from '../types/oracle';

type CastResult = {
  upperTrigramNumber: number;
  lowerTrigramNumber: number;
  movingLine: number;
};

const TRIGRAM_NUMBER_TO_KEY: Record<number, string> = {
  1: '111',
  2: '110',
  3: '101',
  4: '100',
  5: '011',
  6: '010',
  7: '001',
  8: '000',
};

const ZHI_TO_NUMBER: Record<string, number> = {
  子: 1,
  丑: 2,
  寅: 3,
  卯: 4,
  辰: 5,
  巳: 6,
  午: 7,
  未: 8,
  申: 9,
  酉: 10,
  戌: 11,
  亥: 12,
};

function modTo1Based(value: number, modulo: number) {
  const r = value % modulo;
  return r === 0 ? modulo : r;
}

function hashToInt(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalizeText(input: string) {
  return input.trim().toLowerCase();
}

export function movingLineFromText(input: string) {
  return modTo1Based(hashToInt(normalizeText(input || 'unknown')), 6);
}

function mapObjectToTrigramNumber(input: string) {
  const s = normalizeText(input);
  const rules: Array<{ n: number; keys: string[] }> = [
    { n: 1, keys: ['天空', '天', '空', '苍穹', '星', '月', '云'] },
    { n: 6, keys: ['海', '大海', '江', '河', '水', '雨', '雪', '泉', '冰', '井'] },
    { n: 3, keys: ['火', '灯', '光', '电', '炉', '烧', '炎', '太阳', '日'] },
    { n: 4, keys: ['雷', '电', '震', '车', '鸣', '鼓'] },
    { n: 5, keys: ['风', '气', '树', '木', '草', '花', '叶', '果', '水果', '香', '竹'] },
    { n: 7, keys: ['山', '石', '岩', '墙', '门', '止', '台阶'] },
    { n: 2, keys: ['湖', '泽', '池', '塘', '沼', '口', '笑', '悦'] },
    { n: 8, keys: ['地', '土', '田', '房', '屋', '母', '坤'] },
  ];

  for (const r of rules) {
    for (const k of r.keys) {
      if (s.includes(k)) return r.n;
    }
  }

  return modTo1Based(hashToInt(s || 'unknown'), 8);
}

export function buildHexagramLines(upperTrigramNumber: number, lowerTrigramNumber: number): LineType[] {
  const lowerKey = TRIGRAM_NUMBER_TO_KEY[lowerTrigramNumber];
  const upperKey = TRIGRAM_NUMBER_TO_KEY[upperTrigramNumber];
  const bits = `${lowerKey}${upperKey}`;
  return bits.split('').map((b) => (b === '1' ? 'yang' : 'yin'));
}

export function buildChangedLines(lines: LineType[], movingLine: number): LineType[] {
  return lines.map((l, idx) => {
    if (idx !== movingLine - 1) return l;
    return l === 'yang' ? 'yin' : 'yang';
  });
}

export function trigramNumbersFromLines(lines: LineType[]) {
  const lowerKey = lines.slice(0, 3).map((l) => (l === 'yang' ? '1' : '0')).join('');
  const upperKey = lines.slice(3, 6).map((l) => (l === 'yang' ? '1' : '0')).join('');

  const lower = Number(
    Object.entries(TRIGRAM_NUMBER_TO_KEY).find(([, k]) => k === lowerKey)?.[0] ?? 0,
  );
  const upper = Number(
    Object.entries(TRIGRAM_NUMBER_TO_KEY).find(([, k]) => k === upperKey)?.[0] ?? 0,
  );
  return { upperTrigramNumber: upper, lowerTrigramNumber: lower };
}

export function castByNumbers(input: string | number[]): CastResult {
  const digits: number[] = Array.isArray(input)
    ? input
    : input
        .trim()
        .split('')
        .filter((c) => /\d/.test(c))
        .map((c) => Number(c));

  if (digits.length !== 3) {
    const h = hashToInt(String(input));
    const a = (h % 9) + 1;
    const b = ((h >> 4) % 9) + 1;
    const c = ((h >> 8) % 9) + 1;
    return castByNumbers([a, b, c]);
  }

  const [a, b, c] = digits.map((n) => Math.max(0, Math.floor(n)));
  const upperTrigramNumber = modTo1Based(a + b, 8);
  const lowerTrigramNumber = modTo1Based(b + c, 8);
  const movingLine = modTo1Based(a + b + c, 6);

  return { upperTrigramNumber, lowerTrigramNumber, movingLine };
}

export function castByTime(date: Date): CastResult {
  const solar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );

  const lunar = solar.getLunar();
  const yearZhi = lunar.getYearZhi();
  const timeZhi = lunar.getTimeZhi();
  const yearZhiNumber = ZHI_TO_NUMBER[yearZhi] ?? 1;
  const hourZhiNumber = ZHI_TO_NUMBER[timeZhi] ?? 1;

  const base = yearZhiNumber + lunar.getMonth() + lunar.getDay();
  const upperTrigramNumber = modTo1Based(base, 8);
  const lowerTrigramNumber = modTo1Based(base + hourZhiNumber, 8);
  const movingLine = modTo1Based(base + hourZhiNumber, 6);

  return { upperTrigramNumber, lowerTrigramNumber, movingLine };
}

export function castByObjects(objects: [string, string, string]): CastResult {
  const [a, b, c] = objects;
  const upperTrigramNumber = mapObjectToTrigramNumber(a);
  const lowerTrigramNumber = mapObjectToTrigramNumber(b);
  const movingLine = modTo1Based(hashToInt(normalizeText(c)), 6);
  return { upperTrigramNumber, lowerTrigramNumber, movingLine };
}

export function castByFate(date: Date): CastResult {
  return castByTime(date);
}

export function cast(method: OracleMethod, signals: string[], occurredAt: Date): CastResult {
  if (method === 'number') {
    if (signals.length === 1) return castByNumbers(signals[0]);
    return castByNumbers(signals.map((s) => Number(s)).filter((n) => Number.isFinite(n)).slice(0, 3));
  }

  if (method === 'time') {
    const raw = signals[0] ?? '';
    const date = parseTimeInput(raw, occurredAt);
    return castByTime(date);
  }

  if (method === 'object') {
    const a = signals[0] ?? '';
    const b = signals[1] ?? '';
    const c = signals[2] ?? '';
    return castByObjects([a, b, c]);
  }

  return castByFate(occurredAt);
}

export function parseTimeInput(raw: string, fallback: Date) {
  const s = raw.trim();
  if (!s) return fallback;

  const full = s.match(/^\s*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日\s*(\d{1,2})\s*:\s*(\d{2})\s*$/);
  if (full) {
    const y = Number(full[1]);
    const m = Number(full[2]);
    const d = Number(full[3]);
    const hh = Number(full[4]);
    const mm = Number(full[5]);
    const dt = new Date(y, m - 1, d, hh, mm, 0);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const hm = s.match(/^\s*(\d{1,2})\s*:\s*(\d{2})\s*$/);
  if (hm) {
    const hh = Number(hm[1]);
    const mm = Number(hm[2]);
    const dt = new Date(
      fallback.getFullYear(),
      fallback.getMonth(),
      fallback.getDate(),
      hh,
      mm,
      0,
    );
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return fallback;
}

export function normalizeSignals(method: OracleMethod, signals: string[]) {
  if (method === 'number') {
    if (signals.length === 1) {
      const s = signals[0].trim();
      if (/^\d{3}$/.test(s)) return s.split('');
      return [s];
    }
    return signals.slice(0, 3);
  }

  if (method === 'object') return signals.slice(0, 3);
  if (method === 'time') return signals.slice(0, 1);
  return [];
}
