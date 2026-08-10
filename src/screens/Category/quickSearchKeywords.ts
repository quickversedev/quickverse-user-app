import type React from 'react';
import type { SvgProps } from 'react-native-svg';
import AttaIcon from '../../assets/svg/quick-search/atta.svg';
import BiryaniIcon from '../../assets/svg/quick-search/biryani.svg';
import BreadIcon from '../../assets/svg/quick-search/bread.svg';
import BurgerIcon from '../../assets/svg/quick-search/burger.svg';
import ChineseIcon from '../../assets/svg/quick-search/chinese.svg';
import DrinksIcon from '../../assets/svg/quick-search/drinks.svg';
import EggsIcon from '../../assets/svg/quick-search/eggs.svg';
import FruitsIcon from '../../assets/svg/quick-search/fruits.svg';
import IceCreamIcon from '../../assets/svg/quick-search/ice-cream.svg';
import MilkIcon from '../../assets/svg/quick-search/milk.svg';
import MomosIcon from '../../assets/svg/quick-search/momos.svg';
import OilIcon from '../../assets/svg/quick-search/oil.svg';
import PizzaIcon from '../../assets/svg/quick-search/pizza.svg';
import RiceIcon from '../../assets/svg/quick-search/rice.svg';
import RollsIcon from '../../assets/svg/quick-search/rolls.svg';
import ShawarmaIcon from '../../assets/svg/quick-search/shawarma.svg';
import SnacksIcon from '../../assets/svg/quick-search/snacks.svg';
import ThaliIcon from '../../assets/svg/quick-search/thali.svg';
import VegetablesIcon from '../../assets/svg/quick-search/vegetables.svg';

/**
 * Keywords for the Quick Search strip on CategoryScreen.
 *
 * Tapping a chip navigates to the Search screen with `query` pre-filled, which
 * runs the normal /v3/search flow — these are plain search strings, not a
 * separate taxonomy. Every `query` below exists in src/assets/searchSuggestions.ts
 * so the chip, the suggestion dropdown and the results share one vocabulary.
 *
 * Keep each `query` at 20 characters or fewer: the search TextInput sets
 * maxLength={20} (src/components/search/SearchHeader.tsx), so a longer term
 * could not be typed by hand and would look inconsistent when it lands in the
 * input and in Recent Searches.
 */

export interface QuickSearchKeyword {
  /** Stable React key. */
  id: string;
  /** Chip label. */
  label: string;
  /** What actually gets searched — may differ from the label. */
  query: string;
  /**
   * Interim in-house SVG, 48x48 viewBox normalised to a uniform 34-unit content
   * height so every chip's art reads at the same size. Replace the files in
   * src/assets/svg/quick-search/ when design delivers real artwork.
   *
   * Optional so the strip's placeholder fallback covers any keyword added before
   * its asset exists.
   */
  Icon?: React.FC<SvgProps>;
}

export const FOOD_QUICK_SEARCH: readonly QuickSearchKeyword[] = [
  { id: 'pizza', label: 'Pizza', query: 'Pizza', Icon: PizzaIcon },
  { id: 'burger', label: 'Burger', query: 'Burger', Icon: BurgerIcon },
  { id: 'biryani', label: 'Biryani', query: 'Biryani', Icon: BiryaniIcon },
  { id: 'chinese', label: 'Chinese', query: 'Chinese', Icon: ChineseIcon },
  { id: 'shawarma', label: 'Shawarma', query: 'Shawarma', Icon: ShawarmaIcon },
  { id: 'rolls', label: 'Rolls', query: 'Rolls', Icon: RollsIcon },
  { id: 'momos', label: 'Momos', query: 'Momos', Icon: MomosIcon },
  { id: 'thali', label: 'Thali', query: 'Thali', Icon: ThaliIcon },
  { id: 'ice-cream', label: 'Ice Cream', query: 'Ice Cream', Icon: IceCreamIcon },
  { id: 'cold-drinks', label: 'Cold Drinks', query: 'Cold Drinks', Icon: DrinksIcon },
];

export const GROCERY_QUICK_SEARCH: readonly QuickSearchKeyword[] = [
  { id: 'milk', label: 'Milk', query: 'Milk', Icon: MilkIcon },
  { id: 'eggs', label: 'Eggs', query: 'Eggs', Icon: EggsIcon },
  { id: 'bread', label: 'Bread', query: 'Bread', Icon: BreadIcon },
  { id: 'rice', label: 'Rice', query: 'Rice', Icon: RiceIcon },
  { id: 'atta', label: 'Atta', query: 'Atta', Icon: AttaIcon },
  { id: 'oil', label: 'Oil', query: 'Oil', Icon: OilIcon },
  { id: 'snacks', label: 'Snacks', query: 'Snacks', Icon: SnacksIcon },
  { id: 'fruits', label: 'Fruits', query: 'Fruits', Icon: FruitsIcon },
  { id: 'vegetables', label: 'Vegetables', query: 'Vegetables', Icon: VegetablesIcon },
  { id: 'beverages', label: 'Beverages', query: 'Beverages', Icon: DrinksIcon },
];

/**
 * Returns the module-level constant array — never a fresh array. The strip is
 * React.memo'd and CategoryScreen rebuilds its list header on every render, so
 * returning a new array here would defeat the memo and re-mount 10 SVG trees on
 * every collections/vendor state change.
 *
 * Note CategoryScreen derives its category as
 * `categoryName.toLowerCase().includes('grocery')`, so any non-grocery category
 * (including a future 'Pharmacy') falls back to the food set — matching the
 * behaviour its existing search-bar handler already has.
 */
export const getQuickSearchKeywords = (
  category: 'Food' | 'Grocery'
): readonly QuickSearchKeyword[] =>
  category === 'Grocery' ? GROCERY_QUICK_SEARCH : FOOD_QUICK_SEARCH;
