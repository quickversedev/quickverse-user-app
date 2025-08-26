import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../theme/ThemeText';

interface FeaturedProductsErrorProps {
  error: string;
  onRetry: () => void;
  loading?: boolean;
}

const FeaturedProductsError: React.FC<FeaturedProductsErrorProps> = ({ error, onRetry }) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      alignItems: 'center',
    },
    icon: {
      marginBottom: 12,
    },
    title: {
      color: getColor('text'),
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      color: getColor('subText'),
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    retryButtonText: {
      color: getColor('white'),
    },
  });

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={32}
        color={getColor('error')}
        style={styles.icon}
      />
      <ThemeText variant="subtitle" color={getColor('text')} style={styles.title}>
        Failed to load featured products
      </ThemeText>
      <ThemeText variant="body" color={getColor('subText')} style={styles.message}>
        {error}
      </ThemeText>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <ThemeText variant="body" color={getColor('white')} style={styles.retryButtonText}>
          Try Again
        </ThemeText>
      </TouchableOpacity>
    </View>
  );
};

export default FeaturedProductsError;
