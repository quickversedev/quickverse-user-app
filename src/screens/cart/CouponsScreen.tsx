import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';

import useCartStore from '../../store/cart/cartStore';
import useCouponStore, { Coupon } from '../../store/cart/couponStore';
import useVendorStore from '../../store/vendorStore';

const CouponCard: React.FC<{
  coupon: Coupon;
  onApply: (code: string) => void;
}> = ({ coupon, onApply }) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    discountBadge: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.sm,
    },
    discountText: {
      color: getColor('black'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      fontFamily: theme.typography.fontFamily,
    },
    applyButton: {
      borderWidth: 1,
      borderColor: getColor('primary'),
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.sm,
    },
    applyButtonDisabled: {
      borderWidth: 1,
      borderColor: getColor('subText'),
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.sm,
      opacity: 0.6,
    },
    applyButtonText: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      fontFamily: theme.typography.fontFamily,
    },
    applyButtonTextDisabled: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      fontFamily: theme.typography.fontFamily,
    },
    code: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      fontWeight: 'normal',
      marginBottom: 8,
      fontFamily: theme.typography.fontFamily,
    },
    codeLabel: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      fontWeight: 'normal',
      fontFamily: theme.typography.fontFamily,
    },
    codeValue: {
      color: getColor('primary'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      fontFamily: theme.typography.fontFamily,
    },
    description: {
      color: getColor('text'),
      fontSize: getTypography('subtitle'),
      fontWeight: '500',
      marginBottom: 12,
      fontFamily: theme.typography.fontFamily,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    minOrder: {
      color: getColor('subText'),
      fontSize: getTypography('small'),
      fontFamily: theme.typography.fontFamily,
    },
    expiryDate: {
      color: getColor('subText'),
      fontSize: getTypography('small'),
      fontFamily: theme.typography.fontFamily,
    },
    eligibilityInfo: {
      marginTop: 8,
      padding: 8,
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.sm,
    },
    eligibilityText: {
      color: getColor('primary'),
      fontSize: getTypography('small'),
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily,
      marginBottom: 4,
    },
    constraintText: {
      color: getColor('error'),
      fontSize: getTypography('small'),
      fontFamily: theme.typography.fontFamily,
      marginBottom: 2,
    },
    benefitText: {
      color: getColor('primary'),
      fontSize: getTypography('small'),
      fontFamily: theme.typography.fontFamily,
      marginBottom: 2,
    },
  });

  const isEligible = coupon.isEligible !== false; // Default to true if not specified

  // Helper function to get specific eligibility message
  const getEligibilityMessage = () => {
    if (isEligible) return null;

    const messages: string[] = [];

    // Check minimum order amount using minimumOrderAmount field
    if (coupon.minimumOrderAmount && coupon.totalAmountRequired) {
      const amountNeeded = coupon.minimumOrderAmount - coupon.totalAmountRequired;
      if (amountNeeded > 0) {
        messages.push(`Add ₹${amountNeeded} more to cart`);
      }
    }

    // Check minimum product count
    if (coupon.minProductCount && coupon.minProductCount > 0) {
      messages.push(`Add at least ${coupon.minProductCount} items to cart`);
    }

    // Add constraint suggestions if available
    if (coupon.constraintSuggestions) {
      coupon.constraintSuggestions.forEach(constraint => {
        const message = constraint
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace('min order amount rule failure', 'Order amount too low')
          .replace('min product count rule failure', 'Not enough items in cart')
          .replace('rule failure', 'Requirements not met');
        messages.push(message);
      });
    }

    return messages;
  };

  const eligibilityMessages = getEligibilityMessage();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>Get {coupon.discount}</Text>
        </View>
        <TouchableOpacity
          style={isEligible ? styles.applyButton : styles.applyButtonDisabled}
          onPress={() => isEligible && onApply(coupon.code)}
          disabled={!isEligible}
        >
          <Text style={isEligible ? styles.applyButtonText : styles.applyButtonTextDisabled}>
            {isEligible ? 'APPLY' : 'NOT ELIGIBLE'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.code}>
        <Text style={styles.codeLabel}>apply coupon code: </Text>
        <Text style={styles.codeValue}>{coupon.code}</Text>
      </Text>
      <Text style={styles.description}>{coupon.description}</Text>

      {/* Show eligibility information for non-eligible offers */}
      {!isEligible && eligibilityMessages && eligibilityMessages.length > 0 && (
        <View style={styles.eligibilityInfo}>
          <Text style={styles.eligibilityText}>Why not eligible?</Text>
          {eligibilityMessages.map((message, index) => (
            <Text key={index} style={styles.constraintText}>
              • {message}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.minOrder}>Min. Order: ₹{coupon.minOrder}</Text>
        <Text style={styles.expiryDate}>{coupon.expiryDate}</Text>
      </View>
    </View>
  );
};

const CouponsScreen: React.FC = () => {
  const { carts, activeCartId } = useCartStore();
  const { vendors } = useVendorStore();
  const { getAvailableCoupons, applyCoupon, loading, error, checkAndFetchOffers } =
    useCouponStore();
  const navigation = useNavigation<AppNavigationProp>();
  const { getColor, getTypography, theme } = useTheme();
  const [couponCode, setCouponCode] = useState('');
  const { authData } = useAuth();

  // Get current cart and vendor
  const cart = activeCartId ? carts[activeCartId] : Object.values(carts)[0];
  const vendor = vendors.find(v => v.shopId === cart?.cartId.replace('vendor_', ''));
  const vendorId = vendor?.shopId || '';

  // Get vendor-specific coupons
  const availableCoupons = getAvailableCoupons(vendorId);

  useEffect(() => {
    if (vendorId) {
      checkAndFetchOffers(vendorId, authData);
    }
  }, [vendorId, checkAndFetchOffers, authData]);

  const handleApplyCoupon = (code: string) => {
    const cartId = activeCartId || (carts && Object.keys(carts)[0]);
    if (!cartId) return;

    const coupon = availableCoupons.find((c: Coupon) => c.code === code);
    if (coupon) {
      applyCoupon(cartId, coupon);
      navigation.goBack();
    }
  };

  const handleManualApply = () => {
    if (couponCode.trim()) {
      handleApplyCoupon(couponCode.trim());
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
    },
    content: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === 'ios' ? 12 : 16,
      backgroundColor: getColor('background'),
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.borderRadius.full,
      backgroundColor: getColor('card'),
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    headerTitle: {
      color: getColor('text'),
      fontSize: getTypography('subtitle'),
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily,
    },
    placeholder: {
      width: 40,
    },
    inputContainer: {
      backgroundColor: getColor('card'),
      padding: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    input: {
      flex: 1,
      height: 48,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      backgroundColor: getColor('background'),
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontFamily: theme.typography.fontFamily,
    },
    applyButtonLarge: {
      height: 48,
      paddingHorizontal: 24,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: getColor('primary'),
    },
    applyButtonLargeText: {
      color: getColor('black'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      fontFamily: theme.typography.fontFamily,
    },
    sectionTitle: {
      fontSize: getTypography('subtitle'),
      fontWeight: '600',
      color: getColor('text'),
      marginHorizontal: 16,
      marginBottom: 12,
      fontFamily: theme.typography.fontFamily,
    },
    couponList: {
      padding: 16,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 32,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingVertical: 32,
    },
    errorIcon: {
      marginBottom: 16,
    },
    errorText: {
      color: getColor('error'),
      fontSize: getTypography('body'),
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily,
      marginBottom: 8,
    },
    errorSubtext: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily,
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
    },
    retryButtonText: {
      color: getColor('black'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
      fontFamily: theme.typography.fontFamily,
    },
    noDataText: {
      color: getColor('subText'),
      fontSize: getTypography('body'),
      textAlign: 'center',
      fontFamily: theme.typography.fontFamily,
    },
    vendorInfo: {
      backgroundColor: getColor('card'),
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    vendorName: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily,
      marginLeft: 12,
    },
  });

  const handleRetry = () => {
    if (vendorId) {
      checkAndFetchOffers(vendorId, authData);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply Coupon</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Coupon Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter coupon code"
              placeholderTextColor={getColor('subText')}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                styles.applyButtonLarge,
                {
                  backgroundColor: couponCode.trim()
                    ? getColor('primary')
                    : getColor('button').disabled.background,
                },
              ]}
              onPress={handleManualApply}
              disabled={!couponCode.trim()}
            >
              <Text style={styles.applyButtonLargeText}>APPLY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Coupons */}
        <Text style={styles.sectionTitle}>Available Coupons</Text>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={getColor('primary')} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color={getColor('error')}
              style={styles.errorIcon}
            />
            <Text style={styles.errorText}>Failed to load coupons</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : availableCoupons.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={48}
              color={getColor('subText')}
              style={styles.errorIcon}
            />
            <Text style={styles.noDataText}>No coupons available for this vendor</Text>
          </View>
        ) : (
          <FlatList
            data={availableCoupons}
            renderItem={({ item }) => <CouponCard coupon={item} onApply={handleApplyCoupon} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.couponList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default CouponsScreen;
