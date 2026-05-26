import { normalizeText } from '../shared/text-utils';

export interface AhoCorasickMatch {
    keyword: string;
    index: number;
}

export interface AhoCorasickResult {
    matches: AhoCorasickMatch[];
    comparisons: number;
}

export interface AhoCorasickNode {
    next: Map<string, number>;
    fail: number;
    output: string[];
}

function createNode(): AhoCorasickNode {
    return {
        next: new Map<string, number>(),
        fail: 0,
        output: [],
    };
}

function buildTrie(patterns: string[]): AhoCorasickNode[] {
    const trie: AhoCorasickNode[] = [createNode()];

    for (let i = 0; i < patterns.length; i++){
        const pattern = normalizeText(patterns[i]);

        if (pattern.length === 0){
            continue;
        }

        let current = 0;

        for (let j = 0; j < pattern.length; j++){
            const c = pattern[j];
            const nextNode = trie[current].next.get(c);

            if (nextNode === undefined){
                trie.push(createNode());
                trie[current].next.set(c, trie.length - 1);
                current = trie.length - 1;
            } else {
                current = nextNode;
            }
        }

        trie[current].output.push(pattern);
    }
    return trie;
}

function buildFailure(trie: AhoCorasickNode[]): void {
    const queue: number[] = [];

    for (const child of trie[0].next.values()){
        trie[child].fail = 0;
        queue.push(child);
    }

    let head = 0;

    while (head < queue.length){
        const current = queue[head];
        head++;
    
        for (const [char, child] of trie[current].next.entries()){
            queue.push(child);
            let failure = trie[current].fail;

            while (failure !== 0 && trie[failure].next.get(char) === undefined){
                failure = trie[failure].fail;
            }

            const nextFailure = trie[failure].next.get(char);

            if (nextFailure !== undefined){
                trie[child].fail = nextFailure;
            } else {
                trie[child].fail = 0;
            }

            const failureOut = trie[trie[child].fail].output;

            for (let i = 0; i < failureOut.length; i++){
                trie[child].output.push(failureOut[i]);
            }
        }
    }
}

export function precompute(patterns: string[]): AhoCorasickNode[] {
    const trie = buildTrie(patterns);
    buildFailure(trie);
    return trie;
}

export function ahoCorasickSearch(
    text: string,
    pattern: string[],
    automation?: AhoCorasickNode[]
): AhoCorasickResult {
    const source = normalizeText(text);
    const trie = automation === undefined ? precompute(pattern) : automation;
    const matches: AhoCorasickMatch[] = [];
    let comparisons = 0;
    let state = 0;

    for (let i = 0; i < source.length; i++){
        const c = source[i];

        while (state !== 0 && trie[state].next.get(c) === undefined){
            state = trie[state].fail;
            comparisons++;
        }

        comparisons++;
        const nextState = trie[state].next.get(c);

        if (nextState !== undefined){
            state = nextState;
        } else {
            state = 0;
        }

        for (let j = 0; j < trie[state].output.length; j++){
            const keyword = trie[state].output[j];

            matches.push({
                keyword,
                index: i - keyword.length + 1,
            });
        }
    }
    return { matches, comparisons };
}
