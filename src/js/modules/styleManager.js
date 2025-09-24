/**
 * Style management functionality for Colorfy extension
 * Handles multiple color styles per website
 */

// Style management state
let currentStyleId = null;
let availableStyles = [];
let maxStyles = 5;

/**
 * Initialize style management for current URL
 */
const initializeStyles = (callback) => {
  const currentUrl = window.getBaseURL ? window.getBaseURL() : window.location.origin;
  
  chrome.storage.local.get(["Colorfy_Styles"], (data) => {
    let stylesData = {};
    if (data.Colorfy_Styles) {
      try {
        stylesData = JSON.parse(data.Colorfy_Styles);
      } catch (e) {
        console.error('Error parsing styles data:', e);
      }
    }
    
    // Check if this is a legacy user with existing data
    chrome.storage.local.get(["Colorfy"], (legacyData) => {
      if (!stylesData[currentUrl]) {
        // Initialize styles for this URL
        if (legacyData.Colorfy) {
          // Migrate legacy data
          migrateLegacyData(currentUrl, legacyData.Colorfy, stylesData, callback);
        } else {
          // New user - create default styles
          createDefaultStyles(currentUrl, stylesData, callback);
        }
      } else {
        // Load existing styles
        if (stylesData[currentUrl].styles && Array.isArray(stylesData[currentUrl].styles)) {
          availableStyles = stylesData[currentUrl].styles;
          currentStyleId = stylesData[currentUrl].activeStyle || availableStyles[0]?.id;
          if (callback) callback();
        } else {
          console.warn('Invalid styles data structure, recreating defaults');
          createDefaultStyles(currentUrl, stylesData, callback);
        }
      }
    });
  });
};

/**
 * Migrate legacy data to new multi-style format
 */
const migrateLegacyData = (currentUrl, legacyData, stylesData, callback) => {
  try {
    const legacyElements = JSON.parse(legacyData);
    const legacyUrlData = Object.values(legacyElements).find(item => item.url === currentUrl);
    
    // Create styles structure for this URL
    stylesData[currentUrl] = {
      styles: [
        {
          id: 'original',
          name: 'Original',
          elements: [],
          isOriginal: true
        },
        {
          id: 'style_1',
          name: 'Style 1',
          elements: legacyUrlData ? legacyUrlData.elements : [],
          isOriginal: false
        }
      ],
      activeStyle: legacyUrlData && legacyUrlData.elements.length > 0 ? 'style_1' : 'original'
    };
    
    availableStyles = stylesData[currentUrl].styles;
    currentStyleId = stylesData[currentUrl].activeStyle;
    
    // Save the migrated data
    chrome.storage.local.set({ Colorfy_Styles: JSON.stringify(stylesData) }, () => {
      if (callback) callback();
    });
  } catch (e) {
    console.error('Error migrating legacy data:', e);
    createDefaultStyles(currentUrl, stylesData, callback);
  }
};

/**
 * Create default styles for new users
 */
const createDefaultStyles = (currentUrl, stylesData, callback) => {
  stylesData[currentUrl] = {
    styles: [
      {
        id: 'original',
        name: 'Original',
        elements: [],
        isOriginal: true
      },
      {
        id: 'style_1',
        name: 'Style 1',
        elements: [],
        isOriginal: false
      }
    ],
    activeStyle: 'style_1' // Pre-select the editable style
  };
  
  availableStyles = stylesData[currentUrl].styles;
  currentStyleId = stylesData[currentUrl].activeStyle;
  
  // Save the new structure
  chrome.storage.local.set({ Colorfy_Styles: JSON.stringify(stylesData) }, () => {
    if (callback) callback();
  });
};

/**
 * Get current active style
 */
const getCurrentStyle = () => {
  if (!availableStyles || !currentStyleId) return null;
  return availableStyles.find(style => style.id === currentStyleId);
};

/**
 * Get all available styles
 */
const getAllStyles = () => {
  return availableStyles || [];
};

/**
 * Switch to a different style
 */
const switchStyle = (styleId, callback) => {
  if (!availableStyles || availableStyles.length === 0) {
    return;
  }
  
  const style = availableStyles.find(s => s.id === styleId);
  if (!style) {
    return;
  }
  
  currentStyleId = styleId;
  const currentUrl = window.getBaseURL ? window.getBaseURL() : window.location.origin;
  
  // Update storage
  chrome.storage.local.get(["Colorfy_Styles"], (data) => {
    let stylesData = {};
    if (data.Colorfy_Styles) {
      stylesData = JSON.parse(data.Colorfy_Styles);
    }
    
    if (stylesData[currentUrl]) {
      stylesData[currentUrl].activeStyle = styleId;
      chrome.storage.local.set({ Colorfy_Styles: JSON.stringify(stylesData) }, () => {
        // Reset all elements from ALL styles first
        resetAllStyleElements(availableStyles);
        
        // Then apply the new style's changes if it's not original
        if (!style.isOriginal && style.elements && style.elements.length > 0) {
          setTimeout(() => {
            if (window.getSavedChanges) {
              window.getSavedChanges(style.elements);
            } else {
              console.error('❌ getSavedChanges function not available!');
            }
          }, 50);
        }
        
        if (callback) callback();
      });
    }
  });
};

/**
 * Reset elements from all styles to ensure clean switching
 */
const resetAllStyleElements = (styles) => {
  if (!styles || !Array.isArray(styles)) {
    console.error('❌ No styles provided to reset function!');
    return;
  }
  
  // Collect all elements from all styles
  let allElements = [];
  styles.forEach(style => {
    if (style.elements && Array.isArray(style.elements)) {
      allElements = allElements.concat(style.elements);
    }
  });
  
  let resetCount = 0;
  let failureCount = 0;
  
  // Reset each element using the same selection logic
  allElements.forEach(elementData => {
    try {
      const selectedElements = window.selectElements ? window.selectElements(elementData) : [];
      
      if (selectedElements.length === 0) {
        failureCount++;
        return;
      }
      
      selectedElements.forEach(el => {
        try {
          // Check if element actually has styles to reset
          const hasStyles = el.getAttribute('style');
          
          // Reset the main element
          resetElementStyles(el);
          
          if (hasStyles) {
            resetCount++;
          }
          
          // Also reset all nested children
          const family = el.getElementsByTagName("*");
          for (let i = 0; i < family.length; i++) {
            // Check if element has className and if it's a string that includes "__Colorfy"
            const elementClassName = family[i].className;
            if (elementClassName && typeof elementClassName === 'string' && elementClassName.includes("__Colorfy")) continue;
            if (elementClassName && typeof elementClassName !== 'string' && elementClassName.toString().includes("__Colorfy")) continue;
            
            resetElementStyles(family[i]);
          }
        } catch (err) {
          failureCount++;
        }
      });
    } catch (err) {
      failureCount++;
    }
  });
};

/**
 * Reset styles for a single element
 */
const resetElementStyles = (element) => {
  try {
    const hadStyles = element.getAttribute('style');
    
    // Remove Colorfy-applied styles
    element.style.setProperty('background', '', 'important');
    element.style.setProperty('background-color', '', 'important');
    element.style.setProperty('color', '', 'important');
    
    // Also remove via removeProperty as backup
    element.style.removeProperty('background');
    element.style.removeProperty('background-color');
    element.style.removeProperty('color');
    
    // If no other inline styles, remove style attribute
    if (!element.style.cssText || element.style.cssText.trim() === '') {
      element.removeAttribute('style');
    }
    
    // Log only if there's an issue with reset
    const stillHasColorStyles = element.getAttribute('style') && 
      (element.getAttribute('style').includes('background') || element.getAttribute('style').includes('color'));
    
  } catch (err) {
    console.error(`❌ Reset error for ${element.tagName}:`, err);
  }
};

/**
 * Add a new style
 */
const addNewStyle = (styleName, callback) => {
  if (availableStyles.length >= maxStyles) {
    alert(`Maximum ${maxStyles} styles allowed per website.`);
    return;
  }
  
  const newStyleId = 'style_' + (availableStyles.filter(s => !s.isOriginal).length + 1);
  const newStyle = {
    id: newStyleId,
    name: styleName,
    elements: [],
    isOriginal: false
  };
  
  availableStyles.push(newStyle);
  
  // Save to storage
  saveStylesData(() => {
    if (callback) callback(newStyle);
  });
};

/**
 * Rename a style
 */
const renameStyle = (styleId, newName, callback) => {
  const style = availableStyles.find(s => s.id === styleId);
  if (style && !style.isOriginal) {
    style.name = newName;
    saveStylesData(callback);
  }
};

/**
 * Delete a style
 */
const deleteStyle = (styleId, callback) => {
  const styleIndex = availableStyles.findIndex(s => s.id === styleId);
  if (styleIndex > -1 && !availableStyles[styleIndex].isOriginal) {
    // Confirm deletion
    if (confirm(`Are you sure you want to delete "${availableStyles[styleIndex].name}"? This will permanently remove all color changes for this style.`)) {
      availableStyles.splice(styleIndex, 1);
      
      // If deleted style was active, switch to original
      if (currentStyleId === styleId) {
        currentStyleId = 'original';
        if (window.resetColorfyStyles) {
          window.resetColorfyStyles();
        }
      }
      
      saveStylesData(callback);
    }
  }
};

/**
 * Save an element to the current active style
 */
const saveElementToCurrentStyle = (element, callback) => {
  const currentStyle = getCurrentStyle();
  if (!currentStyle || currentStyle.isOriginal) {
    // Cannot save to original style - switch to first editable style
    const editableStyle = availableStyles.find(s => !s.isOriginal);
    if (editableStyle) {
      switchStyle(editableStyle.id, () => {
        saveElementToStyle(editableStyle.id, element, callback);
      });
    }
    return;
  }
  
  saveElementToStyle(currentStyleId, element, callback);
};

/**
 * Save an element to a specific style
 */
const saveElementToStyle = (styleId, element, callback) => {
  const style = availableStyles.find(s => s.id === styleId);
  if (!style || style.isOriginal) return;
  
  // Check if element already exists and remove it
  let removeIndex = null;
  for (let i = 0; i < style.elements.length; i++) {
    if (
      style.elements[i].nodeName === element.nodeName &&
      style.elements[i].id === element.id &&
      style.elements[i].className === element.className
    ) {
      removeIndex = i;
      break;
    }
  }
  
  if (removeIndex !== null) {
    style.elements.splice(removeIndex, 1);
  }
  
  style.elements.push(element);
  
  // Save to storage
  saveStylesData(callback);
};

/**
 * Save all styles data to storage
 */
const saveStylesData = (callback) => {
  const currentUrl = window.getBaseURL ? window.getBaseURL() : window.location.origin;
  
  chrome.storage.local.get(["Colorfy_Styles"], (data) => {
    let stylesData = {};
    if (data.Colorfy_Styles) {
      stylesData = JSON.parse(data.Colorfy_Styles);
    }
    
    stylesData[currentUrl] = {
      styles: availableStyles,
      activeStyle: currentStyleId
    };
    
    chrome.storage.local.set({ Colorfy_Styles: JSON.stringify(stylesData) }, () => {
      if (callback) callback();
    });
  });
};

/**
 * Check if current style allows editing
 */
const canEditCurrentStyle = () => {
  const currentStyle = getCurrentStyle();
  return currentStyle && !currentStyle.isOriginal;
};

// Make functions globally accessible
window.initializeStyles = initializeStyles;
window.getCurrentStyle = getCurrentStyle;
window.getAllStyles = getAllStyles;
window.switchStyle = switchStyle;
window.addNewStyle = addNewStyle;
window.renameStyle = renameStyle;
window.deleteStyle = deleteStyle;
window.saveElementToCurrentStyle = saveElementToCurrentStyle;
window.canEditCurrentStyle = canEditCurrentStyle;
window.resetElementStyles = resetElementStyles;

// Style manager namespace
window.StyleManager = {
  init: initializeStyles,
  getCurrentStyle,
  getAllStyles,
  switchStyle,
  addNewStyle,
  renameStyle,
  deleteStyle,
  saveElement: saveElementToCurrentStyle,
  canEdit: canEditCurrentStyle,
  resetElement: resetElementStyles
};
