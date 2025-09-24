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
    createPaletteWrapperInternal();
    
    // Call callback after UI is created
    if (callback && typeof callback === 'function') {
      callback();
    }
  });
};

/**
 * Internal function to create the palette wrapper after dev mode is loaded
 */
const createPaletteWrapperInternal = () => {
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
  closeBtn.title = "Cancel";
  closeBtn.onclick = closeColorfy;
  paletteWrapper.appendChild(closeBtn);

  // Container for background/text color pickers
  colorsWrapper = document.createElement("div");
  colorsWrapper.id = "colors_wrapper";
  colorsWrapper.className = "colors_wrapper__Colorfy";
  paletteWrapper.appendChild(colorsWrapper);

  // Confirmation button
  const selectBtn = document.createElement("button");
  selectBtn.id = "colorfy_submit";
  selectBtn.className = "colorfy_submit__Colorfy";
  selectBtn.innerHTML = "OK";
  selectBtn.onclick = selectedChanges;
  paletteWrapper.appendChild(selectBtn);

  // Advanced changes toggle (only show in dev mode)
  const savedItemsButton = document.createElement("div");
  savedItemsButton.id = "saved_items_button";
  savedItemsButton.className = "saved_items_button__Colorfy";
  savedItemsButton.innerHTML = `<span class="material-symbols-outlined">manufacturing</span>`;
  savedItemsButton.title = "Advanced changes";
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
  manualInputAdd.title = "Add item";
  manualButtonsWrapper.appendChild(manualInputAdd);

  const manualInputCancel = document.createElement("div");
  manualInputCancel.id = "manual_input_cancel";
  manualInputCancel.className = "manual_input_cancel__Colorfy";
  manualInputCancel.innerHTML = `<span class="material-symbols-outlined">cancel</span>`;
  manualInputCancel.title = "Cancel";
  manualButtonsWrapper.appendChild(manualInputCancel);

  // Show/hide "Add New Item"
  const manualInputShow = document.createElement("div");
  manualInputShow.id = "manual_input_show";
  manualInputShow.className = "manual_input_show__Colorfy";
  manualInputShow.title = "Add new item";
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
      closeOptionsBtn.title = "Close advanced changes";
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
