/**
 * Color utility functions for Colorfy extension
 */

// Predefined color palettes
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
 * Function to convert RGB to Hex
 * @param {string} rgb - RGB color string
 * @returns {string|null} - Hex color string or null if invalid
 */
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
 * Get the system theme preference
 * @returns {string} - 'dark' or 'light'
 */
const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Make functions globally accessible
window.parseColor = parseColor;
window.getOptimalTextColor = getOptimalTextColor;
window.rgbToHex = rgbToHex;
window.getSystemTheme = getSystemTheme;
window.colorfyColors = colorfyColors;
window.colorfyGradients = colorfyGradients;
