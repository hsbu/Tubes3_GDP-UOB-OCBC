const BLUR_CLASS = 'judol-blur';
const BLUR_ATTR = 'data-judol-blur-target';

function isRootElement(element: Element): boolean {
    return element === document.body || element === document.documentElement;
}

function isExtensionElement(element: Element): boolean {
    return (element.id === 'judol-tooltip' || element.classList.contains('judol-highlight') || element.classList.contains(BLUR_CLASS));
}

function isGoodBlurTarget(element: HTMLElement): boolean {
    if (isRootElement(element)){
        return false;
    }

    if (isExtensionElement(element)){
        return false;
    }

    const tagName = element.tagName;

    if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT' || tagName === 'TEXTAREA' || tagName === 'INPUT'){
        return false;
    }

    return true;
}

function getTextNodeParent(textNode: Text): HTMLElement | null {
    const parent = textNode.parentElement;

    if (parent === null){
        return null;
    }

    if (!isGoodBlurTarget(parent)){
        return null;
    }

    return parent;
}

function getHighlightParent(element: Element): HTMLElement | null {
    let current = element.parentElement;

    while (current !== null && !isRootElement(current)){
        if (isGoodBlurTarget(current)) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}

function getBlurTargetFromTextNode(textNode: Text): HTMLElement | null {
    const parent = getTextNodeParent(textNode);

    if (parent === null){
        return null;
    }

    const closestTarget = parent.closest('a, button, p, li, h1, h2, h3, h4, h5, h6, article, section, div, span');

    if (closestTarget instanceof HTMLElement && isGoodBlurTarget(closestTarget)){
        return closestTarget;
    }
    return parent;
}

export function clearBlur(): void {
    const blurredElements = document.querySelectorAll(`.${BLUR_CLASS}[${BLUR_ATTR}]`);

    blurredElements.forEach((element) => {
        clearElementBlur(element);
    });
}

export function clearElementBlur(element: Element): void {
    element.classList.remove(BLUR_CLASS);
    element.removeAttribute(BLUR_ATTR);
}

export function blurElement(element: HTMLElement): void {
    if (!isGoodBlurTarget(element)){
        return;
    }

    element.classList.add(BLUR_CLASS);
    element.setAttribute(BLUR_ATTR, 'true');
}

export function blurTextNodeTarget(textNode: Text): void {
    const target = getBlurTargetFromTextNode(textNode);

    if (target === null){
        return;
    }

    blurElement(target);
}

export function blurHighlightedTargets(): void {
    const highlights = document.querySelectorAll('.judol-highlight');

    highlights.forEach((highlight) => {
        const target = getHighlightParent(highlight);

        if (target !== null) {
            blurElement(target);
        }
    });
}

export function setBlurVisibility(enabled: boolean): void {
    if (enabled){
        blurHighlightedTargets();
    } else{
        clearBlur();
    }
}