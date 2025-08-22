import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SectionDivider } from '../../../components/common';
import {
  BillSummaryCard,
  HelpCard,
  OrderHeader,
  OrderInfoCard,
  OrderProgress,
} from '../../../components/common/OrderDetails';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useOrders } from '../../../hooks/useOrders';
import orderService from '../../../services/createOrderService';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';

const OrderDetailsScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute();
  const { getColor } = useTheme();
  const { selectedOrder, loadOrderById, refreshOrders } = useOrders();
  const { authData } = useAuth();
  const { orderId } = route.params as { orderId: string };

  React.useEffect(() => {
    if (orderId) {
      loadOrderById(orderId);
    }
  }, [orderId, loadOrderById]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleViewSummary = useCallback(() => {
    // TODO: Navigate to bill summary screen
    // console.log('View summary pressed');
  }, []);

  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);

  const handleRetryPayment = useCallback(async () => {
    if (!selectedOrder) return;
    setRetryingPayment(true);
    try {
      // TODO: Implement retry payment logic
      Alert.alert('Retry Payment', 'Redirecting to payment gateway...');
      // After implementing:
      // await retryPayment(selectedOrder.orderId);
      // await loadOrderById(selectedOrder.orderId);
    } catch (error) {
      Alert.alert('Error', 'Failed to retry payment. Please try again.');
    } finally {
      setRetryingPayment(false);
    }
  }, [selectedOrder]);

  const handleCancelOrder = useCallback(async () => {
    if (!selectedOrder || !authData?.jwt || !authData?.phone) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setCancellingOrder(true);
            try {
              await orderService.cancelOrder(
                selectedOrder.orderId,
                selectedOrder.shopId,
                'Need to change address', // Default reason
                authData.jwt,
                authData.phone
              );

              // Refresh orders list and navigate back
              await refreshOrders();
              navigation.goBack();
              Alert.alert('Success', 'Order cancelled successfully');
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to cancel order. Please try again.'
              );
            } finally {
              setCancellingOrder(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [selectedOrder, authData?.jwt, authData?.phone, refreshOrders, navigation]);

  const handleGetHelp = useCallback(() => {
    // TODO: Navigate to help screen
    // console.log('Get help pressed');
  }, []);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  // Types to avoid 'any' and map API shape safely
  type DerivedItem = { id: string; name: string; quantity: number; price: number; image?: string };
  type ApiSkuGroup = {
    id?: string;
    sku?: string;
    itemCount?: number;
    finalPrice?: number;
    shopPrice?: number;
    productDetails?: {
      sku?: string;
      productName?: string;
      productImageUrl?: string;
      additionalAttributes?: { quantity?: number };
    };
  };
  type ApiOrderShape = {
    items?: Array<{
      id?: string;
      sku?: string;
      name?: string;
      productName?: string;
      quantity?: number;
      totalPrice?: number;
      price?: number;
      image?: string;
      imageUrl?: string;
    }>;
    skuDetailsGrouped?: ApiSkuGroup[];
    deliveryDetails?: { deliveryFees?: number };
  };

  // Derive items either from typed order.items or API's skuDetailsGrouped
  const derivedItems = React.useMemo<DerivedItem[]>(() => {
    const base: DerivedItem[] = [];
    const apiOrder = selectedOrder as unknown as ApiOrderShape;
    if (Array.isArray(apiOrder?.items) && apiOrder.items.length > 0) {
      return apiOrder.items.map(it => ({
        id: String(it.id ?? it.sku ?? Math.random()),
        name: String(it.name ?? it.productName ?? 'Item'),
        quantity: Number(it.quantity ?? 1),
        price: Number(it.totalPrice ?? it.price ?? 0),
        image: it.image ?? it.imageUrl,
      }));
    }
    const groups = apiOrder?.skuDetailsGrouped;
    if (Array.isArray(groups)) {
      return groups.map((g: ApiSkuGroup) => {
        const pd = g.productDetails || {};
        return {
          id: String(g.id ?? g.sku ?? pd.sku ?? Math.random()),
          name: String(pd.productName ?? 'Item'),
          quantity: Number(g.itemCount ?? pd.additionalAttributes?.quantity ?? 1),
          price: Number(g.finalPrice ?? g.shopPrice ?? 0),
          image: pd.productImageUrl,
        };
      });
    }
    return base;
  }, [selectedOrder]);

  // Payment summary derived from items + order delivery details
  const summary = useMemo(() => {
    if (!selectedOrder) return { subTotal: 0, deliveryFee: 0, total: 0 };

    const apiOrder = selectedOrder as unknown as ApiOrderShape;
    const subTotal = derivedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const deliveryFee = Number(apiOrder?.deliveryDetails?.deliveryFees ?? 0);
    const total = Number(selectedOrder.totalAmount ?? subTotal + deliveryFee);
    return { subTotal, deliveryFee, total };
  }, [derivedItems, selectedOrder]);

  const [showAllItems, setShowAllItems] = React.useState(false);
  const displayedItems = showAllItems ? derivedItems : derivedItems.slice(0, 2);
  const hasMoreItems = derivedItems.length > 2;

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
          <OrderInfoCard
            order={selectedOrder}
            getStatusColor={getStatusColor}
            actionButton={
              selectedOrder.status === 'payment_pending' ? (
                <TouchableOpacity
                  style={[styles.actionButton, { borderWidth: 1, borderColor: '#2196F3' }]}
                  onPress={handleRetryPayment}
                  disabled={retryingPayment}
                >
                  {retryingPayment ? (
                    <ActivityIndicator size="small" color="#2196F3" />
                  ) : (
                    <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>
                      Retry Payment
                    </Text>
                  )}
                </TouchableOpacity>
              ) : selectedOrder.status === 'processing' ? (
                <TouchableOpacity
                  style={[styles.actionButton, { borderWidth: 1, borderColor: '#F44336' }]}
                  onPress={handleCancelOrder}
                  disabled={cancellingOrder}
                >
                  {cancellingOrder ? (
                    <ActivityIndicator size="small" color="#F44336" />
                  ) : (
                    <Text style={[styles.actionButtonText, { color: '#F44336' }]}>
                      Cancel Order
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
          />

          {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
            <OrderProgress status={selectedOrder.status} />
          )}

          <SectionDivider text="Order Items" />
          <View style={[styles.itemsCard, { backgroundColor: getColor('card') }]}>
            {derivedItems.length === 0 ? (
              <Text style={[styles.emptyText, { color: getColor('subText') }]}>No items found</Text>
            ) : (
              <View style={styles.itemsContainer}>
                {displayedItems.map((item: DerivedItem) => (
                  <View key={item.id} style={[styles.itemRow, { borderColor: getColor('border') }]}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                    ) : (
                      <View
                        style={[styles.itemImage, { backgroundColor: getColor('background') }]}
                      />
                    )}
                    <View style={styles.itemInfo}>
                      <Text
                        style={[styles.itemName, { color: getColor('text') }]}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.itemMeta, { color: getColor('subText') }]}>
                        Qty: {item.quantity}
                      </Text>
                    </View>
                    <Text style={[styles.itemPrice, { color: getColor('text') }]}>
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                {hasMoreItems && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllItems(!showAllItems)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.showMoreText, { color: '#FFA500' }]}>
                      {showAllItems ? 'Show Less' : `Show ${derivedItems.length - 2} More Items`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <BillSummaryCard
            totalAmount={summary.total}
            subtotal={summary.subTotal}
            deliveryFee={summary.deliveryFee}
            onPress={handleViewSummary}
          />

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
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'BricolageGrotesque-Regular',
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
  emptyText: {
    marginTop: 8,
  },
  itemsContainer: {
    marginTop: 8,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  billHeader: {
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  billHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billHeaderAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryContainer: {
    marginTop: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryTotalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryTotalValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  showMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OrderDetailsScreen;
