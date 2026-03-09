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
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { TabBarVisibilityContext } from '../../../navigation/TabNavigation';

interface CartFooterProps {
  address: string;
  addressTag?: string;
  onSelectAddress: () => void;
  onCheckout: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const CartFooter: React.FC<CartFooterProps> = ({
  address,
  addressTag,
  onSelectAddress,
  onCheckout,
  disabled = false,
  loading = false,
}) => {
  const { getColor, getTypography, theme, getButtonColor } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarContext = React.useContext(TabBarVisibilityContext);
  const extraBottom = tabBarContext?.fullTabBarHeight || 0;

  const isAddressSelected = address !== 'Select delivery address';

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
      backgroundColor: getButtonColor('default', 'background'),
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
    if (!isAddressSelected) return 'Select Address to Continue';
    if (disabled) return 'Select Payment Method';
    return 'Place Order';
  };

  return (
    <View style={styles.footerBar}>
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
          <Text style={styles.addressLabel}>
            Deliver to{addressTag ? ` • ${addressTag}` : ''}
          </Text>
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
            {address}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={getColor('primary')} />
      </TouchableOpacity>

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
