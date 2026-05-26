import { loadKeywords } from '../shared/keywords';
import { onStateChange } from '../shared/storage';
import { initScanner, runScan } from './scanner';
import { initTooltip } from './tooltip';
import { clearHighlights } from './highlighter';
import { clearBlur, setBlurVisibility } from './blur';


async function init(): Promise<void> {
  initTooltip();
  await loadKeywords();
  await initScanner();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'START_SCAN') {
        runScan()
            .then(() => sendResponse({ ok: true }))
            .catch((err) => {
                console.error('scan failed', err);
                sendResponse({ ok: false, error: String(err) });
            });
        return true;
    }

    if (message.type === 'CLEAR') {
        clearHighlights();
        clearBlur();
        sendResponse({ ok: true });
    }
});

onStateChange((changes) => {
    if (changes.blurEnabled !== undefined) {
        setBlurVisibility(changes.blurEnabled);
    }
});

init().catch((err) => console.error('init failed', err));