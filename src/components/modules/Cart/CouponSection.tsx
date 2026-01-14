import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface CouponSectionProps {
  appliedCoupon?: {
    code: string;
    discount: string;
    minOrder: number;
  } | null;
  couponLoading: boolean;
  couponError: boolean;
  availableCoupons: unknown[];
  onCouponNavigation: () => void;
  onEditCoupon: () => void;
}

const CouponSection: React.FC<CouponSectionProps> = ({
  appliedCoupon,
  couponLoading,
  couponError,
  availableCoupons,
  onCouponNavigation,
  onEditCoupon,
}) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    couponBox: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 0,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: getColor('border'),
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
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    couponLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    appliedCouponContainer: {
      marginLeft: 10,
      flex: 1,
    },
    couponText: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('subtitle'),
      marginBottom: 4,
      fontFamily: theme.typography.fontFamily,
    },
    appliedDiscount: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
      fontFamily: theme.typography.fontFamily,
      flexDirection: 'row',
      alignItems: 'center',
    },
    couponDivider: {
      height: 1,
      backgroundColor: getColor('border'),
      marginVertical: 8,
    },
    minOrderText: {
      color: getColor('subText'),
      fontSize: getTypography('small'),
      fontFamily: theme.typography.fontFamily,
    },
    couponRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    couponAvailable: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
      marginRight: 8,
      fontWeight: '500',
      fontFamily: theme.typography.fontFamily,
    },
    editCoupon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: getColor('primary'),
      marginLeft: 'auto',
    },
    editCouponText: {
      color: getColor('primary'),
      fontSize: getTypography('small'),
      marginLeft: 4,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily,
      textTransform: 'uppercase',
    },
    couponLoadingText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      marginLeft: 8,
    },
    couponErrorText: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      marginLeft: 8,
    },
  });

  const handleCouponPress = useCallback(() => {
    onCouponNavigation();
  }, [onCouponNavigation]);

  const handleEditPress = useCallback(() => {
    onEditCoupon();
  }, [onEditCoupon]);

  return (
    <TouchableOpacity
      style={styles.couponBox}
      onPress={handleCouponPress}
      disabled={couponLoading}
      activeOpacity={0.7}
    >
      <View style={styles.couponLeft}>
        <View style={[styles.iconBadge, { backgroundColor: `${getColor('primary')}15` }]}>
          <MaterialCommunityIcons
            name="ticket-percent-outline"
            size={22}
            color={getColor('primary')}
          />
        </View>
        {appliedCoupon ? (
          <View style={styles.appliedCouponContainer}>
            <View>
              <Text style={styles.couponText}>{appliedCoupon.code}</Text>
              <Text style={styles.appliedDiscount}>
                <MaterialCommunityIcons name="check-circle" size={12} color={getColor('primary')} />{' '}
                {appliedCoupon.discount} discount applied
              </Text>
            </View>
            <View style={styles.couponDivider} />
            {/* <Text style={styles.minOrderText}>Min order: ₹{appliedCoupon.minOrder}</Text> */}
          </View>
        ) : (
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.couponText}>Apply Coupon</Text>
            {couponLoading && <Text style={styles.couponLoadingText}>Loading offers...</Text>}
            {couponError && <Text style={styles.couponErrorText}>Failed to load offers</Text>}
          </View>
        )}
      </View>
      <View style={styles.couponRight}>
        {appliedCoupon ? (
          <TouchableOpacity onPress={handleEditPress} style={styles.editCoupon}>
            <MaterialCommunityIcons name="pencil" size={20} color={getColor('primary')} />
            <Text style={styles.editCouponText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <>
            {!couponLoading && !couponError && (
              <Text style={styles.couponAvailable}>{availableCoupons.length} Available</Text>
            )}
            <MaterialCommunityIcons name="chevron-right" size={24} color={getColor('primary')} />
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CouponSection;
