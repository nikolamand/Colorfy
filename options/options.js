(function () {
  const elements = {
    colorScheme: document.getElementById("color-scheme"),
    useGradients: document.getElementById("use-gradients"),
    devMode: document.getElementById("dev-mode"),
    saveSettings: document.getElementById("save-settings"),
    resetSettings: document.getElementById("reset-settings"),
    clearAll: document.getElementById("clear_all_changes"),
  };

  // Set initial text and event listener for clearAll button
  elements.clearAll.value = chrome.i18n.getMessage("optionsResetButton");
  elements.clearAll.addEventListener("click", clearAllChanges);

  // Load and initialize settings from storage
  chrome.storage.local.get(
    ["Colorfy_colorScheme", "Colorfy_useGradients", "Colorfy_devMode"],
    (data) => {
      console.log("Loaded settings:", data);
      elements.colorScheme.value = data.Colorfy_colorScheme || "system";
      elements.useGradients.checked =
        data.Colorfy_useGradients !== false ? true : false;
      elements.devMode.checked = data.Colorfy_devMode || false;
    }
  );

  // Save settings handler
  elements.saveSettings.addEventListener("click", () => {
    const settings = {
      Colorfy_colorScheme: elements.colorScheme.value,
      Colorfy_useGradients: elements.useGradients.checked,
      Colorfy_devMode: elements.devMode.checked,
    };

    chrome.storage.local.set(settings, () => {
      alert("Settings saved successfully!");
    });
  });

  // Reset settings to defaults handler
  elements.resetSettings.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      chrome.storage.local.clear(() => {
        elements.colorScheme.value = "system";
        elements.useGradients.checked = true;
        elements.devMode.checked = false;
        alert("Settings reset to default!");
      });
    }
  });

  // Clear all changes handler
  function clearAllChanges() {
    if (confirm(chrome.i18n.getMessage("optionsResetConfirm"))) {
      chrome.storage.local.clear(() => {
        const error = chrome.runtime.lastError;
        if (error) {
          console.error(error);
        } else {
          alert(chrome.i18n.getMessage("optionsResetSuccess"));
        }
      });
    }
  }
})();
