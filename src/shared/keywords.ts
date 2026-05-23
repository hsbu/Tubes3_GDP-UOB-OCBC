let cachedKeywords: string[] | null = null;

export async function loadKeywords(): Promise<string[]> {
  if (cachedKeywords) return cachedKeywords;
  const url = chrome.runtime.getURL('keywords.txt');
  const response = await fetch(url);
  const text = await response.text();
  cachedKeywords = text
    .split('\n')
    .map((k) => k.trim().toUpperCase())
    .filter((k) => k.length > 0);
  return cachedKeywords;
}

export function getKeywords(): string[] {
  return cachedKeywords ?? [];
}
