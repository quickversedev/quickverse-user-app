import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useTheme } from '../../theme/ThemeContext';
import { AppNavigationProp } from '../../types/navigation';

import useCartStore from '../../store/cart/cartStore';
import useCouponStore, { Coupon } from '../../store/cart/couponStore';
import useVendorStore from '../../store/vendorStore';

const CouponCard: React.FC<{
  coupon: Coupon;
  onApply: (code: string) => void;
  isApplied?: boolean;
}> = ({ coupon, onApply, isApplied = false }) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginBottom: 16,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
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
    applyButtonApplied: {
      borderWidth: 1,
      borderColor: getColor('primary'),
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: getColor('primary'),
    },
    code: {
      color: getColor('text'),
      marginBottom: 8,
    },
    codeLabel: {
      color: getColor('subText'),
    },
    codeValue: {
      color: getColor('primary'),
    },
    description: {
      color: getColor('text'),
      marginBottom: 12,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    minOrder: {
      color: getColor('subText'),
    },
    expiryDate: {
      color: getColor('subText'),
    },
    eligibilityInfo: {
      marginTop: 8,
      padding: 8,
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.sm,
    },
    eligibilityText: {
      color: getColor('primary'),
      marginBottom: 4,
    },
    constraintText: {
      color: getColor('error'),
      marginBottom: 2,
    },
    benefitText: {
      color: getColor('primary'),
      marginBottom: 2,
    },
  });

  const isEligible = coupon.isEligible !== false; // Default to true if not specified

  // Helper function to get specific eligibility message
  const getEligibilityMessage = () => {
    if (isEligible) return null;

    const messages: string[] = [];

    // Minimum order not met: API provides totalAmountRequired as the remaining amount needed
    if (typeof coupon.totalAmountRequired === 'number' && coupon.totalAmountRequired > 0) {
      const amountNeeded = Math.ceil(coupon.totalAmountRequired);
      messages.push(`Add ₹${amountNeeded} more to cart`);
    }

    // Check minimum product count if provided
    if (typeof coupon.minProductCount === 'number' && coupon.minProductCount > 0) {
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
          <ThemeText variant="caption" color={getColor('black')}>
            Get {coupon.discount}
          </ThemeText>
        </View>
        <TouchableOpacity
          style={
            isApplied
              ? styles.applyButtonApplied
              : isEligible
              ? styles.applyButton
              : styles.applyButtonDisabled
          }
          onPress={() => isEligible && !isApplied && onApply(coupon.code)}
          disabled={!isEligible || isApplied}
        >
          <ThemeText
            variant="caption"
            color={
              isApplied ? getColor('black') : isEligible ? getColor('primary') : getColor('subText')
            }
          >
            {isApplied ? 'APPLIED' : isEligible ? 'APPLY' : 'NOT ELIGIBLE'}
          </ThemeText>
        </TouchableOpacity>
      </View>
      <ThemeText variant="caption" color={getColor('text')} style={styles.code}>
        <ThemeText variant="caption" color={getColor('subText')} style={styles.codeLabel}>
          apply coupon code:{' '}
        </ThemeText>
        <ThemeText variant="body" color={getColor('primary')} style={styles.codeValue}>
          {coupon.code}
        </ThemeText>
      </ThemeText>
      <ThemeText variant="subtitle" color={getColor('text')} style={styles.description}>
        {coupon.description}
      </ThemeText>

      {/* Show eligibility information for non-eligible offers */}
      {!isEligible && eligibilityMessages && eligibilityMessages.length > 0 && (
        <View style={styles.eligibilityInfo}>
          <ThemeText variant="small" color={getColor('primary')} style={styles.eligibilityText}>
            Why not eligible?
          </ThemeText>
          {eligibilityMessages.map((message, index) => (
            <ThemeText
              key={index}
              variant="small"
              color={getColor('error')}
              style={styles.constraintText}
            >
              • {message}
            </ThemeText>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <ThemeText variant="small" color={getColor('subText')} style={styles.minOrder}>
          Min. Order: ₹{coupon.minOrder}
        </ThemeText>
        <ThemeText variant="small" color={getColor('subText')} style={styles.expiryDate}>
          {coupon.expiryDate}
        </ThemeText>
      </View>
    </View>
  );
};

const CouponsScreen: React.FC = () => {
  const { carts, activeCartId } = useCartStore();
  const { vendors } = useVendorStore();
  const {
    getAvailableCoupons,
    checkAndFetchOffers,
    applyOfferToCart,
    getAppliedCoupon,
    vendorOffersLoading,
    customerOffersLoading,
    vendorOffersError,
    customerOffersError,
    applyCouponLoading,
    applyCouponError,
  } = useCouponStore();
  const navigation = useNavigation<AppNavigationProp>();
  const { getColor, getButtonColor, theme } = useTheme();
  const [couponCode, setCouponCode] = useState('');
  const { authData } = useAuth();

  // Get current cart and vendor
  const cart = activeCartId ? carts[activeCartId] : Object.values(carts)[0];
  // Ensure cart has required properties
  if (cart && !cart.cartId) {
    console.warn('Cart missing cartId property:', cart);
  }
  const vendor = cart?.cartId
    ? vendors.find(v => v.shopId === cart.cartId.replace('vendor_', ''))
    : undefined;
  const vendorId = vendor?.shopId || '';

  // Get vendor-specific coupons
  const availableCoupons = getAvailableCoupons(vendorId);
  const appliedCoupon = cart ? getAppliedCoupon(cart.cartId) : null;

  useEffect(() => {
    if (vendorId) {
      checkAndFetchOffers(vendorId, authData);
    }
  }, [vendorId, checkAndFetchOffers, authData]);

  // Revalidate coupons when cart contents change
  useEffect(() => {
    if (vendorId && cart) {
      // Revalidate coupons when cart items or total amount changes
      checkAndFetchOffers(vendorId, authData);
    }
  }, [
    cart?.totalCartAmount,
    Object.keys(cart?.products || {}).length,
    vendorId,
    checkAndFetchOffers,
    authData,
  ]);

  const handleApplyCoupon = async (code: string) => {
    const cartId = activeCartId || (carts && Object.keys(carts)[0]);
    if (!cartId || !vendorId) return;

    const coupon = availableCoupons.find((c: Coupon) => c.code === code || c.id === code);
    if (coupon) {
      try {
        await applyOfferToCart(cartId, vendorId, coupon, authData);
        navigation.goBack();
      } catch (e) {
        // Error handled by store and shown in modal
      }
    }
  };

  const handleManualApply = () => {
    const code = couponCode.trim();
    if (!code) return;
    const cartId = activeCartId || (carts && Object.keys(carts)[0]);
    if (!cartId || !vendorId) return;
    const existing = availableCoupons.find((c: Coupon) => c.code === code || c.id === code);
    const coupon: Coupon =
      existing ||
      ({
        id: code,
        code,
        description: code,
        discount: '',
        minOrder: 0,
        expiryDate: '',
      } as Coupon);
    applyOfferToCart(cartId, vendorId, coupon, authData)
      .then(() => navigation.goBack())
      .catch(() => {});
  };

  const handleRetry = () => {
    if (vendorId) {
      checkAndFetchOffers(vendorId, authData);
    }
  };

  const handleCloseErrorModal = () => {
    // Clear the error state by calling the store method
    useCouponStore.setState({ applyCouponError: null });
  };

  // Early return if cart is not properly configured
  if (!cart?.cartId || !vendor) {
    return null;
  }

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
      borderRadius: theme.borderRadius.md,
      backgroundColor: getColor('card'),
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
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
    },
    sectionTitle: {
      color: getColor('text'),
      marginHorizontal: 16,
      marginBottom: 12,
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
      textAlign: 'center',
      marginBottom: 8,
    },
    errorSubtext: {
      color: getColor('subText'),
      textAlign: 'center',
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
    },
    noDataText: {
      color: getColor('subText'),
      textAlign: 'center',
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
      marginLeft: 12,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    errorModal: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 24,
      alignItems: 'center',
      width: '80%',
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    errorModalIcon: {
      marginBottom: 16,
    },
    errorModalTitle: {
      color: getColor('error'),
      marginBottom: 8,
    },
    errorModalMessage: {
      color: getColor('subText'),
      textAlign: 'center',
      marginBottom: 24,
    },
    errorModalButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.md,
    },
    errorModalButtonText: {
      color: getColor('black'),
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
          </TouchableOpacity>
          <ThemeText variant="subtitle" color={getColor('text')} style={styles.headerTitle}>
            Apply Coupon
          </ThemeText>
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
                    : getButtonColor('disabled', 'background'),
                },
              ]}
              onPress={handleManualApply}
              disabled={!couponCode.trim() || applyCouponLoading}
            >
              <ThemeText
                variant="body"
                color={getColor('black')}
                style={styles.applyButtonLargeText}
              >
                {applyCouponLoading ? 'APPLYING...' : 'APPLY'}
              </ThemeText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Coupons */}
        <ThemeText variant="subtitle" color={getColor('text')} style={styles.sectionTitle}>
          Available Coupons
        </ThemeText>
        {vendorOffersLoading || customerOffersLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={getColor('primary')} />
          </View>
        ) : vendorOffersError || customerOffersError ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color={getColor('error')}
              style={styles.errorIcon}
            />
            <ThemeText variant="body" color={getColor('error')} style={styles.errorText}>
              Failed to load coupons
            </ThemeText>
            <ThemeText variant="caption" color={getColor('subText')} style={styles.errorSubtext}>
              {vendorOffersError || customerOffersError}
            </ThemeText>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <ThemeText variant="body" color={getColor('black')} style={styles.retryButtonText}>
                Try Again
              </ThemeText>
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
            <ThemeText variant="body" color={getColor('subText')} style={styles.noDataText}>
              No coupons available for this vendor
            </ThemeText>
          </View>
        ) : (
          <FlatList
            data={availableCoupons}
            renderItem={({ item }: { item: Coupon }) => {
              // Sync with smartBizOffer: if smartBizOffer is null, no coupon is applied
              const isApplied = cart?.smartBizOffer
                ? cart.smartBizOffer.offerId === item.id ||
                  cart.smartBizOffer.offerCode === item.code ||
                  appliedCoupon?.code === item.code ||
                  appliedCoupon?.offerId === item.id
                : false;

              return <CouponCard coupon={item} onApply={handleApplyCoupon} isApplied={isApplied} />;
            }}
            keyExtractor={(item: Coupon) => item.id}
            contentContainerStyle={styles.couponList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Error Modal for Apply Coupon */}
      <Modal
        visible={Boolean(applyCouponError)}
        transparent
        animationType="fade"
        onRequestClose={handleCloseErrorModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModal}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color={getColor('error')}
              style={styles.errorModalIcon}
            />
            <ThemeText variant="subtitle" color={getColor('error')} style={styles.errorModalTitle}>
              Unable to Apply Coupon
            </ThemeText>
            <ThemeText variant="body" color={getColor('subText')} style={styles.errorModalMessage}>
              {applyCouponError || 'Something went wrong. Please try again.'}
            </ThemeText>
            <TouchableOpacity style={styles.errorModalButton} onPress={handleCloseErrorModal}>
              <ThemeText
                variant="body"
                color={getColor('black')}
                style={styles.errorModalButtonText}
              >
                OK
              </ThemeText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CouponsScreen;
