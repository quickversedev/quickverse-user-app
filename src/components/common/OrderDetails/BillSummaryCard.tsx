import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../theme/ThemeText';

interface BillSummaryCardProps {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  onViewDetails?: () => void;
}

const BillSummaryCard: React.FC<BillSummaryCardProps> = ({
  subtotal,
  deliveryFee,
  discount,
  total,
  onViewDetails,
}) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      color: getColor('text'),
    },
    viewDetailsButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewDetailsText: {
      color: getColor('primary'),
      marginRight: 4,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      color: getColor('subText'),
    },
    value: {
      color: getColor('text'),
    },
    discountValue: {
      color: getColor('success'),
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
    },
    totalLabel: {
      color: getColor('text'),
    },
    totalValue: {
      color: getColor('text'),
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
          Bill Summary
        </ThemeText>
        {onViewDetails && (
          <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
            <ThemeText variant="body" color={getColor('primary')} style={styles.viewDetailsText}>
              View Details
            </ThemeText>
            <MaterialCommunityIcons name="chevron-right" size={16} color={getColor('primary')} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.summaryRow}>
        <ThemeText variant="body" color={getColor('subText')} style={styles.label}>
          Subtotal
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={styles.value}>
          ₹{subtotal}
        </ThemeText>
      </View>

      <View style={styles.summaryRow}>
        <ThemeText variant="body" color={getColor('subText')} style={styles.label}>
          Delivery Fee
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={styles.value}>
          ₹{deliveryFee}
        </ThemeText>
      </View>

      {discount > 0 && (
        <View style={styles.summaryRow}>
          <ThemeText variant="body" color={getColor('subText')} style={styles.label}>
            Discount
          </ThemeText>
          <ThemeText variant="body" color={getColor('success')} style={styles.discountValue}>
            -₹{discount}
          </ThemeText>
        </View>
      )}

      <View style={styles.totalRow}>
        <ThemeText variant="h2" color={getColor('text')} style={styles.totalLabel}>
          Total
        </ThemeText>
        <ThemeText variant="h2" color={getColor('text')} style={styles.totalValue}>
          ₹{total}
        </ThemeText>
      </View>
    </View>
  );
};

export default BillSummaryCard;
