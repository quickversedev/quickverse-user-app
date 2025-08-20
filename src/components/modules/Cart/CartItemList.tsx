import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../../routes/AppStack';
import { CartProduct } from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import CartItem from './CartItem';

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

interface CartItemListProps {
  items: CartProduct[];
  onInc: (sku: string) => void;
  onDec: (sku: string) => void;
  vendor?: Vendor;
  navigation: CartScreenNavigationProp;
}

const CartItemList: React.FC<CartItemListProps> = ({ items, onInc, onDec, vendor, navigation }) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    cartItemListBox: {
      borderColor: getColor('primary'),
      borderTopLeftRadius: 0,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomLeftRadius: theme.borderRadius.md,
      borderBottomRightRadius: theme.borderRadius.md,
      margin: 16,
      marginTop: 0,
      padding: 16,
      backgroundColor: getColor('card'),
      overflow: 'visible',
    },
    addMoreInputRow: { marginTop: 8, marginHorizontal: 4 },
    addMoreInput: {
      borderWidth: 1,
      borderColor: getColor('subText'),
      borderRadius: theme.borderRadius.sm,
      padding: 6,
      color: getColor('subText'),
      backgroundColor: getColor('card'),
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
  });

  const handleAddMore = useCallback(() => {
    if (vendor) {
      navigation.navigate('VendorProduct', { vendor });
    }
  }, [vendor, navigation]);

  const renderCartItem = useCallback(
    (item: CartProduct) => (
      <CartItem
        key={item.sku}
        {...item}
        tag={item.sku === 'sku2' ? '250 ML' : undefined}
        onInc={() => onInc(item.sku)}
        onDec={() => onDec(item.sku)}
      />
    ),
    [onInc, onDec]
  );

  return (
    <View style={styles.cartItemListBox}>
      {items.map(renderCartItem)}
      <TouchableOpacity style={styles.addMoreInputRow} onPress={handleAddMore}>
        <View style={styles.addMoreInput}>
          <Text style={[styles.addMoreInput, { borderWidth: 0 }]}>+ Add More Items</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default CartItemList;
