import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';

interface BillSummaryCardProps {
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  deliveryFeeOriginal?: number;
  platformFee?: number;
  platformFeeOriginal?: number;
  packagingCharges?: number;
  packagingChargesOriginal?: number;
  taxes?: number;
  onPress: () => void;
}

const BillSummaryCard: React.FC<BillSummaryCardProps> = ({
  totalAmount,
  subtotal,
  deliveryFee,
  deliveryFeeOriginal,
  platformFee = 0,
  platformFeeOriginal,
  packagingCharges = 0,
  packagingChargesOriginal,
  taxes = 0,
  onPress,
}) => {
  const { getColor } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePress = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  return (
    <TouchableOpacity
      style={[styles.billCard, { backgroundColor: getColor('card') }]}
      onPress={handlePress}
    >
      <View style={styles.billContent}>
        <View style={styles.billInfo}>
          <Icon name="file-document-outline" size={20} color={getColor('text')} />
          <View style={styles.billText}>
            <Text style={[styles.billLabel, { color: getColor('subText') }]}>
              Total Bill (Inc. Taxes and Charges)
            </Text>
            <Text style={[styles.billAmount, { color: getColor('text') }]}>
              ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.billAction}>
          <Text style={[styles.billActionText, { color: '#FFA500' }]}>
            {isExpanded ? 'Hide details' : 'View details'}
          </Text>
          <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#FFA500" />
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={[styles.sectionTitle, { color: getColor('text') }]}>BILL DETAILS</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>Sub Total</Text>
            <Text style={[styles.summaryValue, { color: getColor('text') }]}>
              ₹{subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>Delivery Fee</Text>
            <View style={styles.feeRow}>
              {deliveryFeeOriginal != null && deliveryFeeOriginal !== deliveryFee && (
                <Text style={[styles.crossedText, { color: getColor('subText') }]}>
                  ₹{deliveryFeeOriginal}
                </Text>
              )}
              <Text style={[styles.summaryValue, { color: getColor('text') }]}>
                ₹{deliveryFee.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>Platform Fee</Text>
            <View style={styles.feeRow}>
              {platformFeeOriginal != null && platformFeeOriginal !== platformFee && (
                <Text style={[styles.crossedText, { color: getColor('subText') }]}>
                  ₹{platformFeeOriginal}
                </Text>
              )}
              <Text style={[styles.summaryValue, { color: getColor('text') }]}>
                ₹{platformFee.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>
              Packaging Charges
            </Text>
            <View style={styles.feeRow}>
              {packagingChargesOriginal != null && packagingChargesOriginal !== packagingCharges && (
                <Text style={[styles.crossedText, { color: getColor('subText') }]}>
                  ₹{packagingChargesOriginal}
                </Text>
              )}
              <Text style={[styles.summaryValue, { color: getColor('text') }]}>
                ₹{packagingCharges.toFixed(2)}
              </Text>
            </View>
          </View>
          {taxes > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>
                Taxes (GST & Services)
              </Text>
              <Text style={[styles.summaryValue, { color: getColor('text') }]}>
                ₹{taxes.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={[styles.summaryTotalLabel, { color: getColor('text') }]}>Total Pay</Text>
            <Text style={[styles.summaryTotalValue, { color: getColor('text') }]}>
              ₹{totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  billCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  billContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  billText: {
    marginLeft: 12,
  },
  billLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  billAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  billActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crossedText: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  summaryTotalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryTotalValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default BillSummaryCard;
