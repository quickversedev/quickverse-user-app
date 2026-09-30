import React, { useEffect, useMemo, useState } from 'react';
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../../constants/catalogue';
import useCartStore from '../../../store/cart/cartStore';
import { useProductsStore } from '../../../store/products/productsStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { ThemeText } from '../../common/theme/ThemeText';
import QuantitySelector from './QuantitySelector';
import { wholeRupees } from '../../../utils/price';

/**
 * "Pairs well with" suggestions, laid out as the QV PDP design has them: a two-up
 * grid of compact cards, each a thumbnail beside the name and price with the add
 * control across the bottom.
 *
 * This replaced a horizontally scrolling shelf of tall ProductCards inside one large
 * bordered panel. The panel is gone deliberately — in the design the section is only
 * a heading and a grid, and each suggestion is its own raised surface on the page, so
 * the outer card was a box around boxes.
 *
 * Dropping ProductCard also ended a fabrication: to reuse it this file built a mock
 * Product per suggestion with `rating: 4.5`, `veg: true`, `discount: 0` and
 * `currentStock: 10` hardcoded, none of which came from the catalogue. The design's
 * suggestion card carries neither a rating nor a diet marker, so none of it is
 * needed and nothing here asserts a value it was not given.
 */

const THUMB = 56;
/** Add button and stepper share this, so a card does not resize on first add. */
const CONTROL_H = 28;

/**
 * Two rows of two.
 *
 * The shelf showed up to ten because horizontal scrolling made the count free. In a
 * grid each extra pair is another ~120px of a page that is already long, and this is
 * a nudge at checkout rather than a catalogue to browse.
 */
const MAX_SUGGESTIONS = 4;

// Hoisted so the two uses below (source fallback and defaultSource) share one
// reference. `require` because there is no `*.png` module declaration in the repo,
// so an ES import of an image does not typecheck — ProductCard resolves it the
// same way, inline.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER = require('../../../assets/images/food.png');

interface SuggestedItem {
  id: string;
  name: string;
  price: number;
  mrp: number;
  /** Image URL; the bundled placeholder stands in when it is empty or not http. */
  image: string;
  quantity: number;
}

interface SuggestedItemsProps {
  categories?: string; // Comma-separated categories
  products?: Product[]; // Direct products to show
  /**
   * SKUs to keep out of the suggestions — the product detail screen passes the
   * product being viewed (and its selected variant), which the category lookup
   * would otherwise return as a suggestion for itself.
   */
  excludeSkus?: string[];
  /**
   * Cart to read quantities from. Worth passing: the caller adds to its own cart
   * (the PDP uses `vendor_<shopId>`), while the fallback here is whichever cart is
   * active, so without it a card can show a count from a different vendor's cart —
   * or none while the item is in fact in the one being added to.
   */
  cartId?: string;
  onItemPress: (item: SuggestedItem) => void;
  onAdd: (item: SuggestedItem) => void;
  onIncrement: (item: SuggestedItem) => void;
  onDecrement: (item: SuggestedItem) => void;
  isStoreClosed?: boolean;
}

/** Mirrors ProductCard's handling, including the leading `@` some URLs carry. */
const imageSourceFor = (image: string): ImageSourcePropType => {
  const cleanUrl = typeof image === 'string' ? image.trim().replace(/^@+/, '') : '';
  return cleanUrl.startsWith('http') ? { uri: cleanUrl } : PLACEHOLDER;
};

const SuggestedItems: React.FC<SuggestedItemsProps> = ({
  categories,
  products,
  excludeSkus,
  cartId,
  onItemPress,
  onAdd,
  onIncrement,
  onDecrement,
  isStoreClosed,
}) => {
  const { getColor, theme } = useTheme();
  const { getProductsByCategories } = useProductsStore();
  const { carts, activeCartId } = useCartStore();
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedItem[]>([]);

  // Resolve items from provided products or categories
  useEffect(() => {
    const resolvedCartId = cartId ?? activeCartId;
    const cartProducts = (resolvedCartId ? carts[resolvedCartId] : null)?.products || {};

    // Filtered before slicing, so excluding an item doesn't shrink the grid.
    const isExcluded = (sku: string) => (excludeSkus ? excludeSkus.includes(sku) : false);

    const toItem = (p: Product): SuggestedItem => ({
      id: p.sku,
      name: p.name,
      price: p.sellingPrice,
      mrp: p.mrp,
      image: typeof p.imageUrl === 'string' ? p.imageUrl : '',
      quantity: cartProducts[p.sku]?.quantity || 0,
    });

    const source = products && products.length > 0 ? products : null;
    if (source) {
      setSuggestedProducts(
        source
          .filter(p => !isExcluded(p.sku))
          .slice(0, MAX_SUGGESTIONS)
          .map(toItem)
      );
      return;
    }

    if (categories && categories.trim()) {
      setSuggestedProducts(
        getProductsByCategories(categories)
          .filter(p => !isExcluded(p.sku))
          .slice(0, MAX_SUGGESTIONS)
          .map(toItem)
      );
      return;
    }

    setSuggestedProducts([]);
    // NOTE: callers must pass a referentially stable `excludeSkus` (useMemo) —
    // a fresh array literal each render would re-run this effect indefinitely.
  }, [products, categories, excludeSkus, getProductsByCategories, cartId, activeCartId, carts]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginTop: 16,
          marginHorizontal: CATALOGUE_GUTTER,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
        },
        // The design's section heading: 14/18 bold, not the h2 this used to render
        // at the top of a panel.
        title: {
          fontSize: 14,
          lineHeight: 18,
          fontWeight: '700',
          color: getColor('text'),
        },
        /**
         * Two per row. `space-between` with 49%-wide cards leaves ~8px between
         * them, matching the design's card-gap, and leaves a lone trailing card at
         * the start of its row instead of stretched across it.
         */
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 8,
        },
        card: {
          width: '49%',
          // Pins the add control to the bottom edge, so cards in a row keep their
          // controls level even when one name wraps to two lines and the other
          // does not.
          justifyContent: 'space-between',
          backgroundColor: getColor('white'),
          borderRadius: 12,
          padding: 10,
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 3,
          elevation: 2,
        },
        cardTop: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
        },
        thumbWrap: {
          width: THUMB,
          height: THUMB,
          borderRadius: 8,
          backgroundColor: getColor('overlay'),
          padding: 4,
        },
        // `contain` rather than `cover`: at 56px these are packshots, and cropping
        // one to fill the square cuts the product out of its own thumbnail.
        thumb: {
          width: '100%',
          height: '100%',
        },
        cardText: {
          flex: 1,
        },
        name: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '700',
          color: getColor('text'),
        },
        priceRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: 5,
          marginTop: 3,
        },
        price: {
          fontSize: 15,
          lineHeight: 18,
          fontWeight: '800',
          color: getColor('text'),
        },
        /**
         * The design's suggestion card shows the price alone, because none of its
         * sample products is discounted. Ours frequently are, so the struck MRP is
         * carried over from the design's own price line rather than dropping real
         * savings on the floor. It renders only when there is a difference.
         */
        mrp: {
          fontSize: 11,
          lineHeight: 14,
          color: getColor('subText'),
          textDecorationLine: 'line-through',
        },
        addBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          height: CONTROL_H,
          marginTop: 8,
          borderRadius: 8,
          backgroundColor: getColor('overlay'),
        },
        addLabel: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '800',
          letterSpacing: 0.4,
          color: CATALOGUE_ACCENT,
        },
        disabledLabel: {
          color: getColor('placeholder'),
        },
        /**
         * Filled green, matching the PDP's own purchase bar and the PLP grid card:
         * across all three surfaces an item already in the cart shows a solid green
         * stepper. position/right/bottom undo QuantitySelector's default, which
         * absolutely positions itself inside a ProductCard image.
         */
        stepper: {
          position: 'relative',
          right: 0,
          bottom: 0,
          alignSelf: 'stretch',
          minWidth: 0,
          height: CONTROL_H,
          marginTop: 8,
          borderRadius: 8,
          backgroundColor: CATALOGUE_ACCENT,
          borderColor: CATALOGUE_ACCENT,
          paddingHorizontal: 0,
        },
      }),
    [getColor, theme]
  );

  // Don't render if no suggested products
  if (suggestedProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="gift-outline" size={18} color={getColor('primary')} />
        <ThemeText style={styles.title}>Add a little somethin&apos;</ThemeText>
      </View>

      <View style={styles.grid}>
        {suggestedProducts.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => onItemPress(item)}
          >
            <View style={styles.cardTop}>
              <View style={styles.thumbWrap}>
                <Image
                  source={imageSourceFor(item.image)}
                  style={styles.thumb}
                  resizeMode="contain"
                  defaultSource={PLACEHOLDER}
                  onError={() => console.warn('Failed to load image:', item.image)}
                />
              </View>
              <View style={styles.cardText}>
                <ThemeText style={styles.name} numberOfLines={2}>
                  {item.name}
                </ThemeText>
                <View style={styles.priceRow}>
                  <ThemeText style={styles.price}>₹{wholeRupees(item.price)}</ThemeText>
                  {wholeRupees(item.mrp) > wholeRupees(item.price) ? (
                    <ThemeText style={styles.mrp}>₹{wholeRupees(item.mrp)}</ThemeText>
                  ) : null}
                </View>
              </View>
            </View>

            {item.quantity > 0 ? (
              <QuantitySelector
                quantity={item.quantity}
                onIncrement={() => onIncrement(item)}
                onDecrement={() => onDecrement(item)}
                size="xs"
                disabled={isStoreClosed}
                containerStyle={styles.stepper}
                tintColor={getColor('white')}
                quantityColor={getColor('white')}
              />
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => onAdd(item)}
                disabled={isStoreClosed}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name}`}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={14}
                  color={isStoreClosed ? getColor('placeholder') : CATALOGUE_ACCENT}
                />
                <ThemeText style={[styles.addLabel, isStoreClosed && styles.disabledLabel]}>
                  ADD
                </ThemeText>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default SuggestedItems;
