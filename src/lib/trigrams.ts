import type { LineType } from '../types/oracle';

export type TrigramInfo = {
  key: string;
  number: number;
  name: string;
  symbol: string;
  element: string;
  image: string;
  nature: string;
};

export const TRIGRAMS_BY_NUMBER: Record<number, TrigramInfo> = {
  1: { number: 1, key: '111', name: '乾', symbol: '☰', element: '天', image: '天', nature: '健' },
  2: { number: 2, key: '110', name: '兑', symbol: '☱', element: '泽', image: '泽', nature: '悦' },
  3: { number: 3, key: '101', name: '离', symbol: '☲', element: '火', image: '火', nature: '明' },
  4: { number: 4, key: '100', name: '震', symbol: '☳', element: '雷', image: '雷', nature: '动' },
  5: { number: 5, key: '011', name: '巽', symbol: '☴', element: '风', image: '风', nature: '入' },
  6: { number: 6, key: '010', name: '坎', symbol: '☵', element: '水', image: '水', nature: '险' },
  7: { number: 7, key: '001', name: '艮', symbol: '☶', element: '山', image: '山', nature: '止' },
  8: { number: 8, key: '000', name: '坤', symbol: '☷', element: '地', image: '地', nature: '顺' },
};

export function getTrigramsFromHexagramNumbers(upper: number, lower: number) {
  return {
    upper: TRIGRAMS_BY_NUMBER[upper],
    lower: TRIGRAMS_BY_NUMBER[lower],
  };
}

export function getTrigramsFromLines(lines: LineType[]) {
  const lowerKey = lines
    .slice(0, 3)
    .map((l) => (l === 'yang' ? '1' : '0'))
    .join('');
  const upperKey = lines
    .slice(3, 6)
    .map((l) => (l === 'yang' ? '1' : '0'))
    .join('');

  const lower = Object.values(TRIGRAMS_BY_NUMBER).find((t) => t.key === lowerKey);
  const upper = Object.values(TRIGRAMS_BY_NUMBER).find((t) => t.key === upperKey);
  return { lower, upper };
}

