/**
 * Utility functions for color calculations
 */

/**
 * Determines if a color is dark based on its luminance
 * @param color - Hex color string (with or without #)
 * @returns true if color is dark, false if light
 */
export const isDarkColor = (color: string): boolean => {
  if (!color) return false;
  
  // Remove # if present
  const hex = color.replace('#', '').trim();
  if (!hex) return false;
  
  // Handle 3-digit hex colors
  const fullHex = hex.length === 3 
    ? hex.split('').map(char => char + char).join('')
    : hex;
  
  // Convert to RGB
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  // Check for invalid values
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  
  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

/**
 * Gets the appropriate text color (white or black) based on background color
 * @param backgroundColor - Hex color string (with or without #)
 * @param lightTextColor - Color to use for dark backgrounds (default: white)
 * @param darkTextColor - Color to use for light backgrounds (default: black/dark gray)
 * @returns Hex color string for text
 */
export const getContrastTextColor = (
  backgroundColor: string,
  lightTextColor: string = '#FFFFFF',
  darkTextColor: string = '#1F1B13'
): string => {
  return isDarkColor(backgroundColor) ? lightTextColor : darkTextColor;
};

