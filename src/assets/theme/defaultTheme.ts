import { Theme } from '../../theme/ThemeContext';

export const DefaultTheme: Theme = {
  colors: {
    primary: '#FEDB51', // used in shadowColor
    secondary: '#FFE885', // used in otpButton background
    background: '#111827', // screen background
    tabBackground: '#1F2937',
    card: '#1F2937', // card + input background
    border: '#374151', // input border
    overlay: '#4B5563', // skip button background
    white: '#FFFFFF',
    black: '#000000',
    error: '#EF4444',
    text: '#F3F4F6', // title text
    subText: '#9CA3AF', // subtitle + phoneLabel
    placeholder: '#9CA3AF',

    button: {
      default: {
        background: '#FFE885',
        text: '#000000',
      },
      pressed: {
        background: '#E6D172',
        text: '#000000',
      },
      disabled: {
        background: '#CCCCCC',
        text: '#666666',
      },
    },

    shadow: {
      color: '#FAE588',
      opacity: 0.15,
      offset: { width: 0, height: 5 },
      radius: 10,
    },

    borderHighlight: 'yellow', // used in card border
  },

  typography: {
    fontFamily: 'BricolageGrotesque',
    lineHeightMultiplier: 1.4,

    h1: 28, // for title
    h2: 22,
    subtitle: 18, // for subtext
    body: 16, // input text, calling code
    caption: 14, // skip text, phoneLabel
    small: 12,
  },

  borderRadius: {
    sm: 8,
    md: 15,
    full: 9999,
  },
};
