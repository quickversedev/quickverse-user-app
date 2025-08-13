import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';

type PaymentOptionKey = 'phonepe' | 'gpay' | 'cod';

type PaymentOption = {
  key: PaymentOptionKey;
  title: string;
  subtitle?: string;
};

const PaymentScreen: React.FC = () => {
  const { getColor, getButtonColor } = useTheme();
  const [selected, setSelected] = useState<PaymentOptionKey>('cod');
  const [upiId, setUpiId] = useState<string>('');

  const options: PaymentOption[] = useMemo(
    () => [
      { key: 'phonepe', title: 'PhonePe' },
      { key: 'gpay', title: 'Google Pay' },
      { key: 'cod', title: 'Cash on Delivery', subtitle: 'Pay with cash when your order arrives' },
    ],
    []
  );

  const handleConfirm = () => {
    // In a real flow, trigger the appropriate payment handler based on `selected`
    // For now, simply navigate back or show a toast in the parent flow
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getColor('background') }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: getColor('text') }]}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Payment breakdown */}
        <Text style={[styles.sectionTitle, { color: getColor('subText') }]}>Payment breakdown</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: getColor('card'), borderColor: getColor('border') },
          ]}
        >
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: getColor('subText') }]}>Items total</Text>
            <Text style={[styles.rowValue, { color: getColor('text') }]}>₹ 540.00</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: getColor('subText') }]}>Delivery fee</Text>
            <Text style={[styles.rowValue, { color: getColor('text') }]}>₹ 30.00</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: getColor('subText') }]}>Discount</Text>
            <Text style={[styles.rowValuePositive, { color: getColor('text') }]}>- ₹ 40.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: getColor('text') }]}>Total</Text>
            <Text style={[styles.totalValue, { color: getColor('text') }]}>₹ 530.00</Text>
          </View>
        </View>

        {/* Section 2: UPI applications */}
        <Text style={[styles.sectionTitle, { color: getColor('subText') }]}>UPI applications</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: getColor('card'), borderColor: getColor('border') },
          ]}
        >
          {options
            .filter(o => o.key === 'phonepe' || o.key === 'gpay')
            .map((item, idx) => {
              const isActive = selected === item.key;
              return (
                <View key={item.key}>
                  {idx > 0 ? (
                    <View style={[styles.itemDivider, { backgroundColor: getColor('border') }]} />
                  ) : null}
                  <TouchableOpacity
                    onPress={() => setSelected(item.key)}
                    activeOpacity={0.85}
                    style={styles.innerOption}
                  >
                    <View style={styles.optionContent}>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: getColor(isActive ? 'primary' : 'border') },
                        ]}
                      >
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: getColor(isActive ? 'primary' : 'background') },
                          ]}
                        />
                      </View>
                      <View
                        style={[
                          styles.iconBadge,
                          { backgroundColor: item.key === 'gpay' ? '#4285F4' : '#5F259F' },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.key === 'gpay' ? 'google' : 'alpha-p'}
                          size={16}
                          color={getColor('white')}
                        />
                      </View>
                      <View style={styles.texts}>
                        <Text style={[styles.title, { color: getColor('text') }]}>
                          {item.title}
                        </Text>
                        {item.subtitle ? (
                          <Text style={[styles.subtitle, { color: getColor('subText') }]}>
                            {item.subtitle}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}

          {/* UPI ID sub-section */}
          <View style={[styles.itemDivider, { backgroundColor: getColor('border') }]} />
          <View style={styles.upiIdSection}>
            <Text style={[styles.upiIdLabel, { color: getColor('subText') }]}>Enter UPI ID</Text>
            <TextInput
              value={upiId}
              onChangeText={setUpiId}
              placeholder="username@bank"
              placeholderTextColor={getColor('placeholder')}
              style={[
                styles.upiInput,
                {
                  backgroundColor: getColor('background'),
                  borderColor: getColor('border'),
                  color: getColor('text'),
                },
              ]}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setSelected('phonepe')}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Section 3: Cash on Delivery */}
        <Text style={[styles.sectionTitle, { color: getColor('subText') }]}>Cash on Delivery</Text>
        {options
          .filter(o => o.key === 'cod')
          .map(item => {
            const isActive = selected === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSelected(item.key)}
                activeOpacity={0.85}
                style={[
                  styles.option,
                  {
                    backgroundColor: getColor('card'),
                    borderColor: getColor(isActive ? 'primary' : 'border'),
                  },
                ]}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.radioOuter,
                      { borderColor: getColor(isActive ? 'primary' : 'border') },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: getColor(isActive ? 'primary' : 'background') },
                      ]}
                    />
                  </View>
                  <View style={styles.texts}>
                    <Text style={[styles.title, { color: getColor('text') }]}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={[styles.subtitle, { color: getColor('subText') }]}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.9}
          style={[styles.cta, { backgroundColor: getButtonColor('default', 'background') }]}
        >
          <Text style={[styles.ctaText, { color: getButtonColor('default', 'text') }]}>
            Confirm and continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  innerOption: {
    paddingVertical: 10,
  },
  itemDivider: {
    height: 1,
    opacity: 0.5,
  },
  upiIdSection: {
    paddingTop: 10,
  },
  upiIdLabel: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
  },
  upiInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 6,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowValuePositive: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    padding: 16,
  },
  cta: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PaymentScreen;
