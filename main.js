(function(global) {
  const init = () => {
    var selectedElement = null;
    //Saves background color for the element if there is inline CSS on the element
    var saveBackground = null;
    var saveBackgroundColor = null;
    var colorfyColorPicker = null;

    addColorPicker();
    addListeners();
  };
  
  const changeColor = () => {
    var selectedColor = colorfyColorPicker.value;
    //Remove images from background
    selectedElement.style.setProperty("background", "none", "important");
    selectedElement.style.setProperty("background-color", selectedColor, "important"); 
  };

  const addColorPicker = e => {
    if (document.getElementById("colorfyColorPicker") != null) {
      return;
    }

    colorfyColorPicker = document.createElement("input");
    colorfyColorPicker.type = "color";
    colorfyColorPicker.id = "colorfyColorPicker";
    colorfyColorPicker.value = "#365389";
    colorfyColorPicker.hidden = true;
    document.getElementsByTagName("body")[0].appendChild(colorfyColorPicker);

    //FIX HTML5 color picker .oninput event seems to have a bugg that makes it act the same as .onchange event
    //so this will need to be addressed in to be able to add a color selected by default (colorfyColorPicker.value)
    colorfyColorPicker.oninput = changeColor;
  };

  //Change element background when hovered over (mouseover event)
  const hoverElements = e => {
    e = e || window.event;
    let target = e.target || e.srcElement;
    
    //FIX saveBackground and saveBackgroundColor, take the color from localstorage when it is created.
    saveBackground = target.style.background;
    saveBackgroundColor = target.style.backgroundColor;
    target.style.setProperty("background", "none", "important");
    target.style.setProperty("background-color", "rgba(0,40,80,0.3)", "important");
  };

  //Return  element background
  const resetHover = e => {
    e = e || window.event;
    let target = e.target || e.srcElement;
    if(saveBackgroundColor)
      target.style.setProperty("background-color", saveBackgroundColor);
    else if(saveBackground)
      target.style.setProperty("background", saveBackground);
    else{
      target.style.setProperty("background-color", "");
      target.style.setProperty("background", "");
    }
  };

  const removeListeners = () => {
    document.removeEventListener("click", selectElement);
    document.removeEventListener("mouseover", hoverElements);
    document.removeEventListener("mouseout", resetHover);
  };

  const addListeners = () => {
    document.addEventListener("click", selectElement, false);
    document.addEventListener("mouseover", hoverElements, false);
    document.addEventListener("mouseout", resetHover, false);
  };

  const selectElement = e => {
    e = e || window.event;
    let target = e.target || e.srcElement;
    if (target == colorfyColorPicker) return;
    else selectedElement = target;
    elementInfo(selectedElement);
    colorfyColorPicker.click();
    removeListeners();
    resetHover(e);
  };

  //preparation for backend.
  const elementInfo = element => {
    let elementId = element.id;
    let elementClass = element.className;
    let elementNodeName = element.nodeName;
    let parentElement = element.parentNode;
    let tree = [element];
    do {
      if (parentElement == document) break;
      tree.push(parentElement);
      parentElement = parentElement.parentNode;
      if (!parentElement) break;
    } while (parentElement.nodeName != "BODY");
  };

  init();
})(window);
