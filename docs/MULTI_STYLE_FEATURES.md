# Colorfy Multi-Style Feature

## Overview

The Colorfy extension now supports multiple color styles per website, allowing users to create, manage, and switch between different color schemes for the same web page.

## Key Features

### 1. **Multiple Styles per Website**
- Up to 5 different color styles per website
- Each style maintains its own set of color changes
- Styles are saved independently and can be switched instantly

### 2. **Style Management Interface**
- **Style Selector Dropdown**: Located at the top of the color picker, shows all available styles
- **Edit Button**: Opens the style management modal for advanced operations
- **Original Style**: Always available, shows the webpage in its original state

### 3. **Style Management Modal**
- **Add New Style**: Create new color schemes (up to 5 total)
- **Rename Styles**: Click on style names to edit them inline
- **Delete Styles**: Remove unwanted styles with confirmation
- **Style Overview**: See how many color changes each style contains

## User Experience

### For New Users
- When first using Colorfy on a website, two styles are automatically created:
  - **"Original"**: The unchanged webpage (read-only)
  - **"Style 1"**: Pre-selected for making color changes
- This ensures a seamless experience without requiring setup

### For Existing Users
- Existing color changes are automatically migrated to "Style 1"
- The "Original" style is added for easy comparison
- All previous functionality remains intact

## Technical Implementation

### New Modules
1. **`styleManager.js`**: Core functionality for managing multiple styles
2. **`styleSelector.js`**: UI components for style selection and editing

### Data Structure
```javascript
// New storage format: Colorfy_Styles
{
  "https://example.com": {
    "styles": [
      {
        "id": "original",
        "name": "Original",
        "elements": [],
        "isOriginal": true
      },
      {
        "id": "style_1",
        "name": "My Dark Theme",
        "elements": [/* color changes */],
        "isOriginal": false
      }
    ],
    "activeStyle": "style_1"
  }
}
```

### Backward Compatibility
- Existing data in the old format (`Colorfy`) is automatically migrated
- Legacy storage is preserved until migration is complete
- No data loss during the upgrade process

## Usage Instructions

### Creating a New Style
1. Click the Colorfy extension icon
2. Click "Edit" next to the style selector
3. Click "Add New Style" in the modal
4. Enter a name for your new style
5. Select the new style from the dropdown to start adding colors

### Switching Between Styles
1. Click the Colorfy extension icon
2. Use the dropdown at the top to select any available style
3. The page will instantly update to show that style's colors
4. Select "Original" to see the unmodified webpage

### Managing Styles
1. Click the "Edit" button next to the style selector
2. In the modal, you can:
   - Rename styles by clicking on their names
   - Delete styles using the "×" button
   - See how many changes each style contains

### Making Color Changes
1. Ensure you're not on the "Original" style (it's read-only)
2. Select an element on the page
3. Choose colors from the palette
4. Changes are saved to the currently active style only

## UI Components

### Style Selector
- **Location**: Top of the color picker modal
- **Functionality**: Dropdown showing all available styles
- **Visual Indicator**: Shows the currently active style

### Edit Button
- **Location**: Next to the style selector dropdown
- **Functionality**: Opens the style management modal
- **Styling**: Blue button with "Edit" text

### Style Management Modal
- **Components**:
  - List of all styles with edit capabilities
  - Element count for each style
  - Add new style functionality
  - Delete confirmation for style removal

## Limitations

1. **Maximum Styles**: 5 styles per website to prevent storage bloat
2. **Original Style**: Cannot be edited or deleted (always available)
3. **Style Names**: Must be non-empty when creating or renaming

## Benefits

### For Users
- **Organization**: Keep different color schemes separate (e.g., "Work Mode", "Dark Theme", "High Contrast")
- **Experimentation**: Test different color combinations without losing existing work
- **Quick Switching**: Instantly switch between themes for different contexts
- **Comparison**: Easy comparison with original webpage design

### For Developers
- **Clean Architecture**: Modular design with separated concerns
- **Extensibility**: Easy to add new features to specific styles
- **Maintainability**: Clear separation between style management and color application
- **Data Integrity**: Each style maintains independent state

## CSS Classes

All new UI components use the `__Colorfy` suffix to avoid conflicts:

- `.style_selector_wrapper__Colorfy`
- `.style_select__Colorfy`
- `.style_edit_btn__Colorfy`
- `.style_edit_modal__Colorfy`
- `.style_edit_content__Colorfy`
- `.style_item__Colorfy`
- `.add_style_btn__Colorfy`

## Future Enhancements

Potential improvements that could be added:
1. **Style Export/Import**: Share styles between devices or users
2. **Template Styles**: Pre-made color schemes for common use cases
3. **Style Scheduling**: Automatically switch styles based on time of day
4. **Bulk Operations**: Apply one style's changes to another style
5. **Style Preview**: Thumbnail previews of how each style looks
