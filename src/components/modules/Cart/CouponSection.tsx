import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface AvailableCoupon {
  id: string;
  code: string;
  mov: number;
  discountValue: number | null;
  type: string;
  uptoValue: number | null;
}

interface CouponSectionProps {
  couponLoading: boolean;
  availableCoupons: AvailableCoupon[];
  selectedCoupon: AvailableCoupon | null;
  onCouponNavigation: () => void;
  onRemoveCoupon: () => void;
}

const CouponSection: React.FC<CouponSectionProps> = ({
  couponLoading,
  availableCoupons,
  selectedCoupon,
  onCouponNavigation,
  onRemoveCoupon,
}) => {
  const { getColor, getTypography, theme } = useTheme();
  const ff = theme.typography.fontFamily;

  if (selectedCoupon) {
    const getAppliedLabel = () => {
      if (selectedCoupon.type === 'FREE_DELIVERY') {
        return 'Free Delivery Applied';
      }
      if (selectedCoupon.type === 'FIXED' && selectedCoupon.discountValue != null) {
        return `Flat ₹${selectedCoupon.discountValue} OFF Applied`;
      }
      if (selectedCoupon.type === 'PERCENTAGE' && selectedCoupon.discountValue != null) {
        const uptoText = selectedCoupon.uptoValue ? ` (Up to ₹${selectedCoupon.uptoValue})` : '';
        return `${selectedCoupon.discountValue}% OFF Applied${uptoText}`;
      }
      return 'Coupon Applied';
    };

    return (
      <View
        style={[
          styles.couponBox,
          {
            backgroundColor: getColor('card'),
            borderColor: getColor('primary'),
            borderRadius: theme.borderRadius.md,
          },
          Platform.select({
            ios: {
              shadowColor: theme.colors.shadow.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
            },
            android: { elevation: 4 },
          }),
        ]}
      >
        <View style={styles.couponLeft}>
          <View style={[styles.iconBadge, { backgroundColor: `${getColor('primary')}18` }]}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={22}
              color={getColor('primary')}
            />
          </View>
          <View style={styles.labelContainer}>
            <Text
              style={{
                color: getColor('primary'),
                fontWeight: '700',
                fontSize: getTypography('body'),
                fontFamily: ff,
                letterSpacing: 0.5,
              }}
            >
              {selectedCoupon.code}
            </Text>
            <Text
              style={{
                color: getColor('primary'),
                fontSize: getTypography('caption'),
                fontFamily: ff,
                marginTop: 3,
                fontWeight: '500',
                lineHeight: 16,
              }}
            >
              {getAppliedLabel()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onRemoveCoupon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.removeBtn, { borderColor: getColor('error') }]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="close" size={13} color={getColor('error')} />
          <Text
            style={{
              color: getColor('error'),
              fontSize: getTypography('small'),
              fontFamily: ff,
              fontWeight: '700',
              marginLeft: 3,
            }}
          >
            Remove
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.couponBox,
        {
          backgroundColor: getColor('card'),
          borderColor: getColor('border'),
          borderRadius: theme.borderRadius.md,
        },
        Platform.select({
          ios: {
            shadowColor: theme.colors.shadow.color,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          },
          android: { elevation: 4 },
        }),
      ]}
      onPress={onCouponNavigation}
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
        <View style={styles.labelContainer}>
          <Text
            style={{
              color: getColor('text'),
              fontWeight: 'bold',
              fontSize: getTypography('body'),
              fontFamily: ff,
            }}
          >
            Apply Coupon
          </Text>
          {couponLoading && (
            <Text
              style={{
                color: getColor('subText'),
                fontSize: getTypography('caption'),
                fontFamily: ff,
                marginTop: 3,
              }}
            >
              Loading offers...
            </Text>
          )}
          {!couponLoading && availableCoupons.length > 0 && (
            <Text
              style={{
                color: getColor('primary'),
                fontSize: getTypography('caption'),
                fontFamily: ff,
                marginTop: 3,
                fontWeight: '600',
              }}
            >
              {availableCoupons.length} offer{availableCoupons.length > 1 ? 's' : ''} available
            </Text>
          )}
          {!couponLoading && availableCoupons.length === 0 && (
            <Text
              style={{
                color: getColor('subText'),
                fontSize: getTypography('caption'),
                fontFamily: ff,
                marginTop: 3,
              }}
            >
              No coupons available right now
            </Text>
          )}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={getColor('primary')} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  couponBox: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14, // Slightly increased padding for clean breathing room
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16, // Added spacing to make sure text leaves a clean gap before the action item button
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    marginLeft: 12,
    flex: 1,
    flexDirection: 'column', // Text stacks properly and handles vertical expansion clean
    justifyContent: 'center',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: 'center', // Centers nicely with the layout regardless of textual lines height
  },
});

export default CouponSection;
