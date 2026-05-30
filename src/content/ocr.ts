import { createWorker } from 'tesseract.js';
import { kmpSearch } from '../algorithms/kmp';
import { regexSearch } from '../algorithms/regex-match';
import { levenshteinSearch } from '../algorithms/levenshtein';
import type { MatchResult } from '../shared/types';
import { blurElement, clearElementBlur } from './blur';

const OCR_CLASS = 'judol-ocr-detected';
const OCR_ATTR = 'data-judol-ocr-target';
const MAX_IMAGES_PER_SCAN = 12;
const MIN_IMAGE_WIDTH = 80;
const MIN_IMAGE_HEIGHT = 30;

type OCRWorker = Awaited<ReturnType<typeof createWorker>>;

export interface OCRScanSummary {
    results: MatchResult[];
    hits: number;
    ms: number;
}

let workerPromise: Promise<OCRWorker> | null = null;

function getWorker(): Promise<OCRWorker> {
    if (workerPromise === null){
        workerPromise = createWorker('eng');
    }
    return workerPromise;
}

function isRecognizableImage(image: HTMLImageElement): boolean {
    if (image.classList.contains(OCR_CLASS)){
        return false;
    }
    if (!image.complete){ 
        return false;
    }
    if (image.naturalWidth < MIN_IMAGE_WIDTH || image.naturalHeight < MIN_IMAGE_HEIGHT){ 
        return false;
    }

    const source = image.currentSrc || image.src;
    if (source.trim().length === 0){
        return false;
    }

    const rect = image.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function collectImages(): HTMLImageElement[] {
    return Array.from(document.images).filter(isRecognizableImage).slice(0, MAX_IMAGES_PER_SCAN);
}

async function recognizeImage(worker: OCRWorker, image: HTMLImageElement): Promise<string> {
    try {
        const result = await worker.recognize(image);
        return result.data.text;
    } catch (imageElementError) {
        const source = image.currentSrc || image.src;
        if (source.trim().length === 0){
            throw imageElementError;
        }

        const result = await worker.recognize(source);
        return result.data.text;
    }
}

function addMatch(matches: Map<string, number>, keyword: string, count: number): void {
    if (keyword.trim().length === 0 || count <= 0){
        return;
    }
    matches.set(keyword, (matches.get(keyword) ?? 0) + count);
}

function collectKeywordMatches(text: string, keywords: string[]): Map<string, number> {
    const matches = new Map<string, number>();
    const upperText = text.toUpperCase();

    for (const keyword of keywords){
        const result = kmpSearch(upperText, keyword);
        addMatch(matches, keyword, result.indices.length);
    }

    const regexResult = regexSearch(text);
    for (const match of regexResult.matches){
        addMatch(matches, match.fullMatch.toUpperCase(), 1);
    }

    const fuzzyResult = levenshteinSearch(text, keywords);
    for (const match of fuzzyResult.matches){
        addMatch(matches, `${match.keyword} ≈ ${match.candidate}`, 1);
    }

    return matches;
}

function summarizeMatches(matches: Map<string, number>): { label: string; count: number } {
    const parts: string[] = [];
    let count = 0;

    for (const [keyword, amount] of matches.entries()) {
        parts.push(`${keyword} (${amount})`);
        count += amount;
    }

    return {
        label: parts.join(', '),
        count,
    };
}

function markImage(image: HTMLImageElement, matches: Map<string, number>, executionMs: number, blurEnabled: boolean): void {
    const summary = summarizeMatches(matches);

    image.classList.add(OCR_CLASS);
    image.setAttribute(OCR_ATTR, 'true');
    image.dataset.judolInfo = JSON.stringify({
        keyword: summary.label,
        algorithm: 'ocr',
        count: summary.count,
        executionMs,
    });
    image.title = `Judol OCR detected: ${summary.label}`;

    if (blurEnabled){
        blurElement(image);
    }
}

export function clearOcrDetections(): void {
    document.querySelectorAll(`.${OCR_CLASS}[${OCR_ATTR}]`).forEach((element) => {
        element.classList.remove(OCR_CLASS);
        element.removeAttribute(OCR_ATTR);
        clearElementBlur(element);

        if (element instanceof HTMLElement) {
            delete element.dataset.judolInfo;
            element.removeAttribute('title');
        }
    });
}

export async function runOCRScan(keywords: string[], blurEnabled: boolean): Promise<OCRScanSummary> {
    const start = performance.now();
    const images = collectImages();
    const results: MatchResult[] = [];
    let hits = 0;

    if (images.length === 0 || keywords.length === 0){
        return { results, hits, ms: performance.now() - start };
    }

    const worker = await getWorker();

    for (let imageIndex = 0; imageIndex < images.length; imageIndex++){
        const image = images[imageIndex];
        const imageStart = performance.now();

        try {
            const text = await recognizeImage(worker, image);
            const normalizedText = text.trim();

            if (normalizedText.length === 0) continue;

            const matches = collectKeywordMatches(normalizedText, keywords);
            if (matches.size === 0) continue;

            const executionMs = performance.now() - imageStart;
            markImage(image, matches, executionMs, blurEnabled);

            for (const [keyword, count] of matches.entries()) {
                hits += count;
                results.push({keyword, algorithm: 'ocr', count, executionMs, nodeIndex: imageIndex});
            }
        } catch (error) {
            console.warn('OCR failed for image', image.currentSrc || image.src, error);
        }
    }

    return {results, hits, ms: performance.now() - start};
}
