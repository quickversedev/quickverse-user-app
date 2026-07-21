import Icon from '@react-native-vector-icons/material-design-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { OrderFinance } from '../../../types/order';
import { ThemeText } from '../../common/theme/ThemeText';

interface BillSummaryCardProps {
  finance: OrderFinance | null;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  deliveryFeeOriginal?: number;
  platformFee?: number;
  platformFeeOriginal?: number;
  packagingCharges?: number;
  packagingChargesOriginal?: number;
  taxes?: number;
  commission?: number;
  taxableAmount?: number;
  isGrocery?: boolean;
  commissionRate?: number;
  gstRate?: number;
  onPress: () => void;
}

const BillSummaryCard: React.FC<BillSummaryCardProps> = ({
  finance,
  totalAmount,
  subtotal,
  deliveryFee,
  deliveryFeeOriginal,
  platformFee = 0,
  platformFeeOriginal,
  packagingCharges = 0,
  packagingChargesOriginal,
  taxes = 0,
  commission = 0,
  taxableAmount = 0,
  isGrocery = false,
  commissionRate,
  gstRate,
  onPress,
}) => {
  const { getColor, theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: isExpanded ? 1 : 0,
        duration: 250,
        delay: isExpanded ? 100 : 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedRotation, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded, animatedHeight, animatedOpacity, animatedRotation]);

  const rotateInterpolate = animatedRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handlePress = useCallback(() => {
    setIsExpanded(prev => !prev);
    onPress?.();
  }, [onPress]);

  // ── Resolve values: prefer `finance` when present, else fall back to individual props ──
  const resolvedSubtotal = finance ? finance.itemTotalAmount : subtotal;
  const resolvedDeliveryFee = finance ? finance.deliveryFee : deliveryFee;
  const resolvedDeliveryFeeOriginal = finance ? finance.actualDeliveryFee : deliveryFeeOriginal;
  const resolvedPlatformFee = finance ? finance.platformFee : platformFee;
  const resolvedPackagingCharges = finance ? finance.packagingCharges : packagingCharges;
  const resolvedTaxes = finance ? finance.totalGst : taxes;
  const resolvedCommission = finance ? finance.commission : commission;
  const resolvedTaxableAmount = finance ? finance.taxableAmount : taxableAmount;
  const resolvedCommissionRate = finance ? finance.commissionRate : commissionRate;
  const resolvedGstRate = finance ? finance.serviceGstRate : gstRate;
  const resolvedTotalAmount = finance ? finance.payableAmount : totalAmount;

  const couponDiscount = finance?.couponDiscount ?? 0;
  const isFreeDelivery = finance?.isFreeDelivery ?? false;
  const codCharges = finance?.codCharges ?? 0;
  const codGst = finance?.codGst ?? 0;
  const commissionGst = finance?.commissionGst ?? 0;
  const deliveryGst = finance?.deliveryGst ?? 0;
  const packagingGst = finance?.packagingGst ?? 0;
  const platformGst = finance?.platformGst ?? 0;

  const commissionPct =
    resolvedCommissionRate != null
      ? `${(resolvedCommissionRate * (finance ? 1 : 100)).toFixed(0)}%`
      : isGrocery
        ? '2%'
        : '10%';
  const gstPct =
    resolvedGstRate != null ? `${(resolvedGstRate * (finance ? 1 : 100)).toFixed(0)}%` : '18%';

  const styles = StyleSheet.create({
    billSummaryBox: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: getColor('border'),
      marginBottom: 8,
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
      fontFamily: 'BricolageGrotesque-Medium',
      letterSpacing: 0.5,
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
      fontFamily: 'BricolageGrotesque-Regular',
    },
    billAmount: {
      color: getColor('text'),
      fontFamily: 'BricolageGrotesque-Medium',
    },
    discountAmount: {
      color: getColor('primary'),
      fontFamily: 'BricolageGrotesque-Medium',
    },
    dottedLine: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: getColor('border'),
      marginVertical: 10,
    },
    billSummaryHeader: {
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
    billSummaryContent: {
      flex: 1,
    },
    billSummaryTitle: {
      color: getColor('text'),
      fontFamily: 'BricolageGrotesque-Bold',
    },
    billSummaryAmount: {
      color: getColor('primary'),
      marginTop: 2,
      fontFamily: 'BricolageGrotesque-Bold',
    },
    billSummaryDetails: { marginTop: 12 },
    crossedText: {
      textDecorationLine: 'line-through',
      opacity: 0.5,
      marginRight: 6,
      fontSize: 13,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    feeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    taxBreakdownBox: {
      backgroundColor: getColor('card'),
      borderWidth: 1,
      borderColor: getColor('border'),
      borderRadius: theme.borderRadius.sm,
      padding: 12,
      marginBottom: 10,
      gap: 4,
    },
    taxBreakdownDivider: {
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
      marginVertical: 4,
    },
    taxBreakdownText: {
      fontFamily: 'BricolageGrotesque-Regular',
    },
    taxTotalLabel: {
      fontFamily: 'BricolageGrotesque-Medium',
    },
    taxTotalValue: {
      fontFamily: 'BricolageGrotesque-Bold',
    },
    toPayLabel: {
      fontFamily: 'BricolageGrotesque-Bold',
    },
    toPayAmount: {
      color: getColor('text'),
      fontSize: 16,
      fontFamily: 'BricolageGrotesque-Bold',
    },
  });

  return (
    <View style={styles.billSummaryBox}>
      <TouchableOpacity style={styles.billSummaryHeader} onPress={handlePress} activeOpacity={0.7}>
        <View style={[styles.iconBadge, { backgroundColor: `${getColor('primary')}12` }]}>
          <Icon name="file-document-outline" size={22} color={getColor('primary')} />
        </View>
        <View style={styles.billSummaryContent}>
          <ThemeText variant="body" style={styles.billSummaryTitle}>
            Total Bill
          </ThemeText>
          <ThemeText variant="body" style={styles.billSummaryAmount}>
            ₹{resolvedTotalAmount.toFixed(2)}
          </ThemeText>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Icon name="chevron-down" size={24} color={getColor('text')} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.billSummaryDetails,
          {
            maxHeight: animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 700] }),
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
          <View style={styles.billRow}>
            <ThemeText variant="body" style={styles.billLabel}>
              Sub Total
            </ThemeText>
            <ThemeText variant="body" style={styles.billAmount}>
              ₹{resolvedSubtotal.toFixed(2)}
            </ThemeText>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <ThemeText variant="body" style={styles.billLabel}>
                Coupon Discount{finance?.couponCode ? ` (${finance.couponCode})` : ''}
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
              {isFreeDelivery && finance?.deliveryCouponCode
                ? ` (${finance.deliveryCouponCode})`
                : ''}
            </ThemeText>
            <View style={styles.feeRow}>
              {isFreeDelivery ? (
                <>
                  <ThemeText style={[styles.crossedText, { color: getColor('text') }]}>
                    ₹{resolvedDeliveryFeeOriginal?.toFixed(2)}
                  </ThemeText>
                  <ThemeText style={[styles.discountAmount, { color: getColor('primary') }]}>
                    FREE
                  </ThemeText>
                </>
              ) : (
                <>
                  {resolvedDeliveryFeeOriginal != null &&
                    resolvedDeliveryFeeOriginal > resolvedDeliveryFee && (
                      <ThemeText style={[styles.crossedText, { color: getColor('text') }]}>
                        ₹{resolvedDeliveryFeeOriginal.toFixed(2)}
                      </ThemeText>
                    )}
                  <ThemeText variant="body" style={styles.billAmount}>
                    ₹{resolvedDeliveryFee.toFixed(2)}
                  </ThemeText>
                </>
              )}
            </View>
          </View>

          <View style={styles.billRow}>
            <ThemeText variant="body" style={styles.billLabel}>
              Platform Fee
            </ThemeText>
            <View style={styles.feeRow}>
              {platformFeeOriginal != null && platformFeeOriginal > resolvedPlatformFee && (
                <ThemeText style={[styles.crossedText, { color: getColor('text') }]}>
                  ₹{platformFeeOriginal.toFixed(2)}
                </ThemeText>
              )}
              <ThemeText variant="body" style={styles.billAmount}>
                ₹{resolvedPlatformFee.toFixed(2)}
              </ThemeText>
            </View>
          </View>

          {resolvedPackagingCharges > 0 && (
            <View style={styles.billRow}>
              <ThemeText variant="body" style={styles.billLabel}>
                Packaging Charges
              </ThemeText>
              <View style={styles.feeRow}>
                {packagingChargesOriginal != null &&
                  packagingChargesOriginal > resolvedPackagingCharges && (
                    <ThemeText style={[styles.crossedText, { color: getColor('text') }]}>
                      ₹{packagingChargesOriginal.toFixed(2)}
                    </ThemeText>
                  )}
                <ThemeText variant="body" style={styles.billAmount}>
                  ₹{resolvedPackagingCharges.toFixed(2)}
                </ThemeText>
              </View>
            </View>
          )}

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

          {resolvedTaxes > 0 && (
            <View>
              <Pressable style={styles.billRow} onPress={() => setShowTaxBreakdown(prev => !prev)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ThemeText variant="body" style={styles.billLabel}>
                    Taxes (GST & Services)
                  </ThemeText>
                  <Icon
                    name={showTaxBreakdown ? 'chevron-up' : 'information-outline'}
                    size={14}
                    color={getColor('subText')}
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <ThemeText variant="body" style={styles.billAmount}>
                  ₹{resolvedTaxes.toFixed(2)}
                </ThemeText>
              </Pressable>

              {showTaxBreakdown && (
                <View style={styles.taxBreakdownBox}>
                  <ThemeText
                    variant="caption"
                    color={getColor('subText')}
                    style={styles.taxBreakdownText}
                  >
                    Commission ({commissionPct}): ₹{resolvedCommission.toFixed(2)}
                  </ThemeText>
                  {commissionGst > 0 && (
                    <ThemeText
                      variant="caption"
                      color={getColor('subText')}
                      style={styles.taxBreakdownText}
                    >
                      Commission GST: ₹{commissionGst.toFixed(2)}
                    </ThemeText>
                  )}
                  {platformGst > 0 && (
                    <ThemeText
                      variant="caption"
                      color={getColor('subText')}
                      style={styles.taxBreakdownText}
                    >
                      Platform GST: ₹{platformGst.toFixed(2)}
                    </ThemeText>
                  )}
                  {deliveryGst > 0 && (
                    <ThemeText
                      variant="caption"
                      color={getColor('subText')}
                      style={styles.taxBreakdownText}
                    >
                      Delivery GST: ₹{deliveryGst.toFixed(2)}
                    </ThemeText>
                  )}
                  {packagingGst > 0 && (
                    <ThemeText
                      variant="caption"
                      color={getColor('subText')}
                      style={styles.taxBreakdownText}
                    >
                      Packaging GST: ₹{packagingGst.toFixed(2)}
                    </ThemeText>
                  )}
                  {codGst > 0 && (
                    <ThemeText
                      variant="caption"
                      color={getColor('subText')}
                      style={styles.taxBreakdownText}
                    >
                      COD GST: ₹{codGst.toFixed(2)}
                    </ThemeText>
                  )}
                  <View style={styles.taxBreakdownDivider} />
                  <ThemeText
                    variant="caption"
                    color={getColor('text')}
                    style={styles.taxTotalLabel}
                  >
                    Taxable Pool Base: ₹{resolvedTaxableAmount.toFixed(2)}
                  </ThemeText>
                  <ThemeText
                    variant="caption"
                    color={getColor('primary')}
                    style={styles.taxTotalValue}
                  >
                    GST Total ({gstPct}): ₹{resolvedTaxes.toFixed(2)}
                  </ThemeText>
                </View>
              )}
            </View>
          )}

          <View style={styles.dottedLine} />

          <View style={styles.billRowLast}>
            <ThemeText variant="body" style={[styles.billLabel, styles.toPayLabel]}>
              Total Pay
            </ThemeText>
            <ThemeText variant="body" style={styles.toPayAmount}>
              ₹{resolvedTotalAmount.toFixed(2)}
            </ThemeText>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default BillSummaryCard;
