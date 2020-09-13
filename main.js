(function (global) {

  var selectedElement = null;
  var selectedBackground = null;
  var selectedTextColor = null;
  var modalWrapper = null;
  var paletteWrapper = null;
  let colorsWrapper = null;
  let storedLocalElements = [];
  let storedLocalData = [];

  var colorfyColors = [
    //black
    "#222930",
    "#595959",
    "#6c7a89",

    //blue
    "#1727AE",
    "#97BAEC",

    "#8E0000",

    "#FC90AF",
    "#502688",
    //white
    "#E9E9E9",
    "#FFFFFF"
  ];

  //Gradients have to be (to right/to left) because of the cliping and long pages
  //they also have to start with this format in order to be able to change
  var colorfyGradients = [
    "linear-gradient(to right, rgba(33,147,176,1) 0%, rgba(109,213,237,1) 100%)",
    "linear-gradient(to right, #b8cbb8 0%, #b8cbb8 0%, #b465da 0%, #cf6cc9 33%, #ee609c 66%, #ee609c 100%)",
    "linear-gradient(to right, rgba(149,149,149,1) 0%, rgba(44,62,80,1) 100%)",
    "linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)",
    "linear-gradient(to right, #6a11cb 0%, #2575fc 100%)"
  ]

  const init = () => {
    //Load CSS
    let style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = "./colorfy.css";
    document.getElementsByTagName("body")[0].appendChild(style);
    let fontAwesome = document.createElement("link");
    fontAwesome.rel = "stylesheet";
    fontAwesome.type = "text/css";
    fontAwesome.href = "./assets/fontawesome/css/all.css";
    document.getElementsByTagName("body")[0].appendChild(fontAwesome);

    //Dummy element used to check if the listeners have already been added
    let colorfyCheck = document.getElementById("colorfy_check");
    if (!colorfyCheck)
      addListeners();
  };

  /**
   * Creates a modal with palette wrapper used to contain bacground and text color schemes
   */
  const createPaletteWrapper = () => {

    modalWrapper = document.createElement("div");
    modalWrapper.id = "colorfy_modal";
    modalWrapper.className = "colorfy_modal__Colorfy";
    document.getElementsByTagName("body")[0].appendChild(modalWrapper);
    modalWrapper.addEventListener("click", closeColorfy, false);

    paletteWrapper = document.createElement("div");
    paletteWrapper.id = "palette_wrapper";
    paletteWrapper.className = "palette_wrapper__Colorfy";
    let bgImage = chrome.runtime.getURL("assets/images/bright-squares.png");
    paletteWrapper.style.background = "url('" + bgImage + "'), linear-gradient(135deg, rgba(16,16,16,1) 0%, rgba(51,51,51,1) 65%, rgba(136,136,136,1) 100%)";
    document.getElementsByTagName("body")[0].appendChild(paletteWrapper);

    let logo = document.createElement('img');
    logo.id = "colorfy_logo";
    logo.className = "colorfy_logo__Colorfy";
    logo.src = chrome.runtime.getURL("assets/logo.svg");;
    logo.alt = "Colorfy";
    logo.title = "Colorfy";
    paletteWrapper.appendChild(logo);

    let closeBtn = document.createElement("span");
    closeBtn.className = "closeColorfy__Colorfy";
    closeBtn.innerHTML = "&times;";
    closeBtn.title = "Cancel";
    closeBtn.onclick = closeColorfy;
    paletteWrapper.appendChild(closeBtn);

    colorsWrapper = document.createElement("div");
    colorsWrapper.id = "colors_wrapper";
    colorsWrapper.className = "colors_wrapper__Colorfy";
    paletteWrapper.appendChild(colorsWrapper);

    let selectBtn = document.createElement("button");
    selectBtn.id = "colorfy_submit";
    selectBtn.className = "colorfy_submit__Colorfy";
    selectBtn.innerHTML = "OK";
    selectBtn.onclick = selectedChanges;

    paletteWrapper.appendChild(selectBtn);

    let savedItemsButton = document.createElement("div")
    savedItemsButton.id = "saved_items_button";
    savedItemsButton.className = "saved_items_button__Colorfy";
    savedItemsButton.innerHTML = '<i class="fa fa-cog"></i>';
    savedItemsButton.title = "Advanced changes";
    paletteWrapper.appendChild(savedItemsButton);

    addSavedItems();
  };

  const addInputElement = (id, name) => {
    let manualInputElement = document.createElement('input');
    manualInputElement.id = id;
    manualInputElement.nodeName = name;
    manualInputElement.className = "manual_input_elment__Colorfy";
    return manualInputElement
  }

  const addNewLabelElement = (title, className) => {
    let labelElement = document.createElement('label');
    labelElement.innerHTML = title;
    labelElement.className = "input_label__Colorfy";
    return labelElement
  }


  const addSavedItems = () => {
    let optionsWrapper = document.createElement("div")
    optionsWrapper.id = "options_wrapper";
    optionsWrapper.className = "options_wrapper__Colorfy";
    paletteWrapper.appendChild(optionsWrapper);

    let manualInputWrapper = document.createElement("div")
    manualInputWrapper.id = "manual_input_wrapper";
    manualInputWrapper.className = "manual_input_wrapper__Colorfy";
    optionsWrapper.appendChild(manualInputWrapper);

    manualInputWrapper.appendChild(addNewLabelElement('Element name:', 'manual_input_node'));
    let manualInputNode = addInputElement('manual_input_node', 'manual_input_node');
    manualInputWrapper.appendChild(manualInputNode);

    manualInputWrapper.appendChild(addNewLabelElement('Background:', 'manual_input_background'));
    let manualInputBackground = addInputElement('manual_input_background', 'manual_input_background');
    manualInputWrapper.appendChild(manualInputBackground);

    manualInputWrapper.appendChild(addNewLabelElement('Text color:', 'manual_input_color'));
    let manualInputColor = addInputElement('manual_input_color', 'manual_input_color');
    manualInputWrapper.appendChild(manualInputColor);

    manualInputWrapper.appendChild(addNewLabelElement('Class:', 'manual_input_class'));
    let manualInputClass = addInputElement('manual_input_class', 'manual_input_class');
    manualInputWrapper.appendChild(manualInputClass);

    manualInputWrapper.appendChild(addNewLabelElement('Id:', 'manual_input_id'));
    let manualInputId = addInputElement('manual_input_id', 'manual_input_id');
    manualInputWrapper.appendChild(manualInputId);

    let manualButtonsWrapper = document.createElement("div");
    manualButtonsWrapper.className = "manual_buttons_wrapper__Colorfy";
    manualInputWrapper.appendChild(manualButtonsWrapper);

    let manualInputAdd = document.createElement("div")
    manualInputAdd.id = "manual_input_add";
    manualInputAdd.className = "manual_input_add__Colorfy";
    manualInputAdd.innerHTML = '<i class="fa fa-check"></i>';
    manualButtonsWrapper.appendChild(manualInputAdd);

    let manualInputCancel = document.createElement("div")
    manualInputCancel.id = "manual_input_cancel";
    manualInputCancel.className = "manual_input_cancel__Colorfy";
    manualInputCancel.innerHTML = '<i class="fa fa-times"></i>';
    manualButtonsWrapper.appendChild(manualInputCancel);

    let manualInputShow = document.createElement("div")
    manualInputShow.id = "manual_input_show";
    manualInputShow.className = "manual_input_show__Colorfy";
    manualInputShow.innerHTML = '<i class="fa fa-plus"></i>';
    optionsWrapper.appendChild(manualInputShow);

    manualInputShow.addEventListener("click", function () {
      manualInputWrapper.style.display = 'flex';
    });

    manualInputCancel.addEventListener("click", function () {
      manualInputWrapper.style.display = 'none';
    })

    manualInputAdd.addEventListener("click", function (event) {
      let manualObject = {};
      manualObject["nodeName"] = "";
      if (manualInputNode.value) {
        manualObject["nodeName"] = manualInputNode.value;
        manualInputNode.value = '';
      }

      manualObject["backround"] = "";
      if (manualInputBackground.value) {
        manualObject["background"] = manualInputBackground.value;
        manualInputBackground.value = '';
      }

      manualObject["color"] = "";
      if (manualInputColor.value) {
        manualObject["color"] = manualInputColor.value;
        manualInputColor.value = '';
      }

      manualObject["className"] = "";
      if (manualInputClass.value) {
        manualObject["className"] = manualInputClass.value;
        manualInputClass.value = '';
      }

      manualObject["id"] = "";
      if (manualInputId.value) {
        manualObject["id"] = manualInputId.value;
        manualInputId.value = '';
      }

      manualAdd(manualObject);

      manualInputWrapper.style.display = 'none';


    });


    let savedElementsWrapper = document.createElement("div");
    savedElementsWrapper.className = "saved_items_wrapper__Colorfy";
    savedElementsWrapper.id = "saved_items_wrapper";
    optionsWrapper.appendChild(savedElementsWrapper);

    document.getElementById('saved_items_button').onclick = () => {
      if (window.getComputedStyle(optionsWrapper).display === 'none')
        optionsWrapper.style.display = 'block';
      else
        optionsWrapper.style.display = 'none';

      displaySavedElements(savedElementsWrapper);
    }
    loadSavedElements();

  }

  const manualSave = object => {
    let pageUrl = getBaseURL()
    storedLocalData.forEach((el, i) => {
      if (storedLocalData[i]["url"] === pageUrl) {
        storedLocalData[i]["elements"] = object;
      }
    });
    chrome.storage.local.set({ "Colorfy": JSON.stringify(storedLocalData) });
  }

  const manualAdd = object => {
    storedLocalElements[0].push(object);
    manualSave(storedLocalElements[0]);
    displaySavedElements(document.getElementById("saved_items_wrapper"));

  }

  const deleteSavedElement = (elIndex) => {

    storedLocalElements[0].splice(elIndex, 1);

    displaySavedElements(document.getElementById("saved_items_wrapper"));
    manualSave(storedLocalElements[0])

  }

  /**
   * Load all saved elements and put them inside a selected HTML element
   * @param {DOM} elementName HTML DOM element for hosting saved elements
   */
  const loadSavedElements = () => {

    chrome.storage.local.get(["Colorfy"], function (data) {
      if (data["Colorfy"]) {
        storedLocalData = changeFormat(data["Colorfy"])
        for (let i = 0, len = storedLocalData.length; i < len; i++) {

          if (storedLocalData[i]["url"] == getBaseURL()) {
            let storedElements = storedLocalData[i]["elements"];
            storedLocalElements.push(storedElements);
          }
        }
      }
    });
  }

  const displaySavedElements = (elementName) => {
    elementName.innerHTML = '';
    for (let index = 0; index < storedLocalElements[0].length; index++) {
      const element = storedLocalElements[0][index];
      let deleteElement = document.createElement("button");
      deleteElement.id = "colorfy_delete_" + index;
      deleteElement.className = "delete_saved_button__Colorfy";
      deleteElement.innerHTML = '<i class="fa fa-trash"></i>';
      elementName.appendChild(deleteElement);

      deleteElement.onclick = function () { deleteSavedElement(index) };

      let elementInput = document.createElement("textarea")
      elementInput.className = "saved_element_input__Colorfy";
      elementInput.value = JSON.stringify(element, null, 4);
      elementName.appendChild(elementInput);

    }
  }
  /**
   * Adds colors from the array to the selected palette
   * @param {Array} colors Array containing base colors used in both background and text
   * @param {String} paletteName String for palette name, it can be "background" and "text"
   */
  const addPresetColors = (colors, paletteName) => {
    let label = null;
    let presetColors = null;
    let palette = null;

    palette = document.getElementsByClassName("palette-" + paletteName)[0];

    presetColors = document.createElement("div");
    presetColors.className = "colorfy_preset_colors__Colorfy"

    //Colors from array
    for (let i = 0, len = colors.length; i < len; i++) {
      let input = null;
      let colorBox = null;
      label = document.createElement("label");
      input = document.createElement("input");
      input.name = "paletteColors-" + paletteName;
      input.type = "radio";
      input.value = colors[i];
      colorBox = document.createElement("p");
      colorBox.className = "colorfy_color__Colorfy";
      colorBox.style.background = colors[i];
      colorBox.title = colors[i];


      presetColors.appendChild(label)
      palette.appendChild(presetColors);
      label.appendChild(input);
      label.appendChild(colorBox);
      if (colors[i].startsWith("linear-gradient")) {
        colorBox.addEventListener('click', function () {
          if (colors[i].includes("to right"))
            colors[i] = colors[i].replace("to right", "to left")
          else if (colors[i].includes("to left"))
            colors[i] = colors[i].replace("to left", "to right")
          input.value = colors[i];
          colorBox.style.background = colors[i];
        });
      }
    }

  }

  /**
   * Adds selction for the "Default color" that returns the color to its original value
   * @param {String} paletteName String for palette name, it can be "background" and "text"
   */
  const addDefaultColor = (paletteName) => {
    let label = null;
    let input = null;
    let individualWrap = null;
    let colorBox = null;
    let palette = null;

    palette = document.getElementsByClassName("palette-" + paletteName)[0];

    individualWrap = document.createElement("div");
    individualWrap.className = "individual_color_wrapper__Colorfy";

    //Default color, used to change background back to initial
    label = document.createElement("label");
    label.className = "colorfy_default_color_wrap__Colorfy"
    input = document.createElement("input");
    input.name = "paletteColors-" + paletteName;
    input.type = "radio";
    input.value = "";
    input.checked = true;
    colorBox = document.createElement("p");
    colorBox.className = "colorfy_color__Colorfy colorfy_default_color__Colorfy";
    colorBox.style.backgroundColor = "white";
    colorBox.innerHTML = chrome.i18n.getMessage("defaultColor");

    individualWrap.appendChild(label)
    palette.appendChild(individualWrap);
    label.appendChild(input);
    label.appendChild(colorBox);

  }

  /**
   * Adds custom color picker to the palette
   * @param {String} paletteName String for palette name, it can be "background" and "text"
   */
  const addCustomColor = (paletteName) => {
    let label = null;
    let input = null;
    let individualWrap = null;
    let colorBox = null;
    let palette = null;

    palette = document.getElementsByClassName("palette-" + paletteName)[0];

    individualWrap = document.createElement("div");
    individualWrap.className = "individual_color_wrapper__Colorfy";

    //Create custom color (vanilla color picker)
    label = document.createElement("label");
    label.className = "colorfy_custom_color__Colorfy";

    input = document.createElement("input");
    input.name = "paletteColors-" + paletteName;
    input.id = "customColor-" + paletteName;
    input.type = "radio";
    input.value = "FFF";


    colorBox = document.createElement("p");
    colorBox.className = "colorfy_color__Colorfy colorfy_custom_color__Colorfy";
    colorBox.id = "colorfy_color-" + paletteName;
    colorBox.innerHTML = chrome.i18n.getMessage("customColor");
    colorBox.style.backgroundColor = "#FFF";

    //set the initial custom color to already selected color
    let currentColor;
    if (paletteName == "background")
      currentColor = selectedElement.target.style.background;
    if (paletteName == "text")
      currentColor = selectedElement.target.style.color;
    if (!currentColor)
      currentColor = "#FFFF";

    if (typeof Picker != "undefined") {
      new Picker({
        parent: colorBox,
        color: currentColor,
        onChange: function (color) {
          colorBox.style.background = color.rgbaString;
          input.value = color.rgbaString;
          input.checked = true;
        }
      });
    }
    else
      console.log("Undefined Picker");

    individualWrap.appendChild(label)
    palette.appendChild(individualWrap);
    label.appendChild(input);
    label.appendChild(colorBox);

  }

  /**
   * Creates palette with color schemes, return to default color, and color picker.
   * @param {Array} colors Array containing base colors used in both background and text
   * @param {String} paletteName String for palette name, it can be "background" and "text"
   */
  const addColors = (paletteName) => {

    let palette = null;
    let paletteInfo = null;

    palette = document.createElement("div");
    palette.className = "palette__Colorfy palette-" + paletteName;
    colorsWrapper.appendChild(palette);

    paletteInfo = document.createElement("p");
    paletteInfo.className = "palette_info__Colorfy";
    let getPaletteName;
    if (paletteName == "background")
      getPaletteName = chrome.i18n.getMessage("background");
    if (paletteName == "text")
      getPaletteName = chrome.i18n.getMessage("text");

    paletteInfo.innerHTML = getPaletteName;
    palette.appendChild(paletteInfo);


    addDefaultColor(paletteName);

    addPresetColors(colorfyColors, paletteName);

    addCustomColor(paletteName);

    if (paletteName == "background")
      addPresetColors(colorfyGradients, paletteName)

  };

  /**
   * Apply selected changes to element and save them
   */
  const selectedChanges = () => {

    //Get the value of the selected color for background
    let background = document.getElementsByName("paletteColors-background");
    for (let i = 0, len = background.length; i < len; i++) {
      if (background[i].checked) {
        selectedBackground = background[i].value;
      }
    }

    //Get the value of the selected color for text
    let text = document.getElementsByName("paletteColors-text");
    for (let i = 0, len = text.length; i < len; i++) {
      if (text[i].checked) {
        selectedTextColor = text[i].value;
      }
    }

    //Apply to selected element
    let target = selectElements(selectedElement);
    for (let index = 0; index < target.length; index++) {
      const element = target[index];
      changeColor(element);
    }

    saveElement(elementInfo(selectedElement));

    //Remove picker and modal
    closeColorfy();

  }

  /**
   * Close Colorfy modal
   */
  const closeColorfy = () => {
    if (paletteWrapper) {
      document.getElementsByTagName("body")[0].removeChild(paletteWrapper);
    }
    if (modalWrapper) {
      document.getElementsByTagName("body")[0].removeChild(modalWrapper);
    }
    let checkWarning = document.getElementById("colorfy_impossible")
    if (checkWarning)
      document.getElementsByTagName("body")[0].removeChild(checkWarning);
    removeListeners();
  }

  /**
   * Changes background color of selected DOM element
   * @param {DOM} element DOM elment
   */
  const changeColor = element => {
    element.style.setProperty("background", selectedBackground, "important");
    element.style.setProperty("color", "none", "important");
    element.style.setProperty("color", selectedTextColor, "important");
    //Change text color of all elements nested inside original element
    let family = element.getElementsByTagName("*");
    for (let i = 0, len = family.length; i < len; i++) {
      family[i].style.setProperty("color", "none", "important");
      family[i].style.setProperty("color", selectedTextColor, "important");
    }
  };

  /**
   * Create color picker and it's event listener that calls changeColor function
   */
  const addColorPicker = () => {
    createPaletteWrapper();
    addColors("background");
    addColors("text");
  };

  /**
   * Change element background when hovered over (mouseover event)
   * @param {DOM} e DOM element that is taken from onmouseover event
   */
  const hoverElements = e => {
    let target = selectElements(e);

    for (let index = 0; index < target.length; index++) {
      const element = target[index];
      element.style.setProperty("border", "5px solid #000080");
      element.style.setProperty("opacity", "0.5");
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
      element.style.setProperty("border", "");
      element.style.setProperty("opacity", "1");
    }
  };

  /**
   * Add event listeners
   */
  const addListeners = () => {
    //Create a dummy element used to check if the listeners already exist
    let colorfyCheck = document.createElement("div");
    colorfyCheck.id = "colorfy_check";
    colorfyCheck.style.setProperty("position", "absolute");
    colorfyCheck.style.setProperty("opacity", "0");
    colorfyCheck.style.setProperty("height", "0");
    colorfyCheck.style.setProperty("width", "0");
    document.getElementsByTagName('body')[0].appendChild(colorfyCheck);

    document.addEventListener("click", changeElement, false);
    document.addEventListener("mouseover", hoverElements, false);
    document.addEventListener("mouseout", resetHover, false);
  };

  /**
   * Remove event listeners
   */
  const removeListeners = () => {
    //Remove dummy element used to check if the listeners already exist
    let colorfyCheck = document.getElementById("colorfy_check");
    if (colorfyCheck)
      document.getElementsByTagName("body")[0].removeChild(colorfyCheck);

    document.removeEventListener("click", changeElement);
    document.removeEventListener("mouseover", hoverElements);
    document.removeEventListener("mouseout", resetHover);
  };

  /**
   * Take DOM element and return it's information in JSON form
   * This is a coppy of the function from backend.js, in case when backend.js fails to load colors can still be changed
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
    if (parent.nodeName != "#document")
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
    return el;
  };

  /**
   * Select element and click on color picker to activate color picker event listener
   * @param {object} e DOM object taken from the onClick event listener
   */
  const changeElement = e => {
    selectedElement = e;
    addColorPicker();
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

    let colorfyWarning = document.createElement("p");
    colorfyWarning.id = "colorfy_impossible";
    colorfyWarning.className = "colorfy_impossible__Colorfy";
    colorfyWarning.innerHTML = chrome.i18n.getMessage("warningElement");

    let elArr = [];
    if (element.nodeName == "IFRAME") {
      let checkWarning = document.getElementById("colorfy_impossible")
      if (!checkWarning)
        document.getElementsByTagName("body")[0].appendChild(colorfyWarning);
    }
    else {
      let checkWarning = document.getElementById("colorfy_impossible")
      if (checkWarning)
        document.getElementsByTagName("body")[0].removeChild(checkWarning);
    }
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
