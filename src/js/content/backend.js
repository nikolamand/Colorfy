// Array of JSON objects for the whole chrome.storage
let storedData = [];
// Array with DOM elements for the given URL
let storedColors = [];

/**
 * Get base URL for current tab
 */
function getBaseURL() {
  const { protocol, host } = window.location;
  return `${protocol}//${host}`;
}

/**
 * Fetch from storage, then apply changes for the current page
 */
function getData() {
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

          // Apply the changes multiple times to ensure the DOM is ready
          getSavedChanges(storedColors);
          setTimeout(() => getSavedChanges(storedColors), 1000);
          setTimeout(() => getSavedChanges(storedColors), 2000);
          setTimeout(() => getSavedChanges(storedColors), 3000);
          setTimeout(() => getSavedChanges(storedColors), 5000);
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
    if (found) elArr.push(found);
  } else if (element.className) {
    elArr = document.getElementsByClassName(element.className);
  } else if (element.nodeName) {
    const tmp = document.getElementsByTagName(element.nodeName);
    for (let i = 0; i < tmp.length; i++) {
      if (checkParents(element.parentNode, parentInfo(tmp[i]))) {
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
  if (!data) return;

  for (let i = 0; i < data.length; i++) {
    const selectedElements = selectElements(data[i]);
    const selectedBackground = data[i].background;
    const selectedBackgroundColor = data[i].backgroundColor;
    const selectedTextColor = data[i].color;

    for (let j = 0; j < selectedElements.length; j++) {
      try {
        const el = selectedElements[j];
        el.style.setProperty("background", selectedBackgroundColor, "important");
        el.style.setProperty("background", selectedBackground, "important");
        el.style.setProperty("color", "none", "important");
        el.style.setProperty("color", selectedTextColor, "important");

        // Also change text color of all nested children
        const family = el.getElementsByTagName("*");
        for (let k = 0; k < family.length; k++) {
          if (family[k].className.includes("__Colorfy")) continue;
          family[k].style.setProperty("color", "none", "important");
          family[k].style.setProperty("color", selectedTextColor, "important");
        }
      } catch (err) {
        // Silently ignore if we can't change some element
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
