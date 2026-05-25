import { loadKeywords } from '../shared/keywords';
import { onStateChange } from '../shared/storage';
import { initScanner, runScan } from './scanner';
import { initTooltip } from './tooltip';


async function init(): Promise<void> {
  initTooltip();
  await loadKeywords();
  await initScanner();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'scan') {
        runScan()
            .then(() => sendResponse({ ok: true}))
            .catch((err) => {
                console.error('scan failed', err);
                sendResponse({ ok: false, error: String(err) });
            });
        return true;
    }
});

onStateChange((_changes) => {

});

init().catch((err) => console.error('init failed', err));