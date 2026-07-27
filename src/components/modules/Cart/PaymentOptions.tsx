// components/common/PaymentOptions.tsx
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

export type PaymentOptionKey = 'COD' | 'PREPAID';

interface PaymentOptionsProps {
  selectedOption?: PaymentOptionKey;
  /** Called immediately when the user taps an option */
  onSelect: (selectedOption: PaymentOptionKey) => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({ selectedOption, onSelect }) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    paymentOptionsBox: {
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
        android: { elevation: 4 },
      }),
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    sectionHeader: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      fontFamily: theme.typography.fontFamily,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    optionSpacing: {
      marginBottom: 10,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    texts: { flex: 1 },
    optionTitle: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      fontFamily: theme.typography.fontFamily,
    },
    optionSubtitle: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('small'),
      fontFamily: theme.typography.fontFamily,
    },
  });

  const renderOption = (
    key: PaymentOptionKey,
    title: string,
    subtitle: string,
    isLast: boolean
  ) => {
    const isSelected = selectedOption === key;
    return (
      <TouchableOpacity
        onPress={() => onSelect(key)}
        activeOpacity={0.7}
        style={[
          styles.option,
          !isLast && styles.optionSpacing,
          { borderColor: getColor(isSelected ? 'primary' : 'border') },
        ]}
      >
        <View
          style={[styles.radioOuter, { borderColor: getColor(isSelected ? 'primary' : 'border') }]}
        >
          <View
            style={[
              styles.radioInner,
              { backgroundColor: getColor(isSelected ? 'primary' : 'background') },
            ]}
          />
        </View>
        <View style={styles.texts}>
          <ThemeText style={styles.optionTitle}>{title}</ThemeText>
          <ThemeText style={styles.optionSubtitle}>{subtitle}</ThemeText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.paymentOptionsBox}>
      <View style={styles.sectionHeaderRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${getColor('primary')}15` }]}>
          <MaterialCommunityIcons name="wallet-outline" size={18} color={getColor('primary')} />
        </View>
        <ThemeText style={styles.sectionHeader}>Payment Options</ThemeText>
      </View>

      {renderOption('PREPAID', 'Prepaid', 'Pay securely using UPI', false)}
      {renderOption('COD', 'Cash on Delivery', 'Pay using UPI only, on Delivery', true)}
    </View>
  );
};

export default PaymentOptions;
