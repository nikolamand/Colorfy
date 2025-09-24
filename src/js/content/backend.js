// Array of JSON objects for the whole chrome.storage
let storedData = [];
// Array with DOM elements for the given URL
let storedColors = [];
// Track pending timeouts to cancel them when switching styles
let pendingTimeouts = [];

/**
 * Clear any pending style application timeouts
 */
function clearPendingTimeouts() {
  pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  pendingTimeouts = [];
}

/**
 * Apply styles with retry timeouts for slow-loading pages
 */
function applyStylesWithRetry(elements, reason = "unknown") {
  if (!elements || elements.length === 0) {
    return;
  }
  
  // Apply immediately
  getSavedChanges(elements);
  
  // Set up retry timeouts and track them
  const timeoutDelays = [1000, 2000, 3000, 5000];
  timeoutDelays.forEach(delay => {
    const timeoutId = setTimeout(() => {
      getSavedChanges(elements);
      // Remove this timeout from pending list
      const index = pendingTimeouts.indexOf(timeoutId);
      if (index > -1) {
        pendingTimeouts.splice(index, 1);
      }
    }, delay);
    
    pendingTimeouts.push(timeoutId);
  });
}
function getBaseURL() {
  const { protocol, host } = window.location;
  return `${protocol}//${host}`;
}

/**
 * Fetch from storage, then apply changes for the current page
 */
function getData() {
  // Clear any pending timeouts from previous style applications
  clearPendingTimeouts();
  
  // First, check for new style-based storage
  chrome.storage.local.get(["Colorfy_Styles"], (styleData) => {
    if (styleData["Colorfy_Styles"]) {
      try {
        const stylesData = JSON.parse(styleData["Colorfy_Styles"]);
        const currentBase = getBaseURL();
        
        if (stylesData[currentBase] && stylesData[currentBase].styles) {
          const activeStyleId = stylesData[currentBase].activeStyle;
          const activeStyle = stylesData[currentBase].styles.find(s => s.id === activeStyleId);
          
          if (activeStyle && !activeStyle.isOriginal) {
            storedColors = activeStyle.elements;
            // Notify background to update the badge
            chrome.runtime.sendMessage({
              type: "updateBadge",
              text: storedColors.length.toString()
            });

            // Apply the changes with retry timeouts for slow-loading pages
            applyStylesWithRetry(storedColors, `style: ${activeStyleId}`);
          } else {
            // Original style selected - clear badge and no styles to apply
            chrome.runtime.sendMessage({
              type: "updateBadge",
              text: ""
            });
          }
        } else {
          // No styles data for this URL, check legacy storage
          checkLegacyStorage();
        }
      } catch (e) {
        console.error('Error parsing styles data:', e);
        checkLegacyStorage();
      }
    } else {
      // No new style storage, check legacy
      checkLegacyStorage();
    }
  });
}

/**
 * Check legacy storage for backward compatibility
 */
function checkLegacyStorage() {
  chrome.storage.local.get(["Colorfy"], (data) => {
    if (data["Colorfy"]) {
      storedData = changeFormat(data["Colorfy"]);
      const currentBase = getBaseURL();
      for (let i = 0; i < storedData.length; i++) {
        if (storedData[i].url === currentBase) {
          storedColors = storedData[i].elements;
          // Notify background to update the badge
          chrome.runtime.sendMessage({
            type: "updateBadge",
            text: storedColors.length.toString()
          });

          // Apply the changes with retry timeouts for slow-loading pages
          applyStylesWithRetry(storedColors, "legacy storage");
        }
      }
    }
  });
}

/**
 * Listen to changes in storage and re-run getData
 * (Important: pass the function reference, not the function call)
 */
chrome.storage.onChanged.addListener(getData);

// Run at script load
getData();

/**
 * Convert the stored JSON string to an array of objects
 */
function changeFormat(data) {
  const elements = JSON.parse(data);
  // ensures we get a normal array
  return Object.values(elements);
}

/**
 * Save/update a single element into our storedColors array, then store them
 */
function saveElement(el) {
  // Check if the element already exists
  let removeIndex = null;
  for (let i = 0; i < storedColors.length; i++) {
    if (
      storedColors[i].nodeName === el.nodeName &&
      storedColors[i].id === el.id &&
      storedColors[i].className === el.className
    ) {
      removeIndex = i;
      break;
    }
  }
  // Remove so we can re-add at the end
  if (removeIndex !== null) {
    storedColors.splice(removeIndex, 1);
  }
  storedColors.push(el);

  // Update storedData for the current URL
  const currentBase = getBaseURL();
  let foundIndex = null;
  for (let i = 0; i < storedData.length; i++) {
    if (storedData[i].url === currentBase) {
      storedData[i].elements = storedColors;
      foundIndex = i;
      break;
    }
  }
  // If we didn't find the current url in storedData, push a new record
  if (foundIndex === null) {
    storedData.push({ url: currentBase, elements: storedColors });
  }

  // Persist back to chrome.storage
  chrome.storage.local.set({ Colorfy: JSON.stringify(storedData) });
}

/**
 * Returns a structured object with details about a DOM element
 */
function elementInfo(e) {
  const element = e.target;
  const {
    id,
    style: { background, backgroundColor, color },
    className,
    nodeName
  } = element;

  const parent = element.parentNode;
  let parentNode = {
    id: "#document",
    className: "#document",
    nodeName: "#document"
  };
  if (parent && parent.nodeName !== "#document") {
    parentNode = {
      id: parent.id.trim(),
      className: parent.className.trim(),
      nodeName: parent.nodeName
    };
  }

  return {
    nodeName,
    id: id.trim(),
    className: className.trim(),
    background,
    backgroundColor,
    color,
    parentNode
  };
}

/**
 * Helper to get the parent node details
 */
function parentInfo(element) {
  const parent = element.parentNode;
  if (!parent || parent.nodeName === "#document") {
    return {
      id: "#document",
      className: "#document",
      nodeName: "#document"
    };
  }
  return {
    id: parent.id.trim(),
    className: parent.className.trim(),
    nodeName: parent.nodeName
  };
}

/**
 * Compare two parent objects
 */
function checkParents(first, second) {
  return (
    first.id === second.id &&
    first.className === second.className &&
    first.nodeName === second.nodeName
  );
}

/**
 * Given an element-like descriptor, return all matching DOM elements
 */
function selectElements(e) {
  const element = e.target || e;
  let elArr = [];

  if (element.id) {
    const found = document.getElementById(element.id);
    if (found) {
      elArr.push(found);
    }
  } else if (element.className) {
    elArr = Array.from(document.getElementsByClassName(element.className));
  } else if (element.nodeName) {
    const tmp = document.getElementsByTagName(element.nodeName);
    
    for (let i = 0; i < tmp.length; i++) {
      const parentMatch = checkParents(element.parentNode, parentInfo(tmp[i]));
      if (parentMatch) {
        elArr.push(tmp[i]);
      }
    }
  }
  
  return elArr;
}

/**
 * Apply color/background changes for a list of stored color definitions
 */
function getSavedChanges(data) {
  if (!data) {
    return;
  }

  let appliedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const selectedElements = selectElements(data[i]);
    
    if (selectedElements.length === 0) {
      continue;
    }
    
    const selectedBackground = data[i].background;
    const selectedBackgroundColor = data[i].backgroundColor;
    const selectedTextColor = data[i].color;

    for (let j = 0; j < selectedElements.length; j++) {
      const el = selectedElements[j];
      
      try {
        let stylesApplied = [];
        
        // Apply background styles
        if (selectedBackground && selectedBackground !== 'none') {
          el.style.setProperty("background", selectedBackground, "important");
          stylesApplied.push(`bg:${selectedBackground}`);
        }
        if (selectedBackgroundColor && selectedBackgroundColor !== 'none') {
          el.style.setProperty("background-color", selectedBackgroundColor, "important");
          stylesApplied.push(`bg-color:${selectedBackgroundColor}`);
        }
        
        // Apply text color
        if (selectedTextColor && selectedTextColor !== 'none') {
          el.style.setProperty("color", selectedTextColor, "important");
          stylesApplied.push(`color:${selectedTextColor}`);
          
          // Also change text color of all nested children
          const family = el.getElementsByTagName("*");
          for (let k = 0; k < family.length; k++) {
            // Check if element has className and if it's a string that includes "__Colorfy"
            const elementClassName = family[k].className;
            if (elementClassName && typeof elementClassName === 'string' && elementClassName.includes("__Colorfy")) continue;
            if (elementClassName && typeof elementClassName !== 'string' && elementClassName.toString().includes("__Colorfy")) continue;
            
            family[k].style.setProperty("color", selectedTextColor, "important");
          }
        }
        
        if (stylesApplied.length > 0) {
          appliedCount++;
        }
      } catch (err) {
        console.error('❌ Error applying styles:', err);
      }
    }
  }
}

/**
 * Clear everything from storage (not just the current domain).
 */
function clearColors() {
  chrome.storage.local.clear(() => {
    const error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
    }
  });
}

// Make functions globally accessible for other modules
window.saveElement = saveElement;
window.getSavedChanges = getSavedChanges;
window.changeFormat = changeFormat;
window.selectElements = selectElements;
window.elementInfo = elementInfo;
