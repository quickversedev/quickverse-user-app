import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';

interface BillSummaryCardProps {
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  platformFee?: number;
  packagingCharges?: number;
  taxes?: number;
  additionalPaymentCharges?: number;
  paymentMethod?: string;
  onPress: () => void;
}

const BillSummaryCard: React.FC<BillSummaryCardProps> = ({
  totalAmount,
  subtotal,
  deliveryFee,
  platformFee = 0,
  packagingCharges = 0,
  taxes = 0,
  additionalPaymentCharges = 0,
  paymentMethod,
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
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: getColor('text') }]}>
              ₹{subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, { color: getColor('text') }]}>
              ₹{deliveryFee.toFixed(2)}
            </Text>
          </View>
          {platformFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>
                Platform Fee
              </Text>
              <Text style={[styles.summaryValue, { color: getColor('text') }]}>
                ₹{platformFee.toFixed(2)}
              </Text>
            </View>
          )}
          {packagingCharges > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>
                Packaging Charges
              </Text>
              <Text style={[styles.summaryValue, { color: getColor('text') }]}>
                ₹{packagingCharges.toFixed(2)}
              </Text>
            </View>
          )}
          {taxes > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>Taxes (5%)</Text>
              <Text style={[styles.summaryValue, { color: getColor('text') }]}>
                ₹{taxes.toFixed(2)}
              </Text>
            </View>
          )}
          {additionalPaymentCharges > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: getColor('subText') }]}>
                {paymentMethod === 'cash' ? 'COD Charges' : 'Additional Charges'}
              </Text>
              <Text style={[styles.summaryValue, { color: getColor('text') }]}>
                ₹{additionalPaymentCharges.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={[styles.summaryTotalLabel, { color: getColor('text') }]}>Total</Text>
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
