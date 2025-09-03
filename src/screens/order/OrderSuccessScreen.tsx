import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect } from 'react';
import { Dimensions, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { useOrders } from '../../hooks/useOrders';
import { RootStackParamList } from '../../routes/AppStack';
import { useTheme } from '../../theme/ThemeContext';

type OrderSuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderSuccess'>;

interface OrderSuccessScreenProps {
  route: {
    params: {
      orderId: string;
      amount: number;
      date: string;
      shopId?: string;
    };
  };
}

const { width, height } = Dimensions.get('window');

const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ route }) => {
  const { getColor } = useTheme();
  const navigation = useNavigation<OrderSuccessScreenNavigationProp>();
  const { orderId, amount, date, shopId } = route.params;
  const { loadOrderById } = useOrders();

  // Fetch order details when component mounts
  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          await loadOrderById(orderId, shopId);
        } catch (err) {
          console.error('Failed to fetch order details:', err);
        }
      }
    };

    fetchOrder();
  }, [orderId, shopId, loadOrderById]);

  const handleBackToHome = useCallback(() => {
    navigation.navigate('MainApp');
  }, [navigation]);

  const handleTrackOrder = useCallback(() => {
    // Navigate to OrderDetails with orderId
    navigation.navigate('OrderDetails', { orderId });
  }, [navigation, orderId]);

  return (
    <View style={[styles.container, { backgroundColor: getColor('background') }]}>
      <StatusBar barStyle="light-content" backgroundColor={getColor('background')} />

      {/* Success Icon with Dots */}
      <View style={styles.iconContainer}>
        <View style={[styles.successCircle, { backgroundColor: '#4ADE80' }]}>
          <ThemeText style={styles.checkmark}>✓</ThemeText>
        </View>

        {/* Decorative dots */}
        {Array.from({ length: 20 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: '#4ADE80',
                opacity: 0.3 + Math.random() * 0.7,
                left: Math.random() * width * 0.8 + width * 0.1,
                top: Math.random() * height * 0.3 + height * 0.1,
                zIndex: 1, // Ensure dots are behind the success circle
              },
            ]}
          />
        ))}
      </View>

      {/* Order Details */}
      <View style={styles.detailsContainer}>
        <ThemeText style={[styles.amount, { color: getColor('white') }]}>₹{amount}</ThemeText>

        <ThemeText style={[styles.successMessage, { color: getColor('white') }]}>
          Order Placed Successfully!
        </ThemeText>

        <ThemeText style={[styles.orderInfo, { color: getColor('white') }]}>
          Order: #{orderId}
        </ThemeText>

        <ThemeText style={[styles.orderInfo, { color: getColor('white') }]}>{date}</ThemeText>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleBackToHome} style={styles.textButton}>
          <ThemeText style={[styles.textButtonText, { color: '#FEDB51' }]}>Back to Home</ThemeText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTrackOrder}
          style={[styles.primaryButton, { backgroundColor: '#FEDB51' }]}
        >
          <ThemeText style={[styles.primaryButtonText, { color: getColor('black') }]}>
            Track Order
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
    position: 'relative',
    marginBottom: 40,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  checkmark: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    zIndex: 1,
  },
  detailsContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  amount: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  orderInfo: {
    fontSize: 16,
    marginBottom: 4,
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

export default OrderSuccessScreen;
