(function () {
  const elements = {
    // Basic settings (implemented)
    colorScheme: document.getElementById("color-scheme"),
    useGradients: document.getElementById("use-gradients"),
    devMode: document.getElementById("dev-mode"),
    saveSettings: document.getElementById("save-settings"),
    resetSettings: document.getElementById("reset-settings"),
    clearAll: document.getElementById("clear_all_changes"),
    
    // Storage elements (implemented)
    storageBar: document.getElementById("storage-fill"),
    storageText: document.getElementById("storage-text"),
    storageStats: document.getElementById("storage-stats"),
    
    // Storage management modal elements (implemented)
    manageStorageBtn: document.getElementById("manage-storage-btn"),
    storageModal: document.getElementById("storage-modal"),
    storageModalClose: document.getElementById("storage-modal-close"),
    storageModalCancel: document.getElementById("storage-modal-cancel"),
    storageModalApply: document.getElementById("storage-modal-apply"),
    modalStorageFill: document.getElementById("modal-storage-fill"),
    modalStorageText: document.getElementById("modal-storage-text"),
    modalStorageDetails: document.getElementById("modal-storage-details"),
    categoriesList: document.getElementById("categories-list"),
    selectAllBtn: document.getElementById("select-all-btn"),
    selectNoneBtn: document.getElementById("select-none-btn")
    
    // TODO: Uncomment when implementing new features
    // Color picker settings (not implemented yet)
    // defaultColorFormat: document.getElementById("default-color-format"),
    // autoCopy: document.getElementById("auto-copy"),
    // showColorPreview: document.getElementById("show-color-preview"),
    // pickerSize: document.getElementById("picker-size"),
    
    // Shortcuts & accessibility (not implemented yet)
    // quickAccessKey: document.getElementById("quick-access-key"),
    // highContrast: document.getElementById("high-contrast"),
    // showTooltips: document.getElementById("show-tooltips"),
    
    // Advanced features (not implemented yet)
    // paletteSuggestions: document.getElementById("palette-suggestions"),
    // exportFormat: document.getElementById("export-format"),
    // syncAcrossDevices: document.getElementById("sync-across-devices")
  };

  // Load storage versioning module only if not already loaded
  if (!window.COLORFY_STORAGE_INITIALIZED) {
    const script = document.createElement('script');
    script.src = '../src/js/modules/storageVersioning.js';
    document.head.appendChild(script);

    // Initialize storage versioning and load settings
    script.onload = () => {
      if (window.initializeStorageVersioning) {
        window.initializeStorageVersioning().then(() => {
          loadSettings();
          updateStorageInfo();
          // Update storage info every 5 seconds
          setInterval(updateStorageInfo, 5000);
        });
      } else {
        loadSettings();
        updateStorageInfo();
        setInterval(updateStorageInfo, 5000);
      }
    };
  } else {
    // Storage already initialized, just load settings
    loadSettings();
    updateStorageInfo();
    setInterval(updateStorageInfo, 5000);
  }

  // Set initial text and event listener for clearAll button
  elements.clearAll.value = chrome.i18n.getMessage("optionsResetButton");
  elements.clearAll.addEventListener("click", clearAllChanges);

  // Storage management event listeners
  elements.manageStorageBtn.addEventListener("click", openStorageModal);
  elements.storageModalClose.addEventListener("click", closeStorageModal);
  elements.storageModalCancel.addEventListener("click", closeStorageModal);
  elements.storageModalApply.addEventListener("click", deleteSelectedData);
  elements.selectAllBtn.addEventListener("click", selectAllCategories);
  elements.selectNoneBtn.addEventListener("click", selectNoCategories);

  // Close modal when clicking outside
  elements.storageModal.addEventListener("click", (e) => {
    if (e.target === elements.storageModal) {
      closeStorageModal();
    }
  });

  // Load settings function
  function loadSettings() {
    // Define only the implemented settings keys
    const settingsKeys = [
      "Colorfy_colorScheme", 
      "Colorfy_useGradients", 
      "Colorfy_devMode"
    ];

    chrome.storage.local.get(settingsKeys, (data) => {
      // Basic settings (implemented)
      elements.colorScheme.value = data.Colorfy_colorScheme || "system";
      elements.useGradients.checked = data.Colorfy_useGradients !== false ? true : false;
      elements.devMode.checked = data.Colorfy_devMode || false;
      
      // TODO: Uncomment when implementing new features
      // Color picker settings
      // elements.defaultColorFormat.value = data.Colorfy_defaultColorFormat || "hex";
      // elements.autoCopy.checked = data.Colorfy_autoCopy !== false ? true : false;
      // elements.showColorPreview.checked = data.Colorfy_showColorPreview !== false ? true : false;
      // elements.pickerSize.value = data.Colorfy_pickerSize || "medium";
      
      // Shortcuts & accessibility
      // elements.quickAccessKey.value = data.Colorfy_quickAccessKey || "alt+c";
      // elements.highContrast.checked = data.Colorfy_highContrast || false;
      // elements.showTooltips.checked = data.Colorfy_showTooltips !== false ? true : false;
      
      // Advanced features
      // elements.paletteSuggestions.checked = data.Colorfy_paletteSuggestions || false;
      // elements.exportFormat.value = data.Colorfy_exportFormat || "json";
      // elements.syncAcrossDevices.checked = data.Colorfy_syncAcrossDevices || false;
    });
  }

  // Update storage information display
  async function updateStorageInfo() {
    if (window.getStorageStats && window.formatBytes) {
      const stats = await window.getStorageStats();
      
      // Update progress bar
      elements.storageBar.style.width = `${stats.usagePercent}%`;
      
      // Set color based on usage
      if (stats.usagePercent > 90) {
        elements.storageBar.style.backgroundColor = '#dc3545'; // Red
      } else if (stats.usagePercent > 75) {
        elements.storageBar.style.backgroundColor = '#ffc107'; // Yellow
      } else {
        elements.storageBar.style.backgroundColor = '#28a745'; // Green
      }
      
      // Update text
      elements.storageText.textContent = `${stats.usagePercent}% used`;
      elements.storageStats.textContent = 
        `${window.formatBytes(stats.usedBytes)} of ${window.formatBytes(stats.maxBytes)} used (${stats.items} items)`;
      
      // Show warning if near limit
      if (stats.isNearLimit) {
        elements.storageStats.innerHTML += 
          '<br><span style="color: #dc3545; font-weight: bold;">⚠️ Storage nearly full! Consider clearing old data.</span>';
      }
    }
  }

  // Load and initialize settings from storage
  chrome.storage.local.get(
    ["Colorfy_colorScheme", "Colorfy_useGradients", "Colorfy_devMode"],
    (data) => {
      elements.colorScheme.value = data.Colorfy_colorScheme || "system";
      elements.useGradients.checked =
        data.Colorfy_useGradients !== false ? true : false;
      elements.devMode.checked = data.Colorfy_devMode || false;
    }
  );

  // Save settings handler
  elements.saveSettings.addEventListener("click", () => {
    const settings = {
      // Basic settings (implemented)
      Colorfy_colorScheme: elements.colorScheme.value,
      Colorfy_useGradients: elements.useGradients.checked,
      Colorfy_devMode: elements.devMode.checked
      
      // TODO: Uncomment when implementing new features
      // Color picker settings
      // Colorfy_defaultColorFormat: elements.defaultColorFormat.value,
      // Colorfy_autoCopy: elements.autoCopy.checked,
      // Colorfy_showColorPreview: elements.showColorPreview.checked,
      // Colorfy_pickerSize: elements.pickerSize.value,
      
      // Shortcuts & accessibility
      // Colorfy_quickAccessKey: elements.quickAccessKey.value,
      // Colorfy_highContrast: elements.highContrast.checked,
      // Colorfy_showTooltips: elements.showTooltips.checked,
      
      // Advanced features
      // Colorfy_paletteSuggestions: elements.paletteSuggestions.checked,
      // Colorfy_exportFormat: elements.exportFormat.value,
      // Colorfy_syncAcrossDevices: elements.syncAcrossDevices.checked
    };

    chrome.storage.local.set(settings, () => {
      // Show a more user-friendly notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        animation: slideIn 0.3s ease-out;
      `;
      notification.textContent = '✓ Settings saved successfully!';
      
      // Add animation keyframes
      if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    });
  });

  // Reset settings to defaults handler
  elements.resetSettings.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all settings to default? This will not affect your saved colors.")) {
      // Define default values for implemented settings
      const defaults = {
        colorScheme: "system",
        useGradients: true,
        devMode: false
      };
      
      // Clear only implemented settings, not saved colors
      const settingsKeys = [
        "Colorfy_colorScheme", 
        "Colorfy_useGradients", 
        "Colorfy_devMode"
      ];
      
      chrome.storage.local.remove(settingsKeys, () => {
        // Reset form values to defaults
        elements.colorScheme.value = defaults.colorScheme;
        elements.useGradients.checked = defaults.useGradients;
        elements.devMode.checked = defaults.devMode;
        
        // TODO: Uncomment when implementing new features
        // elements.defaultColorFormat.value = "hex";
        // elements.autoCopy.checked = true;
        // elements.showColorPreview.checked = true;
        // elements.pickerSize.value = "medium";
        // elements.quickAccessKey.value = "alt+c";
        // elements.highContrast.checked = false;
        // elements.showTooltips.checked = true;
        // elements.paletteSuggestions.checked = false;
        // elements.exportFormat.value = "json";
        // elements.syncAcrossDevices.checked = false;
        
        // Show success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2196F3;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = '🔄 Settings reset to defaults!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = 'slideIn 0.3s ease-out reverse';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
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
          updateStorageInfo(); // Refresh storage info after clearing
        }
      });
    }
  }

  // Storage management functions
  
  // Helper function for formatting bytes (fallback if not available from storageVersioning)
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function openStorageModal() {
    elements.storageModal.style.display = 'flex';
    await updateModalStorageInfo();
    await populateStorageCategories();
  }

  function closeStorageModal() {
    elements.storageModal.style.display = 'none';
  }

  async function updateModalStorageInfo() {
    if (window.getStorageStats && window.formatBytes) {
      const stats = await window.getStorageStats();
      
      // Update modal progress bar
      elements.modalStorageFill.style.width = `${stats.usagePercent}%`;
      
      // Set color based on usage
      if (stats.usagePercent > 90) {
        elements.modalStorageFill.style.backgroundColor = '#dc3545'; // Red
      } else if (stats.usagePercent > 75) {
        elements.modalStorageFill.style.backgroundColor = '#ffc107'; // Yellow
      } else {
        elements.modalStorageFill.style.backgroundColor = '#28a745'; // Green
      }
      
      // Update modal text
      elements.modalStorageText.textContent = `${stats.usagePercent}% used`;
      elements.modalStorageDetails.textContent = 
        `${window.formatBytes(stats.usedBytes)} of ${window.formatBytes(stats.maxBytes)}`;
    }
  }

  async function populateStorageCategories() {
    chrome.storage.local.get(null, (items) => {
      const categories = analyzeStorageData(items);
      renderCategories(categories);
      updateDeletionSummary();
    });
  }

  function analyzeStorageData(items) {
    const websites = {};
    let settingsSize = 0;
    
    for (const [key, value] of Object.entries(items)) {
      const size = new Blob([JSON.stringify(value)]).size;
      
      // Focus on color styles data
      if (key === 'Colorfy_Styles' || key === 'Colorfy') {
        try {
          const stylesData = typeof value === 'string' ? JSON.parse(value) : value;
          
          // Parse website data
          for (const [url, urlData] of Object.entries(stylesData)) {
            if (url && urlData) {
              // Extract domain from URL for grouping
              const domain = extractDomain(url);
              
              if (!websites[domain]) {
                websites[domain] = {
                  domain: domain,
                  urls: [],
                  totalSize: 0,
                  totalColors: 0,
                  totalStyles: 0,
                  lastModified: null
                };
              }
              
              // Analyze styles and elements for this URL
              let urlStyles = [];
              let colorCount = 0;
              let styleCount = 0;
              let lastMod = null;
              const urlSize = new Blob([JSON.stringify(urlData)]).size;
              
              if (urlData.styles && Array.isArray(urlData.styles)) {
                // New multi-style format - each style is separate
                urlData.styles.forEach((style, index) => {
                  const styleSize = new Blob([JSON.stringify(style)]).size;
                  const elementCount = style.elements ? style.elements.length : 0;
                  
                  urlStyles.push({
                    id: style.id || `style-${index}`,
                    name: style.name || `Style ${index + 1}`,
                    elementCount: elementCount,
                    size: styleSize,
                    lastModified: style.lastModified || style.createdAt,
                    isOriginal: style.isOriginal || style.id === 'original' || style.name === 'Original',
                    data: style
                  });
                  
                  colorCount += elementCount;
                  // Only count non-original styles in the style count
                  if (!style.isOriginal && style.id !== 'original' && style.name !== 'Original') {
                    styleCount++;
                  }
                });
                lastMod = urlData.migratedAt || urlData.lastModified;
              } else if (urlData.elements && Array.isArray(urlData.elements)) {
                // Legacy format - treat as single style
                urlStyles.push({
                  id: 'legacy-style',
                  name: 'Legacy Style',
                  elementCount: urlData.elements.length,
                  size: urlSize,
                  lastModified: urlData.lastModified,
                  data: urlData
                });
                colorCount = urlData.elements.length;
                styleCount = 1;
                lastMod = urlData.lastModified;
              }
              
              websites[domain].urls.push({
                url: url,
                size: urlSize,
                colorCount: colorCount,
                styleCount: styleCount,
                styles: urlStyles,
                lastModified: lastMod
              });
              
              websites[domain].totalSize += urlSize;
              websites[domain].totalColors += colorCount;
              websites[domain].totalStyles += styleCount;
              
              // Update last modified date
              if (lastMod && (!websites[domain].lastModified || lastMod > websites[domain].lastModified)) {
                websites[domain].lastModified = lastMod;
              }
            }
          }
        } catch (e) {
          console.error('Error parsing color styles data:', e);
        }
      } else {
        // Count all other data as settings
        settingsSize += size;
      }
    }
    
    return { websites, settingsSize };
  }
  
  function extractDomain(url) {
    try {
      // Handle different URL formats
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return new URL(url).hostname;
      } else if (url.includes('.')) {
        // Direct domain or domain with path
        return url.split('/')[0];
      } else {
        return url;
      }
    } catch (e) {
      // Fallback for malformed URLs
      return url.split('/')[0] || url;
    }
  }

  function renderCategories(data) {
    const { websites, settingsSize } = data;
    const websiteList = Object.values(websites);
    const totalSize = websiteList.reduce((sum, site) => sum + site.totalSize, 0) + settingsSize;
    
    elements.categoriesList.innerHTML = '';

    if (websiteList.length === 0) {
      elements.categoriesList.innerHTML = `
        <div class="category-item">
          <div class="category-info" style="justify-content: center; text-align: center; padding: 20px;">
            <div class="category-details">
              <div class="category-name">No saved colors found</div>
              <div class="category-description">Start using Colorfy on websites to see saved color data here</div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Sort websites by size (largest first)
    websiteList.sort((a, b) => b.totalSize - a.totalSize);

    websiteList.forEach((website, websiteIndex) => {
      const percentage = totalSize > 0 ? Math.round((website.totalSize / totalSize) * 100) : 0;
      const lastModified = website.lastModified ? 
        new Date(website.lastModified).toLocaleDateString() : 'Unknown';
      
      const websiteDiv = document.createElement('div');
      websiteDiv.className = 'category-item website-item';
      websiteDiv.dataset.domain = website.domain;
      
      // Check if website has multiple custom styles (worth showing individual selection)
      const hasMultipleStyles = website.totalStyles > 1;
      
      websiteDiv.innerHTML = `
        <div class="website-header">
          <input type="checkbox" class="category-checkbox website-checkbox" data-domain="${website.domain}">
          ${hasMultipleStyles ? 
            `<button class="expand-btn" data-expanded="false">▶</button>` : 
            '<div class="expand-placeholder"></div>'
          }
          <div class="category-info">
            <div class="category-details">
              <div class="category-name">${website.domain}</div>
              <div class="category-description">
                ${website.urls.length} page${website.urls.length !== 1 ? 's' : ''} • 
                ${website.totalStyles} custom style${website.totalStyles !== 1 ? 's' : ''} • 
                ${website.totalColors} element${website.totalColors !== 1 ? 's' : ''} • 
                Last used: ${lastModified}
              </div>
            </div>
            <div class="category-stats">
              <div class="category-size">${(window.formatBytes || formatBytes)(website.totalSize)} (${percentage}%)</div>
              <div class="category-count">${website.totalStyles} custom style${website.totalStyles !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
        ${hasMultipleStyles ? `<div class="styles-list" style="display: none;"></div>` : ''}
      `;

      // Add event listener for website checkbox
      const websiteCheckbox = websiteDiv.querySelector('.website-checkbox');
      websiteCheckbox.addEventListener('change', (e) => {
        // If website checkbox is checked/unchecked, update all style checkboxes
        const styleCheckboxes = websiteDiv.querySelectorAll('.style-checkbox');
        styleCheckboxes.forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
        updateDeletionSummary();
      });

      // Add expand/collapse functionality for websites with multiple styles
      if (hasMultipleStyles) {
        const expandBtn = websiteDiv.querySelector('.expand-btn');
        const stylesList = websiteDiv.querySelector('.styles-list');
        
        expandBtn.addEventListener('click', () => {
          const isExpanded = expandBtn.dataset.expanded === 'true';
          
          if (!isExpanded) {
            // Expand and populate styles
            expandBtn.textContent = '▼';
            expandBtn.dataset.expanded = 'true';
            stylesList.style.display = 'block';
            
            // Populate styles if not already done
            if (stylesList.children.length === 0) {
              populateStylesList(stylesList, website, websiteCheckbox);
            }
          } else {
            // Collapse
            expandBtn.textContent = '▶';
            expandBtn.dataset.expanded = 'false';
            stylesList.style.display = 'none';
          }
        });
      }

      elements.categoriesList.appendChild(websiteDiv);
    });

    // Add settings info at bottom (non-deletable)
    if (settingsSize > 0) {
      const settingsPercentage = totalSize > 0 ? Math.round((settingsSize / totalSize) * 100) : 0;
      const settingsDiv = document.createElement('div');
      settingsDiv.className = 'category-item';
      settingsDiv.style.opacity = '0.6';
      
      settingsDiv.innerHTML = `
        <div class="website-header">
          <div class="expand-placeholder"></div>
          <div style="width: 16px; height: 16px; margin-right: 12px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 12px;">⚙️</span>
          </div>
          <div class="category-info">
            <div class="category-details">
              <div class="category-name">Extension Settings & System Data</div>
              <div class="category-description">Cannot be deleted individually (use "Clear All Data" to reset)</div>
            </div>
            <div class="category-stats">
              <div class="category-size">${(window.formatBytes || formatBytes)(settingsSize)} (${settingsPercentage}%)</div>
              <div class="category-count">System data</div>
            </div>
          </div>
        </div>
      `;

      elements.categoriesList.appendChild(settingsDiv);
    }
  }

  function populateStylesList(container, website, websiteCheckbox) {
    website.urls.forEach(urlData => {
      urlData.styles.forEach(style => {
        // Skip Original style - it should only be deleted with the whole website
        if (style.isOriginal || style.id === 'original' || style.name === 'Original') {
          return;
        }
        
        const styleDiv = document.createElement('div');
        styleDiv.className = 'style-item';
        
        const styleSize = (window.formatBytes || formatBytes)(style.size);
        const lastMod = style.lastModified ? 
          new Date(style.lastModified).toLocaleDateString() : 'Unknown';
        
        styleDiv.innerHTML = `
          <input type="checkbox" class="style-checkbox" 
                 data-domain="${website.domain}" 
                 data-url="${urlData.url}" 
                 data-style-id="${style.id}">
          <div class="style-info">
            <div class="style-details">
              <div class="style-name">${style.name}</div>
              <div class="style-description">
                ${style.elementCount} element${style.elementCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div class="style-stats">
              <div class="style-size">${styleSize}</div>
            </div>
          </div>
        `;

        // Add event listener for style checkbox
        const styleCheckbox = styleDiv.querySelector('.style-checkbox');
        styleCheckbox.addEventListener('change', () => {
          // Update website checkbox state based on style selections
          const allStyleCheckboxes = container.parentElement.querySelectorAll('.style-checkbox');
          const checkedStyles = container.parentElement.querySelectorAll('.style-checkbox:checked');
          
          if (checkedStyles.length === 0) {
            websiteCheckbox.checked = false;
            websiteCheckbox.indeterminate = false;
          } else if (checkedStyles.length === allStyleCheckboxes.length) {
            websiteCheckbox.checked = true;
            websiteCheckbox.indeterminate = false;
          } else {
            websiteCheckbox.checked = false;
            websiteCheckbox.indeterminate = true;
          }
          
          updateDeletionSummary();
        });

        container.appendChild(styleDiv);
      });
    });
  }

  function selectAllCategories() {
    const websiteCheckboxes = elements.categoriesList.querySelectorAll('.website-checkbox');
    websiteCheckboxes.forEach(cb => {
      cb.checked = true;
      cb.indeterminate = false;
      
      // Also select all style checkboxes for this website
      const websiteItem = cb.closest('.website-item');
      if (websiteItem) {
        const styleCheckboxes = websiteItem.querySelectorAll('.style-checkbox');
        styleCheckboxes.forEach(styleCb => styleCb.checked = true);
      }
    });
    updateDeletionSummary();
  }

  function selectNoCategories() {
    const allCheckboxes = elements.categoriesList.querySelectorAll('.website-checkbox, .style-checkbox');
    allCheckboxes.forEach(cb => {
      cb.checked = false;
      if (cb.classList.contains('website-checkbox')) {
        cb.indeterminate = false;
      }
    });
    updateDeletionSummary();
  }

  function updateDeletionSummary() {
    const websiteCheckboxes = elements.categoriesList.querySelectorAll('.website-checkbox:checked');
    const websiteCheckboxesIndeterminate = elements.categoriesList.querySelectorAll('.website-checkbox:indeterminate');
    const styleCheckboxes = elements.categoriesList.querySelectorAll('.style-checkbox:checked');
    
    const totalSelected = websiteCheckboxes.length + styleCheckboxes.length;
    
    if (totalSelected === 0) {
      elements.storageModalApply.disabled = true;
      return;
    }

    let parts = [];
    
    // Count full websites
    if (websiteCheckboxes.length > 0) {
      const websiteNames = Array.from(websiteCheckboxes).map(cb => cb.dataset.domain);
      parts.push(`${websiteCheckboxes.length} website${websiteCheckboxes.length !== 1 ? 's' : ''} (${websiteNames.join(', ')})`);
    }
    
    // Count individual styles from partially selected websites
    const individualStyleCount = styleCheckboxes.length - 
      websiteCheckboxes.length * elements.categoriesList.querySelectorAll('.website-checkbox:checked ~ .styles-list .style-checkbox').length;
    
    if (individualStyleCount > 0) {
      parts.push(`${individualStyleCount} individual style${individualStyleCount !== 1 ? 's' : ''}`);
    }
    
    // Count partially selected websites
    if (websiteCheckboxesIndeterminate.length > 0) {
      const partialWebsites = Array.from(websiteCheckboxesIndeterminate).map(cb => cb.dataset.domain);
      parts.push(`partial selection from ${partialWebsites.join(', ')}`);
    }
    
    elements.storageModalApply.disabled = false;
  }

  async function deleteSelectedData() {
    const websiteCheckboxes = elements.categoriesList.querySelectorAll('.website-checkbox:checked:not(:indeterminate)');
    const styleCheckboxes = elements.categoriesList.querySelectorAll('.style-checkbox:checked');
    
    if (websiteCheckboxes.length === 0 && styleCheckboxes.length === 0) return;

    // Build confirmation message
    let confirmParts = [];
    if (websiteCheckboxes.length > 0) {
      const websiteNames = Array.from(websiteCheckboxes).map(cb => cb.dataset.domain);
      confirmParts.push(`Full websites: ${websiteNames.join(', ')}`);
    }
    if (styleCheckboxes.length > 0) {
      confirmParts.push(`${styleCheckboxes.length} individual styles`);
    }

    const confirmMessage = `Are you sure you want to delete:\n\n${confirmParts.join('\n')}\n\nThis action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      // Get current storage data
      chrome.storage.local.get(null, (items) => {
        let deletedUrls = 0;
        let deletedStyles = 0;
        let deletedColors = 0;
        
        // Get selected domains for full deletion
        const selectedDomains = Array.from(websiteCheckboxes).map(cb => cb.dataset.domain);
        
        // Get selected individual styles
        const selectedStyles = Array.from(styleCheckboxes).map(cb => ({
          domain: cb.dataset.domain,
          url: cb.dataset.url,
          styleId: cb.dataset.styleId
        }));

        // Handle both new and legacy formats
        for (const [key, value] of Object.entries(items)) {
          if (key === 'Colorfy_Styles' || key === 'Colorfy') {
            try {
              const stylesData = typeof value === 'string' ? JSON.parse(value) : value;
              const updatedStylesData = {};
              
              // Process each URL
              for (const [url, urlData] of Object.entries(stylesData)) {
                const domain = extractDomain(url);
                
                if (selectedDomains.includes(domain)) {
                  // Delete entire URL
                  deletedUrls++;
                  
                  // Count deleted items
                  if (urlData.styles && Array.isArray(urlData.styles)) {
                    deletedStyles += urlData.styles.length;
                    urlData.styles.forEach(style => {
                      if (style.elements && Array.isArray(style.elements)) {
                        deletedColors += style.elements.length;
                      }
                    });
                  } else if (urlData.elements && Array.isArray(urlData.elements)) {
                    deletedStyles += 1;
                    deletedColors += urlData.elements.length;
                  }
                } else {
                  // Check for individual style deletions
                  const urlStyles = selectedStyles.filter(s => s.url === url);
                  
                  if (urlStyles.length > 0 && urlData.styles && Array.isArray(urlData.styles)) {
                    // Remove specific styles from this URL
                    const updatedStyles = urlData.styles.filter(style => {
                      const shouldDelete = urlStyles.some(s => 
                        s.styleId === style.id || s.styleId === `style-${urlData.styles.indexOf(style)}`
                      );
                      
                      // Never delete original style in individual deletions
                      if (style.isOriginal || style.id === 'original' || style.name === 'Original') {
                        return true; // Keep original style
                      }
                      
                      if (shouldDelete) {
                        deletedStyles++;
                        if (style.elements && Array.isArray(style.elements)) {
                          deletedColors += style.elements.length;
                        }
                        return false;
                      }
                      return true;
                    });
                    
                    // Check if any non-original styles remain
                    const hasNonOriginalStyles = updatedStyles.some(style => 
                      !style.isOriginal && style.id !== 'original' && style.name !== 'Original'
                    );
                    
                    if (hasNonOriginalStyles) {
                      // Keep URL with remaining styles
                      updatedStylesData[url] = {
                        ...urlData,
                        styles: updatedStyles
                      };
                    } else {
                      // URL has no meaningful styles left, remove it entirely
                      deletedUrls++;
                    }
                  } else if (urlStyles.length > 0 && urlData.elements) {
                    // Legacy format - if selected, delete entire URL
                    deletedUrls++;
                    deletedStyles++;
                    deletedColors += urlData.elements.length;
                  } else {
                    // Keep this URL unchanged
                    updatedStylesData[url] = urlData;
                  }
                }
              }
              
              // Save updated data
              const updatedValue = typeof value === 'string' ? 
                JSON.stringify(updatedStylesData) : updatedStylesData;
              
              chrome.storage.local.set({ [key]: updatedValue }, () => {
                if (chrome.runtime.lastError) {
                  console.error(`Error updating ${key}:`, chrome.runtime.lastError);
                }
              });
            } catch (e) {
              console.error(`Error parsing ${key}:`, e);
            }
          }
        }
        
        // Show success message
        setTimeout(() => {
          if (deletedStyles > 0) {
            alert(`Successfully deleted:\n• ${deletedStyles} style${deletedStyles !== 1 ? 's' : ''}\n• ${deletedColors} saved element${deletedColors !== 1 ? 's' : ''}\n• From ${deletedUrls} page${deletedUrls !== 1 ? 's' : ''}`);
          } else {
            alert('No data was found to delete.');
          }
          closeStorageModal();
          updateStorageInfo(); // Refresh main storage info
        }, 100);
      });
    } catch (error) {
      console.error('Error deleting selected data:', error);
      alert('An error occurred while deleting the data.');
    }
  }

})();
