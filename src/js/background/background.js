/**
 * In Manifest V3, the background script is a service worker.
 * We cannot directly use alerts/confirms here — they simply won't work.
 * We also replace chrome.browserAction with chrome.action.
 */

// Initialize storage versioning when service worker starts
chrome.runtime.onStartup.addListener(() => {
  initializeStorage();
});

chrome.runtime.onInstalled.addListener((details) => {
  initializeStorage();
  
  // Run migration on install or update
  if (details.reason === 'install' || details.reason === 'update') {
    runMigrationInBackground();
  }
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

// Run migration in background script context
function runMigrationInBackground() {
  // Import the storageVersioning script if not already loaded
  try {
    if (typeof importScripts !== 'undefined') {
      importScripts('src/js/modules/storageVersioning.js');
    }
  } catch (e) {
    // Script may already be loaded
  }

  // Check if migration is needed
  chrome.storage.local.get(['Colorfy_Storage_Version', 'Colorfy'], (data) => {
    const currentVersion = data['Colorfy_Storage_Version'] || 1;
    const CURRENT_STORAGE_VERSION = 2;
    
    if (currentVersion < CURRENT_STORAGE_VERSION && data['Colorfy']) {
      // Run v1 to v2 migration
      migrateV1toV2Background(() => {
        // Set version after migration
        chrome.storage.local.set({ 'Colorfy_Storage_Version': CURRENT_STORAGE_VERSION });
      });
    }
  });
}

// Background version of v1 to v2 migration
function migrateV1toV2Background(callback) {
  chrome.storage.local.get(['Colorfy', 'Colorfy_Styles'], (data) => {
    // If v2 format already exists, skip migration
    if (data['Colorfy_Styles']) {
      callback();
      return;
    }
    
    // If no legacy data, skip migration
    if (!data['Colorfy']) {
      callback();
      return;
    }
    
    try {
      const legacyData = JSON.parse(data['Colorfy']);
      const newStylesData = {};
      
      // Handle both array and object legacy formats
      let urlDataArray = [];
      if (Array.isArray(legacyData)) {
        urlDataArray = legacyData;
      } else if (typeof legacyData === 'object' && legacyData !== null) {
        urlDataArray = Object.values(legacyData);
      }
      
      // Convert each URL's data to new format
      urlDataArray.forEach(urlData => {
        if (urlData && urlData.url && urlData.elements && Array.isArray(urlData.elements)) {
          const baseUrl = getBaseUrlFromLegacy(urlData.url);
          
          newStylesData[baseUrl] = {
            styles: [
              {
                id: 'original',
                name: 'Original',
                elements: [],
                isOriginal: true,
                createdAt: new Date().toISOString()
              },
              {
                id: 'style_1',
                name: 'Style 1',
                elements: urlData.elements,
                isOriginal: false,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
              }
            ],
            activeStyle: urlData.elements.length > 0 ? 'style_1' : 'original',
            migrated: true,
            migratedAt: new Date().toISOString()
          };
        }
      });
      
      // Save new format and backup
      chrome.storage.local.set({
        'Colorfy_Styles': JSON.stringify(newStylesData),
        'Colorfy_Migration_Backup': data['Colorfy']
      }, () => {
        // Remove legacy data after successful migration
        chrome.storage.local.remove(['Colorfy'], callback);
      });
      
    } catch (e) {
      callback(); // Continue anyway
    }
  });
}

// Helper function for background script
function getBaseUrlFromLegacy(url) {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      // Use host (includes port) instead of hostname to match current system
      return `${urlObj.protocol}//${urlObj.host}`;
    }
    
    // Handle file:// URLs (local files)
    if (url.startsWith('file://')) {
      // For file URLs, we use "file://" as the base since there's no hostname
      return 'file://';
    }
    
    if (url.includes('.')) {
      return `https://${url.split('/')[0]}`;
    }
    return url;
  } catch (e) {
    return url;
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
  } else if (message.type === 'openOptionsPage') {
    // Open the extension's options page
    chrome.runtime.openOptionsPage();
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
 * Switch to Original style for the current tab's website
 * This allows users to quickly see the unmodified webpage
 */
function switchToOriginalStyle(tab) {
  // Check if URL is valid
  if (!isValidUrl(tab.url)) {
    return;
  }
  
  const baseUrl = getBaseURL(tab.url);
  if (!baseUrl) return;

  chrome.storage.local.get(["Colorfy_Styles"], (data) => {
    if (data["Colorfy_Styles"]) {
      try {
        const stylesData = JSON.parse(data["Colorfy_Styles"]);
        
        // Check if this website has styles
        if (stylesData[baseUrl] && stylesData[baseUrl].styles) {
          // Set active style to 'original'
          stylesData[baseUrl].activeStyle = 'original';
          
          // Save updated data
          chrome.storage.local.set({ 
            "Colorfy_Styles": JSON.stringify(stylesData) 
          }, () => {
            // Send message to content script to update the page
            chrome.tabs.sendMessage(tab.id, { 
              type: 'switchToOriginal',
              baseUrl: baseUrl 
            }, (response) => {
              if (chrome.runtime.lastError) {
                // Content script might not be loaded, reload the page
                chrome.tabs.reload(tab.id).catch((error) => {
                  // Could not reload tab
                });
              }
            });
          });
        } else {
          // No custom styles exist for this site, page is already original
          // Optionally show a notification that no custom styles exist
        }
      } catch (error) {
        console.error('Error switching to original style:', error);
      }
    }
  });
}

/**
 * Create right-click option to switch to Original style
 * This allows users to quickly toggle between their custom styles and the original webpage
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "switchToOriginal",
    title: chrome.i18n.getMessage("switchToOriginal"),
    contexts: ["page"]
  });
});

/**
 * Handle clicks on the context menu item
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "switchToOriginal") {
    switchToOriginalStyle(tab);
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
