
// Array of JSON objects for the whole chrome.storage
let storedData = [];
// Array with DOM elements for the given URL
let storedColors = [];

/**
 * Get base URL for the currently opened tab
 * @return {string} Base URL for the page on the currently opened tab
 */
const getBaseURL = () => {
  let getUrl = window.location;
  let baseUrl = getUrl.protocol + "//" + getUrl.host;
  return baseUrl;
}

/**
 * Get the data stored in chrome.storage and call the function that changes element colors (getSavedChanges)
 */
const getData = () => {
  chrome.storage.local.get(["Colorfy"], function (data) {
    if (data["Colorfy"]) {
      storedData = changeFormat(data["Colorfy"])
      for (let i = 0, len = storedData.length; i < len; i++) {

        if (storedData[i]["url"] == getBaseURL()) {
          storedColors = storedData[i]["elements"];
          getSavedChanges(storedColors);
        }
      }
    }
  });
}
getData();

chrome.storage.onChanged.addListener(getData());

const changeFormat = data => {
  let elements = JSON.parse(data);
  return Object.values(elements);
}

/**
 * Save element to chrome.storage
 * @param {Object} el JSON object with information about element that needs to be saved
 */
const saveElement = el => {
  //Used to check if the elment already exists
  let removeIndex = null;
  if (storedColors.length > 0) {
    for (let i = 0, len = storedColors.length; i < len; i++) {
      if (
        storedColors[i].nodeName == el.nodeName &&
        storedColors[i].id == el.id &&
        storedColors[i].className == el.className
      )
        removeIndex = i;
    }
    //Remove element, so that it can be added to the end of array
    if (removeIndex != null) storedColors.splice(removeIndex, 1);
    storedColors.push(el);
  }
  //Initiate element if it is getting saved for the first time
  else {
    storedColors = [el];
  }

  let changedStoredData = null;
  for (let i = 0, len = storedData.length; i < len; i++) {
    if (storedData[i]["url"] == getBaseURL()) {
      storedData[i]["elements"] = storedColors;
      changedStoredData = i;
    }
  }

  //Add a new element to storedData(chrome.storage) if it hasn't been changed
  if (changedStoredData === null)
    storedData.push({ 'url': getBaseURL(), 'elements': storedColors });
  //Save elements to chrome.storage
  chrome.storage.local.set({ "Colorfy": JSON.stringify(storedData) });
};

/**
 * Take DOM element and return it's information in JSON form
 * @param {DOM} e DOM element
 * @return {Object} JSON object with element information
 */
const elementInfo = e => {
  let element = e.target;
  let elementId = element.id;
  let background = element.style.background;
  let backgroundColor = element.style.backgroundColor;
  let color = element.style.color;
  let elementClass = element.className;
  let elementNodeName = element.nodeName;
  let parent = element.parentNode;
  let parentNode;
  if(parent.nodeName != "#document")
    parentNode = {
      id: parent.id.trim(),
      className: parent.className.trim(),
      nodeName: parent.nodeName
    }
  else
    parentNode = {
      id: "#document",
      className: "#document",
      nodeName: "#document"
    }     

  let el = {
    nodeName: elementNodeName,
    id: elementId.trim(),
    className: elementClass.trim(),
    background: background,
    backgroundColor: backgroundColor,
    color: color,
    parentNode: parentNode
  };
  console.log(el)
  return el;
};

/**
 * Get the info about elements parent, used for elements with only tagName, 
 * so that we dont change all elements with that tag across entire website.
 * @param {Object} element HTML element
 */
const parentInfo = element => {
  let parent = element.parentNode;
  let parentNode;
  if(parent.nodeName != "#document")
    parentNode = {
      id: parent.id.trim(),
      className: parent.className.trim(),
      nodeName: parent.nodeName
    }
  else
    parentNode = {
      id: "#document",
      className: "#document",
      nodeName: "#document"
    }     
  return parentNode;

}

/**
 * Check if the two objects are identical
 * @param {Object} first
 * @param {Object} second 
 */
const checkParents = (first, second) => {
  if (first.id == second.id && first.className == second.className && first.nodeName == second.nodeName)
    return true;
  else
    return false
}

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
  else if (element.nodeName) {
    let tmp = document.getElementsByTagName(element.nodeName);
    for (let i = 0, len = tmp.length; i < len; i++) {
      if (checkParents(element.parentNode, parentInfo(tmp[i])))
        elArr.push(tmp[i]);
    }
  }
  return elArr;
};

/**
 * Change background colors for the given elements
 * @param {array} data 
 */
const getSavedChanges = (data) => {
  if (data) {
    for (let i = 0, len = data.length; i < len; i++) {
      //Get DOM elements
      let selectedElements = selectElements(data[i]);
      let selectedBackground = data[i].background;
      let selectedBackgroundColor = data[i].backgroundColor;
      let selectedTextColor = data[i].color;
      //Change color for each DOM element
      for (let index = 0; index < selectedElements.length; index++) {
        const element = selectedElements[index];
        element.style.setProperty(
          "background",
          selectedBackgroundColor,
          "important"
        );
        element.style.setProperty(
          "background",
          selectedBackground,
          "important"
        );
        element.style.setProperty("color", "none", "important");
        element.style.setProperty("color", selectedTextColor, "important");
        //Change text color of all elements nested inside original element
        let family = element.getElementsByTagName("*");
        for (let i = 0, len = family.length; i < len; i++) {
          family[i].style.setProperty("color", "none", "important");
          family[i].style.setProperty("color", selectedTextColor, "important");
        }
      }
    }
  }
};


const clearColors = () => {
  chrome.storage.local.clear(function () {
    var error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
    }
  });
}

