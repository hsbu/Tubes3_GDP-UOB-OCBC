export type Algorithm =
  | 'kmp'
  | 'bm'
  | 'regex'
  | 'levenshtein'
  | 'aho-corasick'
  | 'rabin-karp';

export interface MatchResult {
  keyword: string;
  algorithm: Algorithm;
  count: number;
  executionMs: number;
  nodeIndex?: number;
}

export interface AlgoStats {
  kmp: { hits: number; ms: number };
  bm: { hits: number; ms: number };
  regex: { hits: number; ms: number };
  levenshtein: { hits: number; ms: number };
  ahoCorasick: { hits: number; ms: number };
  rabinKarp: { hits: number; ms: number };
}

export interface StorageState {
  scanStatus: 'idle' | 'scanning' | 'done';
  scanResults: MatchResult[];
  algoStats: AlgoStats;
  blurEnabled: boolean;
  bonusEnabled: boolean;
}

export const DEFAULT_ALGO_STATS: AlgoStats = {
  kmp: { hits: 0, ms: 0 },
  bm: { hits: 0, ms: 0 },
  regex: { hits: 0, ms: 0 },
  levenshtein: { hits: 0, ms: 0 },
  ahoCorasick: { hits: 0, ms: 0 },
  rabinKarp: { hits: 0, ms: 0 },
};

export const INITIAL_STATE: StorageState = {
  scanStatus:'idle',
  scanResults: [],
  algoStats: { ...DEFAULT_ALGO_STATS },
  blurEnabled: false,
  bonusEnabled: false,
};
