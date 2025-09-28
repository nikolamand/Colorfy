/**
 * Color palette creation and management for Colorfy extension
 */

// Palette state
let useGradients = true;

/**
 * Get gradient option from storage and apply it
 */
const applyGradientOption = () => {
  chrome.storage.local.get("Colorfy_useGradients", (data) => {
    if (data.Colorfy_useGradients !== undefined) {
      useGradients = data.Colorfy_useGradients;
    }
  });
};

/**
 * Collapsing logic for gradient colors
 */
const colapsePreviousElement = (paletteName, text) => {
  const palette = document.getElementsByClassName(
    `palette-${paletteName}`
  )[0];
  const collapseButton = document.createElement("div");
  collapseButton.className = "colapse_button__Colorfy";
  collapseButton.innerHTML = `${text} <span class="material-symbols-outlined">keyboard_arrow_down</span>`;

  collapseButton.addEventListener("click", function () {
    this.classList.toggle("active");
    const collapseContent = this.previousElementSibling;
    const family = collapseContent.getElementsByTagName("*");

    if (collapseContent.style.maxHeight) {
      collapseContent.style.maxHeight = null;
      for (let i = 0; i < family.length; i++) {
        family[i].style.maxHeight = null;
        family[i].style.border = null;
      }
      collapseButton.innerHTML = `${text} <span class="material-symbols-outlined">keyboard_arrow_up</span>`;
    } else {
      collapseContent.style.maxHeight = "0";
      for (let i = 0; i < family.length; i++) {
        family[i].style.maxHeight = "0";
        family[i].style.setProperty("border", "0", "important");
      }
      collapseButton.innerHTML = `${text} <span class="material-symbols-outlined">keyboard_arrow_down</span>`;
    }
  });
  palette.appendChild(collapseButton);
};

/**
 * Add preset colors or gradients to the palette UI
 */
const addPresetColors = (colors, paletteName, collapse = false) => {
  const palette = document.getElementsByClassName(
    `palette-${paletteName}`
  )[0];
  const presetColors = document.createElement("div");
  presetColors.className = "colorfy_preset_colors__Colorfy";

  for (let i = 0; i < colors.length; i++) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.name = `paletteColors-${paletteName}`;
    input.type = "radio";
    input.value = colors[i];

    const selectedColors = window.getSelectedColors ? window.getSelectedColors() : { background: null, text: null };
    if (colors[i] === selectedColors.background && paletteName === "background") {
      input.checked = true;
    }
    if (colors[i] === selectedColors.text && paletteName === "text") {
      input.checked = true;
    }

    const colorBox = document.createElement("p");
    colorBox.className = "colorfy_color__Colorfy";
    colorBox.style.background = colors[i];
    colorBox.title = colors[i];

    label.appendChild(input);
    label.appendChild(colorBox);
    presetColors.appendChild(label);
    palette.appendChild(presetColors);

    // Toggle gradient direction on click
    if (colors[i].startsWith("linear-gradient")) {
      colorBox.addEventListener("click", () => {
        if (colors[i].includes("to right")) {
          colors[i] = colors[i].replace("to right", "to left");
        } else if (colors[i].includes("to left")) {
          colors[i] = colors[i].replace("to left", "to right");
        }
        input.value = colors[i];
        colorBox.style.background = colors[i];
      });
    }
  }

  if (collapse) {
    const family = presetColors.getElementsByTagName("*");
    presetColors.style.maxHeight = "0";
    for (let i = 0; i < family.length; i++) {
      family[i].style.maxHeight = "0";
      family[i].style.setProperty("border", "0", "important");
    }
  }
};

/**
 * Add a "Default color" option that reverts background/text to original
 */
const addDefaultColor = (paletteName) => {
  const palette = document.getElementsByClassName(
    `palette-${paletteName}`
  )[0];
  const individualWrap = document.createElement("div");
  individualWrap.className = "individual_color_wrapper__Colorfy";

  const label = document.createElement("label");
  label.className = "colorfy_default_color_wrap__Colorfy";

  const input = document.createElement("input");
  input.name = `paletteColors-${paletteName}`;
  input.type = "radio";
  input.value = "";
  input.checked = true;

  const colorBox = document.createElement("p");
  colorBox.className =
    "colorfy_color__Colorfy colorfy_default_color__Colorfy";
  colorBox.style.backgroundColor = "white";
  colorBox.innerHTML = chrome.i18n.getMessage("defaultColor");

  label.appendChild(input);
  label.appendChild(colorBox);
  individualWrap.appendChild(label);
  palette.appendChild(individualWrap);
};

/**
 * Add the custom color picker (VanillaPicker)
 */
const addCustomColor = (paletteName) => {
  const palette = document.getElementsByClassName(
    `palette-${paletteName}`
  )[0];
  const individualWrap = document.createElement("div");
  individualWrap.className = "individual_color_wrapper__Colorfy";

  const label = document.createElement("label");
  label.className = "colorfy_custom_color__Colorfy";

  const input = document.createElement("input");
  input.name = `paletteColors-${paletteName}`;
  input.id = `customColor-${paletteName}`;
  input.type = "radio";
  input.value = "#FFFFFF";

  // If the selected element has a current color, set it
  let currentColor = "#FFFFFF";

  const selectedElement = window.getSelectedElement ? window.getSelectedElement() : null;
  if (selectedElement?.target) {
    const hexBackground = window.rgbToHex ? window.rgbToHex(selectedElement.target.style.background) : null;
    const hexColor = window.rgbToHex ? window.rgbToHex(selectedElement.target.style.color) : null;
    if (paletteName === "background") {
      currentColor = hexBackground || "#FFFFFF";
    } else if (paletteName === "text") {
      currentColor = hexColor || "#000000";
    }
  }

  // Update input value with current color
  input.value = currentColor;

  const colorBox = document.createElement("p");
  colorBox.className = "colorfy_color__Colorfy colorfy_custom_color__Colorfy";
  colorBox.id = `colorfy_color-${paletteName}`;
  colorBox.innerHTML = chrome.i18n.getMessage("customColor");
  colorBox.style.backgroundColor = currentColor;

  // Set initial text color based on background
  const initialTextColor = window.getOptimalTextColor ? window.getOptimalTextColor(currentColor) : "#000000";
  colorBox.style.setProperty('color', initialTextColor, 'important');

  // If "Picker" is available (VanillaPicker)
  if (typeof Picker !== "undefined") {
    // eslint-disable-next-line no-undef
    new Picker({
      parent: colorBox,
      color: currentColor,
      onChange: (color) => {
        colorBox.style.background = color.rgbaString;
        input.value = color.rgbaString;
        input.checked = true; // Automatically select this radio button when color changes
        
        // Update text color based on the new background color
        const optimalTextColor = getOptimalTextColor(color.rgbaString);
        colorBox.style.setProperty('color', optimalTextColor, 'important');
      },
    });
  } else {
    // Fallback: create a regular color input
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = currentColor.length === 7 ? currentColor : "#FFFFFF";
    colorInput.style.width = "50px";
    colorInput.style.height = "30px";
    colorInput.style.border = "none";
    colorInput.style.borderRadius = "5px";
    colorInput.style.cursor = "pointer";
    colorInput.style.marginLeft = "10px";
    
    colorInput.addEventListener("change", (e) => {
      const selectedColor = e.target.value;
      colorBox.style.background = selectedColor;
      input.value = selectedColor;
      input.checked = true; // Automatically select this radio button when color changes
      
      // Update text color based on the new background color
      const optimalTextColor = getOptimalTextColor(selectedColor);
      colorBox.style.setProperty('color', optimalTextColor, 'important');
    });
    
    colorBox.appendChild(colorInput);
  }

  label.appendChild(input);
  label.appendChild(colorBox);
  individualWrap.appendChild(label);
  palette.appendChild(individualWrap);
};

/**
 * Add both background and text color pickers to the palette
 */
const addColors = (paletteName) => {
  const { colorsWrapper } = getUIReferences();
  
  if (!colorsWrapper) {
    return;
  }
  
  const palette = document.createElement("div");
  palette.className = `palette__Colorfy palette-${paletteName}`;
  colorsWrapper.appendChild(palette);

  const paletteInfo = document.createElement("p");
  paletteInfo.className = "palette_info__Colorfy";
  paletteInfo.innerHTML =
    paletteName === "background"
      ? chrome.i18n.getMessage("background")
      : chrome.i18n.getMessage("text");
  palette.appendChild(paletteInfo);

  // Default color option
  addDefaultColor(paletteName);

  // Preset colors
  if (window.colorfyColors) {
    addPresetColors(window.colorfyColors, paletteName);
  }

  // Custom color picker
  addCustomColor(paletteName);

  // If background, also add collapsible gradients
  if (paletteName === "background" && useGradients && window.colorfyGradients) {
    addPresetColors(window.colorfyGradients, paletteName, true);
    colapsePreviousElement(paletteName, "Gradient colors");
  }
};

/**
 * Open the color pickers (background & text) in a UI panel
 */
const addColorPicker = () => {
  createPaletteWrapper(() => {
    addColors("background");
    addColors("text");
  });
};

/**
 * Gather the chosen colors from the radio inputs, apply, then save
 */
const selectedChanges = () => {
  // Check if current style allows editing
  if (!window.canEditCurrentStyle()) {
    alert("Cannot apply changes to the Original style. Please select a different style to make changes.");
    return;
  }

  // Background
  const backgroundInputs = document.getElementsByName(
    "paletteColors-background"
  );
  for (let i = 0; i < backgroundInputs.length; i++) {
    if (backgroundInputs[i].checked) {
      const selectedColors = window.getSelectedColors ? window.getSelectedColors() : { background: null, text: null };
      if (window.setSelectedColors) {
        window.setSelectedColors(backgroundInputs[i].value, selectedColors.text);
      }
      break;
    }
  }

  // Text
  const textInputs = document.getElementsByName("paletteColors-text");
  for (let i = 0; i < textInputs.length; i++) {
    if (textInputs[i].checked) {
      const selectedColors = window.getSelectedColors ? window.getSelectedColors() : { background: null, text: null };
      if (window.setSelectedColors) {
        window.setSelectedColors(selectedColors.background, textInputs[i].value);
      }
      break;
    }
  }

  // Apply to the previously selected element
  const selectedElement = window.getSelectedElement ? window.getSelectedElement() : null;
  if (selectedElement) {
    const targetEls = window.selectElements ? window.selectElements(selectedElement) : [selectedElement.target];
    for (let index = 0; index < targetEls.length; index++) {
      if (window.changeColor) {
        window.changeColor(targetEls[index]);
      }
    }

    // Save to the current style instead of legacy storage
    if (window.saveElementToCurrentStyle) {
      const elementInfoData = window.elementInfo ? window.elementInfo(selectedElement) : {};
      window.saveElementToCurrentStyle(elementInfoData, () => {
        // Update the style selector to reflect changes
        if (window.populateStyleSelector) {
          window.populateStyleSelector();
        }
      });
    } else {
      // Fallback to legacy system
      if (window.saveElement && window.elementInfo) {
        window.saveElement(window.elementInfo(selectedElement));
      }
    }
  }

  // Done
  if (window.closeColorfy) {
    window.closeColorfy();
  }
};

/**
 * Get the current gradient setting
 */
const getUseGradients = () => useGradients;

// Make functions globally accessible
window.applyGradientOption = applyGradientOption;
window.colapsePreviousElement = colapsePreviousElement;
window.addPresetColors = addPresetColors;
window.addDefaultColor = addDefaultColor;
window.addCustomColor = addCustomColor;
window.addColors = addColors;
window.addColorPicker = addColorPicker;
window.selectedChanges = selectedChanges;
window.getUseGradients = getUseGradients;
