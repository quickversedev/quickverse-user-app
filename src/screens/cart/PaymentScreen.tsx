import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAvailablePaymentOptions } from '../../services/paymentService';
import { useTheme } from '../../theme/ThemeContext';

type PaymentOptionKey = 'phonepe' | 'gpay' | 'cod';

type PaymentOption = {
  key: PaymentOptionKey;
  title: string;
  subtitle?: string;
  available?: boolean;
};

interface PaymentScreenProps {
  onClose: () => void;
  onConfirm: (selectedOption: PaymentOptionKey, upiId?: string) => void;
  paymentMethods?: Array<{
    paymentMethodType: string;
    paymentConfiguration: {
      paymentMethodStatus: string;
      codCharges: number;
      minimumAllowedCartAmount: number;
      maximumAllowedCartAmount: number;
    };
  }>;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({
  onClose,
  onConfirm,
  paymentMethods = [],
  error = null,
  loading = false,
  onRetry,
}) => {
  const { getColor, getButtonColor } = useTheme();
  const [selected, setSelected] = useState<PaymentOptionKey>('cod');
  const [upiId, setUpiId] = useState<string>('');

  const options: PaymentOption[] = useMemo(() => {
    const availableOptions = getAvailablePaymentOptions(paymentMethods);
    return availableOptions.map(option => ({
      key: option.key as PaymentOptionKey,
      title: option.title,
      subtitle: option.subtitle,
      available: option.available,
    }));
  }, [paymentMethods]);

  const handleConfirm = () => {
    onConfirm(selected, upiId);
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor('background') }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <MaterialCommunityIcons name="close" size={24} color={getColor('text')} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: getColor('text') }]}>Payment Options</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={[styles.errorCard, { backgroundColor: getColor('error'), opacity: 0.1 }]}>
            <View style={styles.errorContent}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={24}
                color={getColor('error')}
              />
              <Text style={[styles.errorText, { color: getColor('error') }]}>{error}</Text>
            </View>
            {onRetry && (
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: getColor('primary') }]}
                onPress={onRetry}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={[styles.retryButtonText, { color: getColor('white') }]}>
                  {loading ? 'Retrying...' : 'Retry'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading && (
          <View style={[styles.loadingCard, { backgroundColor: getColor('card') }]}>
            <Text style={[styles.loadingText, { color: getColor('subText') }]}>
              Loading payment methods...
            </Text>
          </View>
        )}

        {/* Section 1: UPI applications */}
        <Text style={[styles.sectionTitle, { color: getColor('subText') }]}>
          UPI applications (Unavailable for now)
        </Text>
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
              const isDisabled = true; // Always disabled for now
              return (
                <View key={item.key}>
                  {idx > 0 ? (
                    <View style={[styles.itemDivider, { backgroundColor: getColor('border') }]} />
                  ) : null}
                  <TouchableOpacity
                    onPress={() => !isDisabled && setSelected(item.key)}
                    activeOpacity={isDisabled ? 1 : 0.85}
                    style={[styles.innerOption, isDisabled && { opacity: 0.5 }]}
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
                  opacity: 0.5, // Disabled appearance
                },
              ]}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              editable={false} // Make it non-editable
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Section 2: Cash on Delivery */}
        <Text style={[styles.sectionTitle, { color: getColor('subText') }]}>Cash on Delivery</Text>
        {options
          .filter(o => o.key === 'cod')
          .map(item => {
            const isActive = selected === item.key;
            const isDisabled = !item.available;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => !isDisabled && setSelected(item.key)}
                activeOpacity={isDisabled ? 1 : 0.85}
                style={[
                  styles.option,
                  {
                    backgroundColor: getColor('card'),
                    borderColor: getColor(isActive ? 'primary' : 'border'),
                    opacity: isDisabled ? 0.5 : 1,
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
  errorCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
