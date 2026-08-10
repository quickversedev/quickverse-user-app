import type React from 'react';
import type { SvgProps } from 'react-native-svg';
import ElectronicsIcon from '../../assets/svg/categories/electronics.svg';
import ForYouIcon from '../../assets/svg/categories/for-you.svg';
import FreshIcon from '../../assets/svg/categories/fresh.svg';
import GroceryIcon from '../../assets/svg/categories/grocery.svg';
import MobileIcon from '../../assets/svg/categories/mobile.svg';
import MonsoonIcon from '../../assets/svg/categories/monsoon.svg';

/**
 * Single source of truth for the home screen category strip AND the gradient band
 * behind it. The strip renders one chip per entry; selecting a chip cross-fades the
 * gradient band to that entry's palette.
 *
 * Selection is presentation-only — it repaints the gradient and the chip and nothing
 * else. The backend has no notion of 'Fresh' / 'Monsoon' / 'Mobile' / 'Electronics'
 * (vendor.category is only ever 'Food' | 'Grocery' | 'Pharmacy'), so filtering on
 * these would land four of the six tabs on an empty state.
 */

export type HomeCategoryId = 'forYou' | 'fresh' | 'monsoon' | 'grocery' | 'mobile' | 'electronics';

/** A 4-stop vertical ramp. See GRADIENT_LOCATIONS and the palette rules below. */
export type GradientStops = readonly [string, string, string, string];

export interface HomeCategory {
  id: HomeCategoryId;
  label: string;
  gradient: GradientStops;
  /** Chip tint when selected. Also used for the selected label. */
  accent: string;
  /**
   * Illustrated icon. These are interim in-house SVGs drawn to a 48x48 viewBox and
   * rendered at 40px — replace the files in src/assets/svg/categories/ when design
   * delivers the real artwork; no code change is needed if the filenames stay.
   *
   * Optional so HomeCategoryStrip keeps its neutral placeholder fallback for any
   * future category added before its asset exists.
   */
  Icon?: React.FC<SvgProps>;
}

/**
 * Shared stop positions for every palette. Tuned so that stop 3 (the pale mint)
 * lands behind the Featured Vendors row and stop 4 lands at the band's bottom edge.
 */
export const GRADIENT_LOCATIONS: readonly number[] = [0, 0.42, 0.8, 1];

/**
 * Must stay equal to theme.colors.background (assets/theme/defaultTheme.ts and
 * lightTheme.ts, both '#F9FAFB'). Every palette terminates on this exact value so
 * the band's bottom edge is invisible against the sections below it — no height
 * matching, no measurement.
 */
export const PAGE_BACKGROUND = '#F9FAFB';

/**
 * Palette rules, so future entries stay coherent:
 *   1. Stop 4 is always PAGE_BACKGROUND at location 1.0.
 *   2. Stop 3 is always a pale mint in the #DAF0E6–#E1F2E3 range — this is what
 *      produces the reference design's fade toward mint where Featured Vendors sits.
 *   3. Every stop 0 keeps relative luminance well above 0.5, so the status bar can
 *      stay 'dark-content' and the header's #111827 / #4B5563 text stays legible.
 *      Darkening a palette breaks all three of those at once.
 */
export const HOME_CATEGORIES: readonly HomeCategory[] = [
  {
    id: 'forYou',
    label: 'For You',
    gradient: ['#C9DDF8', '#DBD7F6', '#DCF1E4', PAGE_BACKGROUND],
    accent: '#6C8FD6',
    Icon: ForYouIcon,
  },
  {
    id: 'fresh',
    label: 'Fresh',
    gradient: ['#BFE7CB', '#D8F0DA', '#E0F3E7', PAGE_BACKGROUND],
    accent: '#3EA76A',
    Icon: FreshIcon,
  },
  {
    id: 'monsoon',
    label: 'Monsoon',
    gradient: ['#B9D6E6', '#D0E4EE', '#DAF0E6', PAGE_BACKGROUND],
    accent: '#4A87A8',
    Icon: MonsoonIcon,
  },
  {
    // Stop 0 is the brand amber (#D97706) laid over white, so the one category that
    // maps to a real vendor.category value is also the one carrying the brand colour.
    id: 'grocery',
    label: 'Grocery',
    gradient: ['#F8E2C0', '#FBEEDA', '#E1F2E3', PAGE_BACKGROUND],
    accent: '#D97706',
    Icon: GroceryIcon,
  },
  {
    id: 'mobile',
    label: 'Mobile',
    gradient: ['#D2D6F3', '#E1E3F9', '#DEF1E8', PAGE_BACKGROUND],
    accent: '#6E6BC6',
    Icon: MobileIcon,
  },
  {
    id: 'electronics',
    label: 'Electronics',
    gradient: ['#C4E8E9', '#D9EFF1', '#DDF1E6', PAGE_BACKGROUND],
    accent: '#2E9AA0',
    Icon: ElectronicsIcon,
  },
] as const;

export const DEFAULT_HOME_CATEGORY_ID: HomeCategoryId = 'forYou';

/** Cross-fade duration between palettes, in ms. */
export const GRADIENT_FADE_DURATION = 320;
