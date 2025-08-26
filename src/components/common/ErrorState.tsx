import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/ThemeContext';
import { ThemeText } from './theme/ThemeText';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Please try again later.',
  onRetry,
  retryText = 'Retry',
}) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    icon: {
      marginBottom: 16,
    },
    title: {
      color: getColor('text'),
      textAlign: 'center',
      marginBottom: 8,
    },
    message: {
      color: getColor('subText'),
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    retryButtonText: {
      color: getColor('white'),
    },
  });

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={64}
        color={getColor('error')}
        style={styles.icon}
      />
      <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
        {title}
      </ThemeText>
      <ThemeText variant="body" color={getColor('subText')} style={styles.message}>
        {message}
      </ThemeText>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <ThemeText variant="body" color={getColor('white')} style={styles.retryButtonText}>
            {retryText}
          </ThemeText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorState;
