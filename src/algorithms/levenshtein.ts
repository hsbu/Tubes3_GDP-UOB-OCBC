import {
    extractTextCandidates,
    hasTrailingDigit,
    normalizeText,
    sameVisualGroup,
    stripTrailingDigits,
} from '../shared/text-utils';

export interface LevenshteinMatch {
    keyword: string;
    candidate: string;
    index: number;
    distance: number;
    similarity: number;
}

export interface LevenshteinResult {
    matches: LevenshteinMatch[];
    comparisons: number;
}

export interface DistanceResult {
    distance: number;
    comparisons: number;
}

export interface SimilarityResult {
    distance: number;
    similarity: number;
    comparisons: number;
}

const DEFAULT_THRESHOLD = 0.75;
const INSERT_COST = 1;
const DELETE_COST = 1;
const SUBSTITUTE_COST = 1;
const VISUAL_SUBSTITUTE_COST = 0.25;

function substitutionCost(a: string, b: string): number {
    if (a === b){
        return 0;
    }

    if (sameVisualGroup(a, b)){
        return VISUAL_SUBSTITUTE_COST;
    }
    return SUBSTITUTE_COST;
}

function min3(a: number, b: number, c: number): number {
    return Math.min(a, Math.min(b, c));
}

function comparableCandidate(candidate: string, keyword: string): string {
    if (!hasTrailingDigit(keyword)){
        const stripped = stripTrailingDigits(candidate);
        if (stripped.length > 0){
            return stripped;
        }
    }
    return candidate;

}

export function weightedLevenshteinDistance(a: string, b: string): DistanceResult {
    const s1 = normalizeText(a);
    const s2 = normalizeText(b);
    const n = s1.length;
    const m = s2.length;

    if (n === 0){
        return { distance: m, comparisons: 0 };
    }

    if (m === 0){
        return { distance: n, comparisons: 0 };
    }

    let previous = new Array<number>(m + 1).fill(0);
    let current = new Array<number>(m + 1).fill(0);

    for (let j = 0; j <= m; j++){
        previous[j] = j * INSERT_COST;
    }

    let comparisons = 0;

    for (let i = 1; i <= n; i++){
        current[0] = i * DELETE_COST;
        for (let j = 1; j <= m; j++){
            comparisons++;
            const deleteCost = previous[j] + DELETE_COST;
            const insertCost = current[j - 1] + INSERT_COST;
            const replaceCost = previous[j - 1] + substitutionCost(s1[i - 1], s2[j - 1]);
            current[j] = min3(deleteCost, insertCost, replaceCost);
        }
        const temp = previous;
        previous = current;
        current = temp;
    }
    return {
        distance: previous[m],
        comparisons,
    };
    
}

export function similarityScore(a: string, b: string): SimilarityResult {
    const result = weightedLevenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);

    if (maxLength === 0){
        return {
            distance: 0,
            similarity: 1,
            comparisons: result.comparisons,
        };
    }

    const similarity = Math.max(0, 1 - result.distance / maxLength);
    return {
        distance: result.distance,
        similarity,
        comparisons: result.comparisons,
    };
}

export function levenshteinSearch(
    text: string,
    keywords: string[],
    threshold = DEFAULT_THRESHOLD
): LevenshteinResult {
    const candidates = extractTextCandidates(text);
    const matches: LevenshteinMatch[] = [];
    let comparisons = 0;

    for (let i = 0; i < candidates.length; i++){
        for (let j = 0; j < keywords.length; j++){
            const keyword = keywords[j];

            if (keyword.length === 0){
                continue;
            }

            const compared = comparableCandidate(candidates[i].word, keyword);

            if (compared.length === 0){
                continue;
            }

            const result = similarityScore(compared, keyword);
            comparisons += result.comparisons;

            if (result.similarity >= threshold){
                matches.push({
                    keyword,
                    candidate: candidates[i].word,
                    index: candidates[i].index,
                    distance: result.distance,
                    similarity: result.similarity,
                });
            }
        }
    }
    return {matches, comparisons};
}