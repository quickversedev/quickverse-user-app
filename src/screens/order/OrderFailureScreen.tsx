import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { RootStackParamList } from '../../routes/AppStack';
import { useTheme } from '../../theme/ThemeContext';

type OrderFailureScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderFailure'>;

interface OrderFailureScreenProps {
  route: {
    params: {
      errorMessage?: string;
    };
  };
}

const OrderFailureScreen: React.FC<OrderFailureScreenProps> = ({ route }) => {
  const { getColor } = useTheme();
  const navigation = useNavigation<OrderFailureScreenNavigationProp>();
  const { errorMessage } = route.params;
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('MainApp');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);
  const handleBackToHome = () => {
    navigation.navigate('MainApp');
  };

  const handleTryAgain = () => {
    // Navigate back to the previous screen (likely the payment screen)
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F9FAFB' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Failure Icon */}
      <View style={styles.iconContainer}>
        <View style={[styles.failureCircle, { backgroundColor: '#EF4444' }]}>
          <ThemeText style={styles.xMark}>✕</ThemeText>
        </View>
      </View>

      {/* Error Message */}
      <View style={styles.messageContainer}>
        <ThemeText style={[styles.errorMessage, { color: '#111827' }]}>
          Order Couldn't{'\n'}be Placed!
        </ThemeText>

        {errorMessage && (
          <ThemeText style={[styles.errorDetails, { color: '#6B7280' }]}>
            {errorMessage}
          </ThemeText>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleTryAgain}
          style={[styles.primaryButton, {
            backgroundColor: '#FEDB51',
            shadowColor: '#253EA7',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.4,
            shadowRadius: 2,
            elevation: 3
          }]}
        >
          <ThemeText style={[styles.primaryButtonText, { color: '#111827' }]}>
            Try Again
          </ThemeText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBackToHome} style={styles.secondaryButton}>
          <ThemeText style={[styles.secondaryButtonText, { color: '#6B7280' }]}>
            Back to Home
          </ThemeText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  failureCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xMark: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  errorMessage: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  errorDetails: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderFailureScreen;
