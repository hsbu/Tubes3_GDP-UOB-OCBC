chrome.runtime.onMessage.addListener(
  (message: { type: string }, _sender, sendResponse) => {
    if (message.type !== 'POPUP_SCAN' && message.type !== 'POPUP_CLEAR') return;

    const outType = message.type === 'POPUP_SCAN' ? 'START_SCAN' : 'CLEAR';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId == null) {
        sendResponse({ ok: false, error: 'No active tab' });
        return;
      }
      chrome.tabs.sendMessage(tabId, { type: outType }, sendResponse);
    });

    return true;
  },
);
