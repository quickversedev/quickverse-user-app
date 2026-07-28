import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface Coupon {
  id: string;
  code: string;
  mov: number;
  discountValue: number | null;
  type: string;
  uptoValue: number | null;
}

interface CheckoutSummary {
  itemTotalAmount?: number;
  couponId?: string | null;
  couponCode?: string | null;
  couponDiscount?: number;
  isFreeDelivery?: boolean;
  amountAfterCoupon?: number;
  packagingCharges?: number;
  actualDeliveryFee?: number;
  deliveryFee?: number;
  platformFee?: number;
  serviceGstRate?: number;
  commissionRate?: number;
  commission?: number;
  commissionGst?: number;
  deliveryGst?: number;
  packagingGst?: number;
  platformGst?: number;
  totalGst?: number;
  taxableAmount?: number;
  payableAmount?: number;
  razorpayCharges?: number;
  couponError?: string | null;
  couponErrorMessage?: string | null;
  couponApplied?: boolean;
  deliveryCouponId?: string | null;
  deliveryCouponCode?: string | null;
  isDeliveryCouponApplied?: boolean;
  deliveryCouponError?: string | null;
  deliveryCouponErrorMessage?: string | null;
  codCharges?: number;
  codGst?: number;
}

interface PaymentSummaryProps {
  expanded: boolean;
  onToggle: () => void;
  summary?: CheckoutSummary | null;
  summaryLoading?: boolean;
  selectedPaymentOption?: string | undefined;
  selectedCoupon?: Coupon;
  selectedDeliveryCoupon?: Coupon;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  expanded,
  onToggle,
  summary,
  summaryLoading = false,
  selectedPaymentOption,
  selectedCoupon,
}) => {
  const { getColor, theme } = useTheme();
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

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

  const itemTotalAmount = summary?.itemTotalAmount ?? 0;
  const couponDiscount = summary?.couponDiscount ?? 0;
  const isFreeDelivery = summary?.isFreeDelivery ?? false;
  const packagingCharges = summary?.packagingCharges ?? 0;
  const actualDeliveryFee = summary?.actualDeliveryFee ?? 0;
  const deliveryFee = summary?.deliveryFee ?? 0;
  const platformFee = summary?.platformFee ?? 0;
  const serviceGstRate = summary?.serviceGstRate ?? 0;
  const commissionRate = summary?.commissionRate ?? 0;
  const commission = summary?.commission ?? 0;
  const commissionGst = summary?.commissionGst ?? 0;
  const deliveryGst = summary?.deliveryGst ?? 0;
  const packagingGst = summary?.packagingGst ?? 0;
  const platformGst = summary?.platformGst ?? 0;
  const totalGst = summary?.totalGst ?? 0;
  const taxableAmount = summary?.taxableAmount ?? 0;
  const payableAmount = summary?.payableAmount ?? 0;
  const razorpayCharges = summary?.razorpayCharges ?? 0;
  const codCharges = summary?.codCharges ?? 0;
  const codGst = summary?.codGst ?? 0;
  const isCod = selectedPaymentOption === 'COD';
  // const extraPaymentCharges = isCod ? codCharges : razorpayCharges;
  const finalTotal = payableAmount;

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
          {summaryLoading && !summary ? (
            <ActivityIndicator
              size="small"
              color={getColor('primary')}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            />
          ) : (
            <ThemeText variant="body" style={styles.paymentSummaryAmount}>
              ₹{finalTotal.toFixed(2)}
            </ThemeText>
          )}
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
          {summaryLoading && !summary ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={getColor('primary')} />
            </View>
          ) : (
            <>
              <View style={styles.billRow}>
                <ThemeText variant="body" style={styles.billLabel}>
                  Sub Total
                </ThemeText>
                <ThemeText variant="body" style={styles.billAmount}>
                  ₹{itemTotalAmount.toFixed(2)}
                </ThemeText>
              </View>

              {couponDiscount > 0 && (
                <View style={styles.billRow}>
                  <ThemeText variant="body" style={styles.billLabel}>
                    Coupon Discount
                  </ThemeText>
                  <ThemeText variant="body" style={styles.discountAmount}>
                    -₹{couponDiscount.toFixed(2)}
                  </ThemeText>
                </View>
              )}

              <View style={styles.dottedLine} />

              <View style={styles.billRow}>
                <ThemeText variant="body" style={styles.billLabel}>
                  Delivery Fee
                </ThemeText>
                <View style={styles.feeRow}>
                  {isFreeDelivery ? (
                    <>
                      <ThemeText
                        variant="body"
                        style={[styles.crossedText, { color: getColor('text') }]}
                      >
                        ₹{actualDeliveryFee.toFixed(2)}
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
                      {actualDeliveryFee > deliveryFee && (
                        <ThemeText
                          variant="body"
                          style={[styles.crossedText, { color: getColor('text') }]}
                        >
                          ₹{actualDeliveryFee.toFixed(2)}
                        </ThemeText>
                      )}
                      <ThemeText variant="body" style={styles.billAmount}>
                        ₹{deliveryFee.toFixed(2)}
                      </ThemeText>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.billRow}>
                <ThemeText variant="body" style={styles.billLabel}>
                  Platform Fee
                </ThemeText>
                <ThemeText variant="body" style={styles.billAmount}>
                  ₹{platformFee.toFixed(2)}
                </ThemeText>
              </View>

              {packagingCharges > 0 && (
                <View style={styles.billRow}>
                  <ThemeText variant="body" style={styles.billLabel}>
                    Packaging Charges
                  </ThemeText>
                  <ThemeText variant="body" style={styles.billAmount}>
                    ₹{packagingCharges.toFixed(2)}
                  </ThemeText>
                </View>
              )}

              {isCod && codCharges > 0 && (
                <View style={styles.billRow}>
                  <ThemeText variant="body" style={styles.billLabel}>
                    Cash On Delivery Charges
                  </ThemeText>
                  <ThemeText variant="body" style={styles.billAmount}>
                    ₹{codCharges.toFixed(2)}
                  </ThemeText>
                </View>
              )}

              {totalGst > 0 && (
                <View>
                  <Pressable
                    style={styles.billRow}
                    onPress={() => setShowTaxBreakdown(prev => !prev)}
                  >
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
                      ₹{totalGst.toFixed(2)}
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
                        Commission ({commissionRate.toFixed(0)}%): ₹{commission.toFixed(2)}
                      </ThemeText>
                      {commissionGst > 0 && (
                        <ThemeText variant="caption" color={getColor('subText')}>
                          Commission GST: ₹{commissionGst.toFixed(2)}
                        </ThemeText>
                      )}
                      {deliveryGst > 0 && (
                        <ThemeText variant="caption" color={getColor('subText')}>
                          Delivery GST: ₹{deliveryGst.toFixed(2)}
                        </ThemeText>
                      )}
                      {platformGst > 0 && (
                        <ThemeText variant="caption" color={getColor('subText')}>
                          Platform GST: ₹{platformGst.toFixed(2)}
                        </ThemeText>
                      )}
                      {packagingGst > 0 && (
                        <ThemeText variant="caption" color={getColor('subText')}>
                          Packaging GST: ₹{packagingGst.toFixed(2)}
                        </ThemeText>
                      )}
                      {codGst > 0 && (
                        <ThemeText variant="caption" color={getColor('subText')}>
                          COD GST: ₹{codGst.toFixed(2)}
                        </ThemeText>
                      )}
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
                        GST Total ({serviceGstRate.toFixed(0)}%): ₹{totalGst.toFixed(2)}
                      </ThemeText>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.dottedLine} />

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
            </>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

export default PaymentSummary;
