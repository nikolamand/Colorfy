/**
 * Element selection and interaction handling for Colorfy extension
 */

// Element selection state
let selectedElement = null;
let selectedBackground = null;
let selectedTextColor = null;
let selectionMode = false;

/**
 * Get the previously saved colors for the selected element
 */
const getPreviouslySavedColors = () => {
  const hexBackground = rgbToHex(selectedElement.target.style.background);
  const hexColor = rgbToHex(selectedElement.target.style.color);
  if (hexBackground) {
    selectedBackground = hexBackground.toLowerCase();
  }
  if (hexColor) {
    selectedTextColor = hexColor.toLowerCase();
  }
};

/**
 * On hover, highlight the element
 */
const hoverElements = (e) => {
  const targetEls = getSelectedElements(e);
  for (let i = 0; i < targetEls.length; i++) {
    targetEls[i].style.setProperty("border", "5px solid #000080");
    targetEls[i].style.setProperty("opacity", "0.5");
  }
};

/**
 * On mouse out, remove the highlight
 */
const resetHover = (e) => {
  const targetEls = getSelectedElements(e);
  for (let i = 0; i < targetEls.length; i++) {
    targetEls[i].style.removeProperty("border");
    targetEls[i].style.removeProperty("opacity");
  }
};

/**
 * Intercept clicks in the capture phase so we can prevent link/button actions
 */
const handleClick = (e) => {
  if (!selectionMode) return;

  // Prevent default navigation or button action
  e.preventDefault();
  e.stopPropagation();

  // We have our target; open color UI
  selectedElement = e;
  addColorPicker();
  resetHover(e);

  // Turn off selection mode after one pick (if you want multiple picks, remove this)
  selectionMode = false;
  removeListeners();
};

/**
 * Add the event listeners we need to let user pick an element visually
 */
const addListeners = () => {
  // A hidden div to mark we have already attached listeners
  const colorfyCheck = document.createElement("div");
  colorfyCheck.id = "colorfy_check";
  colorfyCheck.style.position = "absolute";
  colorfyCheck.style.opacity = "0";
  colorfyCheck.style.height = "0";
  colorfyCheck.style.width = "0";
  document.body.appendChild(colorfyCheck);

  // Use capture = true to intercept clicks before they bubble, so we can stop navigation
  document.addEventListener("click", handleClick, true);

  // Mouse hovers
  document.addEventListener("mouseover", hoverElements, false);
  document.addEventListener("mouseout", resetHover, false);
};

/**
 * Remove event listeners
 */
const removeListeners = () => {
  const colorfyCheck = document.getElementById("colorfy_check");
  if (colorfyCheck) {
    document.body.removeChild(colorfyCheck);
  }

  // Remove capture-phase click listener
  document.removeEventListener("click", handleClick, true);

  // Remove hover listeners
  document.removeEventListener("mouseover", hoverElements);
  document.removeEventListener("mouseout", resetHover);
};

/**
 * Select the DOM elements - uses the global selectElements from backend.js
 */
const getSelectedElements = (e) => {
  if (typeof window.selectElements === 'function') {
    return window.selectElements(e);
  }
  // Fallback implementation if backend.js not loaded yet
  let element = e;
  if (e.target) {
    element = e.target;
  }
  
  const elArr = [];
  if (element.id) {
    const found = document.getElementById(element.id);
    if (found) elArr.push(found);
  } else if (element.className) {
    elArr.push(...document.getElementsByClassName(element.className));
  } else if (element.nodeName) {
    elArr.push(...document.getElementsByTagName(element.nodeName));
  }
  return elArr;
};

/**
 * Get structured information about a DOM element - uses the global elementInfo from backend.js
 */
const getElementInfo = (e) => {
  if (typeof window.elementInfo === 'function') {
    return window.elementInfo(e);
  }
  // Fallback implementation
  const element = e.target;
  const { id, style, className, nodeName } = element;
  const { background, backgroundColor, color } = style;
  const parent = element.parentNode;
  let parentNode = {
    id: "#document",
    className: "#document", 
    nodeName: "#document",
  };
  if (parent && parent.nodeName !== "#document") {
    parentNode = {
      id: parent.id.trim(),
      className: parent.className.trim(),
      nodeName: parent.nodeName,
    };
  }

  return {
    nodeName,
    id: (id || "").trim(),
    className: (className || "").trim(),
    background,
    backgroundColor,
    color,
    parentNode,
  };
};

/**
 * Actually apply the chosen color properties to a DOM element (and its descendants)
 */
const changeColor = (element) => {
  element.style.setProperty("background", selectedBackground, "important");
  element.style.setProperty("color", "none", "important");
  element.style.setProperty("color", selectedTextColor, "important");

  // Update children text color
  const family = element.getElementsByTagName("*");
  for (let i = 0; i < family.length; i++) {
    family[i].style.setProperty("color", "none", "important");
    family[i].style.setProperty("color", selectedTextColor, "important");
  }
};

/**
 * Get the selected element
 */
const getSelectedElement = () => selectedElement;

/**
 * Get the selected colors
 */
const getSelectedColors = () => ({
  background: selectedBackground,
  text: selectedTextColor
});

/**
 * Set the selected colors
 */
const setSelectedColors = (background, text) => {
  selectedBackground = background;
  selectedTextColor = text;
};

/**
 * Set the selection mode
 */
const setSelectionMode = (mode) => {
  selectionMode = mode;
};

/**
 * Get the selection mode
 */
const getSelectionMode = () => selectionMode;

// Make functions globally accessible
window.getPreviouslySavedColors = getPreviouslySavedColors;
window.hoverElements = hoverElements;
window.resetHover = resetHover;
window.handleClick = handleClick;
window.addListeners = addListeners;
window.removeListeners = removeListeners;
window.getSelectedElements = getSelectedElements;
window.getElementInfo = getElementInfo;
window.changeColor = changeColor;
window.getSelectedElement = getSelectedElement;
window.getSelectedColors = getSelectedColors;
window.setSelectedColors = setSelectedColors;
window.setSelectionMode = setSelectionMode;
window.getSelectionMode = getSelectionMode;
