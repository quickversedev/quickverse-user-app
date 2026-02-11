import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Cart } from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface PaymentSummaryProps {
  expanded: boolean;
  onToggle: () => void;
  cart?: Cart;
  codCharges?: number;
  selectedPaymentOption?: string | undefined;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  expanded,
  onToggle,
  cart,
  codCharges = 0,
  selectedPaymentOption,
}) => {
  const { getColor, theme, getButtonColor } = useTheme();

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

  const { subtotal, deliveryFee, platformFee, packagingCharges, taxes, total, totalDiscountOnItems, couponDiscount, finalTotal } =
    useMemo(() => {
      if (!cart) {
        return {
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          totalDiscountOnItems: 0,
          couponDiscount: 0,
          finalTotal: 0,
        };
      }

      const apiSubtotal = cart.totalCartAmount ?? 0;

      const localSubtotal = Object.values(cart.products).reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      );

      const calculatedSubtotal = apiSubtotal > 0 ? apiSubtotal : localSubtotal;
      const calculatedDeliveryFee = cart.deliveryFee ?? (calculatedSubtotal > 0 ? 28 : 0);
      const calculatedCouponDiscount = cart.smartBizOffer?.totalBenefit ?? 0;
      const calculatedTotalDiscountOnItems = cart.totalDiscountOnItems ?? 0;
      const apiTotal = cart.totalCartAmountWithDeliveryFeeAndBenefit ?? 0;

      // Use API total if available, otherwise calculate manually
      // const calculatedTotal =
      //   apiTotal > 0
      //     ? apiTotal
      //     : calculatedSubtotal -
      //       calculatedTotalDiscountOnItems -
      //       calculatedCouponDiscount +
      //       calculatedDeliveryFee;


      // New fee structure as per requirements
      const platformFee = 8;
      const packagingCharges = 7;
      const deliveryCharges = 25;
      const taxes = Math.round(calculatedSubtotal * 0.05);

      const calculatedTotal =
        calculatedSubtotal +
        deliveryCharges +
        platformFee +
        packagingCharges +
        taxes -
        calculatedTotalDiscountOnItems -
        calculatedCouponDiscount;


      // Calculate final total including COD charges if COD is selected
      const calculatedFinalTotal = calculatedTotal;

      return {
        subtotal: calculatedSubtotal,
        deliveryFee: deliveryCharges, // Override efficiently to 25
        platformFee,
        packagingCharges,
        taxes,
        total: calculatedTotal,
        totalDiscountOnItems: calculatedTotalDiscountOnItems,
        couponDiscount: calculatedCouponDiscount,
        finalTotal: calculatedFinalTotal,
      };
    }, [cart, codCharges, selectedPaymentOption]);

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
      marginBottom: 8,
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
    },
    dottedLine: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: getColor('border'),
      marginVertical: 8,
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
      color: getButtonColor('default', 'background'),
      fontWeight: '600',
    },
    paymentSummaryAmount: {
      color: getButtonColor('default', 'background'),
      marginTop: 2,
      opacity: 0.8,
    },
    expandIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    paymentSummaryDetails: { marginTop: 12 },
    crossedText: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
      marginRight: 6,
      fontSize: 12,
    },
    feeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.paymentSummaryBox}>
      <TouchableOpacity
        style={styles.paymentSummaryHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: `${getButtonColor('default', 'background')}15` },
          ]}
        >
          <MaterialCommunityIcons
            name="file-document-outline"
            size={22}
            color={getButtonColor('default', 'background')}
          />
        </View>
        <View style={styles.paymentSummaryContent}>
          <ThemeText
            variant="body"
            color={getButtonColor('default', 'background')}
            style={styles.paymentSummaryTitle}
          >
            Total Bill (Inc. Taxes and Charges)
          </ThemeText>
          <ThemeText
            variant="caption"
            color={getButtonColor('default', 'background')}
            style={styles.paymentSummaryAmount}
          >
            ₹{finalTotal}
          </ThemeText>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <MaterialCommunityIcons
            name="chevron-down"
            size={24}
            color={getButtonColor('default', 'background')}
          />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.paymentSummaryDetails,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            opacity: animatedOpacity,
            overflow: 'hidden',
          },
        ]}
      >
        <View style={styles.billDetailsTitle}>
          <View style={styles.titleLine} />
          <ThemeText variant="subtitle" color={getColor('text')} style={styles.titleText}>
            Bill Details
          </ThemeText>
          <View style={styles.titleLine} />
        </View>
        <View style={styles.billBreakdown}>
          <View style={styles.billRow}>
            <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
              Sub Total
            </ThemeText>
            <ThemeText variant="body" color={getColor('text')} style={styles.billAmount}>
              ₹{subtotal}
            </ThemeText>
          </View>
          {totalDiscountOnItems > 0 && (
            <>
              <View style={styles.dottedLine} />
              <View style={styles.billRow}>
                <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
                  Item Discount
                </ThemeText>
                <ThemeText variant="body" color={getColor('primary')} style={styles.billAmount}>
                  -₹{totalDiscountOnItems}
                </ThemeText>
              </View>
            </>
          )}
          {couponDiscount > 0 && (
            <>
              <View style={styles.dottedLine} />
              <View style={styles.billRow}>
                <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
                  Coupon Discount
                </ThemeText>
                <ThemeText variant="body" color={getColor('primary')} style={styles.billAmount}>
                  -₹{couponDiscount}
                </ThemeText>
              </View>
            </>
          )}
          <View style={styles.dottedLine} />

          {/* Delivery Fee */}
          <View style={styles.billRow}>
            <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
              Delivery Fee
            </ThemeText>
            <View style={styles.feeRow}>
              <ThemeText variant="body" color={getColor('text')} style={styles.crossedText}>
                ₹35
              </ThemeText>
              <ThemeText variant="body" color={getColor('text')} style={styles.billAmount}>
                ₹{deliveryFee}
              </ThemeText>
            </View>
          </View>

          {/* Platform Fee */}
          <View style={styles.billRow}>
            <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
              Platform Fee
            </ThemeText>
            <View style={styles.feeRow}>
              <ThemeText variant="body" color={getColor('text')} style={styles.crossedText}>
                ₹12
              </ThemeText>
              <ThemeText variant="body" color={getColor('text')} style={styles.billAmount}>
                ₹{platformFee}
              </ThemeText>
            </View>
          </View>



          {/* Packaging Charges */}
          <View style={styles.billRow}>
            <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
              Packaging Charges
            </ThemeText>
            <View style={styles.feeRow}>
              <ThemeText variant="body" color={getColor('text')} style={styles.crossedText}>
                ₹11
              </ThemeText>
              <ThemeText variant="body" color={getColor('text')} style={styles.billAmount}>
                ₹{packagingCharges}
              </ThemeText>
            </View>
          </View>

          {/* Taxes (GST & Services) */}
          <View style={styles.billRow}>
            <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
              Taxes (GST & Services)
            </ThemeText>
            <ThemeText variant="body" color={getColor('text')} style={styles.billAmount}>
              ₹{taxes}
            </ThemeText>
          </View>

          <View style={styles.dottedLine} />
          <View style={styles.billRowLast}>
            <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
              Total Pay
            </ThemeText>
            <ThemeText variant="body" color={getColor('text')} style={styles.billAmount}>
              ₹{finalTotal}
            </ThemeText>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default PaymentSummary;
