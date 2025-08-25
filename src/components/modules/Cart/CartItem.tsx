import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CartProduct } from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { VegIcon } from '../../common';
import AddButton from '../Product/AddButton';
import QuantitySelector from '../Product/QuantitySelector';

interface CartItemProps extends CartProduct {
  tag?: string;
  onInc: () => void;
  onDec: () => void;
}

const CartItem: React.FC<CartItemProps> = React.memo(
  ({ name, price, mrp, quantity, tag, onInc, onDec, image, veg }) => {
    const { getColor, getTypography, theme, getButtonColor } = useTheme();

    const styles = StyleSheet.create({
      cartItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
      },
      cartItemImg: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.md,
        backgroundColor: getButtonColor('default', 'background'),
        marginRight: 14,
      },
      cartItemName: {
        color: getColor('text'),
        fontWeight: 'bold',
        fontSize: getTypography('body'),
        width: '75%',

        // marginRight: 8,
      },
      cartItemMRP: {
        color: getColor('subText'),
        fontSize: getTypography('caption'),
        textDecorationLine: 'line-through',
        marginRight: 6,
        fontWeight: 'bold',
      },
      cartItemPrice: {
        color: getButtonColor('default', 'background'),
        fontWeight: 'bold',
        fontSize: getTypography('body'),
      },
      qtyCol: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 45,
        justifyContent: 'center',
        minWidth: 70,
      },
      cartItemTag: {
        backgroundColor: getColor('card'),
        borderColor: getButtonColor('default', 'background'),
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 6,
        alignSelf: 'flex-end',
      },
      cartItemTagText: {
        color: getButtonColor('default', 'background'),
        fontWeight: 'bold',
        fontSize: getTypography('caption'),
      },
    });

    const handleIncrement = useCallback(() => {
      onInc();
    }, [onInc]);

    const handleDecrement = useCallback(() => {
      onDec();
    }, [onDec]);

    const handleAdd = useCallback(() => {
      onInc();
    }, [onInc]);

    const imageSource = React.useMemo(
      () => (typeof image === 'number' ? image : { uri: image }),
      [image]
    );

    const showMRP = React.useMemo(() => mrp !== price, [mrp, price]);

    return (
      <View style={styles.cartItemRow}>
        <Image source={imageSource} style={styles.cartItemImg} />
        <View style={{ flex: 1, minWidth: 120 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <Text style={styles.cartItemName} numberOfLines={2}>
              {name} <VegIcon veg={veg} size="small" />
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showMRP && <Text style={styles.cartItemMRP}>₹{mrp}</Text>}
            <Text style={styles.cartItemPrice}>₹{price}</Text>
          </View>
        </View>
        <View style={styles.qtyCol}>
          {quantity > 0 ? (
            <QuantitySelector
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              size="regular"
            />
          ) : (
            <AddButton onPress={handleAdd} size="regular" />
          )}

          {tag && (
            <View style={styles.cartItemTag}>
              <Text style={styles.cartItemTagText}>{tag}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }
);

CartItem.displayName = 'CartItem';

export default CartItem;
