import { getState, onStateChange } from '../shared/storage';
import type { MatchResult, AlgoStats } from '../shared/types';
import { DEFAULT_ALGO_STATS } from '../shared/types';

let tooltipElement: HTMLDivElement | null = null;
let cachedResults: MatchResult[] = [];
let cachedAlgoStats: AlgoStats = { ...DEFAULT_ALGO_STATS };

// Maps MatchResult.algorithm → algoStats key
const ALGO_STATS_KEY: Record<string, keyof AlgoStats> = {
    'kmp': 'kmp',
    'bm': 'bm',
    'regex': 'regex',
    'levenshtein': 'levenshtein',
    'aho-corasick': 'ahoCorasick',
    'rabin-karp': 'rabinKarp',
    'ocr': 'ocr',
};

const ALGO_LABELS: Record<string, string> = {
    'kmp': 'KMP',
    'bm': 'Boyer-Moore',
    'regex': 'Regex',
    'levenshtein': 'Levenshtein',
    'aho-corasick': 'Aho-Corasick',
    'rabin-karp': 'Rabin-Karp',
    'ocr': 'OCR',
};

function getTooltip(): HTMLDivElement {
    if (tooltipElement) {
        return tooltipElement;
    }

    tooltipElement = document.createElement('div');
    tooltipElement.id = 'judol-tooltip';
    document.body.appendChild(tooltipElement);

    return tooltipElement;
}

function getBaseKeyword(displayKeyword: string): string {
    const idx = displayKeyword.indexOf(' ≈ ');
    return idx >= 0 ? displayKeyword.slice(0, idx) : displayKeyword;
}

function buildAlgoBreakdown(displayKeyword: string, nodeIndex: number): Map<string, number> {
    const baseKeyword = getBaseKeyword(displayKeyword).toUpperCase();
    const breakdown = new Map<string, number>();
    for (const result of cachedResults) {
        if (result.keyword.toUpperCase() === baseKeyword && result.nodeIndex === nodeIndex) {
            breakdown.set(result.algorithm, (breakdown.get(result.algorithm) ?? 0) + result.count);
        }
    }
    return breakdown;
}

export function initTooltip(): void {
    const tooltip = getTooltip();

    getState().then(({ scanResults, algoStats }) => {
        cachedResults = scanResults;
        cachedAlgoStats = algoStats;
    });
    onStateChange((changes) => {
        if (changes.scanResults) cachedResults = changes.scanResults;
        if (changes.algoStats) cachedAlgoStats = changes.algoStats;
    });

    document.addEventListener('mouseover', (e) => {
        let mark: HTMLElement | null = null;
        const targetElement = e.target as Element;

        if (targetElement && typeof targetElement.closest === 'function') {
            let current: Element | null = targetElement;

            while (current !== null) {
                if (current.matches('.judol-highlight, .judol-highlight-fuzzy, .judol-highlight-regex, .judol-ocr-detected')) {
                    mark = current as HTMLElement;
                    break;
                }
                current = current.parentElement;
            }
        }

        if (!mark) {
            tooltip.style.display = 'none';
            return;
        }

        const raw = mark.dataset.judolInfo;
        if (!raw) {
            return;
        }

        try {
            const info = JSON.parse(raw) as {
                keyword: string;
                algorithm: string;
                count: number;
                nodeIndex: number;
            };

            const breakdown = buildAlgoBreakdown(info.keyword, info.nodeIndex);
            const totalCount = breakdown.size > 0
                ? [...breakdown.values()].reduce((sum, n) => sum + n, 0)
                : info.count;

            const algoRows = Object.keys(ALGO_LABELS)
                .map((algo) => {
                    const count = breakdown.get(algo) ?? 0;
                    const statsKey = ALGO_STATS_KEY[algo];
                    const ms = statsKey ? cachedAlgoStats[statsKey].ms : 0;
                    return `<div class="judol-algo-row"><span>${ALGO_LABELS[algo]}</span><span>${count}</span><span>${ms.toFixed(2)}ms</span></div>`;
                })
                .join('');

            tooltip.innerHTML = `
                <strong>${info.keyword}</strong>
                <div class="judol-occurrences">Occurrences: ${totalCount}</div>
                ${algoRows}
            `;
            tooltip.style.display = 'block';
        } catch {
            tooltip.style.display = 'none';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (tooltip.style.display === 'none') return;

        tooltip.style.left = `${e.clientX + 14}px`;
        tooltip.style.top = `${e.clientY + 14}px`;
    });
}