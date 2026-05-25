export interface BMResult {
  indices: number[];
  comparisons: number;
}

function buildLastOccurrence(pattern: string): Map<string, number> {
    const last = new Map<string, number>();
    for (let i=0; i<pattern.length; i++) {
        last.set(pattern[i], i);
    }

    return last
}

export function precompute(pattern: string): Map<string, number> {
  return buildLastOccurrence(pattern);
}

export function bmSearch(text: string, pattern: string, lastOcc?: Map<string, number>): BMResult {
    const n = text.length
    const m = pattern.length

    if ( (m === 0) || m > n) {
        return { indices: [], comparisons: 0 };
    }

   let last;

    if (lastOcc === null) {
        last = buildLastOccurrence(pattern);
    } else if (lastOcc === undefined) {
        last = buildLastOccurrence(pattern);
    } else {
        last = lastOcc;
    }
    
    const indices: number[] = [];
    
    let comparisons = 0;
    let i = (m - 1); 

    while (i < n) {
        let j = (m - 1);
        let k = i

        while (j >= 0) {
            comparisons++;
            if (pattern[j] !== text[k]) {
                break;
            }

            j--;
            k--;
        }

        if (j<0) {
            indices.push(i - m+1);
            i++;
        } else {
            let lastIdx: number;
            const temp = last.get(text[k]);

            if (temp === null) {
                lastIdx = -1;
            } else if (temp === undefined) {
                lastIdx = -1;
            } else {
                lastIdx = temp;
            }

            i += Math.max(1, (j - lastIdx))
        }
    }

    return { indices, comparisons };
}