export interface TextCandidate {
    word: string;
    index: number;
}

const VISUAL_GROUPS: string[][] = [
    ['A', '4', '@', 'Α', 'А'],
    ['B', '8'],
    ['E', '3', 'Ε', 'Е'],
    ['G', '6'],
    ['I', '1', 'L', '|', '!', 'Ι', 'І'],
    ['O', '0', 'Ο', 'О'],
    ['S', '5', '$'],
    ['T', '7'],
    ['Z', '2'],
    ['C', '(', 'С'],
    ['V', '\/', 'Ѵ', 'Ѷ'],
    ['X', 'Χ', 'Х'],
    ['g', '9', 'ɡ', 'ɢ', 'Ԍ', 'ԍ'],
    ['R', 'Я']
];

export function normalizeChar(c: string): string {
    return c.toUpperCase();
}

export function normalizeText(text: string): string {
    let result = '';

    for (let i = 0; i < text.length; i++){
        result += normalizeChar(text[i]);
    }
    return result;

}

export function isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
}

export function isAsciiLetter(c: string): boolean {
    const upper = normalizeChar(c);
    return upper >= 'A' && upper <= 'Z';
}

export function isUnicodeLetter(c: string): boolean {
    return c.toLowerCase() !== c.toUpperCase();
}

export function isVisualLookalikeChar(c: string): boolean {
    const target = normalizeChar(c);

    for (let i = 0; i < VISUAL_GROUPS.length; i++){
        for (let j = 0; j < VISUAL_GROUPS[i].length; j++){
            if (normalizeChar(VISUAL_GROUPS[i][j]) === target){
                return true;
            }
        }
    }
    return false;
}

export function sameVisualGroup(a: string, b: string): boolean {
    const ca = normalizeChar(a);
    const cb = normalizeChar(b);

    for (let i = 0; i < VISUAL_GROUPS.length; i++){
        let foundA = false;
        let foundB = false;

        for (let j = 0; j < VISUAL_GROUPS[i].length; j++){
            const current = normalizeChar(VISUAL_GROUPS[i][j]);

            if (current === ca){
                foundA = true;
            }

            if (current === cb){
                foundB = true;
            }
        }

        if (foundA && foundB){
            return true;
        }
    }
    return false;

}

export function isCandidateChar(c: string): boolean {
    return (
        isAsciiLetter(c) || isDigit(c) || isUnicodeLetter(c) || isVisualLookalikeChar(c)
    );
}

export function stripTrailingDigits(text: string): string {
    let last = text.length - 1;

    while (last >= 0 && isDigit(text[last])){
        last--;
    }

    return text.slice(0, last + 1);
}

export function hasTrailingDigit(text: string): boolean {
    if (text.length === 0){
        return false;
    }

    return isDigit(text[text.length - 1]);
}

export function extractTextCandidates(text: string): TextCandidate[] {
    const candidates: TextCandidate[] = [];
    let start = -1;
    let current = '';

    for (let i = 0; i < text.length; i++){
        const c = text[i];

        if (isCandidateChar(c)){
            if (start === -1){
                start = i;
            }

            current += c;
        } else {
            if (start !== -1 && current.length > 0){
                candidates.push({
                    word: current,
                    index: start,
                });
            }

            start = -1;
            current = '';
        }
    }

    if (start !== -1 && current.length > 0){
        candidates.push({
            word: current,
            index: start,
        });
    }

    return candidates;
}