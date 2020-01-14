(function (global) {
  var saveBackground = null;
  //Saves background color for the element if there is inline CSS on the element
  var saveBackgroundColor = null;
  var selectedElement = null;
  var selectedColor = null;
  const init = () => {
    addColorPicker();
    addListeners();
  };

  /**
   * Changes background color of selected DOM element
   * @param {DOM} element DOM elment
   */
  const changeColor = element => {
    //Remove images from background
    element.style.setProperty("background", "none", "important");
    element.style.setProperty("background-color", selectedColor, "important");
  };

  /**
   * Create color picker and it's event listener that calls changeColor function
   */
  const addColorPicker = () => {
    var colorfyColorPicker = null;
    if (document.getElementById("colorfyColorPicker") != null) {
      return;
    }

    colorfyColorPicker = document.createElement("input");
    colorfyColorPicker.type = "color";
    colorfyColorPicker.id = "colorfyColorPicker";
    colorfyColorPicker.value = "#365389";
    colorfyColorPicker.hidden = true;
    document.getElementsByTagName("body")[0].appendChild(colorfyColorPicker);
    colorfyColorPicker.addEventListener("input", pickerInput);
  };

  /**
   * Select color from color picker and call changeColor function, 
   * then call saveElement function to save the selected element
   */
  const pickerInput = () => {
    selectedColor = colorfyColorPicker.value;
    let target = selectElements(selectedElement);
    for (let index = 0; index < target.length; index++) {
      const element = target[index];
      changeColor(element);
    }
    document.getElementsByTagName("body")[0].removeChild(colorfyColorPicker);
    saveElement(elementInfo(selectedElement));
    removeListeners();
  };

  /**
   * Change element background when hovered over (mouseover event)
   * @param {DOM} e DOM element that is taken from onmouseover event
   */
  const hoverElements = e => {
    let target = selectElements(e);

    for (let index = 0; index < target.length; index++) {
      const element = target[index];
      //FIX saveBackground and saveBackgroundColor, take the color from localstorage when it is created.
      saveBackground = element.style.background;
      saveBackgroundColor = element.style.backgroundColor;
      element.style.setProperty("background", "none", "important");
      element.style.setProperty(
        "background-color",
        "rgba(0,40,80,0.5)",
        "important"
      );
    }
  };

  /**
   * Return element background (mouseout event)
   * @param {DOM} e DOM element that is taken from mouseout event
   */
  const resetHover = e => {
    let target = selectElements(e);

    for (let index = 0; index < target.length; index++) {
      const element = target[index];
      if (saveBackgroundColor)
        element.style.setProperty("background-color", saveBackgroundColor);
      else if (saveBackground)
        element.style.setProperty("background", saveBackground);
      else {
        element.style.setProperty("background-color", "");
        element.style.setProperty("background", "");
      }
    }
  };

  /**
   * Add event listeners
   */
  const addListeners = () => {
    document.addEventListener("click", changeElement, false);
    document.addEventListener("mouseover", hoverElements, false);
    document.addEventListener("mouseout", resetHover, false);
  };

  /**
   * Remove event listeners
   */
  const removeListeners = () => {
    document.removeEventListener("click", changeElement);
    document.removeEventListener("mouseover", hoverElements);
    document.removeEventListener("mouseout", resetHover);
  };

  /**
   * Take DOM element and return it's information in JSON form
   * This is a coppy of the function from backend.js that is used in case when backend.js fails to load
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
   * Select element and click on color picker to activate color picker event listener
   * @param {object} e DOM object taken from the onClick event listener
   */
  const changeElement = e => {
    colorfyColorPicker.click();
    if (e.target == colorfyColorPicker) return;
    else {
      selectedElement = e;
    }
    resetHover(e);
    removeListeners();
  };

  /**
   * Select elements on the page with the information provided and return it
   * @param {object} e DOM or JSON object with the information about the element
   * @return {array} Array consisting of DOM elements
   */
  const selectElements = e => {
    let element;
    if (e.target)
      element = e.target;
    else
      element = e;
    let elArr = [];
    if (element.id)
      elArr.push(document.getElementById(element.id));
    else if (element.className)
      elArr = document.getElementsByClassName(element.className);
    else if (element.nodeName)
      elArr = document.getElementsByTagName(element.nodeName);
    return elArr;
  };

  init();
})(window);
