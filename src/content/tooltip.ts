let tooltipElement : HTMLDivElement | null = null;

function getTooltip(): HTMLDivElement {
    if (tooltipElement) {
        return tooltipElement;
    }

    tooltipElement = document.createElement('div');
    tooltipElement.id = 'judol-tooltip';
    document.body.appendChild(tooltipElement);

    return tooltipElement;
}

export function initTooltip(): void {
    const tooltip = getTooltip();

    document.addEventListener('mouseover', (e) => {
        let mark: HTMLElement | null = null;
        const targetElement = e.target as Element;

        if (targetElement && typeof targetElement.closest === 'function') {
            let current: Element | null = targetElement;
            
            while (current !== null) {
                if (current.matches('.judol-highlight')) {
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
                execMs: number;
            };

            tooltip.innerHTML = `
                <strong>${info.keyword}</strong>
                <div>Algorithm: ${info.algorithm.toUpperCase()}</div>
                <div>Occurrences: ${info.count}</div>
                <div>Time: ${Number(info.execMs).toFixed(2)}ms</div>
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