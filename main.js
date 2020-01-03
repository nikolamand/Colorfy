(function(global) {
  const changeColor = () => {
    var selectedColor = colorfyColorPicker.value;
    //Remove images from background
    selectedElement.style.background = "none";
    selectedElement.style.backgroundColor = selectedColor;
  };

  const init = () => {
    var selectedElement = null;
    //Saves background color for the element if there is inline CSS on the element
    var saveBackground = null;
    var colorfyColorPicker = null;

    addColorPicker();
    addListeners();
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

    //HTML5 color picker .oninput event seems to have a bugg that makes it act the same as .onchange event
    //so this will need to be addressed in to be able to add a color selected by default (colorfyColorPicker.value)
    colorfyColorPicker.oninput = changeColor;
  };

  //Change element background when hovered over (mouseover event)
  const hoverElements = e => {
    e = e || window.event;
    let target = e.target || e.srcElement;
    saveBackground = target.style.backgroundColor;
    target.style.backgroundColor = "rgba(0,130,255,0.3)";
  };

  //Return  element background
  const resetHover = e => {
    e = e || window.event;
    let target = e.target || e.srcElement;
    target.style.backgroundColor = saveBackground;
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
    console.log(colorfyColorPicker);
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
