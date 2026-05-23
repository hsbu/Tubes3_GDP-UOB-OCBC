export interface RegexMatch {
  word: string;
  digits: string;
  fullMatch: string;
  index: number;
}

export interface RegexResult {
  matches: RegexMatch[];
  comparisons: number;
}

// Map number to alphabet that looks similar
const LOOKALIKE: Record<string, string> = {
  '0': 'O', '1': 'I', '3': 'E', '4': 'A', '5': 'S', '6': 'G', '7': 'T',
};

function normalizeLookalikes(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((c) => LOOKALIKE[c] ?? c)
    .join('');
}

const RAW_PATTERN = /([A-Za-z][A-Za-z]*)(\d{2,})/g;

function extractMatches(source: string, originalText: string, offset = 0): RegexMatch[] {
  const pattern = new RegExp(RAW_PATTERN.source, 'g');
  const results: RegexMatch[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(source)) !== null) {
    results.push({
      word: m[1],
      digits: m[2],
      fullMatch: originalText.slice(m.index + offset, m.index + offset + m[0].length),
      index: m.index + offset,
    });
  }
  return results;
}

export function regexSearch(text: string): RegexResult {
  let comparisons = text.length;
  const seen = new Set<number>();
  const matches: RegexMatch[] = [];

  // Matched the original text
  for (const m of extractMatches(text, text)) {
    seen.add(m.index);
    matches.push(m);
  }

  // Matched the normalized text (G4C0R99 = GACOR99)
  const normalized = normalizeLookalikes(text);
  comparisons += normalized.length;
  for (const m of extractMatches(normalized, text)) {
    if (!seen.has(m.index)) {
      seen.add(m.index);
      matches.push(m);
    }
  }

  return { matches, comparisons };
}
