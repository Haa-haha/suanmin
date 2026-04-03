import { TRIGRAMS_BY_NUMBER } from './trigrams';

export type HexagramInfo = {
  number: number;
  name: string;
  title: string;
  upper: number;
  lower: number;
};

const HEXAGRAM_NAME_BY_NUMBER: Record<number, string> = {
  1: '乾',
  2: '坤',
  3: '屯',
  4: '蒙',
  5: '需',
  6: '讼',
  7: '师',
  8: '比',
  9: '小畜',
  10: '履',
  11: '泰',
  12: '否',
  13: '同人',
  14: '大有',
  15: '谦',
  16: '豫',
  17: '随',
  18: '蛊',
  19: '临',
  20: '观',
  21: '噬嗑',
  22: '贲',
  23: '剥',
  24: '复',
  25: '无妄',
  26: '大畜',
  27: '颐',
  28: '大过',
  29: '坎',
  30: '离',
  31: '咸',
  32: '恒',
  33: '遁',
  34: '大壮',
  35: '晋',
  36: '明夷',
  37: '家人',
  38: '睽',
  39: '蹇',
  40: '解',
  41: '损',
  42: '益',
  43: '夬',
  44: '姤',
  45: '萃',
  46: '升',
  47: '困',
  48: '井',
  49: '革',
  50: '鼎',
  51: '震',
  52: '艮',
  53: '渐',
  54: '归妹',
  55: '丰',
  56: '旅',
  57: '巽',
  58: '兑',
  59: '涣',
  60: '节',
  61: '中孚',
  62: '小过',
  63: '既济',
  64: '未济',
};

const HEXAGRAM_NUMBER_BY_LOWER_UPPER: number[][] = [
  [1, 43, 14, 34, 9, 5, 26, 11],
  [10, 58, 38, 54, 61, 60, 41, 19],
  [13, 49, 30, 55, 37, 63, 22, 36],
  [25, 17, 21, 51, 42, 3, 27, 24],
  [44, 28, 50, 32, 57, 48, 18, 46],
  [6, 47, 64, 40, 59, 29, 4, 7],
  [33, 31, 56, 62, 53, 39, 52, 15],
  [12, 45, 35, 16, 20, 8, 23, 2],
];

export function getHexagramByTrigrams(upper: number, lower: number): HexagramInfo {
  const upperIndex = upper - 1;
  const lowerIndex = lower - 1;
  const number = HEXAGRAM_NUMBER_BY_LOWER_UPPER[lowerIndex]?.[upperIndex] ?? 0;
  const name = HEXAGRAM_NAME_BY_NUMBER[number] ?? '未知';
  const upperTri = TRIGRAMS_BY_NUMBER[upper];
  const lowerTri = TRIGRAMS_BY_NUMBER[lower];
  const title =
    upperTri && lowerTri
      ? upper === lower
        ? `${name}为${upperTri.image}`
        : `${upperTri.image}${lowerTri.image}${name}`
      : name;
  return { number, name, title, upper, lower };
}
