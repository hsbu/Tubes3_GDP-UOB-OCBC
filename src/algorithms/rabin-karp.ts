import { normalizeText } from '../shared/text-utils';

export interface RKResult {
    indices: number[];
    comparisons: number;
}

export interface RKMatch {
    keyword: string;
    index: number;
}

export interface RKMultiResult {
    matches: RKMatch[];
    comparisons: number;
}

export interface RKPrecomputed {
    pattern: string;
    hash: bigint;
    power: bigint;
}

const BASE = 257n;
const MOD = 1000000007n;

function charCode(c: string): bigint {
    return BigInt(c.charCodeAt(0));
}

function normalizeHash(value: bigint): bigint {
    let result = value % MOD;

    if (result < 0n){
        result += MOD;
    }
    return result;
}

function appendHash(current: bigint, c: string): bigint {
    return normalizeHash(current * BASE + charCode(c));
}

function buildHash(text: string): bigint {
    let hash = 0n;

    for (let i = 0; i < text.length; i++){
        hash = appendHash(hash, text[i]);
    }
    return hash;
}

function buildPower(length: number): bigint {
    let power = 1n;

    for (let i = 1; i < length; i++){
        power = normalizeHash(power * BASE);
    }
    return power;
}

function rollHash(
    currentHash: bigint,
    leftChar: string,
    rightChar: string,
    power: bigint
): bigint {
    let hash = currentHash - normalizeHash(charCode(leftChar) * power);
    hash = normalizeHash(hash);
    hash = appendHash(hash, rightChar);

    return hash;
}

function verifyAt(text: string, pattern: string, start: number): {
    matched: boolean;
    comparisons: number;
} {
    let comparisons = 0;

    for (let i = 0; i < pattern.length; i++){
        comparisons++;

        if (text[start + i] !== pattern[i]){
            return {
                matched: false,
                comparisons,
            };
        }
    }

    return {
        matched: true,
        comparisons,
    };
}

export function precompute(pattern: string): RKPrecomputed {
    const normalizedPattern = normalizeText(pattern);

    return {
        pattern: normalizedPattern,
        hash: buildHash(normalizedPattern),
        power: buildPower(normalizedPattern.length),
    };
}

export function rabinKarpSearch(
    text: string,
    pattern: string,
    prepared?: RKPrecomputed
): RKResult {
    const source = normalizeText(text);
    const data = prepared === undefined ? precompute(pattern) : prepared;
    const n = source.length;
    const m = data.pattern.length;

    if (m === 0 || m > n){
        return {
            indices: [],
            comparisons: 0,
        };
    }

    const indices: number[] = [];
    let comparisons = 0;
    let textHash = buildHash(source.slice(0, m));

    for (let i = 0; i <= n - m; i++){
        comparisons++;
        if (textHash === data.hash){
            const verified = verifyAt(source, data.pattern, i);
            comparisons += verified.comparisons;

            if (verified.matched){
                indices.push(i);
            }
        }

        if (i < n - m){
            textHash = rollHash(
                textHash,
                source[i],
                source[i + m],
                data.power
            );
        }
    }
    return {indices, comparisons};
}

export function rabinKarpMultiSearch(
    text: string,
    patterns: string[]
): RKMultiResult {
    const matches: RKMatch[] = [];
    let comparisons = 0;

    for (let i = 0; i < patterns.length; i++){
        const pattern = patterns[i];

        if (pattern.length === 0){
            continue;
        }

        const result = rabinKarpSearch(text, pattern);
        comparisons += result.comparisons;

        for (let j = 0; j < result.indices.length; j++){
            matches.push({
                keyword: normalizeText(pattern),
                index: result.indices[j],
            });
        }
    }
    return {matches, comparisons};
}