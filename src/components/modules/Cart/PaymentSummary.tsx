import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Cart } from '../../../store/cart/cartStore';
import usePricingStore from '../../../store/pricingStore';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface Coupon {
  id: string;
  code: string;
  mov: number;
  discountValue: number | null;
  type: string; // 'FREE_DELIVERY' | 'FIXED' | 'PERCENTAGE'
  uptoValue: number | null;
}

interface PaymentSummaryProps {
  expanded: boolean;
  onToggle: () => void;
  cart?: Cart;
  codCharges?: number;
  selectedPaymentOption?: string | undefined;
  vendorCategory?: string;
  selectedCoupon?: Coupon;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  expanded,
  onToggle,
  cart,
  codCharges = 0,
  selectedPaymentOption,
  vendorCategory,
  selectedCoupon,
}) => {
  const { getColor, theme, getButtonColor } = useTheme();
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);
  const isGrocery = vendorCategory?.toLowerCase().includes('grocery');
  const serviceType = isGrocery ? 'GROCERY' : 'FOOD';

  const pricingConfig = usePricingStore(state => state.configs[serviceType]);
  const pricing = useMemo(() => {
    return usePricingStore.getState().getPricingValues(serviceType);
  }, [pricingConfig, serviceType]);

  // Animation values
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 250,
        delay: expanded ? 100 : 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedRotation, {
        toValue: expanded ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, animatedHeight, animatedOpacity, animatedRotation]);

  const rotateInterpolate = animatedRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const {
    subtotal,
    deliveryFee,
    deliveryFeeOriginal,
    platformFee,
    platformFeeOriginal,
    packagingCharges,
    packagingChargesOriginal,
    taxes,
    commission,
    taxableAmount,
    totalDiscountOnItems,
    calculatedCouponDiscount,
    isFreeDeliveryApplied,
    finalTotal,
  } = useMemo(() => {
    if (!cart) {
      return {
        subtotal: 0,
        deliveryFee: 0,
        deliveryFeeOriginal: 0,
        platformFee: 0,
        platformFeeOriginal: 0,
        packagingCharges: 0,
        packagingChargesOriginal: 0,
        taxes: 0,
        commission: 0,
        taxableAmount: 0,
        totalDiscountOnItems: 0,
        calculatedCouponDiscount: 0,
        isFreeDeliveryApplied: false,
        finalTotal: 0,
      };
    }

    const apiSubtotal = cart.totalCartAmount ?? 0;
    const localSubtotal = Object.values(cart.products).reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );

    const calculatedSubtotal = apiSubtotal > 0 ? apiSubtotal : localSubtotal;
    const calculatedTotalDiscountOnItems = cart.totalDiscountOnItems ?? 0;

    // Evaluate active structural coupon impacts rules
    let couponDiscountAmount = 0;
    let freeDeliveryActive = false;

    if (selectedCoupon && calculatedSubtotal >= selectedCoupon.mov) {
      if (selectedCoupon.type === 'FREE_DELIVERY') {
        freeDeliveryActive = true;
      } else if (selectedCoupon.type === 'FIXED' && selectedCoupon.discountValue != null) {
        couponDiscountAmount = selectedCoupon.discountValue;
      } else if (selectedCoupon.type === 'PERCENTAGE' && selectedCoupon.discountValue != null) {
        const percentageBenefit = (selectedCoupon.discountValue / 100) * calculatedSubtotal;
        if (selectedCoupon.uptoValue != null) {
          couponDiscountAmount = Math.min(percentageBenefit, selectedCoupon.uptoValue);
        } else {
          couponDiscountAmount = percentageBenefit;
        }
      }
    }

    // Adjust current structural fee based on Free Delivery coupon flag status
    const effectiveDeliveryFee = freeDeliveryActive ? 0 : pricing.deliveryFee;

    // Compute precise legal dynamic GST mapping values
    const commission = pricing.commissionRate * calculatedSubtotal;
    const taxableAmount = commission + effectiveDeliveryFee + pricing.platformFee;
    const taxes = Math.round(pricing.gstRate * taxableAmount);

    // Sum final mathematical aggregation structure
    const calculatedTotal =
      calculatedSubtotal +
      effectiveDeliveryFee +
      pricing.platformFee +
      pricing.packagingCharges +
      taxes +
      codCharges -
      calculatedTotalDiscountOnItems -
      couponDiscountAmount;

    return {
      subtotal: calculatedSubtotal,
      deliveryFee: effectiveDeliveryFee,
      deliveryFeeOriginal: pricing.deliveryFeeOriginal,
      platformFee: pricing.platformFee,
      platformFeeOriginal: pricing.platformFeeOriginal,
      packagingCharges: pricing.packagingCharges,
      packagingChargesOriginal: pricing.packagingChargesOriginal,
      taxes,
      commission,
      taxableAmount,
      totalDiscountOnItems: calculatedTotalDiscountOnItems,
      calculatedCouponDiscount: couponDiscountAmount,
      isFreeDeliveryApplied: freeDeliveryActive,
      finalTotal: Math.max(0, calculatedTotal),
    };
  }, [cart, codCharges, pricing, selectedCoupon]);

  const styles = StyleSheet.create({
    paymentSummaryBox: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 0,
      paddingHorizontal: 16,
      paddingVertical: 12,
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
    billDetailsTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    titleLine: {
      flex: 1,
      height: 1,
      backgroundColor: getColor('border'),
    },
    titleText: {
      color: getColor('text'),
      marginHorizontal: 12,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    billBreakdown: {
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.sm,
      padding: 16,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    billRowLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 0,
    },
    billLabel: {
      color: getColor('text'),
    },
    billAmount: {
      color: getColor('text'),
      fontWeight: '500',
    },
    discountAmount: {
      color: getColor('primary'),
      fontWeight: '600',
    },
    dottedLine: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: getColor('border'),
      marginVertical: 10,
    },
    paymentSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 40,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    paymentSummaryContent: {
      flex: 1,
    },
    paymentSummaryTitle: {
      color: getColor('text'),
      fontWeight: '700',
    },
    paymentSummaryAmount: {
      color: getColor('primary'),
      marginTop: 2,
      fontWeight: '700',
    },
    paymentSummaryDetails: { marginTop: 12 },
    crossedText: {
      textDecorationLine: 'line-through',
      opacity: 0.5,
      marginRight: 6,
      fontSize: 13,
    },
    feeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.paymentSummaryBox}>
      <TouchableOpacity style={styles.paymentSummaryHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.iconBadge, { backgroundColor: `${getColor('primary')}12` }]}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={22}
            color={getColor('primary')}
          />
        </View>
        <View style={styles.paymentSummaryContent}>
          <ThemeText variant="body" style={styles.paymentSummaryTitle}>
            Total Bill
          </ThemeText>
          <ThemeText variant="body" style={styles.paymentSummaryAmount}>
            ₹{finalTotal.toFixed(2)}
          </ThemeText>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <MaterialCommunityIcons name="chevron-down" size={24} color={getColor('text')} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.paymentSummaryDetails,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 600],
            }),
            opacity: animatedOpacity,
            overflow: 'hidden',
          },
        ]}
      >
        <View style={styles.billDetailsTitle}>
          <View style={styles.titleLine} />
          <ThemeText variant="caption" style={styles.titleText}>
            Bill Details
          </ThemeText>
          <View style={styles.titleLine} />
        </View>

        <View style={styles.billBreakdown}>
          {/* Subtotal */}
          <View style={styles.billRow}>
            <ThemeText variant="body" style={styles.billLabel}>
              Sub Total
            </ThemeText>
            <ThemeText variant="body" style={styles.billAmount}>
              ₹{subtotal.toFixed(2)}
            </ThemeText>
          </View>

          {/* Item Discounts */}
          {totalDiscountOnItems > 0 && (
            <View style={styles.billRow}>
              <ThemeText variant="body" style={styles.billLabel}>
                Item Discount
              </ThemeText>
              <ThemeText variant="body" style={styles.discountAmount}>
                -₹{totalDiscountOnItems.toFixed(2)}
              </ThemeText>
            </View>
          )}

          {/* Active Structural Coupon Discounts */}
          {calculatedCouponDiscount > 0 && (
            <View style={styles.billRow}>
              <ThemeText variant="body" style={styles.billLabel}>
                Coupon Discount ({selectedCoupon?.code})
              </ThemeText>
              <ThemeText variant="body" style={styles.discountAmount}>
                -₹{calculatedCouponDiscount.toFixed(2)}
              </ThemeText>
            </View>
          )}

          <View style={styles.dottedLine} />

          {/* Delivery Fee */}
          <View style={styles.billRow}>
            <ThemeText variant="body" style={styles.billLabel}>
              Delivery Fee
            </ThemeText>
            <View style={styles.feeRow}>
              {isFreeDeliveryApplied ? (
                <>
                  <ThemeText
                    variant="body"
                    style={[styles.crossedText, { color: getColor('text') }]}
                  >
                    ₹{deliveryFeeOriginal.toFixed(2)}
                  </ThemeText>
                  <ThemeText
                    variant="body"
                    style={[styles.discountAmount, { color: getColor('primary') }]}
                  >
                    FREE
                  </ThemeText>
                </>
              ) : (
                <>
                  {deliveryFeeOriginal > deliveryFee && (
                    <ThemeText
                      variant="body"
                      style={[styles.crossedText, { color: getColor('text') }]}
                    >
                      ₹{deliveryFeeOriginal.toFixed(2)}
                    </ThemeText>
                  )}
                  <ThemeText variant="body" style={styles.billAmount}>
                    ₹{deliveryFee.toFixed(2)}
                  </ThemeText>
                </>
              )}
            </View>
          </View>

          {/* Platform Fee */}
          <View style={styles.billRow}>
            <ThemeText variant="body" style={styles.billLabel}>
              Platform Fee
            </ThemeText>
            <View style={styles.feeRow}>
              {platformFeeOriginal > platformFee && (
                <ThemeText variant="body" style={[styles.crossedText, { color: getColor('text') }]}>
                  ₹{platformFeeOriginal.toFixed(2)}
                </ThemeText>
              )}
              <ThemeText variant="body" style={styles.billAmount}>
                ₹{platformFee.toFixed(2)}
              </ThemeText>
            </View>
          </View>

          {/* Packaging Charges */}
          <View style={styles.billRow}>
            <ThemeText variant="body" style={styles.billLabel}>
              Packaging Charges
            </ThemeText>
            <View style={styles.feeRow}>
              {packagingChargesOriginal > packagingCharges && (
                <ThemeText variant="body" style={[styles.crossedText, { color: getColor('text') }]}>
                  ₹{packagingChargesOriginal.toFixed(2)}
                </ThemeText>
              )}
              <ThemeText variant="body" style={styles.billAmount}>
                ₹{packagingCharges.toFixed(2)}
              </ThemeText>
            </View>
          </View>

          {/* COD Charges */}
          {codCharges > 0 && (
            <View style={styles.billRow}>
              <ThemeText variant="body" style={styles.billLabel}>
                Cash On Delivery Charges
              </ThemeText>
              <ThemeText variant="body" style={styles.billAmount}>
                ₹{codCharges.toFixed(2)}
              </ThemeText>
            </View>
          )}

          {/* Taxes Component */}
          {taxes > 0 && (
            <View>
              <Pressable style={styles.billRow} onPress={() => setShowTaxBreakdown(prev => !prev)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ThemeText variant="body" style={styles.billLabel}>
                    Taxes (GST & Services)
                  </ThemeText>
                  <MaterialCommunityIcons
                    name={showTaxBreakdown ? 'chevron-up' : 'information-outline'}
                    size={14}
                    color={getColor('subText')}
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <ThemeText variant="body" style={styles.billAmount}>
                  ₹{taxes.toFixed(2)}
                </ThemeText>
              </Pressable>

              {showTaxBreakdown && (
                <View
                  style={{
                    backgroundColor: getColor('card'),
                    borderWidth: 1,
                    borderColor: getColor('border'),
                    borderRadius: theme.borderRadius.sm,
                    padding: 12,
                    marginBottom: 10,
                    gap: 4,
                  }}
                >
                  <ThemeText variant="caption" color={getColor('subText')}>
                    Commission ({(pricing.commissionRate * 100).toFixed(0)}%): ₹
                    {commission.toFixed(2)}
                  </ThemeText>
                  <ThemeText variant="caption" color={getColor('subText')}>
                    Delivery Component: ₹{deliveryFee.toFixed(2)}
                  </ThemeText>
                  <ThemeText variant="caption" color={getColor('subText')}>
                    Platform Component: ₹{platformFee.toFixed(2)}
                  </ThemeText>
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: getColor('border'),
                      marginVertical: 4,
                    }}
                  />
                  <ThemeText
                    variant="caption"
                    color={getColor('text')}
                    style={{ fontWeight: '600' }}
                  >
                    Taxable Pool Base: ₹{taxableAmount.toFixed(2)}
                  </ThemeText>
                  <ThemeText
                    variant="caption"
                    color={getColor('primary')}
                    style={{ fontWeight: '700' }}
                  >
                    GST Total ({(pricing.gstRate * 100).toFixed(0)}%): ₹{taxes.toFixed(2)}
                  </ThemeText>
                </View>
              )}
            </View>
          )}

          <View style={styles.dottedLine} />

          {/* Final Payable Amount Row */}
          <View style={styles.billRowLast}>
            <ThemeText variant="body" style={[styles.billLabel, { fontWeight: '700' }]}>
              To Pay
            </ThemeText>
            <ThemeText
              variant="body"
              style={[
                styles.billAmount,
                { color: getColor('text'), fontSize: 16, fontWeight: '700' },
              ]}
            >
              ₹{finalTotal.toFixed(2)}
            </ThemeText>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default PaymentSummary;
