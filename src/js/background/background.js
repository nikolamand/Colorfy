/**
 * In Manifest V3, the background script is a service worker.
 * We cannot directly use alerts/confirms here — they simply won't work.
 * We also replace chrome.browserAction with chrome.action.
 */

// Initialize storage versioning when service worker starts
chrome.runtime.onStartup.addListener(() => {
  initializeStorage();
});

chrome.runtime.onInstalled.addListener(() => {
  initializeStorage();
});

// Initialize storage versioning
async function initializeStorage() {
  try {
    // Import storage versioning module
    importScripts('storageVersioning.js');
    
    // Note: Since we can't import ES modules in service workers easily,
    // we'll handle versioning in content scripts instead
  } catch (error) {
    // Storage versioning will be handled by content scripts
  }
}
chrome.action.onClicked.addListener((tab) => {
  // Check if the tab URL is valid for script injection
  if (!isValidUrl(tab.url)) {
    return;
  }

  // Content scripts are already injected via manifest.json
  // Just send a message to activate the extension UI
  chrome.tabs.sendMessage(tab.id, { type: 'showColorPicker' }, (response) => {
    if (chrome.runtime.lastError) {
      // Fallback: inject scripts if content scripts haven't loaded
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          "src/lib/vanilla-picker.min.js", 
          "src/js/modules/colorUtils.js",
          "src/js/modules/elementSelection.js", 
          "src/js/modules/storage.js",
          "src/js/modules/uiComponents.js",
          "src/js/modules/paletteManager.js",
          "src/js/content/backend.js",
          "src/js/content/main.js"
        ]
      }).catch((error) => {
        // Script injection failed, extension may not work on this page
      });
    }
  });
});

/**
 * Update extension state based on active tab
 */
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    
    if (isValidUrl(tab.url)) {
      // Enable extension for valid URLs
      chrome.action.setTitle({
        title: "Colorfy - Click to change colors on this page",
        tabId: tab.id
      });
    } else {
      // Show disabled state for invalid URLs
      chrome.action.setTitle({
        title: "Colorfy - Cannot run on this page", 
        tabId: tab.id
      });
    }
  });
});

/**
 * Update extension state when tab URL changes
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only update when the URL has changed
  if (changeInfo.url) {
    if (isValidUrl(changeInfo.url)) {
      chrome.action.setTitle({
        title: "Colorfy - Click to change colors on this page",
        tabId: tabId
      });
    } else {
      chrome.action.setTitle({
        title: "Colorfy - Cannot run on this page", 
        tabId: tabId
      });
    }
  }
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
    
    const tab = tabs[0];
    const url = tab.url;
    
    // Check if URL is valid
    if (!isValidUrl(url)) {
      return;
    }
    
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
            // Reload after clearing (only if it's a valid URL)
            chrome.tabs.reload(tab.id).catch((error) => {
              // Could not reload tab, but clearing was successful
            });
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

/**
 * Check if URL is valid for script injection
 * @param {string} url - The tab URL to check
 * @returns {boolean} - True if URL is valid for script injection
 */
function isValidUrl(url) {
  if (!url) return false;
  
  // List of URL patterns that should be blocked
  const blockedPatterns = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'moz-extension://',
    'chrome-search://',
    'chrome-devtools://'
  ];
  
  // Check if URL starts with any blocked pattern
  return !blockedPatterns.some(pattern => url.startsWith(pattern));
}
