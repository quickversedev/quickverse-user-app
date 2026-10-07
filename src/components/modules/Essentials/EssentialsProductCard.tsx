import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useMemo } from 'react';
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from 'react-native';
import QuantitySelector from '../Product/QuantitySelector';
import { ThemeText } from '../../common/theme/ThemeText';
import { CATALOGUE_ACCENT } from '../../../constants/catalogue';
import { GroceryGroupProduct } from '../../../services/groceryGroupsService';
import { useTheme } from '../../../theme/ThemeContext';
import { wholeRupees } from '../../../utils/price';

/**
 * A Daily Essentials product: packshot, name, whole-rupee price, ADD or the stepper.
 *
 * Built on its own card rather than ProductCard. ProductCard's `Product` requires
 * `discount`, `numberOfVariants` and `primarySKU`, none of which the groups endpoints return,
 * and below `size="big"` it draws a rating badge with 0. The card never names the product's
 * kirana: to the customer, Daily Essentials is one shop and one order.
 */

const THUMB = 56;
/** ADD and the stepper share this, so a card cannot resize on first add. */
const CONTROL_H = 28;

// Hoisted so the source fallback and defaultSource share one reference.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER = require('../../../assets/images/food.png');

/** Mirrors ProductCard's handling, including the leading `@` some catalogue URLs carry. */
const imageSourceFor = (image?: string): ImageSourcePropType => {
  const cleanUrl = typeof image === 'string' ? image.trim().replace(/^@+/, '') : '';
  return cleanUrl.startsWith('http') ? { uri: cleanUrl } : PLACEHOLDER;
};

interface EssentialsProductCardProps {
  product: GroceryGroupProduct;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

const EssentialsProductCard: React.FC<EssentialsProductCardProps> = ({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}) => {
  const { getColor, theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: '49%',
          justifyContent: 'space-between',
          backgroundColor: getColor('white'),
          borderRadius: 12,
          padding: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 3,
          elevation: 2,
        },
        cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
        thumbWrap: {
          width: THUMB,
          height: THUMB,
          borderRadius: 8,
          backgroundColor: getColor('overlay'),
          padding: 4,
        },
        // `contain`, not `cover`: at 56px these are packshots, and cropping one to fill
        // the square cuts the product out of its own thumbnail.
        thumb: { width: '100%', height: '100%' },
        cardText: { flex: 1, minWidth: 0 },
        name: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: getColor('text') },
        priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 3 },
        price: { fontSize: 15, lineHeight: 18, fontWeight: '800', color: getColor('text') },
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
        soldOutLabel: { color: getColor('placeholder') },
        /** Filled green in the cart, as on the PLP grid, the PDP and the cart itself. */
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

  const soldOut = !product.inStock;
  // Whole rupees, as the Essentials cart prices them.
  const shownPrice = wholeRupees(product.sellingPrice);
  const shownMrp = wholeRupees(product.mrp);
  const discounted = shownMrp > shownPrice;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.thumbWrap}>
          <Image
            source={imageSourceFor(product.imageUrl)}
            style={styles.thumb}
            resizeMode="contain"
            defaultSource={PLACEHOLDER}
          />
        </View>
        <View style={styles.cardText}>
          <ThemeText style={styles.name} numberOfLines={2}>
            {product.name}
          </ThemeText>
          <View style={styles.priceRow}>
            <ThemeText style={styles.price}>₹{shownPrice}</ThemeText>
            {discounted ? <ThemeText style={styles.mrp}>₹{shownMrp}</ThemeText> : null}
          </View>
        </View>
      </View>

      {quantity > 0 && !soldOut ? (
        <QuantitySelector
          quantity={quantity}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          size="xs"
          containerStyle={styles.stepper}
          tintColor={getColor('white')}
          quantityColor={getColor('white')}
        />
      ) : (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAdd}
          disabled={soldOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={soldOut ? `${product.name} is sold out` : `Add ${product.name}`}
        >
          {soldOut ? null : (
            <MaterialCommunityIcons name="plus" size={14} color={CATALOGUE_ACCENT} />
          )}
          <ThemeText style={[styles.addLabel, soldOut && styles.soldOutLabel]}>
            {soldOut ? 'SOLD OUT' : 'ADD'}
          </ThemeText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default React.memo(EssentialsProductCard);
