import { loadKeywords, getKeywords } from '../shared/keywords';
import { setState } from '../shared/storage';
import { ALGO_FLAGS } from '../shared/config';
import type { MatchResult, AlgoStats } from '../shared/types';
import { DEFAULT_ALGO_STATS } from '../shared/types';
import { kmpSearch, precompute as kmpPrecompute } from '../algorithms/kmp';
import { bmSearch, precompute as bmPrecompute } from '../algorithms/boyer-moore';
import { regexSearch } from '../algorithms/regex-match';
import { walkTextNodes } from './dom-walker';
import { clearHighlights, highlightNode } from './highlighter';
import type { HighlightMatch } from './highlighter';

let kmpTables = new Map<string, number[]>();
let bmTables = new Map<string, Map<string, number>>();

export async function initScanner(): Promise<void> {
    const keywords = await loadKeywords();

    for (const keyword of keywords) {
        kmpTables.set(keyword, kmpPrecompute(keyword));
        bmTables.set(keyword, bmPrecompute(keyword));
    }
}

export function runKMP(text:string, keywords: string[]): { keyword: string; indices: number[]; comparisons: number }[] {
    return keywords.flatMap((kw) => {
        const table = kmpTables.get(kw);
        const {indices, comparisons} = kmpSearch(text, kw, table);
        
        if (indices.length > 0) {
            const matchedResult = {
                keyword: kw,
                indices: indices,
                comparisons: comparisons
            };
            
            const wrapperArray = [matchedResult];
            return wrapperArray;
        } else {
            const emptyResult: any[] = [];
            return emptyResult;
        }
    });
}

export function runBM(text:string, keywords: string[]): { keyword: string; indices: number[]; comparisons: number }[] {
    return keywords.flatMap((kw) => {
        const table = bmTables.get(kw);
        const { indices, comparisons } = bmSearch(text, kw, table);

        if (indices.length > 0) {
            const matchedResult = {
                keyword: kw,
                indices: indices,
                comparisons: comparisons
            };
            
            const wrapperArray = [matchedResult];
            return wrapperArray;
        } else {
            const emptyResult: any[] = [];
            return emptyResult;
        }

    })
}

export async function runScan(): Promise<void> {
    await setState({ scanStatus: 'scanning', scanResults: [], algoStats: { ...DEFAULT_ALGO_STATS }});

    const keywords = getKeywords();
    clearHighlights();

    const textNodes = walkTextNodes();
    const allResults: MatchResult[] = [];
    const stats: AlgoStats = structuredClone(DEFAULT_ALGO_STATS);

    for (let i = 0; i< textNodes.length; i++) {
        const { node, text, nodeIndex } = textNodes[i];
        const upperText = text.toUpperCase();

        const exactHits = new Set<string>();
        const nodeHighlights: HighlightMatch[] = [];

        // 1. KMP
        if (ALGO_FLAGS.kmp) {
            const timeStart = performance.now();
            const kmpMatches = runKMP(upperText, keywords);
            
            const timeElapsed = performance.now() - timeStart;
            stats.kmp.ms += timeElapsed;

            for (const kM of kmpMatches) {
                exactHits.add(kM.keyword);
                stats.kmp.hits += kM.indices.length;
                allResults.push({ keyword: kM.keyword, algorithm: 'kmp', count: kM.indices.length, executionMs: timeElapsed, nodeIndex });

                for (const index of kM.indices) {
                    nodeHighlights.push({ start: index, end: index + kM.keyword.length, info: { keyword: kM.keyword, algorithm: 'kmp', count: kM.indices.length, executionMs: timeElapsed} });
                }
            }
        }

        // 2. BM
        if (ALGO_FLAGS.bm) {
            const timeStart = performance.now();
            const bmMatches = runBM(upperText, keywords);
            
            const timeElapsed = performance.now() - timeStart;
            stats.bm.ms += timeElapsed;

            for (const bM of bmMatches) {
                exactHits.add(bM.keyword);
                stats.bm.hits += bM.indices.length;
                allResults.push({ keyword: bM.keyword, algorithm: 'bm', count: bM.indices.length, executionMs: timeElapsed, nodeIndex });

                for (const index of bM.indices) {
                    nodeHighlights.push({ start: index, end: index + bM.keyword.length, info: { keyword: bM.keyword, algorithm: 'bm', count: bM.indices.length, executionMs: timeElapsed} });
                }
            }
        }

        // 3. RegEx
        if (ALGO_FLAGS.regex) {
            const timeStart = performance.now();
            const { matches: rxMatches } = regexSearch(text);
            
            const timeElapsed = performance.now() - timeStart;
            stats.regex.ms += timeElapsed;

            for (const rM of rxMatches) {
                exactHits.add(rM.fullMatch.toUpperCase());
                stats.regex.hits++;

                allResults.push({ keyword: rM.fullMatch, algorithm: 'regex', count: 1, executionMs: timeElapsed, nodeIndex });
                nodeHighlights.push({ start: rM.index, end: rM.index + rM.fullMatch.length, info: { keyword: rM.fullMatch, algorithm: 'regex', count: 1, executionMs: timeElapsed} });
            }
        }

        // 4. Levenshtein TODO!

        if (nodeHighlights.length > 0) {
            highlightNode(node, nodeHighlights);
        }

        if (i % 20 === 0 || i === textNodes.length - 1) {
            await setState({ scanResults: [...allResults], algoStats: { ...stats } });
        }
    }

    await setState({ scanStatus: 'done', scanResults: allResults, algoStats: stats });
}
