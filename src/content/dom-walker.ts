export interface TextNodeEntry {
  node: Text;
  text: string;
  nodeIndex: number;
}

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 
  'TEXTAREA', 'CODE', 'PRE', 'SVG',
]);

export function walkTextNodes(root: Node = document.body): TextNodeEntry[] {
    const results: TextNodeEntry[] = [];
    let index = 0;

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parentElm = node.parentElement;
                
                if (!parentElm) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (SKIP_TAGS.has(parentElm.tagName)) {
                    return NodeFilter.FILTER_REJECT
                }
                if (parentElm.classList.contains('judol-highlight')) {
                    return NodeFilter.FILTER_REJECT;
                }
                

                let shouldSkip = false;
                const rawValue = node.nodeValue;

                if (rawValue === null) {
                    shouldSkip = true;
                } else if (rawValue === undefined) {
                    shouldSkip = true;
                } else {
                    const trimmedValue = rawValue.trim();
                    if (trimmedValue.length < 2) {
                        shouldSkip = true;
                    }
                }

                if (shouldSkip) {
                    return NodeFilter.FILTER_SKIP;
                }

                return NodeFilter.FILTER_ACCEPT;
            },
        },
    );

    
    let current: Node | null;

    while ((current = walker.nextNode())) {
        let text: string;

        if (current.nodeValue === null) {
            text = '';
        } else if (current.nodeValue === undefined) {
            text = '';
        } else {
            text = current.nodeValue;
        }

        results.push({ node: current as Text, text, nodeIndex: index++ });
    }

    return results;
}