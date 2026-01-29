import { Platform } from 'react-native';
import { Theme } from '../../theme/ThemeContext';

export const LightTheme: Theme = {
  colors: {
    main: '#D97706', // Amber/Orange - good contrast on white
    secondary: '#F59E0B',
    background: '#F9FAFB', // Soft warm gray background
    tabBackground: '#FFFFFF',
    card: '#F2F2F2',
    border: '#E0E0E0', // Slightly darker border for definition
    overlay: '#EEEEEE',
    white: '#FFFFFF',
    black: '#000000',
    error: '#DC2626',
    text: '#1F2937', // Dark gray text for readability
    subText: '#4B5563', // Darker subtext for better contrast
    placeholder: '#9CA3AF',
    dividerText: '#6B7280', // Darker divider text for light mode
    dividerLine: '#9CA3AF', // Visible divider line

    button: {
      default_background: '#D97706',
      default_text: '#FFFFFF',
      pressed_background: '#B45309',
      pressed_text: '#FFFFFF',
      disabled_background: '#E5E5E5',
      disabled_text: '#9CA3AF',
    },

    shadow: {
      color: '#000000',
      opacity: 0.08,
      offset_width: 0,
      offset_height: 2,
      radius: 8,
    },

    borderHighlight: '#D97706',
  },

  typography: {
    fontFamily: Platform.select({
      ios: 'BricolageGrotesque-Regular',
      android: 'BricolageGrotesque',
      default: 'BricolageGrotesque',
    }) as string,
    lineHeightMultiplier: 1.4,

    h1: 28,
    h2: 22,
    subtitle: 18,
    body: 16,
    caption: 14,
    small: 12,
  },

  borderRadius: {
    sm: 8,
    md: 15,
    max: 9999,
  },
};
