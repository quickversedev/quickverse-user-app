import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { getAvailablePaymentOptions } from '../../services/paymentService';
import { useTheme } from '../../theme/ThemeContext';

type PaymentOptionKey = 'COD' | 'PREPAID';

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
  selectedOption?: PaymentOptionKey;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({
  onClose,
  onConfirm,
  paymentMethods = [],
  error = null,
  loading = false,
  onRetry,
  selectedOption,
}) => {
  const { getColor, getButtonColor } = useTheme();
  const [selected, setSelected] = useState<PaymentOptionKey>(selectedOption || 'PREPAID');
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
        <ThemeText variant="h2" color={getColor('text')} style={styles.headerTitle}>
          Payment Options
        </ThemeText>
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
              <ThemeText variant="body" color={getColor('error')} style={styles.errorText}>
                {error}
              </ThemeText>
            </View>
            {onRetry && (
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: getColor('primary') }]}
                onPress={onRetry}
                activeOpacity={0.8}
                disabled={loading}
              >
                <ThemeText
                  variant="caption"
                  color={getColor('white')}
                  style={styles.retryButtonText}
                >
                  {loading ? 'Retrying...' : 'Retry'}
                </ThemeText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {loading && (
          <View style={[styles.loadingCard, { backgroundColor: getColor('card') }]}>
            <ThemeText variant="body" color={getColor('subText')} style={styles.loadingText}>
              Loading payment methods...
            </ThemeText>
          </View>
        )}

        <ThemeText variant="caption" color={getColor('subText')} style={styles.sectionTitle}>
          Prepaid
        </ThemeText>
        <TouchableOpacity
          onPress={() => setSelected('PREPAID')}
          style={[
            styles.option,
            {
              backgroundColor: getColor('card'),
              borderColor: getColor(selected === 'PREPAID' ? 'primary' : 'border'),
            },
          ]}
        >
          <View style={styles.optionContent}>
            <View
              style={[
                styles.radioOuter,
                { borderColor: getColor(selected === 'PREPAID' ? 'primary' : 'border') },
              ]}
            >
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: getColor(selected === 'PREPAID' ? 'primary' : 'background') },
                ]}
              />
            </View>
            <View style={styles.texts}>
              <ThemeText variant="body" color={getColor('text')} style={styles.title}>
                Prepaid
              </ThemeText>
              <ThemeText variant="caption" color={getColor('subText')} style={styles.subtitle}>
                Pay securely using UPI
              </ThemeText>
            </View>
          </View>
        </TouchableOpacity>

        <ThemeText variant="caption" color={getColor('subText')} style={styles.sectionTitle}>
          Cash on Delivery
        </ThemeText>
        <TouchableOpacity
          onPress={() => setSelected('COD')}
          style={[
            styles.option,
            {
              backgroundColor: getColor('card'),
              borderColor: getColor(selected === 'COD' ? 'primary' : 'border'),
            },
          ]}
        >
          <View style={styles.optionContent}>
            <View
              style={[
                styles.radioOuter,
                { borderColor: getColor(selected === 'COD' ? 'primary' : 'border') },
              ]}
            >
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: getColor(selected === 'COD' ? 'primary' : 'background') },
                ]}
              />
            </View>
            <View style={styles.texts}>
              <ThemeText variant="body" color={getColor('text')} style={styles.title}>
                Cash on Delivery
              </ThemeText>
              <ThemeText variant="caption" color={getColor('subText')} style={styles.subtitle}>
                Pay with cash when your order arrives
              </ThemeText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Section 1: UPI applications - OLD FLOW */}
        {/* <ThemeText variant="caption" color={getColor('subText')} style={styles.sectionTitle}>
          UPI applications (Unavailable for now)
        </ThemeText> */}
        {/* <View
          style={[
            styles.card,
            { backgroundColor: getColor('card'), borderColor: getColor('border') },
          ]}
        >
          {options
            .filter(o => o.key === 'phonepe' || o.key === 'gpay')
            .map((item, idx) => {
              const isActive = selected === item.key;
              const isDisabled = true;
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
                        <ThemeText variant="body" color={getColor('text')} style={styles.title}>
                          {item.title}
                        </ThemeText>
                        {item.subtitle ? (
                          <ThemeText
                            variant="caption"
                            color={getColor('subText')}
                            style={styles.subtitle}
                          >
                            {item.subtitle}
                          </ThemeText>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}

          <View style={[styles.itemDivider, { backgroundColor: getColor('border') }]} />
          <View style={styles.upiIdSection}>
            <ThemeText variant="small" color={getColor('subText')} style={styles.upiIdLabel}>
              Enter UPI ID
            </ThemeText>
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
                  opacity: 0.5,
                },
              ]}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              editable={false}
              returnKeyType="done"
            />
          </View>
        </View> */}

        {/* Section 2: Cash on Delivery: OLD FLOW */}
        {/* <ThemeText variant="caption" color={getColor('subText')} style={styles.sectionTitle}>
          Cash on Delivery
        </ThemeText> */}
        {/* {options
          .filter(o => o.key === 'COD')
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
                    <ThemeText variant="body" color={getColor('text')} style={styles.title}>
                      {item.title}
                    </ThemeText>
                    {item.subtitle ? (
                      <ThemeText
                        variant="caption"
                        color={getColor('subText')}
                        style={styles.subtitle}
                      >
                        {item.subtitle}
                      </ThemeText>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })} */}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.9}
          style={[styles.cta, { backgroundColor: getButtonColor('default', 'background') }]}
        >
          <ThemeText
            variant="body"
            color={getButtonColor('default', 'text')}
            style={styles.ctaText}
          >
            Confirm and continue
          </ThemeText>
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
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    // No additional styles needed
  },
  retryButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  retryButtonText: {
    // No additional styles needed
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
    // No additional styles needed
  },
  subtitle: {
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
    // No additional styles needed
  },
});

export default PaymentScreen;
