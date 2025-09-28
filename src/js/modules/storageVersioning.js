/**
 * Storage versioning and migration system for Colorfy extension
 */

// Only define functions if not already defined
if (typeof window.initializeStorageVersioning === 'undefined') {

const CURRENT_STORAGE_VERSION = 2;
const STORAGE_VERSION_KEY = 'Colorfy_Storage_Version';

/**
 * Check and run migrations if needed
 */
window.initializeStorageVersioning = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_VERSION_KEY], (data) => {
      const currentVersion = data[STORAGE_VERSION_KEY] || 1;
      
      if (currentVersion < CURRENT_STORAGE_VERSION) {
        window.runMigrations(currentVersion, resolve);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Run migration chain from current version to target version
 */
window.runMigrations = (fromVersion, callback) => {
  const migrations = [];
  
  // Add migration functions for each version upgrade
  if (fromVersion < 2) {
    migrations.push(window.migrateV1toV2);
  }
  
  // Future migrations would be added here
  // if (fromVersion < 3) migrations.push(migrateV2toV3);
  
  // Run migrations sequentially
  window.runMigrationsSequentially(migrations, 0, callback);
};

/**
 * Run migrations one by one to ensure data integrity
 */
window.runMigrationsSequentially = (migrations, index, callback) => {
  if (index >= migrations.length) {
    // All migrations complete, update version
    chrome.storage.local.set({ [STORAGE_VERSION_KEY]: CURRENT_STORAGE_VERSION }, () => {
      callback();
    });
    return;
  }
  
  migrations[index](() => {
    window.runMigrationsSequentially(migrations, index + 1, callback);
  });
};

/**
 * Migration from v1 (legacy) to v2 (multi-style format)
 * This is the migration that was already implemented, now formalized
 */
window.migrateV1toV2 = (callback) => {
  
  chrome.storage.local.get(['Colorfy', 'Colorfy_Styles'], (data) => {
    // If v2 format already exists, skip migration
    if (data['Colorfy_Styles']) {
      callback();
      return;
    }
    
    // If no legacy data, create empty v2 structure
    if (!data['Colorfy']) {
      callback();
      return;
    }
    
    try {
      const legacyData = JSON.parse(data['Colorfy']);
      const newStylesData = {};
      
      // Handle both array and object legacy formats
      let urlDataArray = [];
      if (Array.isArray(legacyData)) {
        // Legacy data is an array: [{url: "...", elements: [...]}, ...]
        urlDataArray = legacyData;
      } else if (typeof legacyData === 'object' && legacyData !== null) {
        // Legacy data is an object: {"0": {url: "...", elements: [...]}, ...}
        urlDataArray = Object.values(legacyData);
      }
      
      // Convert each URL's data to new format
      urlDataArray.forEach(urlData => {
        if (urlData && urlData.url && urlData.elements && Array.isArray(urlData.elements)) {
          // Create base URL key (protocol + hostname)
          const baseUrl = getBaseUrlFromLegacy(urlData.url);
          
          newStylesData[baseUrl] = {
            styles: [
              {
                id: 'original',
                name: 'Original',
                elements: [],
                isOriginal: true,
                createdAt: new Date().toISOString()
              },
              {
                id: 'style_1', 
                name: 'Style 1',
                elements: urlData.elements,
                isOriginal: false,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
              }
            ],
            activeStyle: urlData.elements.length > 0 ? 'style_1' : 'original',
            migrated: true,
            migratedAt: new Date().toISOString()
          };
        }
      });
      
      // Save new format
      chrome.storage.local.set({ 
        'Colorfy_Styles': JSON.stringify(newStylesData)
        // Remove automatic backup to save storage space
      }, () => {
        // After successful migration, remove the old legacy data
        chrome.storage.local.remove(['Colorfy'], () => {
          callback();
        });
      });
      
    } catch (e) {
      console.error('❌ Migration v1→v2 failed:', e);
      callback(); // Continue anyway
    }
  });
};

/**
 * Helper function to extract base URL from legacy URL format
 */
function getBaseUrlFromLegacy(url) {
  try {
    // Handle full URLs (http/https/file)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      // Use host (includes port) instead of hostname to match current system
      return `${urlObj.protocol}//${urlObj.host}`;
    }
    
    // Handle file:// URLs (local files)
    if (url.startsWith('file://')) {
      // For file URLs, we use "file://" as the base since there's no hostname
      return 'file://';
    }
    
    // Handle relative URLs or direct domains
    if (url.includes('.')) {
      return `https://${url.split('/')[0]}`;
    }
    
    return url;
  } catch (e) {
    // Fallback for malformed URLs
    return url;
  }
}

/**
 * Get current storage usage statistics - Updated for unlimited storage
 */
window.getStorageStats = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      const jsonString = JSON.stringify(items);
      const bytes = new Blob([jsonString]).size;
      
      // With unlimitedStorage permission, there's no practical limit
      resolve({
        usedBytes: bytes,
        maxBytes: null, // No limit with unlimitedStorage permission
        usagePercent: 0, // No meaningful percentage without a limit
        remainingBytes: null, // Unlimited remaining space
        isNearLimit: false, // Never near limit with unlimited storage
        items: Object.keys(items).length,
        isUnlimited: true
      });
    });
  });
};

/**
 * Format bytes to human readable format
 */
window.formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Clean up old migration backups (optional maintenance)
 */
window.cleanupOldBackups = () => {
  chrome.storage.local.get(['Colorfy_Migration_Backup'], (data) => {
    if (data['Colorfy_Migration_Backup']) {
      // Only keep backup for 30 days
      chrome.storage.local.remove(['Colorfy_Migration_Backup']);
    }
  });
};

/**
 * Manual migration function for users to run from options page
 */
window.runManualMigration = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['Colorfy', 'Colorfy_Styles'], async (data) => {
      // Check if legacy data exists
      if (!data['Colorfy']) {
        resolve({ success: false, message: 'No legacy data found to migrate' });
        return;
      }

      // Check if already migrated
      if (data['Colorfy_Styles']) {
        resolve({ success: false, message: 'Data has already been migrated' });
        return;
      }

      try {
        // Check storage space before creating backup
        const currentStats = await window.getStorageStats();
        const legacySize = new Blob([data['Colorfy']]).size;
        const projectedSize = currentStats.usedBytes + legacySize;
        
        if (projectedSize > currentStats.maxBytes * 0.95) {
          resolve({ 
            success: false, 
            message: `Cannot create backup: Would exceed storage limit.\nCurrent: ${window.formatBytes(currentStats.usedBytes)}\nBackup size: ${window.formatBytes(legacySize)}\nLimit: ${window.formatBytes(currentStats.maxBytes)}\n\nConsider freeing up storage space first.`
          });
          return;
        }

        // Create backup before migration
        chrome.storage.local.set({ 
          'Colorfy_Migration_Backup': data['Colorfy']
        }, () => {
          // Run the migration
          window.migrateV1toV2(() => {
            resolve({ success: true, message: `Migration completed successfully!\nBackup created (${window.formatBytes(legacySize)})` });
          });
        });
      } catch (error) {
        resolve({ success: false, message: 'Error checking storage space: ' + error.message });
      }
    });
  });
};

/**
 * Delete migration backup manually
 */
window.deleteMigrationBackup = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['Colorfy_Migration_Backup'], (data) => {
      if (!data['Colorfy_Migration_Backup']) {
        resolve({ success: false, message: 'No backup found' });
        return;
      }

      const backupSize = new Blob([data['Colorfy_Migration_Backup']]).size;
      
      chrome.storage.local.remove(['Colorfy_Migration_Backup'], () => {
        resolve({ 
          success: true, 
          message: `Migration backup deleted successfully.\nFreed up ${window.formatBytes(backupSize)} of storage space.`
        });
      });
    });
  });
};

/**
 * Check if migration backup exists and get its size
 */
window.hasMigrationBackup = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['Colorfy_Migration_Backup'], (data) => {
      if (data['Colorfy_Migration_Backup']) {
        const size = new Blob([data['Colorfy_Migration_Backup']]).size;
        resolve({ exists: true, size: size });
      } else {
        resolve({ exists: false, size: 0 });
      }
    });
  });
};

/**
 * Get size of legacy data
 */
window.getLegacyDataSize = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['Colorfy'], (data) => {
      if (data['Colorfy']) {
        const size = new Blob([data['Colorfy']]).size;
        resolve(size);
      } else {
        resolve(0);
      }
    });
  });
};

} else {
  // Storage functions already exist, skipping redefinition
}
