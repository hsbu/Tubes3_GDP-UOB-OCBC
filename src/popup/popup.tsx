import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { AlgoCard } from './components/AlgoCard';
import { KeywordChart } from './components/KeywordChart';
import { BlurToggle } from './components/BlurToggle';
import { getState, setState, onStateChange } from '../shared/storage';
import type { StorageState } from '../shared/types';
import { INITIAL_STATE } from '../shared/types';
import './popup.css';

function Popup() {
  const [state, setStateLocal] = useState<StorageState>(INITIAL_STATE);

  useEffect(() => {
    getState().then(setStateLocal);
    const unsub = onStateChange((changes) => {
      setStateLocal((prev) => ({ ...prev, ...changes }));
    });
    return unsub;
  }, []);

  const scanning = state.scanStatus === 'scanning';

  async function handleScan() {
    await setState({ scanStatus: 'scanning', scanResults: [], algoStats: { ...INITIAL_STATE.algoStats } });
    chrome.runtime.sendMessage({ type: 'POPUP_SCAN' });
  }

  async function handleClear() {
    chrome.runtime.sendMessage({ type: 'POPUP_CLEAR' });
    await setState({ scanStatus: 'idle', scanResults: [], algoStats: { ...INITIAL_STATE.algoStats } });
  }

  async function handleBlurToggle() {
    await setState({ blurEnabled: !state.blurEnabled });
  }

  const { algoStats: s, scanResults } = state;
  const total = scanResults.reduce((sum, r) => sum + r.count, 0);

  return (
    <div>
      <div class="popup-header">
        <h1>Judol Detector</h1>
        <button class="scan-btn" onClick={handleScan} disabled={scanning}>
          {scanning ? 'Scanning...' : 'Scan Page'}
        </button>
      </div>

      <div class="total-section">
        <div class="total-count">{total}</div>
        <div class="total-label">gambling keywords found</div>
      </div>

      <div class="algo-grid">
        <AlgoCard name="KMP" hits={s.kmp.hits} ms={s.kmp.ms} />
        <AlgoCard name="Boyer-Moore" hits={s.bm.hits} ms={s.bm.ms} />
        <AlgoCard name="Regex" hits={s.regex.hits} ms={s.regex.ms} />
        <AlgoCard name="Levenshtein" hits={s.levenshtein.hits} ms={s.levenshtein.ms} />
        <AlgoCard name="Aho-Corasick" hits={s.ahoCorasick.hits} ms={s.ahoCorasick.ms} />
        <AlgoCard name="Rabin-Karp" hits={s.rabinKarp.hits} ms={s.rabinKarp.ms} />
      </div>

      <KeywordChart results={scanResults} />

      <div class="action-row">
        <BlurToggle enabled={state.blurEnabled} onToggle={handleBlurToggle} />
        <button class="action-btn" onClick={handleClear}>Clear</button>
      </div>

      <div class="status-bar">
        {state.scanStatus === 'idle' && 'Ready — click Scan Page'}
        {state.scanStatus === 'scanning' && 'Scanning page...'}
        {state.scanStatus === 'done' && `Scan complete · ${scanResults.length} keyword types`}
      </div>
    </div>
  );
}

render(<Popup />, document.getElementById('app')!);
