// Images
export const Images = {
  // Backgrounds
  homeBackground: require('./images/homeBackground.png'),
  bg1: require('./images/bg_1.png'),

  // Icons
  logoQv: require('./images/logo_qv.png'),
  mapLocation: require('./images/map-location.png'),

  // Category Icons
  forYou: require('./images/for-you.png'),
  grocery: require('./images/grocery.png'),
  pharmacy: require('./images/pharmacy.png'),
} as const;

// Fonts
export const Fonts = {
  bricolageGrotesque: require('./fonts/BricolageGrotesque.ttf'),
} as const;

// Theme
export { DefaultTheme } from './theme/defaultTheme';

// Mock Data
export { mockProducts } from './mock/products';
export { mockVendors } from './mock/vendor';

// Types for better TypeScript support
export type ImageKey = keyof typeof Images;
export type FontKey = keyof typeof Fonts;

// Helper function to get image by key
export const getImage = (key: ImageKey) => Images[key];

// Helper function to get font by key
export const getFont = (key: FontKey) => Fonts[key];
