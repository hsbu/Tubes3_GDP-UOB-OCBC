export interface HighlightInfo {
  keyword: string;
  algorithm: string;
  count: number;
  execMs: number;
}

export interface HighlightMatch {
  start: number;
  end: number; // exclusive
  info: HighlightInfo;
}


function highlightClass(algorithm: string): string {
    if (algorithm === 'regex') return 'judol-highlight-regex';
    if (algorithm === 'levenshtein') return 'judol-highlight-fuzzy';
    return 'judol-highlight';
}

export function clearHighlights(): void {
    document.querySelectorAll('.judol-highlight, .judol-highlight-fuzzy, .judol-highlight-regex').forEach((element) => {
        const parent = element.parentNode;
        if (!parent) {
            return;
        }

        let safeText: string;
        if (element.textContent === null) {
            safeText = '';
        } else if (element.textContent === undefined) {
            safeText = '';
        } else {
            safeText = element.textContent;
        }

        const textNode: Text = document.createTextNode(safeText);
        parent.replaceChild(textNode, element);

        parent.normalize();
    });
}

export function highlightNode(textNode: Text, matches: HighlightMatch[]): void {
    if (matches.length === 0) {
        return;
    }

    const parent = textNode.parentNode;
    if (!parent) {
        return;
    }

    let text: string;

    if (textNode.nodeValue === null) {
        text = '';
    } else if (textNode.nodeValue === undefined) {
        text = '';
    } else {
        text = textNode.nodeValue;
    }

    const sorted = [...matches].sort((a, b) => a.start - b.start);

    const fragment = document.createDocumentFragment();
    let cursor = 0;

    for (const { start, end, info } of sorted) {
        if (start < cursor) {
            continue;
        }
        if (start > cursor) {
            fragment.appendChild(document.createTextNode(text.slice(cursor, start)));
        }

        const mark = document.createElement('mark');
        mark.className = highlightClass(info.algorithm);
        mark.textContent = text.slice(start, end);
        mark.dataset.judolInfo = JSON.stringify(info);
        
        fragment.appendChild(mark);
        cursor = end;
    }

    if (cursor < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(cursor)));
    }

    parent.replaceChild(fragment, textNode);
}

