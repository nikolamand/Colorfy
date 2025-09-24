# Colorfy Extension - File Structure

The Colorfy extension has been refactored to improve maintainability and organization. The large `main.js` file has been split into several focused modules:

## File Structure

### Core Modules

1. **`colorUtils.js`** - Color parsing, conversion, and utility functions
   - Color parsing (`parseColor`, `rgbToHex`)
   - Color optimization (`getOptimalTextColor`)
   - System theme detection
   - Base URL utilities
   - Contains predefined color palettes (`colorfyColors`, `colorfyGradients`)

2. **`elementSelection.js`** - Element selection and interaction handling
   - Element hovering and highlighting
   - Click handling and event listeners
   - Element selection logic
   - Color application to DOM elements
   - Selection mode management

3. **`uiComponents.js`** - UI creation and management
   - Modal and palette wrapper creation
   - Color scheme application
   - Advanced options UI (saved items, manual input)
   - UI cleanup and management

4. **`storage.js`** - Storage management and saved elements
   - Local storage handling
   - Saved elements display and editing
   - Manual element addition
   - Data persistence

5. **`paletteManager.js`** - Color palette creation and management
   - Preset color addition
   - Custom color picker integration
   - Gradient handling
   - Color selection coordination

6. **`main.js`** - Main entry point and initialization
   - CSS and icon loading
   - Extension initialization
   - Coordination between modules

### Support Files

- **`backend.js`** - Background content script (unchanged)
- **`background.js`** - Service worker for extension management
- **`manifest.json`** - Extension manifest with updated script loading order

## Script Loading Order

The scripts are loaded in this order to ensure proper dependencies:

1. `colorUtils.js` - Core utilities (no dependencies)
2. `elementSelection.js` - Uses colorUtils
3. `storage.js` - Uses colorUtils
4. `uiComponents.js` - Uses colorUtils and storage functions
5. `paletteManager.js` - Uses all previous modules
6. `backend.js` - Original backend functionality
7. `main.js` - Main coordinator (uses all modules)

## Benefits of This Structure

- **Better Organization**: Each file has a clear, focused purpose
- **Easier Maintenance**: Changes to specific functionality are isolated
- **Better Readability**: Smaller, focused files are easier to understand
- **Modular Design**: Functions are grouped by their domain responsibility
- **Reduced Complexity**: The original 1000+ line main.js is now ~30 lines

## Usage

The extension works exactly the same as before from a user perspective. The refactoring is purely internal to improve code organization and maintainability.
