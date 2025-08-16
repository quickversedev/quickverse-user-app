// Images
export const Images = {
  // Backgrounds
  homeBackground: require('./images/homeBackground.png'),
  bg1: require('./images/bg_1.png'),

  // Icons
  logoQv: require('./images/logo_qv.png'),
  mapLocation: require('./images/map-location.png'),
  orderZero: require('./images/order_zero.png'),
  emptyVendors: require('./images/empty_vendors.png'),

  // Category Icons
  forYou: require('./images/for-you.png'),
  grocery: require('./images/grocery.png'),
  pharmacy: require('./images/pharmacy.png'),
  food: require('./images/food.png'),
} as const;

// Icons
export const Icons = {
  // Navigation Icons
  home: require('./images/icons/Home.png'),
  backArrow: require('./images/icons/backArrow.png'),
  search: require('./images/icons/search.png'),

  // Action Icons
  bell: require('./images/icons/Bell.png'),
  cart: require('./images/icons/cart.png'),
  bookmark: require('./images/icons/bookmark.png'),
  lightning: require('./images/icons/lightning.png'),
  selectedAddress: require('./images/icons/selectedAddress.png'),
  heart: require('./images/icons/heart.png'),

  // Category Icons
  foodIcon: require('./images/icons/food.png'),
  forYouIcon: require('./images/icons/forYou.png'),
  pharmacyIcon: require('./images/icons/pharmacy.png'),

  // Utility Icons
  bottle: require('./images/icons/Bottle.png'),
  addressPin: require('./images/icons/addressPin.png'),
  explore: require('./images/icons/explore.png'),
  man: require('./images/icons/man.png'),
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

// Search Suggestions
export * from './searchSuggestions';

// Types for better TypeScript support
export type ImageKey = keyof typeof Images;
export type IconKey = keyof typeof Icons;
export type FontKey = keyof typeof Fonts;

// Helper function to get image by key
export const getImage = (key: ImageKey) => Images[key];

// Helper function to get icon by key
export const getIcon = (key: IconKey) => Icons[key];

// Helper function to get font by key
export const getFont = (key: FontKey) => Fonts[key];
