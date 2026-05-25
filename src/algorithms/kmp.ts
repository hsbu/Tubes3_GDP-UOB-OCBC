export interface KMPResult {
  indices: number[];
  comparisons: number;
}

function buildFailure(pattern: string): number[] {
    const n = pattern.length;
    const fail = new Array <number>(n).fill(0); // declare with 0s

    let k = 0
    for (let i = 1; i < n; i++) {
        while ( (k > 0) && (pattern[k] !== pattern[i]) ) {
            k = fail[k-1];
        }

        if (pattern[k] == pattern[i]) {
            k++;
        }

        fail[i] = k
    }
    return fail
}

// call once at load, pass result into kmpSearch later
export function precompute(pattern: string): number[] {
  return buildFailure(pattern);
}

export function kmpSearch(text: string, pattern: string, failure?: number[]): KMPResult {
    const n = text.length;
    const m = pattern.length;

    if ( (m === 0) || m > n) {
        return { indices: [], comparisons: 0 };
    }

    let fail;

    if (failure === null) {
        fail = buildFailure(pattern);
    } else if (failure === undefined) {
        fail = buildFailure(pattern);
    } else {
        fail = failure;
    }
    
    const indices: number[] = [];
    
    let comparisons = 0;
    let j = 0;

    for (let i=0; i<n; i++) {
        while ( (j>0) && (pattern[j] !== text[i])) {
            comparisons++;
            j = fail[j-1];
        }
        comparisons++;

        if (pattern[j] === text[i]) {
            j++;
        }
        if (j === m) {
            indices.push(i - m+1);
            j = fail[j-1];
        }
    }

    return {indices, comparisons};

}
