import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Images } from '../../assets';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';
import useVendorCouponsStore from '../../store/coupons/vendorCouponsStore';
import { getStoreStatus } from '../../utils/storeUtils';
import { ThemeText } from '../common/theme/ThemeText';
import useEssentialsCartStore from '../../store/cart/essentialsCartStore';

/** Same green the category screens' vendor coupon badges use, kept in step by hand. */
const COUPON_ACCENT = '#16A34A';

interface VendorHeaderCardProps {
  vendor: Vendor;
  onPress?: () => void;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
}

const VendorHeaderCard: React.FC<VendorHeaderCardProps> = ({
  vendor,
  onPress,
  style,
  containerStyle,
}) => {
  const { getColor, theme } = useTheme();
  const navigation = useNavigation();
  const scale = useRef(new Animated.Value(1)).current;
  const [logoError, setLogoError] = useState(false);

  /**
   * This vendor's offers, cycling one at a time.
   *
   * The rotation rides vendorCouponsStore's shared 3s tick rather than a timer of its
   * own, so this label changes in step with the vendor cards on the category screens
   * instead of drifting against them.
   */
  const couponsByVendor = useVendorCouponsStore(s => s.couponsByVendor);
  const couponTick = useVendorCouponsStore(s => s.tick);

  useEffect(() => {
    if (!vendor.shopId) return;
    const serviceType = vendor.category?.toUpperCase() === 'GROCERY' ? 'GROCERY' : 'FOOD';
    useVendorCouponsStore.getState().fetchForVendors([vendor.shopId], serviceType);
    useVendorCouponsStore.getState().startRotation();
    return () => useVendorCouponsStore.getState().stopRotation();
  }, [vendor.shopId, vendor.category]);

  // A grocery shop's offers don't apply in the Daily Essentials cart its products go into.
  const essentialsCartOn = useEssentialsCartStore(s => s.enabled === true);
  const isGroceryVendor = vendor.category?.toUpperCase() === 'GROCERY';
  const activeCoupon = useMemo(() => {
    if (isGroceryVendor && essentialsCartOn) return null;
    const labels = couponsByVendor[vendor.shopId];
    if (!labels || labels.length === 0) return null;
    return labels[couponTick % labels.length];
  }, [couponsByVendor, couponTick, vendor.shopId, isGroceryVendor, essentialsCartOn]);

  const storeStatus = getStoreStatus({
    storeActive: vendor.storeActive,
    openingTime: vendor.openingTime,
    closingTime: vendor.closingTime,
  });
  const isStoreClosed = !storeStatus.isOpen;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginTop: 4,
      borderRadius: theme.borderRadius.md,
      position: 'relative',
      zIndex: 2,
    },
    mainContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 0,
      paddingRight: 0,
    },
    couponRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    couponText: {
      marginLeft: 3,
      fontWeight: '700',
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.max,
      marginRight: 12,
      backgroundColor: getColor('border'),
    },
    info: { flex: 1, justifyContent: 'center' },
    meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    metaText: { color: getColor('subText'), marginRight: 8 },
    ratingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1ec28b',
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 8,
    },
    chevronContainer: {
      marginLeft: 'auto',
      alignSelf: 'center',
    },

    closedBanner: {
      marginTop: 4,
      marginHorizontal: 16,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: getColor('error'),
      borderRadius: 8,
      backgroundColor: 'rgba(255, 0, 0, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    closedText: {
      color: getColor('error'),
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 4,
    },
  });

  const renderRating = () => {
    if (!vendor.rating || vendor.rating === 0)
      return (
        <ThemeText variant="caption" color="#fff" style={{ marginLeft: 2 }}>
          Not Rated
        </ThemeText>
      );
    return (
      <ThemeText variant="caption" color="#fff" style={{ marginLeft: 2 }}>
        {vendor.rating}
      </ThemeText>
    );
  };

  const formatAddress = () => {
    if (vendor.shopAddress) return vendor.shopAddress.city;
    return 'Location';
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    // @ts-expect-error - Navigation type issue
    navigation.navigate('VendorDetails', { vendor });
  };

  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.98, duration: 100, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.mainContent}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <Image
            source={logoError || !vendor.logo ? Images.bg1 : { uri: vendor.logo }}
            style={styles.logo}
            onError={() => setLogoError(true)}
          />
          <View style={styles.info}>
            <View style={styles.meta}>
              <MaterialCommunityIcons name="flash" size={16} color={getColor('primary')} />
              <ThemeText
                variant="caption"
                color={getColor('subText')}
                style={{ marginLeft: 4, marginRight: 8 }}
              >
                {vendor.preparationTime}
              </ThemeText>
              <ThemeText variant="caption" color={getColor('subText')} style={{ marginRight: 8 }}>
                • {formatAddress()}
              </ThemeText>
            </View>
            {activeCoupon ? (
              <View style={styles.couponRow}>
                <MaterialCommunityIcons
                  name="ticket-percent-outline"
                  size={13}
                  color={COUPON_ACCENT}
                />
                <ThemeText variant="small" color={COUPON_ACCENT} style={styles.couponText}>
                  {activeCoupon}
                </ThemeText>
              </View>
            ) : null}
          </View>
          <View style={styles.chevronContainer}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={getColor('primary')} />
          </View>
        </TouchableOpacity>
      </View>
      {isStoreClosed && (
        <View style={styles.closedBanner}>
          <ThemeText variant="caption" color={getColor('error')} style={styles.closedText}>
            WE ARE CLOSED
          </ThemeText>
        </View>
      )}
    </Animated.View>
  );
};

export default VendorHeaderCard;
