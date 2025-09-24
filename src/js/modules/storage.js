/**
 * Storage management and saved elements functionality for Colorfy extension
 */

// Local storage arrays
let storedLocalElements = [];
let storedLocalData = [];

/**
 * Load saved elements from storage for the current URL
 */
const loadSavedElements = (callback) => {
  // Clear existing data to ensure fresh load
  storedLocalElements = [];
  storedLocalData = [];
  
  chrome.storage.local.get(["Colorfy"], (data) => {
    if (data.Colorfy) {
      storedLocalData = parseStoredData(data.Colorfy);
      const currentUrl = window.getBaseURL ? window.getBaseURL() : window.location.origin;
      for (let i = 0; i < storedLocalData.length; i++) {
        if (storedLocalData[i].url === currentUrl) {
          storedLocalElements.push(storedLocalData[i].elements);
        }
      }
    }
    
    // Call callback if provided (for async operations)
    if (callback && typeof callback === 'function') {
      callback();
    }
  });
};

/**
 * Load and display saved elements with fresh data
 */
const refreshAndDisplaySavedElements = (container) => {
  loadSavedElements(() => {
    displaySavedElements(container);
  });
};

/**
 * Display saved elements in the provided container
 */
const displaySavedElements = (container) => {
  container.innerHTML = "";
  
  // Add header
  const header = document.createElement("div");
  header.className = "saved_items_header__Colorfy";
  header.textContent = "Saved Color Elements";
  container.appendChild(header);
  
  if (!storedLocalElements[0] || storedLocalElements[0].length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "saved_items_empty__Colorfy";
    emptyMessage.textContent = "No saved elements yet. Start by selecting elements on any webpage!";
    container.appendChild(emptyMessage);
    return;
  }options_wrapper

  for (let i = 0; i < storedLocalElements[0].length; i++) {
    const element = storedLocalElements[0][i];

    // Create a wrapper for each element
    const elementWrapper = document.createElement("div");
    elementWrapper.className = "saved_element_wrapper__Colorfy";
    container.appendChild(elementWrapper);

    // Button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "saved_element_buttons__Colorfy";
    elementWrapper.appendChild(buttonContainer);

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.id = "colorfy_delete_" + i;
    deleteButton.className = "delete_saved_button__Colorfy";
    deleteButton.title = "Delete";
    deleteButton.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
    buttonContainer.appendChild(deleteButton);

    deleteButton.onclick = () => {
      deleteSavedElement(i);
    };

    // Save button (initially hidden)
    const saveButton = document.createElement("button");
    saveButton.id = "colorfy_save_" + i;
    saveButton.className = "save_saved_button__Colorfy";
    saveButton.title = "Save changes";
    saveButton.innerHTML = `<span class="material-symbols-outlined">save</span>`;
    saveButton.style.display = "none";
    buttonContainer.appendChild(saveButton);

    // Editable JSON textarea
    const elementInput = document.createElement("textarea");
    elementInput.className = "saved_element_input__Colorfy";
    elementInput.value = JSON.stringify(element, null, 4);
    elementInput.dataset.originalValue = elementInput.value;
    elementInput.dataset.elementIndex = i;
    elementInput.title = "Edit JSON data. Press Ctrl+Enter to save quickly.";
    elementWrapper.appendChild(elementInput);

    // Show/hide save button based on changes
    const checkForChanges = () => {
      const hasChanges = elementInput.value !== elementInput.dataset.originalValue;
      saveButton.style.display = hasChanges ? "inline-block" : "none";
    };

    // Event listeners
    elementInput.addEventListener("input", checkForChanges);
    elementInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        // Ctrl+Enter to save
        const success = editSavedElement(i, elementInput.value);
        
        if (success) {
          elementInput.dataset.originalValue = elementInput.value;
          checkForChanges(); // This will hide the save button
        }
      }
    });

    saveButton.onclick = () => {
      const originalText = saveButton.innerHTML;
      saveButton.innerHTML = `<span class="material-symbols-outlined">check</span>`;
      saveButton.style.background = "#4CAF50";
      
      // Save only this specific element
      const success = editSavedElement(i, elementInput.value);
      
      if (success) {
        // Update the original value to reflect the saved state
        elementInput.dataset.originalValue = elementInput.value;
        checkForChanges(); // This will hide the save button
        
        // Reset button after a brief delay
        setTimeout(() => {
          saveButton.innerHTML = originalText;
          saveButton.style.background = "";
        }, 1000);
      } else {
        // If save failed, revert button immediately
        saveButton.innerHTML = originalText;
        saveButton.style.background = "";
      }
    };
  }
};

/**
 * Actually add the new item to local arrays, update storage, re-render the page
 */
const manualAdd = (object) => {
  if (storedLocalElements[0]) {
    storedLocalElements[0].push(object);
  } else {
    storedLocalElements[0] = [object];
  }
  manualSave(storedLocalElements[0]);
  applySavedChanges(storedLocalElements[0]);
  refreshAndDisplaySavedElements(document.getElementById("saved_items_wrapper"));
};

/**
 * Persist changes into storedLocalData
 */
const manualSave = (object) => {
  const pageUrl = window.getBaseURL ? window.getBaseURL() : window.location.origin;
  storedLocalData.forEach((item) => {
    if (item.url === pageUrl) {
      item.elements = object;
    }
  });
  chrome.storage.local.set({ Colorfy: JSON.stringify(storedLocalData) });
};

/**
 * Delete a saved element
 */
const deleteSavedElement = (elIndex) => {
  if (storedLocalElements[0] && storedLocalElements[0][elIndex]) {
    // Remove the element from the array
    storedLocalElements[0].splice(elIndex, 1);
    
    // Save the updated data
    manualSave(storedLocalElements[0]);
    
    // Apply the changes immediately to the current page
    applySavedChanges(storedLocalElements[0]);
    
    // Refresh the display to show the updated list
    const container = document.getElementById("saved_items_wrapper");
    if (container) {
      refreshAndDisplaySavedElements(container);
    }
  }
};

/**
 * Edit a saved element
 */
const editSavedElement = (elIndex, value) => {
  try {
    const parsed = JSON.parse(value);
    
    // Update only the specific element
    if (storedLocalElements[0] && storedLocalElements[0][elIndex]) {
      storedLocalElements[0][elIndex] = parsed;
      
      // Save the updated data
      manualSave(storedLocalElements[0]);
      
      // Apply changes immediately to show the effect on the current page
      applySavedChanges(storedLocalElements[0]);
    } else {
      console.error(`Element at index ${elIndex} does not exist`);
    }
  } catch (e) {
    alert('Invalid JSON format. Please check your syntax.');
    console.error('JSON parse error:', e);
    return false;
  }
  return true;
};

/**
 * Helper to parse stored data - uses the global changeFormat from backend.js
 */
const parseStoredData = (data) => {
  if (typeof window.changeFormat === 'function') {
    return window.changeFormat(data);
  }
  // Fallback implementation
  return JSON.parse(data);
};

/**
 * Get the stored local elements
 */
const getStoredLocalElements = () => storedLocalElements;

/**
 * Get the stored local data
 */
const getStoredLocalData = () => storedLocalData;

/**
 * Save element using the global saveElement function from backend.js
 */
const saveStorageElement = (el) => {
  if (typeof window.saveElement === 'function') {
    window.saveElement(el);
  } else {
    console.error('saveElement function not available from backend.js');
  }
};

/**
 * Reset all Colorfy-applied styles on the page
 */
const resetColorfyStyles = () => {
  // Find all elements that have Colorfy-applied styles
  const allElements = document.querySelectorAll('*:not([class*="__Colorfy"])');
  
  allElements.forEach(el => {
    // Check if element has any inline styles that might be from Colorfy
    if (el.style.cssText) {
      // Remove background and color properties that were set with !important
      el.style.removeProperty('background');
      el.style.removeProperty('background-color');
      el.style.removeProperty('color');
    }
  });
};

/**
 * Apply saved changes using the global getSavedChanges function from backend.js
 */
const applySavedChanges = (data) => {
  // First, reset all previously applied styles
  resetColorfyStyles();
  
  // Then apply the current saved elements (if any)
  if (typeof window.getSavedChanges === 'function') {
    window.getSavedChanges(data);
  } else {
    console.error('getSavedChanges function not available from backend.js');
  }
};

// Make functions globally accessible
window.loadSavedElements = loadSavedElements;
window.displaySavedElements = displaySavedElements;
window.refreshAndDisplaySavedElements = refreshAndDisplaySavedElements;
window.manualAdd = manualAdd;
window.manualSave = manualSave;
window.deleteSavedElement = deleteSavedElement;
window.editSavedElement = editSavedElement;
window.getStoredLocalElements = getStoredLocalElements;
window.getStoredLocalData = getStoredLocalData;
window.saveStorageElement = saveStorageElement;
window.applySavedChanges = applySavedChanges;
// Note: These functions are wrappers for backend.js functions
