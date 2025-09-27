/**
 * UI Components management for Colorfy extension
 */

// UI state variables
let modalWrapper = null;
let paletteWrapper = null;
let colorsWrapper = null;
let devMode = false; // Dev mode flag - false by default

/**
 * Load dev mode setting from storage
 */
const loadDevMode = () => {
  chrome.storage.local.get("Colorfy_devMode", (data) => {
    devMode = data.Colorfy_devMode || false; // Default to false
  });
};

/**
 * Set dev mode and save to storage
 */
const setDevMode = (enabled) => {
  devMode = enabled;
  chrome.storage.local.set({ Colorfy_devMode: enabled });
  
  // Update UI immediately if button exists
  const savedItemsButton = document.getElementById("saved_items_button");
  if (savedItemsButton) {
    if (enabled) {
      savedItemsButton.style.setProperty('display', 'flex', 'important');
    } else {
      savedItemsButton.style.setProperty('display', 'none', 'important');
    }
  }
};

/**
 * Get current dev mode status
 */
const getDevMode = () => devMode;

/**
 * Create and show the main palette wrapper with overlay
 */
const createPaletteWrapper = (callback) => {
  getPreviouslySavedColors();
  
  // Load dev mode setting and create UI after it's loaded
  chrome.storage.local.get("Colorfy_devMode", (data) => {
    devMode = data.Colorfy_devMode || false; // Default to false
    createPaletteWrapperInternal(callback);
  });
};

/**
 * Internal function to create the palette wrapper after dev mode is loaded
 */
const createPaletteWrapperInternal = (callback) => {
  // Initialize styles first, then ensure styles exist - with retry logic for loading order
  const initializeStylesWithRetry = (retryCount = 0) => {
    if (window.initializeStyles && typeof window.initializeStyles === 'function') {
      window.initializeStyles(() => {
        // Now ensure styles exist (lazy creation)
        if (window.ensureStylesExist && typeof window.ensureStylesExist === 'function') {
          window.ensureStylesExist(() => {
            createPaletteElements(callback);
          });
        } else {
          console.error('ensureStylesExist function not available');
          createPaletteElements(callback);
        }
      });
    } else if (retryCount < 10) {
      // Retry after a short delay if not loaded yet
      setTimeout(() => initializeStylesWithRetry(retryCount + 1), 100);
    } else {
      console.error('initializeStyles function not available after retries, proceeding without style initialization');
      createPaletteElements(callback);
    }
  };
  
  initializeStylesWithRetry();
};

/**
 * Create the palette elements
 */
const createPaletteElements = (callback) => {
  // Semi-transparent overlay
  modalWrapper = document.createElement("div");
  modalWrapper.id = "colorfy_modal";
  modalWrapper.className = "colorfy_modal__Colorfy";
  document.body.appendChild(modalWrapper);
  modalWrapper.addEventListener("click", closeColorfy, false);

  // The main palette container
  paletteWrapper = document.createElement("div");
  paletteWrapper.id = "palette_wrapper";
  paletteWrapper.className = "palette_wrapper__Colorfy";
  document.body.appendChild(paletteWrapper);

  // Close button
  const closeBtn = document.createElement("span");
  closeBtn.className = "closeColorfy__Colorfy";
  closeBtn.innerHTML = "&times;";
  closeBtn.title = chrome.i18n.getMessage("closeButton");
  closeBtn.onclick = closeColorfy;
  paletteWrapper.appendChild(closeBtn);

  // Create style selector
  if (window.createStyleSelector) {
    window.createStyleSelector(paletteWrapper);
  }

  // Add storage warning if needed
  checkAndShowStorageWarning(paletteWrapper).catch((error) => {
    console.error('❌ checkAndShowStorageWarning failed:', error);
  });

  // Container for background/text color pickers
  colorsWrapper = document.createElement("div");
  colorsWrapper.id = "colors_wrapper";
  colorsWrapper.className = "colors_wrapper__Colorfy";
  paletteWrapper.appendChild(colorsWrapper);

  // Confirmation button
  const selectBtn = document.createElement("button");
  selectBtn.id = "colorfy_submit";
  selectBtn.className = "colorfy_submit__Colorfy";
  selectBtn.innerHTML = chrome.i18n.getMessage("okButton");
  selectBtn.onclick = selectedChanges;
  paletteWrapper.appendChild(selectBtn);

  // Advanced changes toggle (only show in dev mode)
  const savedItemsButton = document.createElement("div");
  savedItemsButton.id = "saved_items_button";
  savedItemsButton.className = "saved_items_button__Colorfy";
  savedItemsButton.innerHTML = `<span class="material-symbols-outlined">manufacturing</span>`;
  savedItemsButton.title = chrome.i18n.getMessage("advancedChanges");
  // Use the loaded devMode value and use !important to override CSS
  if (devMode) {
    savedItemsButton.style.setProperty('display', 'flex', 'important');
  } else {
    savedItemsButton.style.setProperty('display', 'none', 'important');
  }
  paletteWrapper.appendChild(savedItemsButton);

  applyColorSchemeOption();
  // Build advanced changes UI
  addSavedItems();
  
  // Update editing state based on current style
  if (window.updateEditingState) {
    window.updateEditingState();
  }
  
  // Call callback after all UI is created
  if (callback && typeof callback === 'function') {
    callback();
  }
};

/**
 * Apply the stored color scheme option to the UI
 */
const applyColorSchemeOption = () => {
  chrome.storage.local.get("Colorfy_colorScheme", (data) => {
    if (data.Colorfy_colorScheme) {
      const actualScheme =
        data.Colorfy_colorScheme === "system"
          ? getSystemTheme()
          : data.Colorfy_colorScheme;

      // Remove existing scheme classes
      paletteWrapper.classList.remove(
        "Colorfy_dark-scheme",
        "Colorfy_light-scheme"
      );

      // Add the class corresponding to the actual scheme
      paletteWrapper.classList.add(`Colorfy_${actualScheme}-scheme`);
    } else {
      const actualScheme = getSystemTheme();
      paletteWrapper.classList.add(`Colorfy_${actualScheme}-scheme`);
    }
  });
};

/**
 * Build the UI for advanced changes (saved elements, manual edits, etc.)
 */
const addSavedItems = () => {
  const optionsWrapper = document.createElement("div");
  optionsWrapper.id = "options_wrapper";
  optionsWrapper.className = "options_wrapper__Colorfy";
  paletteWrapper.appendChild(optionsWrapper);

  // The "Add New Item" panel
  const manualInputWrapper = document.createElement("div");
  manualInputWrapper.id = "manual_input_wrapper";
  manualInputWrapper.className = "manual_input_wrapper__Colorfy";
  optionsWrapper.appendChild(manualInputWrapper);

  // Helper function to create label + input
  const addNewLabelElement = (labelText) => {
    const labelEl = document.createElement("label");
    labelEl.innerHTML = labelText;
    labelEl.className = "input_label__Colorfy";
    return labelEl;
  };
  const addInputElement = (id) => {
    const inputEl = document.createElement("input");
    inputEl.id = id;
    inputEl.className = "manual_input_elment__Colorfy";
    return inputEl;
  };

  // Element name
  manualInputWrapper.appendChild(addNewLabelElement("Element name:"));
  const manualInputNode = addInputElement("manual_input_node");
  manualInputWrapper.appendChild(manualInputNode);

  // Background
  manualInputWrapper.appendChild(addNewLabelElement("Background:"));
  const manualInputBackground = addInputElement("manual_input_background");
  manualInputWrapper.appendChild(manualInputBackground);

  // Text color
  manualInputWrapper.appendChild(addNewLabelElement("Text color:"));
  const manualInputColor = addInputElement("manual_input_color");
  manualInputWrapper.appendChild(manualInputColor);

  // Class
  manualInputWrapper.appendChild(addNewLabelElement("Class:"));
  const manualInputClass = addInputElement("manual_input_class");
  manualInputWrapper.appendChild(manualInputClass);

  // ID
  manualInputWrapper.appendChild(addNewLabelElement("Id:"));
  const manualInputId = addInputElement("manual_input_id");
  manualInputWrapper.appendChild(manualInputId);

  // Add/Cancel buttons
  const manualButtonsWrapper = document.createElement("div");
  manualButtonsWrapper.className = "manual_buttons_wrapper__Colorfy";
  manualInputWrapper.appendChild(manualButtonsWrapper);

  const manualInputAdd = document.createElement("div");
  manualInputAdd.id = "manual_input_add";
  manualInputAdd.className = "manual_input_add__Colorfy";
  manualInputAdd.innerHTML = `<span class="material-symbols-outlined">check_circle</span>`;
  manualInputAdd.title = chrome.i18n.getMessage("addItem");
  manualButtonsWrapper.appendChild(manualInputAdd);

  const manualInputCancel = document.createElement("div");
  manualInputCancel.id = "manual_input_cancel";
  manualInputCancel.className = "manual_input_cancel__Colorfy";
  manualInputCancel.innerHTML = `<span class="material-symbols-outlined">cancel</span>`;
  manualInputCancel.title = chrome.i18n.getMessage("cancelButton");
  manualButtonsWrapper.appendChild(manualInputCancel);

  // Show/hide "Add New Item"
  const manualInputShow = document.createElement("div");
  manualInputShow.id = "manual_input_show";
  manualInputShow.className = "manual_input_show__Colorfy";
  manualInputShow.title = chrome.i18n.getMessage("addNewItem");
  manualInputShow.innerHTML = `<span class="material-symbols-outlined">add_circle</span>`;
  optionsWrapper.appendChild(manualInputShow);

  manualInputShow.addEventListener("click", () => {
    manualInputWrapper.style.display = "flex";
    manualInputShow.style.display = "none";
  });
  manualInputCancel.addEventListener("click", () => {
    manualInputWrapper.style.display = "none";
    manualInputShow.style.display = "block";
  });

  // Handle adding new item manually
  manualInputAdd.addEventListener("click", () => {
    const manualObject = {
      nodeName: manualInputNode.value.trim() || "",
      background: manualInputBackground.value.trim() || "",
      color: manualInputColor.value.trim() || "",
      className: manualInputClass.value.trim() || "",
      id: manualInputId.value.trim() || "",
    };
    // Clear input fields
    manualInputNode.value = "";
    manualInputBackground.value = "";
    manualInputColor.value = "";
    manualInputClass.value = "";
    manualInputId.value = "";

    // Save & re-render
    manualAdd(manualObject);

    manualInputWrapper.style.display = "none";
    manualInputShow.style.display = "block";
  });

  // A wrapper for saved elements (to display them)
  const savedElementsWrapper = document.createElement("div");
  savedElementsWrapper.className = "saved_items_wrapper__Colorfy";
  savedElementsWrapper.id = "saved_items_wrapper";
  optionsWrapper.appendChild(savedElementsWrapper);

  // When user clicks the gear icon, toggle advanced changes
  document.getElementById("saved_items_button").onclick = () => {
    if (window.getComputedStyle(optionsWrapper).display === "none") {
      optionsWrapper.style.display = "block";
    } else {
      optionsWrapper.style.display = "none";
    }
    refreshAndDisplaySavedElements(savedElementsWrapper);

    // Move the options wrapper if it's out of viewport
    const rect = optionsWrapper.getBoundingClientRect();
    const fullyInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <=
        (window.innerWidth || document.documentElement.clientWidth);

    if (fullyInViewport) {
      optionsWrapper.style.setProperty("position", "initial", "important");
      optionsWrapper.style.setProperty("width", "100%", "important");
      optionsWrapper.style.setProperty("top", "0", "important");
    } else {
      optionsWrapper.style.setProperty("position", "absolute", "important");
      optionsWrapper.style.setProperty(
        "width",
        "calc(100% - 20px)",
        "important"
      );
      optionsWrapper.style.setProperty("top", "10px", "important");

      const closeOptionsBtn = document.createElement("span");
      closeOptionsBtn.className = "close_options__Colorfy";
      closeOptionsBtn.innerHTML = `<span class="material-symbols-outlined">close</span>`;
      closeOptionsBtn.title = chrome.i18n.getMessage("closeAdvancedChanges");
      closeOptionsBtn.onclick = closeColorfy;
      optionsWrapper.appendChild(closeOptionsBtn);

      closeOptionsBtn.onclick = () => {
        document.getElementById("saved_items_button").click();
      };
    }
  };

  loadSavedElements();
};

/**
 * Remove the colorfy UI and event listeners
 */
const closeColorfy = () => {
  if (paletteWrapper) {
    document.body.removeChild(paletteWrapper);
  }
  if (modalWrapper) {
    document.body.removeChild(modalWrapper);
  }
  const warning = document.getElementById("colorfy_impossible");
  if (warning) {
    document.body.removeChild(warning);
  }
  removeListeners();
  setSelectionMode(false);
};

/**
 * Get the UI wrapper references for other modules
 */
const getUIReferences = () => ({
  modalWrapper,
  paletteWrapper,
  colorsWrapper
});

/**
 * Set UI wrapper references (used by other modules)
 */
const setUIReferences = (refs) => {
  modalWrapper = refs.modalWrapper;
  paletteWrapper = refs.paletteWrapper;
  colorsWrapper = refs.colorsWrapper;
};

/**
 * Get current storage usage statistics (copied from storageVersioning.js)
 */
const getStorageStats = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      const jsonString = JSON.stringify(items);
      const bytes = new Blob([jsonString]).size;
      
      // TEMPORARY: Lower limits for testing (remove after testing)
      // const maxBytes = 5 * 1024; // 5KB limit for testing (normally 10MB)
      // const testingMode = true; // Set to false for production
      
      // Normal production limits (commented out for testing)
      const maxBytes = 10 * 1024 * 1024; // 10MB limit for chrome.storage.local
      const testingMode = false;
      
      const usagePercent = Math.round((bytes / maxBytes) * 100);
      const warningThreshold = testingMode ? 60 : 80; // 60% for testing, 80% for production
      const isNearLimit = usagePercent >= warningThreshold;
      
      resolve({
        usedBytes: bytes,
        maxBytes: maxBytes,
        usagePercent: usagePercent,
        isNearLimit: isNearLimit,
        testingMode: testingMode
      });
    });
  });
};

/**
 * Format bytes to human readable format (copied from storageVersioning.js)
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check storage usage and show warning if near limit
 */
const checkAndShowStorageWarning = async (paletteWrapper) => {
  try {
    const stats = await getStorageStats();

    if (stats.isNearLimit) {
      // Create warning banner
      const warningDiv = document.createElement('div');
      warningDiv.className = 'storage_warning__Colorfy';
      
      const testingNote = stats.testingMode ? '<br><small style="color: #007bff;"><strong>🧪 TESTING MODE:</strong> Using 5KB limit at 60% threshold</small>' : '';
      
      warningDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; margin-bottom: 10px; font-size: 12px; color: #856404;">
          <span style="font-size: 16px;">⚠️</span>
          <div style="flex: 1;">
            <strong>Storage Warning:</strong> ${formatBytes(stats.usedBytes)} of ${formatBytes(stats.maxBytes)} used (${stats.usagePercent}%)
            <br><small>Consider clearing old data to continue using Colorfy.</small>
            ${testingNote}
          </div>
          <button id="storage-options-btn" style="background: #856404; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap; margin-left: 8px; transition: background-color 0.2s;" title="Open storage management" onmouseover="this.style.backgroundColor='#6c4f03'" onmouseout="this.style.backgroundColor='#856404'">
            Manage Data
          </button>
        </div>
      `;
      
      // Add click handler for the manage storage button
      warningDiv.querySelector('#storage-options-btn').addEventListener('click', () => {
        // Send message to background script to open options page
        chrome.runtime.sendMessage({ type: 'openOptionsPage' });
      });
      
      // Insert after style selector or at beginning
      const styleSelector = paletteWrapper.querySelector('.style_selector_wrapper__Colorfy');
      if (styleSelector) {
        styleSelector.after(warningDiv);
      } else {
        const closeBtn = paletteWrapper.querySelector('.closeColorfy__Colorfy');
        if (closeBtn) {
          closeBtn.after(warningDiv);
        } else {
          paletteWrapper.appendChild(warningDiv);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking storage stats:', error);
  }
};

// Make functions globally accessible
window.createPaletteWrapper = createPaletteWrapper;
window.applyColorSchemeOption = applyColorSchemeOption;
window.addSavedItems = addSavedItems;
window.closeColorfy = closeColorfy;
window.getUIReferences = getUIReferences;
window.setUIReferences = setUIReferences;
window.loadDevMode = loadDevMode;
window.setDevMode = setDevMode;
window.getDevMode = getDevMode;

// Also expose with a clear namespace for easy access
window.Colorfy = window.Colorfy || {};
window.Colorfy.devMode = {
  enable: () => setDevMode(true),
  disable: () => setDevMode(false),
  status: getDevMode
};
