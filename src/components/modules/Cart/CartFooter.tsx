import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarVisibilityContext } from '../../../navigation/TabNavigation';
import { CATALOGUE_ACCENT } from '../../../constants/catalogue';
import { useTheme } from '../../../theme/ThemeContext';

interface CartFooterProps {
  /** Amount the customer will actually be charged, from the checkout summary. */
  total?: number;
  /** Total saved on this order; drives the design's savings line. */
  savings?: number;
  /** Opens the bill. The design pairs the total with a "View Bill" affordance. */
  onViewBill?: () => void;
  /**
   * Reports the height of the strip this bar obscures — its own measured height plus
   * the tab-bar offset it floats above — so the list can pad by exactly that much.
   * The height varies with the address line and the savings line, and a fixed guess
   * left the bill card's last rows unreachable behind it.
   */
  onHeightChange?: (height: number) => void;
  address: string;
  addressTag?: string;
  addressId?: string;
  onSelectAddress: () => void;
  onCheckout: () => void;
  disabled?: boolean;
  loading?: boolean;
  isGuest?: boolean;
  /** The method chosen on the cart: COD places the order outright, Prepaid goes on to pay. */
  paymentMethod?: string;
}

const CartFooter: React.FC<CartFooterProps> = ({
  total = 0,
  savings = 0,
  onViewBill,
  onHeightChange,
  address,
  addressTag,
  addressId,
  onSelectAddress,
  onCheckout,
  disabled = false,
  loading = false,
  isGuest = false,
  paymentMethod,
}) => {
  const { getColor, getTypography, theme, getButtonColor } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarContext = React.useContext(TabBarVisibilityContext);
  const extraBottom = tabBarContext?.fullTabBarHeight || 0;

  const isValidUUID = (value?: string | null) =>
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const isAddressSelected = address !== 'Select delivery address' && isValidUUID(addressId);

  const styles = StyleSheet.create({
    footerBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: extraBottom,
      backgroundColor: getColor('card'),
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: extraBottom > 0 ? 16 : Math.max(insets.bottom, 16) + 8,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      flexDirection: 'column',
      alignItems: 'stretch',
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: getColor('border'),
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 16,
        },
      }),
    },
    totalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    totalBlock: { flex: 1 },
    totalLine: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    totalAmount: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '800',
      color: getColor('text'),
    },
    viewBill: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
      color: CATALOGUE_ACCENT,
      textDecorationLine: 'underline',
    },
    savingsLine: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: CATALOGUE_ACCENT,
      marginTop: 2,
    },
    addressBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.md,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isAddressSelected ? getColor('primary') : getColor('border'),
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    addressContent: {
      flex: 1,
    },
    addressLabel: {
      color: getColor('subText'),
      fontSize: getTypography('small'),
      marginBottom: 2,
    },
    addressText: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '500',
    },
    checkoutBtn: {
      backgroundColor: CATALOGUE_ACCENT,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: getButtonColor('default', 'background'),
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    checkoutBtnDisabled: {
      backgroundColor: getColor('border'),
      ...Platform.select({
        ios: {
          shadowOpacity: 0,
        },
        android: {
          elevation: 0,
        },
      }),
    },
    checkoutText: {
      color: getButtonColor('default', 'text'),
      fontWeight: '700',
      fontSize: getTypography('body'),
      letterSpacing: 0.5,
    },
    checkoutIcon: {
      marginLeft: 8,
    },
  });

  const handleAddressPress = useCallback(() => {
    onSelectAddress();
  }, [onSelectAddress]);

  const handleCheckoutPress = useCallback(() => {
    onCheckout();
  }, [onCheckout]);

  const getButtonText = () => {
    if (loading) return 'Processing...';
    if (isGuest) return 'Login to Continue';
    if (!isAddressSelected) return 'Select Address to Continue';
    // The method is chosen on the cart, so the button says what tapping it does: a COD order
    // is placed there and then; a prepaid one goes on to the payment.
    return paymentMethod === 'COD' ? 'Place Order' : 'Proceed to Pay';
  };

  return (
    <View
      style={styles.footerBar}
      // Reports the whole obscured strip, not just this bar: it floats at
      // `bottom: extraBottom` above the tab bar, so the list has to clear both.
      onLayout={e => onHeightChange?.(e.nativeEvent.layout.height + extraBottom)}
    >
      <TouchableOpacity style={styles.addressBox} onPress={handleAddressPress} activeOpacity={0.7}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: isAddressSelected
                ? `${getColor('primary')}15`
                : `${getColor('subText')}15`,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={isAddressSelected ? getColor('primary') : getColor('subText')}
          />
        </View>
        <View style={styles.addressContent}>
          <Text style={styles.addressLabel}>Deliver to{addressTag ? ` • ${addressTag}` : ''}</Text>
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
            {address}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={getColor('primary')} />
      </TouchableOpacity>

      {total > 0 ? (
        <View style={styles.totalRow}>
          <View style={styles.totalBlock}>
            <View style={styles.totalLine}>
              <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
              {onViewBill ? (
                <TouchableOpacity onPress={onViewBill} accessibilityRole="button">
                  <Text style={styles.viewBill}>View Bill</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {savings > 0 ? (
              <Text style={styles.savingsLine}>Total savings ₹{savings.toFixed(2)}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.checkoutBtn, disabled && styles.checkoutBtnDisabled]}
        onPress={handleCheckoutPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={getButtonColor('default', 'text')} />
        ) : (
          <>
            <Text style={[styles.checkoutText, disabled && { color: getColor('subText') }]}>
              {getButtonText()}
            </Text>
            {!disabled && !loading && (
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={getButtonColor('default', 'text')}
                style={styles.checkoutIcon}
              />
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CartFooter;
