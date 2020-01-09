

/**
 * Get elements from localstorage
 * @return {string[Object]} Array of JSON objects with saved elements or null
 */
const getElements = () => {
  let elements = null;
  let elementsArr = [];
  if (localStorage.getItem("Colorfy-elements")) {
    elements = JSON.parse(localStorage.getItem("Colorfy-elements"));
    elementsArr = Object.values(elements);
  }
  return elementsArr;
};

/**
 * Save element to localstorage
 * @param {Object} el JSON object with information about element that needs to be saved
 */
const saveElement = el => {
  let elements = getElements();
  console.log(elements);
  //Used to check if the elment already exists
  let removeIndex = null;
  if (elements) {
    for (let i = 0, len = elements.length; i < len; i++) {
      if (
        elements[i].nodeName == el.nodeName &&
        elements[i].id == el.id &&
        elements[i].className == el.className
      )
        removeIndex = i;
    }
    //Remove element, so that it can be added to the end of array
    if (removeIndex != null) elements.splice(removeIndex, 1);
  }
  //Initiate element if it is getting saved for the first time
  else elements = [el];
  elements.push(el);
  //Save elements to localstorage
  elements = JSON.stringify(elements);
  window.localStorage.setItem("Colorfy-elements", elements);
};

/**
 * Take DOM element and return it's information in JSON form
 * @param {DOM} e DOM element
 * @return {Object} JSON object with element information
 */
const elementInfo = e => {
  let element = e.target;
  let elementId = element.id;
  let color = element.style.backgroundColor;
  let elementClass = element.className;
  let elementNodeName = element.nodeName;
  let el = {
    nodeName: elementNodeName,
    id: elementId,
    className: elementClass,
    color: color
  };
  return el;
};

/**
 * Get DOM elements with provided information/element
 * @param {DOM} e DOM element or JSON object with structure like elementInfo function's return value
 * @return {string[DOM]} array of DOM elements
 */
const selectElements = e => {
  let element;
  if (e.target) element = e.target;
  else element = e;
  let elArr = [];
  if (element.id) elArr.push(document.getElementById(element.id));
  else if (element.className)
    elArr = document.getElementsByClassName(element.className);
  else if (element.nodeName)
    elArr = document.getElementsByTagName(element.nodeName);
  return elArr;
};

/**
 * Change colors for the elements saved in localstorage
 */
const getSavedChanges = () => {
  //Get array from localstorage
  elements = getElements();
  if (elements) {
    for (let i = 0, len = elements.length; i < len; i++) {
      //Get DOM elements
      let seleectedElements = selectElements(elements[i]);
      let selectedColor = elements[i].color;
      //Change color for each DOM element
      for (let index = 0; index < seleectedElements.length; index++) {
        const element = seleectedElements[index];
        element.style.setProperty(
          "background-color",
          selectedColor,
          "important"
        );
      }
    }
  }
};
getSavedChanges();
