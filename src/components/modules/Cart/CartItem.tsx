import React, { useCallback, useMemo } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { CATALOGUE_ACCENT } from '../../../constants/catalogue';
import { CartProduct } from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';
import AddButton from '../Product/AddButton';
import QuantitySelector from '../Product/QuantitySelector';

/**
 * One cart line, in the QV Cart design: a raised white card holding a contained
 * thumbnail, the pack size and name, the line total with its struck MRP, and a filled
 * green stepper.
 *
 * Two things the design shows are deliberately absent.
 *
 * The veg dot: `CartProduct.veg` is overwritten with `true` on every server sync
 * because the cart upstream sends no diet flag, so a marker here would tell every
 * signed-in customer that every line is vegetarian.
 *
 * The "From <store>" line: a QuickVerse cart is keyed `vendor_<shopId>` and holds one
 * vendor, so attributing each row to a store would repeat the same name down the
 * list. It belongs to the vendor header above them, and lives there instead.
 */

const THUMB = 64;
/** Stepper and the Add fallback share this, so the row cannot change height. */
const CONTROL_H = 32;
const CONTROL_W = 96;

interface CartItemProps extends CartProduct {
  tag?: string;
  /** `error` marks a line that cannot be ordered: red tag, dimmed row. */
  tagTone?: 'accent' | 'error';
  onInc: () => void;
  onDec: () => void;
}

const CartItem: React.FC<CartItemProps> = React.memo(
  ({ name, price, mrp, quantity, packSize, tag, tagTone = 'accent', onInc, onDec, image }) => {
    const { getColor, theme } = useTheme();

    const styles = useMemo(
      () =>
        StyleSheet.create({
          card: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: getColor('white'),
            borderRadius: 16,
            padding: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: getColor('border'),
            shadowColor: theme.colors.shadow.color,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.colors.shadow.opacity,
            shadowRadius: 3,
            elevation: 2,
          },
          thumbWrap: {
            width: THUMB,
            height: THUMB,
            borderRadius: 12,
            backgroundColor: getColor('overlay'),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: getColor('border'),
            padding: 4,
          },
          // `contain`, not `cover`: at 64px these are packshots, and cropping one to
          // fill the square cuts the product out of its own thumbnail.
          thumb: { width: '100%', height: '100%' },
          text: { flex: 1, minWidth: 0 },
          packSize: {
            fontSize: 11,
            lineHeight: 14,
            color: getColor('subText'),
          },
          name: {
            fontSize: 14,
            lineHeight: 18,
            fontWeight: '700',
            color: getColor('text'),
          },
          priceRow: {
            flexDirection: 'row',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 4,
          },
          price: {
            fontSize: 14,
            lineHeight: 18,
            fontWeight: '800',
            color: getColor('text'),
          },
          mrp: {
            fontSize: 12,
            lineHeight: 16,
            color: getColor('subText'),
            textDecorationLine: 'line-through',
          },
          // Only earns its place on a multi-unit line, where the line total alone
          // does not say what one costs.
          unitPrice: {
            fontSize: 11,
            lineHeight: 14,
            color: getColor('subText'),
          },
          /**
           * Filled green, matching the PDP purchase bar, the PLP grid and the PDP
           * suggestions. position/right/bottom undo QuantitySelector's default, which
           * absolutely positions itself inside a ProductCard image.
           */
          control: {
            position: 'relative',
            right: 0,
            bottom: 0,
            width: CONTROL_W,
            height: CONTROL_H,
            minWidth: 0,
            borderRadius: 12,
            backgroundColor: CATALOGUE_ACCENT,
            borderColor: CATALOGUE_ACCENT,
            paddingHorizontal: 0,
          },
          tag: {
            alignSelf: 'flex-end',
            marginTop: 6,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: `${CATALOGUE_ACCENT}14`,
          },
          tagError: { backgroundColor: `${getColor('error')}14` },
          tagTextError: { color: getColor('error') },
          dimmed: { opacity: 0.45 },
          tagText: {
            fontSize: 10,
            lineHeight: 12,
            fontWeight: '800',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            color: CATALOGUE_ACCENT,
          },
        }),
      [getColor, theme]
    );

    const handleIncrement = useCallback(() => onInc(), [onInc]);
    const handleDecrement = useCallback(() => onDec(), [onDec]);

    const imageSource: ImageSourcePropType = useMemo(
      () => (typeof image === 'number' ? image : { uri: image }),
      [image]
    );

    const lineTotal = price * quantity;
    const lineMrp = mrp * quantity;
    const showMrp = mrp > price;
    const showUnitPrice = quantity > 1;

    return (
      <View style={styles.card}>
        <View style={[styles.thumbWrap, tagTone === 'error' && styles.dimmed]}>
          <Image source={imageSource} style={styles.thumb} resizeMode="contain" />
        </View>

        <View style={styles.text}>
          {packSize ? (
            <ThemeText style={styles.packSize} numberOfLines={1}>
              {packSize}
            </ThemeText>
          ) : null}
          <ThemeText style={styles.name} numberOfLines={2}>
            {name}
          </ThemeText>
          <View style={styles.priceRow}>
            <ThemeText style={styles.price}>₹{lineTotal.toFixed(2)}</ThemeText>
            {showMrp ? <ThemeText style={styles.mrp}>₹{lineMrp.toFixed(2)}</ThemeText> : null}
            {showUnitPrice ? (
              <ThemeText style={styles.unitPrice}>₹{price.toFixed(2)} each</ThemeText>
            ) : null}
          </View>
        </View>

        <View>
          {quantity > 0 ? (
            <QuantitySelector
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              size="small"
              containerStyle={styles.control}
              tintColor={getColor('white')}
              quantityColor={getColor('white')}
            />
          ) : (
            <AddButton
              onPress={handleIncrement}
              size="small"
              containerStyle={styles.control}
              tintColor={getColor('white')}
            />
          )}
          {tag ? (
            <View style={[styles.tag, tagTone === 'error' && styles.tagError]}>
              <ThemeText style={[styles.tagText, tagTone === 'error' && styles.tagTextError]}>
                {tag}
              </ThemeText>
            </View>
          ) : null}
        </View>
      </View>
    );
  }
);

CartItem.displayName = 'CartItem';

export default CartItem;
