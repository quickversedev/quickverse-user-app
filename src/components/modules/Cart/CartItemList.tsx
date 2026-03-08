import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
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
      borderColor: getColor('border'),
      borderWidth: 1,
      borderTopLeftRadius: 0,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomLeftRadius: theme.borderRadius.md,
      borderBottomRightRadius: theme.borderRadius.md,
      margin: 16,
      marginTop: 0,
      padding: 16,
      backgroundColor: getColor('card'),
      overflow: 'visible',
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    addMoreButton: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: getColor('primary'),
      borderStyle: 'dashed',
    },
    addMoreIcon: {
      marginRight: 8,
    },
    addMoreText: {
      color: getColor('primary'),
      fontWeight: '600',
      fontSize: getTypography('body'),
      fontFamily: theme.typography.fontFamily,
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
      <TouchableOpacity style={styles.addMoreButton} onPress={handleAddMore} activeOpacity={0.7}>
        <MaterialCommunityIcons
          name="plus"
          size={18}
          color={getColor('primary')}
          style={styles.addMoreIcon}
        />
        <Text style={styles.addMoreText}>Add More Items</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CartItemList;
