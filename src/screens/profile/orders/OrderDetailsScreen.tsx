import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SectionDivider } from '../../../components/common';
import {
  BillSummaryCard,
  HelpCard,
  OrderHeader,
  OrderInfoCard,
  OrderItemsSection,
  OrderProgress,
} from '../../../components/common/OrderDetails';
import { useOrders } from '../../../hooks/useOrders';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';

const OrderDetailsScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute();
  const { getColor } = useTheme();
  const { selectedOrder, loadOrderById } = useOrders();

  const { orderId } = route.params as { orderId: string };

  React.useEffect(() => {
    if (orderId) {
      loadOrderById(orderId);
    }
  }, [orderId, loadOrderById]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleViewSummary = () => {
    // TODO: Navigate to bill summary screen
    // console.log('View summary pressed');
  };

  const handleGetHelp = () => {
    // TODO: Navigate to help screen
    // console.log('Get help pressed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#2196F3';
      case 'preparing':
        return '#9C27B0';
      case 'ready':
        return '#00BCD4';
      default:
        return '#666666';
    }
  };

  if (!selectedOrder) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
        <View style={[styles.container, { backgroundColor: getColor('background') }]}>
          <OrderHeader orderId="Loading..." onBackPress={handleBackPress} />
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: getColor('text') }]}>
              Loading order details...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
      <View style={[styles.container, { backgroundColor: getColor('background') }]}>
        <OrderHeader orderId={selectedOrder.orderId} onBackPress={handleBackPress} />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <OrderInfoCard order={selectedOrder} getStatusColor={getStatusColor} />

          {selectedOrder.status !== 'cancelled' && <OrderProgress status={selectedOrder.status} />}

          <SectionDivider text="Order Details" />

          <OrderItemsSection order={selectedOrder} />

          <BillSummaryCard totalAmount={selectedOrder.totalAmount} onPress={handleViewSummary} />

          <HelpCard onPress={handleGetHelp} order={selectedOrder} />
        </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 0 : 25, // Android status bar height for proper top margin
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // iOS home indicator + extra padding
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'BricolageGrotesque-Regular',
  },
});

export default OrderDetailsScreen;
