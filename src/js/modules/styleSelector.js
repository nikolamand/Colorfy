/**
 * Style selector UI component for Colorfy extension
 * Handles the dropdown and edit functionality for multiple styles
 */

/**
 * Create the style selector UI at the top of the palette wrapper
 */
const createStyleSelector = (paletteWrapper) => {
  const styleSelectorWrapper = document.createElement("div");
  styleSelectorWrapper.className = "style_selector_wrapper__Colorfy";
  
  // Top row with options link, select and edit button
  const topRow = document.createElement("div");
  topRow.className = "style_selector_top_row__Colorfy";
  
  // Options link
  const optionsLink = document.createElement("button");
  optionsLink.className = "options_link__Colorfy";
  optionsLink.innerHTML = `<span class="material-symbols-outlined">settings</span>`;
  optionsLink.title = chrome.i18n.getMessage("optionsPageTitle") || "Options";
  optionsLink.onclick = () => {
    // Send message to background script to open options page
    chrome.runtime.sendMessage({ type: 'openOptionsPage' });
  };
  
  // Style selector dropdown
  const styleSelect = document.createElement("select");
  styleSelect.className = "style_select__Colorfy";
  styleSelect.id = "colorfy_style_select";
  
  // Edit button
  const editBtn = document.createElement("button");
  editBtn.className = "style_edit_btn__Colorfy";
  editBtn.innerHTML = chrome.i18n.getMessage("editButton");
  editBtn.title = chrome.i18n.getMessage("manageStyles");
  
  topRow.appendChild(optionsLink);
  topRow.appendChild(styleSelect);
  topRow.appendChild(editBtn);
  styleSelectorWrapper.appendChild(topRow);
  
  // Help message (initially hidden, only shown for Original style)
  const helpMessage = document.createElement("div");
  helpMessage.className = "style_help_message__Colorfy";
  helpMessage.id = "colorfy_style_help";
  helpMessage.innerHTML = `<span class="material-symbols-outlined icon-lightbulb" style="font-size: 16px; margin-right: 4px;">lightbulb</span>${chrome.i18n.getMessage("helpMessage")}`;
  helpMessage.style.display = "none"; // Initially hidden
  
  styleSelectorWrapper.appendChild(helpMessage);
  
  // Insert at the top of palette wrapper (after close button)
  const closeBtn = paletteWrapper.querySelector(".closeColorfy__Colorfy");
  if (closeBtn && closeBtn.nextSibling) {
    paletteWrapper.insertBefore(styleSelectorWrapper, closeBtn.nextSibling);
  } else {
    paletteWrapper.appendChild(styleSelectorWrapper);
  }
  
  // Populate the dropdown
  populateStyleSelector();
  
  // Update help message immediately after populating
  updateHelpMessage();
  
  // Auto-select first editable style if Original is currently selected AND no changes exist
  const currentStyle = window.getCurrentStyle();
  if (currentStyle && currentStyle.isOriginal) {
    const styles = window.getAllStyles();
    // Check if there are any styles with elements (saved changes)
    const hasAnyChanges = styles.some(style => !style.isOriginal && style.elements && style.elements.length > 0);
    
    if (!hasAnyChanges) {
      // Only auto-select if there are no saved changes on this website
      const firstEditableStyle = styles.find(s => !s.isOriginal);
      if (firstEditableStyle) {
        window.switchStyle(firstEditableStyle.id, () => {
          populateStyleSelector();
          updateEditingState();
          updateHelpMessage();
        });
      }
    } else {
      // User has changes but selected Original - just update help message
      updateHelpMessage();
    }
  } else {
    // Update help message for current style
    updateHelpMessage();
  }
  
  // Add event listeners
  styleSelect.addEventListener("change", handleStyleChange);
  editBtn.addEventListener("click", openStyleEditModal);
  
  return styleSelectorWrapper;
};

/**
 * Populate the style selector dropdown with available styles
 */
const populateStyleSelector = () => {
  const styleSelect = document.getElementById("colorfy_style_select");
  if (!styleSelect) return;
  
  const styles = window.getAllStyles();
  const currentStyle = window.getCurrentStyle();
  
  if (!styles || styles.length === 0) {
    return;
  }
  
  styleSelect.innerHTML = "";
  
  styles.forEach(style => {
    const option = document.createElement("option");
    option.value = style.id;
    option.textContent = style.name;
    if (currentStyle && style.id === currentStyle.id) {
      option.selected = true;
    }
    styleSelect.appendChild(option);
  });
};

/**
 * Update the help message based on current style
 */
const updateHelpMessage = (styleId) => {
  const helpElement = document.getElementById("colorfy_style_help");
  if (!helpElement) return;
  
  // If no styleId provided, get the current style
  let currentStyleId = styleId;
  if (!currentStyleId) {
    const currentStyle = window.getCurrentStyle();
    currentStyleId = currentStyle ? currentStyle.id : null;
  }
  
  if (currentStyleId === "original") {
    helpElement.innerHTML = `<span class="material-symbols-outlined icon-lightbulb" style="font-size: 16px; margin-right: 4px;">lightbulb</span>${chrome.i18n.getMessage("helpMessage")}`;
    helpElement.style.display = "flex";
  } else {
    // Hide the message for editable styles
    helpElement.style.display = "none";
  }
};

/**
 * Handle style selection change
 */
const handleStyleChange = (event) => {
  const selectedStyleId = event.target.value;
  window.switchStyle(selectedStyleId, () => {
    // Update the badge count
    updateBadgeCount();
    // Update UI to reflect if editing is allowed
    updateEditingState();
    // Update help message
    updateHelpMessage(selectedStyleId);
  });
};

/**
 * Open the style edit modal
 */
const openStyleEditModal = () => {
  // Check if modal already exists
  if (document.getElementById("style_edit_modal")) return;
  
  const modal = document.createElement("div");
  modal.id = "style_edit_modal";
  modal.className = "style_edit_modal__Colorfy";
  
  const modalContent = document.createElement("div");
  modalContent.className = "style_edit_content__Colorfy";
  
  // Close button
  const closeBtn = document.createElement("span");
  closeBtn.className = "style_edit_close__Colorfy";
  closeBtn.innerHTML = `<span class="material-symbols-outlined">close</span>`;
  closeBtn.onclick = closeStyleEditModal;
  
  // Title
  const title = document.createElement("h3");
  title.textContent = chrome.i18n.getMessage("manageStylesTitle");
  title.className = "style_edit_title__Colorfy";
  
  // Styles list
  const stylesList = document.createElement("div");
  stylesList.className = "styles_list__Colorfy";
  
  // Add new style section
  const addNewSection = document.createElement("div");
  addNewSection.className = "add_new_style__Colorfy";
  
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(title);
  modalContent.appendChild(stylesList);
  modalContent.appendChild(addNewSection);
  modal.appendChild(modalContent);
  
  document.body.appendChild(modal);
  
  // Populate the modal
  populateStyleEditModal(stylesList, addNewSection);
  
  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeStyleEditModal();
    }
  });
};

/**
 * Populate the style edit modal with current styles
 */
const populateStyleEditModal = (stylesList, addNewSection) => {
  const styles = window.getAllStyles();
  const currentStyle = window.getCurrentStyle();
  
  stylesList.innerHTML = "";
  
  styles.forEach(style => {
    const styleItem = document.createElement("div");
    styleItem.className = "style_item__Colorfy";
    if (style.id === currentStyle.id) {
      styleItem.classList.add("active");
    }
    
    // Style name (editable for non-original styles)
    if (style.isOriginal) {
      const styleName = document.createElement("span");
      styleName.textContent = style.name;
      styleName.className = "style_name__Colorfy readonly";
      styleItem.appendChild(styleName);
    } else {
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = style.name;
      nameInput.className = "style_name_input__Colorfy";
      nameInput.onblur = () => handleStyleRename(style.id, nameInput.value);
      nameInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
          nameInput.blur();
        }
      };
      styleItem.appendChild(nameInput);
    }
    
    // Element count
    const elementCount = document.createElement("span");
    elementCount.textContent = `(${style.elements.length} ${chrome.i18n.getMessage("changes")})`;
    elementCount.className = "element_count__Colorfy";
    styleItem.appendChild(elementCount);
    
    // Delete button (only for non-original styles)
    if (!style.isOriginal) {
      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = `<span class="material-symbols-outlined">delete</span>`;
      deleteBtn.className = "style_delete_btn__Colorfy";
      deleteBtn.title = chrome.i18n.getMessage("deleteStyle");
      deleteBtn.onclick = () => handleStyleDelete(style.id);
      styleItem.appendChild(deleteBtn);
      
      // Clone button
      const cloneBtn = document.createElement("button");
      cloneBtn.innerHTML = `<span class="material-symbols-outlined">content_copy</span>`;
      cloneBtn.className = "style_clone_btn__Colorfy";
      cloneBtn.title = chrome.i18n.getMessage("cloneStyle");
      cloneBtn.onclick = () => handleStyleClone(style);
      styleItem.appendChild(cloneBtn);
    }
    
    stylesList.appendChild(styleItem);
  });
  
  // Add new style section
  addNewSection.innerHTML = "";
  
  if (styles.length < 5) { // Max 5 styles
    const addButton = document.createElement("button");
    addButton.textContent = chrome.i18n.getMessage("addNewStyle");
    addButton.className = "add_style_btn__Colorfy";
    addButton.onclick = showAddStyleForm;
    addNewSection.appendChild(addButton);
  } else {
    const maxMessage = document.createElement("p");
    maxMessage.textContent = chrome.i18n.getMessage("maxStylesMessage");
    maxMessage.className = "max_styles_message__Colorfy";
    addNewSection.appendChild(maxMessage);
  }
};

/**
 * Show the add new style form
 */
const showAddStyleForm = () => {
  const addNewSection = document.querySelector(".add_new_style__Colorfy");
  
  addNewSection.innerHTML = "";
  
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = chrome.i18n.getMessage("enterStyleName");
  input.className = "new_style_input__Colorfy";
  
  const addBtn = document.createElement("button");
  addBtn.textContent = chrome.i18n.getMessage("addButton");
  addBtn.className = "confirm_add_btn__Colorfy";
  
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = chrome.i18n.getMessage("cancelButton");
  cancelBtn.className = "cancel_add_btn__Colorfy";
  
  addNewSection.appendChild(input);
  addNewSection.appendChild(addBtn);
  addNewSection.appendChild(cancelBtn);
  
  input.focus();
  
  // Event listeners
  addBtn.onclick = () => {
    const styleName = input.value.trim();
    if (styleName) {
      window.addNewStyle(styleName, (newStyle) => {
        populateStyleSelector();
        populateStyleEditModal(
          document.querySelector(".styles_list__Colorfy"),
          addNewSection
        );
      });
    }
  };
  
  cancelBtn.onclick = () => {
    populateStyleEditModal(
      document.querySelector(".styles_list__Colorfy"),
      addNewSection
    );
  };
  
  input.onkeypress = (e) => {
    if (e.key === 'Enter') {
      addBtn.click();
    } else if (e.key === 'Escape') {
      cancelBtn.click();
    }
  };
};

/**
 * Handle style rename
 */
const handleStyleRename = (styleId, newName) => {
  if (newName.trim()) {
    window.renameStyle(styleId, newName.trim(), () => {
      populateStyleSelector();
    });
  }
};

/**
 * Handle style deletion
 */
const handleStyleDelete = (styleId) => {
  window.deleteStyle(styleId, () => {
    populateStyleSelector();
    populateStyleEditModal(
      document.querySelector(".styles_list__Colorfy"),
      document.querySelector(".add_new_style__Colorfy")
    );
    updateEditingState();
  });
};

/**
 * Close the style edit modal
 */
const closeStyleEditModal = () => {
  const modal = document.getElementById("style_edit_modal");
  if (modal) {
    modal.remove();
  }
};

/**
 * Update the badge count based on current style
 */
const updateBadgeCount = () => {
  if (window.getCurrentStyle) {
    const currentStyle = window.getCurrentStyle();
    if (currentStyle && currentStyle.elements && window.chrome && window.chrome.runtime) {
      chrome.runtime.sendMessage({
        type: "updateBadge",
        text: currentStyle.elements.length.toString()
      });
    }
  }
};

/**
 * Update UI based on whether current style allows editing
 */
const updateEditingState = () => {
  const canEdit = window.canEditCurrentStyle ? window.canEditCurrentStyle() : true;
  const submitButton = document.getElementById("colorfy_submit");
  const colorPickers = document.querySelectorAll(".colorfy_color__Colorfy");
  
  if (submitButton) {
    submitButton.disabled = !canEdit;
    submitButton.style.opacity = canEdit ? "1" : "0.5";
    submitButton.title = canEdit ? "Apply changes" : "Cannot edit Original style";
  }
  
  // Disable/enable color selection
  colorPickers.forEach(picker => {
    if (!canEdit) {
      picker.style.opacity = "0.5";
      picker.style.pointerEvents = "none";
    } else {
      picker.style.opacity = "1";
      picker.style.pointerEvents = "auto";
    }
  });
};

/**
 * Handle cloning a style
 */
const handleStyleClone = (style) => {
  const styles = window.getAllStyles();
  
  if (styles.length >= 5) {
    alert("Maximum number of styles (5) reached!");
    return;
  }
  
  // Create a new style name
  const newStyleName = `${style.name} Copy`;
  
  // Add the new style using the existing function
  window.addNewStyle(newStyleName, (newStyle) => {
    // Now clone the elements from the original style to the new one
    if (style.elements && style.elements.length > 0) {
      // Get current style data to access elements
      newStyle.elements = [...style.elements];
      
      // Save the cloned elements
      const currentUrl = window.getBaseURL ? window.getBaseURL() : window.location.origin;
      chrome.storage.local.get(["Colorfy_Styles"], (data) => {
        let stylesData = {};
        if (data.Colorfy_Styles) {
          try {
            stylesData = JSON.parse(data.Colorfy_Styles);
          } catch (e) {
            console.error('Error parsing styles data:', e);
            return;
          }
        }
        
        if (stylesData[currentUrl]) {
          // Find the new style and update its elements
          const styleToUpdate = stylesData[currentUrl].styles.find(s => s.id === newStyle.id);
          if (styleToUpdate) {
            styleToUpdate.elements = [...style.elements];
            
            // Save updated data
            chrome.storage.local.set({ Colorfy_Styles: JSON.stringify(stylesData) }, () => {
              
              // Re-populate the modal and selector
              const stylesList = document.querySelector(".styles_list__Colorfy");
              const addNewSection = document.querySelector(".add_new_style__Colorfy");
              if (stylesList && addNewSection) {
                populateStyleEditModal(stylesList, addNewSection);
              }
              populateStyleSelector();
              
              // Switch to the new style
              window.switchStyle(newStyle.id, () => {
                populateStyleSelector();
                updateEditingState();
                updateHelpMessage();
              });
            });
          }
        }
      });
    } else {
      // Re-populate the modal and selector
      const stylesList = document.querySelector(".styles_list__Colorfy");
      const addNewSection = document.querySelector(".add_new_style__Colorfy");
      if (stylesList && addNewSection) {
        populateStyleEditModal(stylesList, addNewSection);
      }
      populateStyleSelector();
      
      // Switch to the new style
      window.switchStyle(newStyle.id, () => {
        populateStyleSelector();
        updateEditingState();
        updateHelpMessage();
      });
    }
  });
};

// Make functions globally accessible
window.createStyleSelector = createStyleSelector;
window.populateStyleSelector = populateStyleSelector;
window.updateEditingState = updateEditingState;
window.updateHelpMessage = updateHelpMessage;
window.closeStyleEditModal = closeStyleEditModal;
