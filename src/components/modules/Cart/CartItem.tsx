import React, { useCallback } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { CartProduct } from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';
import AddButton from '../Product/AddButton';
import QuantitySelector from '../Product/QuantitySelector';

interface CartItemProps extends CartProduct {
  tag?: string;
  onInc: () => void;
  onDec: () => void;
}

const CartItem: React.FC<CartItemProps> = React.memo(
  ({ name, price, mrp, quantity, tag, onInc, onDec, image, veg }) => {
    const { getColor, theme, getButtonColor } = useTheme();

    const styles = StyleSheet.create({
      cartItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 18,
      },
      cartItemImg: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.md,
        backgroundColor: getButtonColor('default', 'background'),
        marginRight: 12,
        alignSelf: 'center',
      },
      cartItemName: {
        color: getColor('text'),
        width: '75%',
        // marginRight: 8,
      },
      cartItemMRP: {
        color: getColor('subText'),
        textDecorationLine: 'line-through',
        marginRight: 6,
      },
      cartItemPrice: {
        color: getButtonColor('default', 'background'),
      },
      qtyCol: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70,
        alignSelf: 'center',
        marginLeft: 35,
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
      },
      vegIndicator: {
        width: 14,
        height: 14,
        borderRadius: 2,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
        marginTop: 3,
      },
      vegDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
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
        <View style={{ flex: 1, minWidth: 120, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
            <View
              style={[
                styles.vegIndicator,
                {
                  borderColor: veg ? '#22C55E' : '#EF4444',
                },
              ]}
            >
              <View
                style={[
                  styles.vegDot,
                  {
                    backgroundColor: veg ? '#22C55E' : '#EF4444',
                  },
                ]}
              />
            </View>
            <ThemeText
              variant="body"
              color={getColor('text')}
              style={[styles.cartItemName, { width: undefined, flex: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {name}
            </ThemeText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showMRP && (
              <ThemeText variant="caption" color={getColor('subText')} style={styles.cartItemMRP}>
                ₹{(mrp ?? 0).toFixed(2)}
              </ThemeText>
            )}
            <ThemeText
              variant="body"
              color={getButtonColor('default', 'background')}
              style={styles.cartItemPrice}
            >
              ₹{(price ?? 0).toFixed(2)}
            </ThemeText>
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
              <ThemeText
                variant="caption"
                color={getButtonColor('default', 'background')}
                style={styles.cartItemTagText}
              >
                {tag}
              </ThemeText>
            </View>
          )}
        </View>
      </View>
    );
  }
);

CartItem.displayName = 'CartItem';

export default CartItem;
