/**
 * Main entry point for Colorfy extension
 * This file coordinates the different modules and initializes the extension
 */

(function () {
  // Initialize storage versioning first
  const initStorageVersioning = () => {
    // Only initialize if not already done
    if (!window.COLORFY_STORAGE_INITIALIZED) {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('src/js/modules/storageVersioning.js');
      document.head.appendChild(script);
      
      script.onload = () => {
        if (window.initializeStorageVersioning) {
          window.initializeStorageVersioning();
        }
      };
    } else {
      // Storage versioning already initialized
    }
  };

  /**
   * Initialize the script: load CSS, add event listeners in a "selection mode"
   */
  const init = () => {
    // Initialize storage versioning first
    initStorageVersioning();
    // CSS is already loaded via manifest.json content_scripts
    // No need to load it again here

    // Load Google Icons
    const googleIcons = document.createElement("link");
    googleIcons.rel = "stylesheet";
    googleIcons.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
    document.body.appendChild(googleIcons);

    // Load dev mode setting
    loadDevMode();

    // Apply gradient preferences from storage
    applyGradientOption();

    // Initialize the style management system
    if (window.initializeStyles) {
      window.initializeStyles(() => {
        // Apply the current active style on page load
        const currentStyle = window.getCurrentStyle();
        if (currentStyle && !currentStyle.isOriginal && currentStyle.elements.length > 0) {
          if (window.getSavedChanges) {
            window.getSavedChanges(currentStyle.elements);
          }
        }
      });
    }

    // Just initialize but don't start selection mode automatically
    // Selection mode should only start when user clicks extension icon
    if (!document.getElementById("colorfy_check")) {
      // Don't add listeners or set selection mode on init
      // addListeners();
      // setSelectionMode(true);
    }
  };

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'showColorPicker') {
      // Extension is activated, start element selection
      // Only add listeners if not already added
      if (!document.getElementById("colorfy_check")) {
        addListeners();
      }
      setSelectionMode(true);
      sendResponse({ status: 'ready' });
    }
  });

  // Boot up
  init();
})();
