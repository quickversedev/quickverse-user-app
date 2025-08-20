import React, { useCallback } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Icons } from '../../../assets';
import { useTheme } from '../../../theme/ThemeContext';

interface CartFooterProps {
  address: string;
  onSelectAddress: () => void;
  onCheckout: () => void;
}

const CartFooter: React.FC<CartFooterProps> = ({ address, onSelectAddress, onCheckout }) => {
  const { getColor, getTypography, theme, getButtonColor } = useTheme();

  const styles = StyleSheet.create({
    footerBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: getColor('card'),
      padding: 16,
      borderTopLeftRadius: theme.borderRadius.sm,
      borderTopRightRadius: theme.borderRadius.sm,
      flexDirection: 'column',
      alignItems: 'stretch',
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 12,
    },
    addressBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      marginBottom: 16,
      alignSelf: 'stretch',
    },
    addressText: {
      color: getColor('text'),
      marginHorizontal: 6,
      fontSize: getTypography('subtitle'),
      flex: 1,
    },
    addressIcon: {
      width: 22,
      height: 22,
      marginRight: 8,
      resizeMode: 'contain',
    },
    checkoutBtn: {
      backgroundColor: getButtonColor('default', 'background'),
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 18,
      alignItems: 'center',
      alignSelf: 'stretch',
      shadowColor: getButtonColor('default', 'background'),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 6,
    },
    checkoutText: {
      color: getButtonColor('default', 'text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
  });

  const handleAddressPress = useCallback(() => {
    onSelectAddress();
  }, [onSelectAddress]);

  const handleCheckoutPress = useCallback(() => {
    onCheckout();
  }, [onCheckout]);

  return (
    <View style={styles.footerBar}>
      <TouchableOpacity style={styles.addressBox} onPress={handleAddressPress}>
        <Image source={Icons.selectedAddress} style={styles.addressIcon} />
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
          {address}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={getColor('button').default.background}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckoutPress}>
        <Text style={styles.checkoutText}>Proceed To Checkout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CartFooter;
