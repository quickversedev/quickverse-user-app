import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../../constants/catalogue';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

export type PaymentOptionKey = 'COD' | 'PREPAID';

interface PaymentOptionsProps {
  selectedOption?: PaymentOptionKey;
  /** Called as soon as an option is tapped; the screen re-prices the bill for it. */
  onSelect: (selectedOption: PaymentOptionKey) => void;
  /** False when this cart cannot be paid on delivery; only Prepaid is then offered. */
  codAvailable?: boolean;
  /** COD's extra charge, when known, shown beside the choice as well as in the bill. */
  codCharges?: number;
}

/**
 * Payment method, chosen on the cart itself so the bill below already includes what the method
 * costs — a COD charge shows in the bill before the order is placed, not after.
 *
 * Styled as the rest of the QV Cart design: an uppercase section heading, then one raised card
 * per option with a green radio.
 */
const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  selectedOption,
  onSelect,
  codAvailable = true,
  codCharges,
}) => {
  const { getColor, theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: { marginTop: 14, marginHorizontal: CATALOGUE_GUTTER },
        heading: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: getColor('subText'),
          marginBottom: 8,
        },
        list: { gap: 8 },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: getColor('white'),
          borderRadius: 16,
          padding: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 3,
          elevation: 2,
        },
        optionSelected: { borderWidth: 1.5, borderColor: CATALOGUE_ACCENT },
        radioOuter: {
          width: 20,
          height: 20,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: getColor('border'),
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioOuterSelected: { borderColor: CATALOGUE_ACCENT },
        radioInner: { width: 10, height: 10, borderRadius: 999, backgroundColor: CATALOGUE_ACCENT },
        optionText: { flex: 1, minWidth: 0 },
        optionTitle: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: getColor('text') },
        optionSubtitle: {
          fontSize: 11,
          lineHeight: 15,
          color: getColor('subText'),
          marginTop: 1,
        },
      }),
    [getColor, theme]
  );

  const options: { key: PaymentOptionKey; title: string; subtitle: string }[] = [
    { key: 'PREPAID', title: 'Prepaid', subtitle: 'Pay securely online' },
    ...(codAvailable
      ? [
          {
            key: 'COD' as PaymentOptionKey,
            title: 'Cash on Delivery',
            subtitle:
              codCharges && codCharges > 0
                ? `Pay when your order arrives · ₹${codCharges} extra`
                : 'Pay when your order arrives',
          },
        ]
      : []),
  ];

  return (
    <View style={styles.section}>
      <ThemeText style={styles.heading}>Payment Method</ThemeText>
      <View style={styles.list}>
        {options.map(option => {
          const isSelected = selectedOption === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onSelect(option.key)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.title}
            >
              <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                {isSelected ? <View style={styles.radioInner} /> : null}
              </View>
              <View style={styles.optionText}>
                <ThemeText style={styles.optionTitle}>{option.title}</ThemeText>
                <ThemeText style={styles.optionSubtitle}>{option.subtitle}</ThemeText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default PaymentOptions;
