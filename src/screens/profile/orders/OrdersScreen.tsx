import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import OrderList from '../../../components/common/order/OrderList';
import useOrderStore from '../../../store/cart/orderStore';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';
import { Order } from '../../../types/order';

const OrdersScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { getColor, getTypography } = useTheme();
  const { setSelectedOrder } = useOrderStore();
  // Initial load handled inside OrderList via its own hook

  const handleOrderPress = useCallback(
    (order: Order) => {
      setSelectedOrder(order);
      navigation.navigate('OrderDetails', { orderId: order.orderId });
    },
    [navigation]
  );

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
      <View style={[styles.container, { backgroundColor: getColor('background') }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: getColor('card') }]}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={24} color={getColor('text')} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                color: getColor('text'),
                fontSize: getTypography('subtitle'),
                fontFamily: 'BricolageGrotesque-Regular',
              },
            ]}
          >
            Orders
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Order List */}
        <OrderList
          onOrderPress={handleOrderPress}
          showStatusFilter={true}
          navigation={navigation}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 0 : 25, // Android status bar height
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
});

export default OrdersScreen;
