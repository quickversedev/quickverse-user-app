import { CommonActions, useNavigation } from '@react-navigation/native';
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

  // ... existing code ...

  const handleTrackOrder = useCallback(() => {
    // Replace the current screen with MainApp, then navigate to OrderDetails
    // This ensures that when back is pressed from OrderDetails, it goes to MainApp

    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'MainApp' }, { name: 'OrderDetails', params: { orderId, shopId } }],
      })
    );
  }, [navigation, orderId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleTrackOrder();
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleTrackOrder]);

  // ... existing code ...

  return (
    <View style={[styles.container, { backgroundColor: '#F9FAFB' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Success Icon with Dots */}
      <View style={styles.iconContainer}>
        {/* Decorative dots - repositioned to be relative to the icon */}
        {Array.from({ length: 30 }).map((_, index) => {
          const size = Math.random() * 6 + 2;
          const left = (Math.random() - 0.5) * 220;
          const top = (Math.random() - 0.5) * 220;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: '#4ADE80',
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  opacity: 0.2 + Math.random() * 0.4,
                  left: left + 40, // 40 is half of 80 (icon width)
                  top: top + 40,
                  zIndex: 1,
                },
              ]}
            />
          );
        })}
        <View style={[styles.successCircle, { backgroundColor: '#22C55E' }]}>
          <ThemeText style={styles.checkmark}>✓</ThemeText>
        </View>
      </View>

      {/* Order Details */}
      <View style={styles.detailsContainer}>
        <ThemeText style={[styles.amount, { color: '#111827' }]}>₹{amount}</ThemeText>

        <ThemeText style={[styles.successMessage, { color: '#111827' }]}>
          Order Placed Successfully!
        </ThemeText>

        <View style={styles.infoWrapper}>
          <ThemeText style={[styles.orderInfoLabel, { color: '#6B7280' }]}>Order ID:</ThemeText>
          <ThemeText style={[styles.orderInfoValue, { color: '#111827' }]}>#{orderId}</ThemeText>
        </View>

        <View style={styles.infoWrapper}>
          <ThemeText style={[styles.orderInfoLabel, { color: '#6B7280' }]}>Date:</ThemeText>
          <ThemeText style={[styles.orderInfoValue, { color: '#111827' }]}>{date}</ThemeText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleTrackOrder}
          style={[styles.primaryButton, {
            backgroundColor: '#FEDB51',
            borderWidth: 1,
            borderColor: '#FEDB51',
            shadowColor: '#253EA7',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.48,
            shadowRadius: 2,
            elevation: 3
          }]}
        >
          <ThemeText style={[styles.primaryButtonText, { color: '#111827' }]}>
            Track Order
          </ThemeText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBackToHome} style={styles.secondaryButton}>
          <ThemeText style={[styles.secondaryButtonText, { color: '#6B7280' }]}>Back to Home</ThemeText>
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
  orderInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'serif',
  },
  orderInfoLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  infoWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
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

export default OrderSuccessScreen;
