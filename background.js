/**
 * In Manifest V3, the background script is a service worker.
 * We cannot directly use alerts/confirms here — they simply won't work.
 * We also replace chrome.browserAction with chrome.action.
 */
chrome.action.onClicked.addListener((tab) => {
  // Use the 'chrome.scripting' API to inject scripts into the page
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["vanilla-picker.min.js", "main.js"] // Adjust paths as needed
  });
});

/**
 * Listen for messages from content scripts.
 * (Replacing chrome.extension.onMessage with chrome.runtime.onMessage)
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateBadge') {
    chrome.action.setBadgeText({
      text: message.text,
      tabId: sender.tab.id
    });
    chrome.action.setBadgeBackgroundColor({
      color: "#3C1A5B",
      tabId: sender.tab.id
    });
  }
  // Always call sendResponse if you expect to keep the channel open or confirm receipt
  sendResponse({status: 'ok'});
});

/**
 * Helper: get base URL from a given string URL
 */
function getBaseURL(urlString) {
  try {
    const urlObj = new URL(urlString);
    return urlObj.origin; // e.g. "https://example.com"
  } catch (e) {
    return null;
  }
}

/**
 * Remove saved colors for the URL of the currently opened tab.
 * We cannot confirm with the user here (no alerts/confirm in service worker).
 * If you want a confirm, do it from the content script or options page.
 */
function clearColorsForActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs.length) return;
    const url = tabs[0].url;
    const base = getBaseURL(url);

    if (!base) return;

    chrome.storage.local.get(["Colorfy"], (data) => {
      if (data["Colorfy"]) {
        let storedData = JSON.parse(data["Colorfy"]) || [];
        // Find the record with the matching base URL
        const index = storedData.findIndex(item => item.url === base);
        if (index > -1) {
          storedData.splice(index, 1);
          chrome.storage.local.set({ Colorfy: JSON.stringify(storedData) }, () => {
            // Reload after clearing
            chrome.tabs.reload(tabs[0].id);
          });
        }
      }
    });
  });
}

/**
 * Create right-click option for removal of the saved changes.
 * We'll do this on extension install/update. 
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "clearColors",
    title: chrome.i18n.getMessage("pageReset"),
    contexts: ["page"]
  });
});

/**
 * Handle clicks on the context menu item
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "clearColors") {
    // In a service worker, we can't show alerts/confirms. 
    // If you still want to confirm, do it in the content script or the options page.
    clearColorsForActiveTab();
  }
});
