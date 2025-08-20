import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
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

  const handleBackToHome = () => {
    navigation.navigate('MainApp');
  };

  const handleTryAgain = () => {
    // Navigate back to the previous screen (likely the payment screen)
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor('background') }]}>
      <StatusBar barStyle="light-content" backgroundColor={getColor('background')} />

      {/* Failure Icon */}
      <View style={styles.iconContainer}>
        <View style={[styles.failureCircle, { backgroundColor: '#F87171' }]}>
          <ThemeText style={styles.xMark}>✕</ThemeText>
        </View>
      </View>

      {/* Error Message */}
      <View style={styles.messageContainer}>
        <ThemeText style={[styles.errorMessage, { color: getColor('white') }]}>
          Order Couldn't{'\n'}be Placed!
        </ThemeText>

        {errorMessage && (
          <ThemeText style={[styles.errorDetails, { color: getColor('subText') }]}>
            {errorMessage}
          </ThemeText>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleBackToHome} style={styles.textButton}>
          <ThemeText style={[styles.textButtonText, { color: getColor('white') }]}>
            Back to Home
          </ThemeText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTryAgain}
          style={[styles.primaryButton, { backgroundColor: '#FEDB51' }]}
        >
          <ThemeText style={[styles.primaryButtonText, { color: getColor('black') }]}>
            Try Again
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
    alignItems: 'center',
  },
  textButton: {
    marginBottom: 20,
  },
  textButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OrderFailureScreen;
