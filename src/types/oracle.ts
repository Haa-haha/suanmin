export type OracleMethod = 'number' | 'object' | 'time' | 'fate';

export interface OracleInputs {
  method: OracleMethod;
  signals: string[];
  omen: string;
  movingLine: number | null;
  occurredAtIso: string;
}

export type LineType = 'yang' | 'yin';

export interface OracleSession {
  inputs: OracleInputs;
  lines: LineType[];
  changedLines: LineType[];
  resolvedMovingLine: number;
  upperTrigramNumber: number;
  lowerTrigramNumber: number;
  changedUpperTrigramNumber: number;
  changedLowerTrigramNumber: number;
  reasons: string[];
}
