/**
 * Cyberpunk-inspired dark theme for fitness app
 * Based on user preferences for deep blacks, charcoal grays, midnight blues
 * with vibrant neon accents (electric blue, cyan, magenta)
 */

export const COLORS = {
  // Primary background colors
  background: {
    primary: '#0A0A0F', // Deep black with slight blue tint
    secondary: '#121218', // Slightly lighter black
    tertiary: '#1A1A24', // Dark charcoal with blue undertone
    card: '#16161E', // Card background
    modal: '#1E1E28', // Modal background
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF', // Pure white
    secondary: '#B8B8C0', // Light gray
    tertiary: '#6E6E78', // Medium gray
    disabled: '#4A4A52', // Dark gray
  },
  
  // Accent colors (neon)
  accent: {
    primary: '#00FFFF', // Cyan
    secondary: '#FF00FF', // Magenta
    tertiary: '#00AAFF', // Electric blue
    quaternary: '#FF5500', // Neon orange (for warnings/calories)
    success: '#00FF66', // Neon green (for completed items)
    error: '#FF0055', // Neon red (for errors)
    warning: '#FFAA00', // Neon yellow (for warnings)
  },
  
  // Border colors
  border: {
    primary: '#2A2A32', // Primary border color
    secondary: '#3A3A42', // Secondary border color
    accent: '#00FFFF', // Accent border color
  },
  
  // Gradients (start and end colors)
  gradient: {
    primary: ['#00FFFF', '#0066FF'], // Cyan to blue
    secondary: ['#FF00FF', '#9900FF'], // Magenta to purple
    tertiary: ['#00AAFF', '#0033FF'], // Electric blue to deep blue
    workout: ['#FF5500', '#FF0055'], // Orange to red (for high intensity)
    progress: ['#00FF66', '#00AAFF'], // Green to blue (for progress)
  },
  
  // Utility colors
  utility: {
    divider: '#2A2A32', // Divider lines
    overlay: 'rgba(0, 0, 0, 0.7)', // Overlay for modals
    shadow: 'rgba(0, 0, 0, 0.8)', // Shadow color
    glass: 'rgba(30, 30, 40, 0.7)', // Frosted glass effect
  }
};

export const FONTS = {
  // Font families
  family: {
    primary: 'System', // Will be replaced with a cyberpunk-style font
    secondary: 'System', // Will be replaced with a secondary font
    numbers: 'System', // Will be replaced with a monospace font for numbers
  },
  
  // Font sizes
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    title: 40,
  },
  
  // Font weights
  weight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
};

export const SIZES = {
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  
  // Icon sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
  
  // Button sizes
  button: {
    height: {
      sm: 36,
      md: 48,
      lg: 56,
    },
  },
  
  // Screen dimensions (will be calculated dynamically)
  screen: {
    width: 0,
    height: 0,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.utility.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
    // Web-only CSS shadow for RN Web
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  medium: {
    shadowColor: COLORS.utility.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
    // Web-only CSS shadow for RN Web
    boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
  },
  large: {
    shadowColor: COLORS.utility.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 6,
    // Web-only CSS shadow for RN Web
    boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
  },
  glow: {
    // For neon glow effects
    shadowColor: COLORS.accent.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    // Web-only CSS shadow for RN Web
    boxShadow: '0 0 24px rgba(0,255,255,0.35)',
  },
};

// Animation timing
export const ANIMATION = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

export default {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
  ANIMATION,
};
