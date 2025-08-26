import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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

  const { subtotal, deliveryFee, total, totalDiscountOnItems, couponDiscount, finalTotal } =
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
      const calculatedTotal =
        apiTotal > 0
          ? apiTotal
          : calculatedSubtotal -
            calculatedTotalDiscountOnItems -
            calculatedCouponDiscount +
            calculatedDeliveryFee;

      // Calculate final total including COD charges if COD is selected
      const calculatedFinalTotal =
        selectedPaymentOption === 'cod' ? calculatedTotal + codCharges : calculatedTotal;

      return {
        subtotal: calculatedSubtotal,
        deliveryFee: calculatedDeliveryFee,
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
      margin: 16,
      padding: 16,
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
      marginBottom: 4,
    },
    paymentSummaryTitle: {
      color: getButtonColor('default', 'background'),
      marginLeft: 8,
    },
    paymentSummaryAmount: {
      color: getButtonColor('default', 'background'),
      marginHorizontal: 8,
    },
    paymentSummaryDetails: { marginTop: 8 },
  });

  return (
    <View style={styles.paymentSummaryBox}>
      <TouchableOpacity style={styles.paymentSummaryHeader} onPress={onToggle}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={20}
          color={getButtonColor('default', 'background')}
        />
        <ThemeText
          variant="caption"
          color={getButtonColor('default', 'background')}
          style={styles.paymentSummaryTitle}
        >
          Total Bill (Inc. Taxes and Charges)
        </ThemeText>
        <View style={{ flex: 1 }} />
        <ThemeText
          variant="body"
          color={getButtonColor('default', 'background')}
          style={styles.paymentSummaryAmount}
        >
          ₹{finalTotal}
        </ThemeText>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={getButtonColor('default', 'background')}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.paymentSummaryDetails}>
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
            <View style={styles.billRow}>
              <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
                Delivery Fee
              </ThemeText>
              <ThemeText variant="body" color={getColor('text')} style={styles.billAmount}>
                ₹{deliveryFee}
              </ThemeText>
            </View>
            {selectedPaymentOption === 'cod' && codCharges > 0 && (
              <>
                <View style={styles.dottedLine} />
                <View style={styles.billRow}>
                  <ThemeText variant="body" color={getColor('text')} style={styles.billLabel}>
                    COD Charges
                  </ThemeText>
                  <ThemeText variant="body" color={getColor('text')} style={styles.billAmount}>
                    ₹{codCharges}
                  </ThemeText>
                </View>
              </>
            )}
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
        </View>
      )}
    </View>
  );
};

export default PaymentSummary;
