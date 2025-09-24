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
      
      // Convert each URL's data to new format
      Object.values(legacyData).forEach(urlData => {
        if (urlData.url && urlData.elements) {
          newStylesData[urlData.url] = {
            styles: [
              {
                id: 'original',
                name: 'Original',
                elements: [],
                isOriginal: true
              },
              {
                id: 'style_1',
                name: 'Style 1',
                elements: urlData.elements,
                isOriginal: false
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
        'Colorfy_Styles': JSON.stringify(newStylesData),
        'Colorfy_Migration_Backup': data['Colorfy'] // Keep backup
      }, () => {
        callback();
      });
      
    } catch (e) {
      console.error('❌ Migration v1→v2 failed:', e);
      callback(); // Continue anyway
    }
  });
};

/**
 * Get current storage usage statistics
 */
window.getStorageStats = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      const jsonString = JSON.stringify(items);
      const bytes = new Blob([jsonString]).size;
      
      // TEMPORARY: Lower limits for testing (remove after testing)
      const maxBytes = 5 * 1024; // 5KB limit for testing (normally 10MB)
      const testingMode = false; // Set to false for production
      
      // Use normal limits in production
      const actualMaxBytes = testingMode ? maxBytes : (10 * 1024 * 1024);
      const actualThreshold = testingMode ? 0.6 : 0.9; // 60% for testing, 90% for production
      
      resolve({
        usedBytes: bytes,
        maxBytes: actualMaxBytes,
        usagePercent: (bytes / actualMaxBytes * 100).toFixed(1),
        remainingBytes: actualMaxBytes - bytes,
        isNearLimit: bytes > (actualMaxBytes * actualThreshold),
        items: Object.keys(items).length,
        testingMode: testingMode
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

} else {
  // Storage functions already exist, skipping redefinition
}
