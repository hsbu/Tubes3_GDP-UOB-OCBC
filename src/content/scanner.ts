import { loadKeywords, getKeywords } from '../shared/keywords';
import { getState, setState } from '../shared/storage';
import { ALGO_FLAGS } from '../shared/config';
import type { MatchResult, AlgoStats } from '../shared/types';
import { DEFAULT_ALGO_STATS } from '../shared/types';
import { kmpSearch, precompute as kmpPrecompute } from '../algorithms/kmp';
import { bmSearch, precompute as bmPrecompute } from '../algorithms/boyer-moore';
import { regexSearch } from '../algorithms/regex-match';
import { levenshteinSearch } from '../algorithms/levenshtein';
import { ahoCorasickSearch, precompute as acPrecompute } from '../algorithms/aho-corasick';
import type { AhoCorasickNode } from '../algorithms/aho-corasick';
import { rabinKarpMultiSearch } from '../algorithms/rabin-karp';
import { rabinKarpSearch, precompute as rabinKarpPrecompute } from '../algorithms/rabin-karp';
import type { RKPrecomputed } from '../algorithms/rabin-karp';
import { walkTextNodes } from './dom-walker';
import { clearHighlights, highlightNode } from './highlighter';
import type { HighlightMatch } from './highlighter';
import { clearBlur, blurTextNodeTarget } from './blur';

let kmpTables = new Map<string, number[]>();
let bmTables = new Map<string, Map<string, number>>();
let rkTables = new Map<string, RKPrecomputed>();
let acAutomation: AhoCorasickNode[] = [];

export async function initScanner(): Promise<void> {
    const keywords = await loadKeywords();

    for (const keyword of keywords) {
        kmpTables.set(keyword, kmpPrecompute(keyword));
        bmTables.set(keyword, bmPrecompute(keyword));
        rkTables.set(keyword, rabinKarpPrecompute(keyword));
    }

    acAutomation = acPrecompute(keywords);
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

export function runLevenshtein(text: string, keywords: string[]): { keyword: string; candidate: string; index: number; distance: number; similarity: number; comparisons: number }[] {
    const { matches, comparisons } = levenshteinSearch(text, keywords);

    if (matches.length === 0){
        return [];
    }
    return matches.map((match) => ({keyword: match.keyword, candidate: match.candidate, index: match.index, distance: match.distance, similarity: match.similarity, comparisons}));
}

export function runAhoCorasick(text: string, keywords: string[]): { keyword: string; indices: number[]; comparisons: number }[] {
    const automaton = acAutomation.length === 0 ? acPrecompute(keywords) : acAutomation;
    const { matches, comparisons } = ahoCorasickSearch(text, keywords, automaton);
    const grouped = new Map<string, number[]>();

    for (const match of matches){
        const existing = grouped.get(match.keyword);

        if (existing === undefined){
            grouped.set(match.keyword, [match.index]);
        } else {
            existing.push(match.index);
        }
    }

    const results: { keyword: string; indices: number[]; comparisons: number }[] = [];

    for (const [keyword, indices] of grouped.entries()){
        results.push({keyword, indices, comparisons});
    }
    return results;
}

export function runRabinKarp(text: string, keywords: string[]): { keyword: string; indices: number[]; comparisons: number }[] {
    const results: { keyword: string; indices: number[]; comparisons: number }[] = [];

    for (const keyword of keywords) {
        const table = rkTables.get(keyword);
        const { indices, comparisons } = rabinKarpSearch(text, keyword, table);

        if (indices.length > 0) {
            results.push({keyword, indices, comparisons});
        }
    }
    return results;
}

export async function runScan(): Promise<void> {
    await setState({ scanStatus: 'scanning', scanResults: [], algoStats: { ...DEFAULT_ALGO_STATS }});

    const keywords = getKeywords();
    const { blurEnabled } = await getState();
    clearHighlights();
    clearBlur();

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

        // 4. Levenshtein
        if (ALGO_FLAGS.levenshtein){
            const fuzzyKeywords = keywords.filter((keyword) => !exactHits.has(keyword));

            if (fuzzyKeywords.length > 0){
                const timeStart = performance.now();
                const levenshteinMatches = runLevenshtein(text, fuzzyKeywords);
                const timeElapsed = performance.now() - timeStart;
                stats.levenshtein.ms += timeElapsed;

                for (const lM of levenshteinMatches){
                    stats.levenshtein.hits++;

                    allResults.push({keyword: lM.keyword, algorithm: 'levenshtein', count: 1, executionMs: timeElapsed, nodeIndex});
                    nodeHighlights.push({start: lM.index, end: lM.index + lM.candidate.length, info: {keyword: `${lM.keyword} ≈ ${lM.candidate}`, algorithm: 'levenshtein', count: 1, executionMs: timeElapsed}});
                }
            }
        }

        // 5. Aho-Corasick
        if (ALGO_FLAGS.ahoCorasick) {
            const timeStart = performance.now();
            const ahoMatches = runAhoCorasick(upperText, keywords);
            const timeElapsed = performance.now() - timeStart;
            stats.ahoCorasick.ms += timeElapsed;

            for (const aM of ahoMatches){
                exactHits.add(aM.keyword);
                stats.ahoCorasick.hits += aM.indices.length;

                allResults.push({keyword: aM.keyword, algorithm: 'aho-corasick', count: aM.indices.length, executionMs: timeElapsed, nodeIndex});

                for (const index of aM.indices){
                    nodeHighlights.push({start: index, end: index + aM.keyword.length, info: {keyword: aM.keyword, algorithm: 'aho-corasick', count: aM.indices.length, executionMs: timeElapsed}});
                }
            }
        }

        // 6. Rabin-Karp
        if (ALGO_FLAGS.rabinKarp) {
            const timeStart = performance.now();
            const rkMatches = runRabinKarp(upperText, keywords);
            const timeElapsed = performance.now() - timeStart;
            stats.rabinKarp.ms += timeElapsed;

            for (const rK of rkMatches) {
                exactHits.add(rK.keyword);
                stats.rabinKarp.hits += rK.indices.length;

                allResults.push({keyword: rK.keyword, algorithm: 'rabin-karp', count: rK.indices.length, executionMs: timeElapsed, nodeIndex});

                for (const index of rK.indices) {
                    nodeHighlights.push({start: index, end: index + rK.keyword.length, info: {keyword: rK.keyword, algorithm: 'rabin-karp', count: rK.indices.length, executionMs: timeElapsed}});
                }
            }
        }

        if (nodeHighlights.length > 0) {
            if (blurEnabled) {
                blurTextNodeTarget(node);
            }
            highlightNode(node, nodeHighlights);
        }

        if (i % 20 === 0 || i === textNodes.length - 1) {
            await setState({ scanResults: [...allResults], algoStats: { ...stats } });
        }
    }

    await setState({ scanStatus: 'done', scanResults: allResults, algoStats: stats });
}
