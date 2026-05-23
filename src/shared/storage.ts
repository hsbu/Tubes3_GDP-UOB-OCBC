import type { StorageState } from './types';
import { INITIAL_STATE } from './types';

export async function getState(): Promise<StorageState> {
  const result = await chrome.storage.local.get(null);
  return { ...INITIAL_STATE, ...result } as StorageState;
}

export async function setState(partial: Partial<StorageState>): Promise<void> {
  await chrome.storage.local.set(partial);
}

export async function resetScanState(): Promise<void> {
  await chrome.storage.local.set({
    scanStatus: 'idle',
    scanResults: [],
    algoStats: { ...INITIAL_STATE.algoStats },
  });
}

export function onStateChange(
  callback: (changes: Partial<StorageState>) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
  ) => {
    const updated: Partial<StorageState> = {};
    for (const [key, { newValue }] of Object.entries(changes)) {
      (updated as Record<string, unknown>)[key] = newValue;
    }
    callback(updated);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
