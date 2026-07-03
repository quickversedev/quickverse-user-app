import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface PaymentOptionsProps {
  onPress: () => void;
  selectedOption?: string | undefined;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  onPress,
  selectedOption,
  loading = false,
  error = null,
  onRetry,
}) => {
  const { getColor, getTypography, theme, getButtonColor } = useTheme();

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
        android: {
          elevation: 4,
        },
      }),
    },
    paymentOptionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    paymentOptionsContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    paymentOptionsText: {
      flex: 1,
    },
    paymentOptionsTitle: {
      color: getColor('text'),
      fontWeight: '600',
      fontSize: getTypography('body'),
      fontFamily: theme.typography.fontFamily,
    },
    paymentOptionsSubtitle: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      marginTop: 2,
      fontFamily: theme.typography.fontFamily,
    },
    arrowBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginTop: 8,
      alignSelf: 'flex-end',
    },
    retryButtonText: {
      color: getColor('white'),
      fontSize: getTypography('caption'),
      fontWeight: '600',
    },
  });

  const getPaymentOptionDisplay = () => {
    if (error) {
      return { title: 'Payment Methods Unavailable', subtitle: error };
    }

    if (loading) {
      return { title: 'Loading payment methods...', subtitle: 'Please wait' };
    }

    if (!selectedOption) {
      return { title: 'Select Payment Method', subtitle: 'Choose your preferred payment option' };
    }

    switch (selectedOption) {
      case 'phonepe':
        return { title: 'PhonePe', subtitle: 'UPI Payment' };
      case 'gpay':
        return { title: 'Google Pay', subtitle: 'UPI Payment' };
      case 'cod':
        return { title: 'Cash on Delivery', subtitle: 'Pay using UPI only, on Delivery' };
       case 'prepaid':
        return { title: 'Prepaid', subtitle: 'UPI Payment' };
      default:
        return { title: 'Select Payment Method', subtitle: 'Choose your preferred payment option' };
    }
  };

  const { title, subtitle } = getPaymentOptionDisplay();

  return (
    <View style={styles.paymentOptionsBox}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={loading || Boolean(error) ? 1 : 0.7}
        disabled={loading || Boolean(error)}
      >
        <View style={styles.paymentOptionsHeader}>
          <View style={styles.paymentOptionsContent}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: error
                    ? `${getColor('error')}15`
                    : `${getButtonColor('default', 'background')}15`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={error ? 'alert-circle-outline' : 'credit-card-outline'}
                size={22}
                color={error ? getColor('error') : getButtonColor('default', 'background')}
              />
            </View>
            <View style={styles.paymentOptionsText}>
              <Text style={[styles.paymentOptionsTitle, error && { color: getColor('error') }]}>
                {title}
              </Text>
              <Text style={[styles.paymentOptionsSubtitle, error && { color: getColor('error') }]}>
                {subtitle}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={getColor('primary')} />
        </View>
      </TouchableOpacity>

      {error && onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.retryButtonText}>{loading ? 'Retrying...' : 'Retry'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PaymentOptions;
