import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

interface FeaturedProductsErrorProps {
  error: string;
  onRetry: () => void;
  loading?: boolean;
}

const FeaturedProductsError: React.FC<FeaturedProductsErrorProps> = ({
  error,
  onRetry,
  loading = false,
}) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 20,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorIcon: {
      marginBottom: 12,
    },
    errorText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      textAlign: 'center',
      marginBottom: 16,
      fontFamily: 'BricolageGrotesque-Regular',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('primary'),
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      opacity: loading ? 0.6 : 1,
    },
    retryButtonText: {
      color: getColor('white'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginRight: 6,
      fontFamily: 'BricolageGrotesque-Regular',
    },
  });

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={32}
        color={getColor('error')}
        style={styles.errorIcon}
      />
      <Text style={styles.errorText}>{error || 'Failed to load featured products'}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        disabled={loading}
        activeOpacity={0.8}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
        <MaterialCommunityIcons name="refresh" size={16} color={getColor('white')} />
      </TouchableOpacity>
    </View>
  );
};

export default FeaturedProductsError;
