import { Platform } from 'react-native';
import { Theme } from '../../theme/ThemeContext';

export const DefaultTheme: Theme = {
  colors: {
    main: '#D97706', // Amber/Orange - from LightTheme
    secondary: '#F59E0B',
    background: '#F9FAFB', // Light background
    tabBackground: '#FFFFFF',
    card: '#F2F2F2',
    border: '#E0E0E0',
    overlay: '#EEEEEE',
    white: '#FFFFFF',
    black: '#000000',
    error: '#DC2626',
    text: '#1F2937', // Dark text
    subText: '#4B5563',
    placeholder: '#9CA3AF',
    dividerText: '#6B7280',
    dividerLine: '#9CA3AF',

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
