import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Cart } from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';

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
  const { getColor, getTypography, theme, getButtonColor } = useTheme();

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
      fontWeight: 'bold',
      fontSize: getTypography('subtitle'),
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
      fontSize: getTypography('body'),
      fontWeight: '500',
    },
    billAmount: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
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
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
      marginLeft: 8,
    },
    paymentSummaryAmount: {
      color: getButtonColor('default', 'background'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
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
        <Text style={styles.paymentSummaryTitle}>Total Bill (Inc. Taxes and Charges)</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.paymentSummaryAmount}>₹{finalTotal}</Text>
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
            <Text style={styles.titleText}>Bill Details</Text>
            <View style={styles.titleLine} />
          </View>
          <View style={styles.billBreakdown}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Sub Total</Text>
              <Text style={styles.billAmount}>₹{subtotal}</Text>
            </View>
            {totalDiscountOnItems > 0 && (
              <>
                <View style={styles.dottedLine} />
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Item Discount</Text>
                  <Text style={[styles.billAmount, { color: getColor('primary') }]}>
                    -₹{totalDiscountOnItems}
                  </Text>
                </View>
              </>
            )}
            {couponDiscount > 0 && (
              <>
                <View style={styles.dottedLine} />
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Coupon Discount</Text>
                  <Text style={[styles.billAmount, { color: getColor('primary') }]}>
                    -₹{couponDiscount}
                  </Text>
                </View>
              </>
            )}
            <View style={styles.dottedLine} />
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billAmount}>₹{deliveryFee}</Text>
            </View>
            {selectedPaymentOption === 'cod' && codCharges > 0 && (
              <>
                <View style={styles.dottedLine} />
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>COD Charges</Text>
                  <Text style={styles.billAmount}>₹{codCharges}</Text>
                </View>
              </>
            )}
            <View style={styles.dottedLine} />
            <View style={styles.billRowLast}>
              <Text style={styles.billLabel}>Total Pay</Text>
              <Text style={styles.billAmount}>₹{finalTotal}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default PaymentSummary;
