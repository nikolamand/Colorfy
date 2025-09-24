(function () {
  let selectedElement = null;
  let selectedBackground = null;
  let selectedTextColor = null;
  let modalWrapper = null;
  let paletteWrapper = null;
  let colorsWrapper = null;

  let useGradients = true;

  // Keep track of whether we're actively selecting an element
  let selectionMode = false;

  // Local arrays for saved data
  let storedLocalElements = [];
  let storedLocalData = [];

  const colorfyColors = [
    // black
    "#222930",
    "#595959",
    "#6c7a89",
    // blue
    "#1727AE",
    "#97BAEC",
    // red
    "#8E0000",
    "#FC90AF",
    // purple
    "#502688",
    // white
    "#E9E9E9",
    "#FFFFFF",
  ];

  // Gradients must start with "linear-gradient(to right/...)" so that toggling can happen
  const colorfyGradients = [
    "linear-gradient(to right, rgba(33,147,176,1) 0%, rgba(109,213,237,1) 100%)",
    "linear-gradient(to right, #b8cbb8 0%, #b8cbb8 0%, #b465da 0%, #cf6cc9 33%, #ee609c 66%, #ee609c 100%)",
    "linear-gradient(to right, rgba(149,149,149,1) 0%, rgba(44,62,80,1) 100%)",
    "linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)",
    "linear-gradient(to right, #6a11cb 0%, #2575fc 100%)",
    "linear-gradient(to right, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.15) 100%), radial-gradient(at top center, rgba(255,255,255,0.40) 0%, rgba(0,0,0,0.40) 120%) #989898",
    "linear-gradient(to right, #eea2a2 0%, #bbc1bf 19%, #57c6e1 42%, #b49fda 79%, #7ac5d8 100%)",
    "linear-gradient(to right, #dbdcd7 0%, #dddcd7 24%, #e2c9cc 30%, #e7627d 46%, #b8235a 59%, #801357 71%, #3d1635 84%, #1c1a27 100%)",
    "linear-gradient(to right, #434343 0%, black 100%)",
  ];

  /**
   * Parse a color string and return RGB values and alpha
   * @param {string} colorStr - The color string (hex, rgb, rgba, hsl, etc.)
   * @returns {object} - Object with r, g, b, a values
   */
  const parseColor = (colorStr) => {
    // Create a temporary element to use browser's color parsing
    const div = document.createElement('div');
    div.style.color = colorStr;
    document.body.appendChild(div);
    
    // Get computed color (will be in rgb/rgba format)
    const computedColor = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    
    // Parse rgb/rgba values
    const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
        a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
      };
    }
    
    // Fallback for hex colors
    const hexMatch = colorStr.match(/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16),
        a: 1
      };
    }
    
    // Default fallback
    return { r: 0, g: 0, b: 0, a: 1 };
  };

  /**
   * Returns the optimal text color (black or white) based on background color brightness
   * @param {string} backgroundColor - The background color string
   * @returns {string} - Either 'black' or 'white'
   */
  const getOptimalTextColor = (backgroundColor) => {
    try {
      const { r, g, b, a } = parseColor(backgroundColor);
      
      // Mix the color with white based on its alpha value (for transparency)
      const mixedR = r * a + 255 * (1 - a);
      const mixedG = g * a + 255 * (1 - a);
      const mixedB = b * a + 255 * (1 - a);
      
      // Calculate brightness using the standard formula
      const brightness = (mixedR * 299 + mixedG * 587 + mixedB * 114) / 1000;
      
      // Return black for light backgrounds, white for dark backgrounds
      return brightness > 155 ? 'black' : 'white';
    } catch (e) {
      console.warn('Could not parse color:', backgroundColor, e);
      return 'black'; // Default to black if color parsing fails
    }
  };

  /**
   * Initialize the script: load CSS, add event listeners in a "selection mode".
   */
  const init = () => {
    // Load the primary CSS file
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.type = "text/css";
    styleLink.href = "./colorfy.css";
    document.body.appendChild(styleLink);

    const googleIcons = document.createElement("link");
    googleIcons.rel = "stylesheet";
    googleIcons.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
    document.body.appendChild(googleIcons);

    applyGradientOption();

    // Only add listeners once
    if (!document.getElementById("colorfy_check")) {
      addListeners();
      selectionMode = true; // We'll be in "selection mode" right away
    }
  };

  /*
   * Get options from storage and apply them to the page.
   */
  const applyGradientOption = () => {
    chrome.storage.local.get("Colorfy_useGradients", (data) => {
      if (data.Colorfy_useGradients !== undefined) {
        useGradients = data.Colorfy_useGradients;
      }
    });
  };

  const applyColorSchemeOption = () => {
    chrome.storage.local.get("Colorfy_colorScheme", (data) => {
      if (data.Colorfy_colorScheme) {
        const actualScheme =
          data.Colorfy_colorScheme === "system"
            ? getSystemTheme()
            : data.Colorfy_colorScheme;

        // Remove existing scheme classes
        paletteWrapper.classList.remove(
          "Colorfy_dark-scheme",
          "Colorfy_light-scheme"
        );

        // Add the class corresponding to the actual scheme
        paletteWrapper.classList.add(`Colorfy_${actualScheme}-scheme`);
      } else {
        const actualScheme = getSystemTheme();
        paletteWrapper.classList.add(`Colorfy_${actualScheme}-scheme`);
      }
    });
  };

  /**
   * Set the background and text color of the selected element.
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
   * Add the overlay modal and color palettes.
   */
  const createPaletteWrapper = () => {
    getPreviouslySavedColors();
    // Semi-transparent overlay
    modalWrapper = document.createElement("div");
    modalWrapper.id = "colorfy_modal";
    modalWrapper.className = "colorfy_modal__Colorfy";
    document.body.appendChild(modalWrapper);
    modalWrapper.addEventListener("click", closeColorfy, false);

    // The main palette container
    paletteWrapper = document.createElement("div");
    paletteWrapper.id = "palette_wrapper";
    paletteWrapper.className = "palette_wrapper__Colorfy";
    // const bgImage = chrome.runtime.getURL("assets/images/bright-squares.png");
    // paletteWrapper.style.background = `url('${bgImage}'), linear-gradient(135deg, rgba(16,16,16,1) 0%, rgba(51,51,51,1) 65%, rgba(136,136,136,1) 100%)`;
    document.body.appendChild(paletteWrapper);

    // Logo
    // const logo = document.createElement("img");
    // logo.id = "colorfy_logo";
    // logo.className = "colorfy_logo__Colorfy";
    // logo.src = chrome.runtime.getURL("assets/logo.svg");
    // logo.alt = "Colorfy";
    // logo.title = "Colorfy";
    // paletteWrapper.appendChild(logo);

    // Close button
    const closeBtn = document.createElement("span");
    closeBtn.className = "closeColorfy__Colorfy";
    closeBtn.innerHTML = "&times;";
    closeBtn.title = "Cancel";
    closeBtn.onclick = closeColorfy;
    paletteWrapper.appendChild(closeBtn);

    // Container for background/text color pickers
    colorsWrapper = document.createElement("div");
    colorsWrapper.id = "colors_wrapper";
    colorsWrapper.className = "colors_wrapper__Colorfy";
    paletteWrapper.appendChild(colorsWrapper);

    // Confirmation button
    const selectBtn = document.createElement("button");
    selectBtn.id = "colorfy_submit";
    selectBtn.className = "colorfy_submit__Colorfy";
    selectBtn.innerHTML = "OK";
    selectBtn.onclick = selectedChanges;
    paletteWrapper.appendChild(selectBtn);

    // Advanced changes toggle
    const savedItemsButton = document.createElement("div");
    savedItemsButton.id = "saved_items_button";
    savedItemsButton.className = "saved_items_button__Colorfy";
    savedItemsButton.innerHTML = `<span class="material-symbols-outlined">manufacturing</span>`;
    savedItemsButton.title = "Advanced changes";
    paletteWrapper.appendChild(savedItemsButton);

    applyColorSchemeOption();
    // Build advanced changes UI
    addSavedItems();
  };

  /**
   * Build the UI for advanced changes (saved elements, manual edits, etc.).
   */
  const addSavedItems = () => {
    const optionsWrapper = document.createElement("div");
    optionsWrapper.id = "options_wrapper";
    optionsWrapper.className = "options_wrapper__Colorfy";
    paletteWrapper.appendChild(optionsWrapper);

    // The “Add New Item” panel
    const manualInputWrapper = document.createElement("div");
    manualInputWrapper.id = "manual_input_wrapper";
    manualInputWrapper.className = "manual_input_wrapper__Colorfy";
    optionsWrapper.appendChild(manualInputWrapper);

    // Helper function to create label + input
    const addNewLabelElement = (labelText) => {
      const labelEl = document.createElement("label");
      labelEl.innerHTML = labelText;
      labelEl.className = "input_label__Colorfy";
      return labelEl;
    };
    const addInputElement = (id) => {
      const inputEl = document.createElement("input");
      inputEl.id = id;
      inputEl.className = "manual_input_elment__Colorfy";
      return inputEl;
    };

    // Element name
    manualInputWrapper.appendChild(addNewLabelElement("Element name:"));
    const manualInputNode = addInputElement("manual_input_node");
    manualInputWrapper.appendChild(manualInputNode);

    // Background
    manualInputWrapper.appendChild(addNewLabelElement("Background:"));
    const manualInputBackground = addInputElement("manual_input_background");
    manualInputWrapper.appendChild(manualInputBackground);

    // Text color
    manualInputWrapper.appendChild(addNewLabelElement("Text color:"));
    const manualInputColor = addInputElement("manual_input_color");
    manualInputWrapper.appendChild(manualInputColor);

    // Class
    manualInputWrapper.appendChild(addNewLabelElement("Class:"));
    const manualInputClass = addInputElement("manual_input_class");
    manualInputWrapper.appendChild(manualInputClass);

    // ID
    manualInputWrapper.appendChild(addNewLabelElement("Id:"));
    const manualInputId = addInputElement("manual_input_id");
    manualInputWrapper.appendChild(manualInputId);

    // Add/Cancel buttons
    const manualButtonsWrapper = document.createElement("div");
    manualButtonsWrapper.className = "manual_buttons_wrapper__Colorfy";
    manualInputWrapper.appendChild(manualButtonsWrapper);

    const manualInputAdd = document.createElement("div");
    manualInputAdd.id = "manual_input_add";
    manualInputAdd.className = "manual_input_add__Colorfy";
    manualInputAdd.innerHTML = `<span class="material-symbols-outlined">check_circle</span>`;
    manualInputAdd.title = "Add item";
    manualButtonsWrapper.appendChild(manualInputAdd);

    const manualInputCancel = document.createElement("div");
    manualInputCancel.id = "manual_input_cancel";
    manualInputCancel.className = "manual_input_cancel__Colorfy";
    manualInputCancel.innerHTML = `<span class="material-symbols-outlined">cancel</span>`;
    manualInputCancel.title = "Cancel";
    manualButtonsWrapper.appendChild(manualInputCancel);

    // Show/hide “Add New Item”
    const manualInputShow = document.createElement("div");
    manualInputShow.id = "manual_input_show";
    manualInputShow.className = "manual_input_show__Colorfy";
    manualInputShow.title = "Add new item";
    manualInputShow.innerHTML = `<span class="material-symbols-outlined">add_circle</span>`;
    optionsWrapper.appendChild(manualInputShow);

    manualInputShow.addEventListener("click", () => {
      manualInputWrapper.style.display = "flex";
      manualInputShow.style.display = "none";
    });
    manualInputCancel.addEventListener("click", () => {
      manualInputWrapper.style.display = "none";
      manualInputShow.style.display = "block";
    });

    // Handle adding new item manually
    manualInputAdd.addEventListener("click", () => {
      const manualObject = {
        nodeName: manualInputNode.value.trim() || "",
        background: manualInputBackground.value.trim() || "",
        color: manualInputColor.value.trim() || "",
        className: manualInputClass.value.trim() || "",
        id: manualInputId.value.trim() || "",
      };
      // Clear input fields
      manualInputNode.value = "";
      manualInputBackground.value = "";
      manualInputColor.value = "";
      manualInputClass.value = "";
      manualInputId.value = "";

      // Save & re-render
      manualAdd(manualObject);

      manualInputWrapper.style.display = "none";
      manualInputShow.style.display = "block";
    });

    // A wrapper for saved elements (to display them)
    const savedElementsWrapper = document.createElement("div");
    savedElementsWrapper.className = "saved_items_wrapper__Colorfy";
    savedElementsWrapper.id = "saved_items_wrapper";
    optionsWrapper.appendChild(savedElementsWrapper);

    // When user clicks the gear icon, toggle advanced changes
    document.getElementById("saved_items_button").onclick = () => {
      if (window.getComputedStyle(optionsWrapper).display === "none") {
        optionsWrapper.style.display = "block";
      } else {
        optionsWrapper.style.display = "none";
      }
      displaySavedElements(savedElementsWrapper);

      // Move the options wrapper if it's out of viewport
      const rect = optionsWrapper.getBoundingClientRect();
      const fullyInViewport =
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth);

      if (fullyInViewport) {
        optionsWrapper.style.setProperty("position", "initial", "important");
        optionsWrapper.style.setProperty("width", "100%", "important");
        optionsWrapper.style.setProperty("top", "0", "important");
      } else {
        optionsWrapper.style.setProperty("position", "absolute", "important");
        optionsWrapper.style.setProperty(
          "width",
          "calc(100% - 20px)",
          "important"
        );
        optionsWrapper.style.setProperty("top", "10px", "important");

        const closeOptionsBtn = document.createElement("span");
        closeOptionsBtn.className = "close_options__Colorfy";
        closeOptionsBtn.innerHTML = `<span class="material-symbols-outlined">close</span>`;
        closeOptionsBtn.title = "Close advanced changes";
        closeOptionsBtn.onclick = closeColorfy;
        optionsWrapper.appendChild(closeOptionsBtn);

        closeOptionsBtn.onclick = () => {
          document.getElementById("saved_items_button").click();
        };
      }
    };

    loadSavedElements();
  };

  /**
   * Actually add the new item to local arrays, update storage, re-render the page.
   */
  const manualAdd = (object) => {
    if (storedLocalElements[0]) {
      storedLocalElements[0].push(object);
    } else {
      storedLocalElements[0] = [object];
    }
    manualSave(storedLocalElements[0]);
    getSavedChanges(storedLocalElements[0]);
    displaySavedElements(document.getElementById("saved_items_wrapper"));
  };

  /**
   * Persist changes into `storedLocalData`.
   */
  const manualSave = (object) => {
    const pageUrl = getBaseURL();
    storedLocalData.forEach((item) => {
      if (item.url === pageUrl) {
        item.elements = object;
      }
    });
    console.log("Manual save:", storedLocalData);
    chrome.storage.local.set({ Colorfy: JSON.stringify(storedLocalData) });
  };

  const deleteSavedElement = (elIndex) => {
    storedLocalElements[0].splice(elIndex, 1);
    displaySavedElements(document.getElementById("saved_items_wrapper"));
    manualSave(storedLocalElements[0]);
  };

  const editSavedElement = (elIndex, value) => {
    const parsed = JSON.parse(value);
    storedLocalElements[0][elIndex] = parsed;
    displaySavedElements(document.getElementById("saved_items_wrapper"));
    manualSave(storedLocalElements[0]);
  };

  const loadSavedElements = () => {
    chrome.storage.local.get(["Colorfy"], (data) => {
      if (data.Colorfy) {
        storedLocalData = changeFormat(data.Colorfy);
        const currentUrl = getBaseURL();
        for (let i = 0; i < storedLocalData.length; i++) {
          if (storedLocalData[i].url === currentUrl) {
            storedLocalElements.push(storedLocalData[i].elements);
          }
        }
      }
    });
  };

  const displaySavedElements = (container) => {
    container.innerHTML = "";
    if (!storedLocalElements[0]) return;

    for (let i = 0; i < storedLocalElements[0].length; i++) {
      const element = storedLocalElements[0][i];

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.id = "colorfy_delete_" + i;
      deleteButton.className = "delete_saved_button__Colorfy";
      deleteButton.title = "Delete";
      deleteButton.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
      container.appendChild(deleteButton);

      deleteButton.onclick = () => {
        deleteSavedElement(i);
      };

      // Editable JSON textarea
      const elementInput = document.createElement("textarea");
      elementInput.className = "saved_element_input__Colorfy";
      elementInput.value = JSON.stringify(element, null, 4);
      container.appendChild(elementInput);

      elementInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          editSavedElement(i, elementInput.value);
        }
      });
    }
  };

  // Function to convert RGB to Hex
  const rgbToHex = (rgb) => {
    // Extract the RGB values using a regular expression
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return null; // Not a valid RGB color

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    // Convert each value to a two-digit hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)
      .toUpperCase()}`;
  };

  /**
   * Collapsing logic for gradient colors.
   */
  const colapsePreviousElement = (paletteName, text) => {
    const palette = document.getElementsByClassName(
      `palette-${paletteName}`
    )[0];
    const collapseButton = document.createElement("div");
    collapseButton.className = "colapse_button__Colorfy";
    collapseButton.innerHTML = `${text} <span class="material-symbols-outlined">add_circle</span>`;

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
        collapseButton.innerHTML = `${text} <span class="material-symbols-outlined">remove</span>`;
      } else {
        collapseContent.style.maxHeight = "0";
        for (let i = 0; i < family.length; i++) {
          family[i].style.maxHeight = "0";
          family[i].style.setProperty("border", "0", "important");
        }
        collapseButton.innerHTML = `${text} <span class="material-symbols-outlined">add</span>`;
      }
    });
    palette.appendChild(collapseButton);
  };

  /**
   * Add preset colors or gradients to the palette UI.
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

      if (colors[i] === selectedBackground && paletteName === "background") {
        input.checked = true;
      }
      if (colors[i] === selectedTextColor && paletteName === "text") {
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
   * Add a "Default color" option that reverts background/text to original.
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
   * Add the custom color picker (VanillaPicker).
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

    if (selectedElement?.target) {
      const hexBackground = rgbToHex(selectedElement.target.style.background);
      const hexColor = rgbToHex(selectedElement.target.style.color);
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
    const initialTextColor = getOptimalTextColor(currentColor);
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
      console.log("Undefined Picker - ensure VanillaPicker is loaded.");
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
   * Add both background and text color pickers to the palette.
   */
  const addColors = (paletteName) => {
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
    addPresetColors(colorfyColors, paletteName);

    // Custom color picker
    addCustomColor(paletteName);

    // If background, also add collapsible gradients
    if (paletteName === "background" && useGradients) {
      addPresetColors(colorfyGradients, paletteName, true);
      colapsePreviousElement(paletteName, "Gradient colors");
    }
  };

  /**
   * Gather the chosen colors from the radio inputs, apply, then save.
   */
  const selectedChanges = () => {
    // Background
    const backgroundInputs = document.getElementsByName(
      "paletteColors-background"
    );
    for (let i = 0; i < backgroundInputs.length; i++) {
      if (backgroundInputs[i].checked) {
        selectedBackground = backgroundInputs[i].value;
        break;
      }
    }

    // Text
    const textInputs = document.getElementsByName("paletteColors-text");
    for (let i = 0; i < textInputs.length; i++) {
      if (textInputs[i].checked) {
        selectedTextColor = textInputs[i].value;
        break;
      }
    }

    // Apply to the previously selected element
    const targetEls = selectElements(selectedElement);
    for (let index = 0; index < targetEls.length; index++) {
      changeColor(targetEls[index]);
    }

    // Save to storage
    saveElement(elementInfo(selectedElement));

    // Done
    closeColorfy();
  };

  /**
   * Remove the colorfy UI and event listeners.
   */
  const closeColorfy = () => {
    if (paletteWrapper) {
      document.body.removeChild(paletteWrapper);
    }
    if (modalWrapper) {
      document.body.removeChild(modalWrapper);
    }
    const warning = document.getElementById("colorfy_impossible");
    if (warning) {
      document.body.removeChild(warning);
    }
    removeListeners();
  };

  /**
   * Actually apply the chosen color properties to a DOM element (and its descendants).
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
   * Open the color pickers (background & text) in a UI panel.
   */
  const addColorPicker = () => {
    createPaletteWrapper();
    addColors("background");
    addColors("text");
  };

  /**
   * On hover, highlight the element.
   */
  const hoverElements = (e) => {
    const targetEls = selectElements(e);
    for (let i = 0; i < targetEls.length; i++) {
      targetEls[i].style.setProperty("border", "5px solid #000080");
      targetEls[i].style.setProperty("opacity", "0.5");
    }
  };

  /**
   * On mouse out, remove the highlight.
   */
  const resetHover = (e) => {
    const targetEls = selectElements(e);
    for (let i = 0; i < targetEls.length; i++) {
      targetEls[i].style.removeProperty("border");
      targetEls[i].style.removeProperty("opacity");
    }
  };

  /**
   * Intercept clicks in the capture phase so we can prevent link/button actions.
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
   * Add the event listeners we need to let user pick an element visually.
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
   * Remove event listeners.
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
   * A copy of the function from backend.js to store the chosen element's info.
   */
  const elementInfo = (e) => {
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
   * Select the DOM elements based on the clicked object (id, className, or tag).
   */
  const selectElements = (e) => {
    let element = e;
    // If e is a DOM event, pull out the target
    if (e.target) {
      element = e.target;
    }

    // Show/hide a warning if user tries to pick an iframe
    const colorfyWarning = document.createElement("p");
    colorfyWarning.id = "colorfy_impossible";
    colorfyWarning.className = "colorfy_impossible__Colorfy";
    colorfyWarning.innerHTML = chrome.i18n.getMessage("warningElement");

    const elArr = [];
    if (element.nodeName === "IFRAME") {
      if (!document.getElementById("colorfy_impossible")) {
        document.body.appendChild(colorfyWarning);
      }
    } else {
      const existingWarning = document.getElementById("colorfy_impossible");
      if (existingWarning) {
        document.body.removeChild(existingWarning);
      }
    }

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

  // Helper to parse stored data
  const changeFormat = (data) => JSON.parse(data);

  const getSystemTheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Basic “base URL” for the page
  const getBaseURL = () => {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
  };

  // Boot up
  init();
})();
