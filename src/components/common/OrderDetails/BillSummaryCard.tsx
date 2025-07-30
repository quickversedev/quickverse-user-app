import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface BillSummaryCardProps {
  totalAmount: number;
  onPress: () => void;
}

const BillSummaryCard: React.FC<BillSummaryCardProps> = ({ totalAmount, onPress }) => {
  const { getColor } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.billCard, { backgroundColor: getColor('card') }]}
      onPress={onPress}
    >
      <View style={styles.billContent}>
        <View style={styles.billInfo}>
          <Icon name="file-document-outline" size={20} color={getColor('text')} />
          <View style={styles.billText}>
            <Text style={[styles.billLabel, { color: getColor('subText') }]}>
              Total Bill (Inc. Taxes and Charges)
            </Text>
            <Text style={[styles.billAmount, { color: getColor('text') }]}>
              INR. {totalAmount.toFixed(0)}
            </Text>
          </View>
        </View>
        <Text style={[styles.billAction, { color: '#FFA500' }]}>View summary {'>'}</Text>
      </View>
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
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BillSummaryCard;
