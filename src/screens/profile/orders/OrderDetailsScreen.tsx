import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SectionDivider } from '../../../components/common';
import {
  BillSummaryCard,
  HelpCard,
  OrderHeader,
  OrderInfoCard,
  OrderProgress,
} from '../../../components/common/OrderDetails';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { useNotifications } from '../../../hooks/useNotifications';
import { useOrders } from '../../../hooks/useOrders';
import orderService from '../../../services/createOrderService';
import createPaymentService, { PaymentTender } from '../../../services/createPaymentService';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';

const OrderDetailsScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute();
  const { getColor } = useTheme();
  const { selectedOrder, loadOrderById, refreshOrders } = useOrders();
  const { authData } = useAuth();
  const { orderId } = route.params as { orderId: string };
  const { getVendorById } = useVendorStore();
  const { requestPermissions } = useNotifications();

  // Notification permission state
  const [showPermissionBar, setShowPermissionBar] = useState(false);

  // Get vendor details if we have a shopId
  const vendorDetails = useMemo(() => {
    if (!selectedOrder?.shopId) return null;
    return getVendorById(selectedOrder.shopId);
  }, [selectedOrder?.shopId, getVendorById]);

  React.useEffect(() => {
    if (orderId) {
      loadOrderById(orderId, selectedOrder?.shopId);
    }
  }, [orderId, loadOrderById]);

  // Check notification permission on component mount
  React.useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requires POST_NOTIFICATIONS; older versions don't
        if (Platform.Version < 33) {
          setShowPermissionBar(false);
          return;
        }
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        setShowPermissionBar(!granted);
      } else if (Platform.OS === 'ios') {
        // iOS: use Notifee to check current authorization status
        const settings = await notifee.getNotificationSettings();
        const enabled =
          settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
          settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
        setShowPermissionBar(!enabled);
      }
    } catch (error) {
      // If permission check fails, don't block the UI with the bar
      setShowPermissionBar(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const result = await requestPermissions();

      if (result) {
        // Permission granted, hide the bar
        setShowPermissionBar(false);
      } else {
        Alert.alert(
          'Permission Blocked',
          'Notification permissions have been permanently denied. To enable notifications:\n\n1. Go to App Settings > Notifications\n2. Turn on "Show notifications"\n3. Enable "Sound", "Vibration", and "Heads-up"\n\nWould you like to open App Settings now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );

        setShowPermissionBar(false);
      }
    } catch (error: unknown) {
      // Handle specific permission errors

      // Permission permanently denied, show settings instructions
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Permission Blocked',
          'Notification permissions have been permanently denied. To enable notifications:\n\n1. Go to Settings > Notifications > QuickVerse\n2. Turn on "Allow Notifications"\n3. Enable "Sounds", "Badges", and "Banners"\n\nWould you like to open Settings now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      } else if (Platform.OS === 'android') {
        Alert.alert(
          'Permission Blocked',
          'Notification permissions have been permanently denied. To enable notifications:\n\n1. Go to App Settings > Notifications\n2. Turn on "Show notifications"\n3. Enable "Sound", "Vibration", and "Heads-up"\n\nWould you like to open App Settings now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
    }
  };
  //console.log('showPermissionBar*********', showPermissionBar);
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleViewSummary = useCallback(() => {
    // TODO: Navigate to bill summary screen
    // //console.log('View summary pressed');
  }, []);

  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const wait = useCallback((ms: number) => new Promise(resolve => setTimeout(resolve, ms)), []);

  const handleRetryPayment = useCallback(() => {
    if (!selectedOrder) return;
    if (!authData?.jwt || !authData?.phone) {
      Alert.alert('Login required', 'Please login to proceed with payment.');
      return;
    }

    const onConfirmRetry = async () => {
      setRetryingPayment(true);
      try {
        // Build minimal payment request using order total as a single tender
        const tender: PaymentTender = {
          amount: Number(selectedOrder.totalAmount || 0),
          status: 'CREATED',
          type: 'COMPLETION',
          paymentMethod: 'COD',
          additionalTenderCharges: Number(selectedOrder.additionalPaymentCharges || 0),
        };
        await createPaymentService.createPayment(
          {
            customerId: Number(selectedOrder.customerId),
            mobileNumber: authData.phone,
            name: authData.username,
            orderId: selectedOrder.orderId,
            tenders: [tender],
          },
          authData.jwt,
          authData.phone
        );
        Alert.alert('Ready', 'Payment created.');

        // Refetch the order a few times to overcome eventual consistency on the backend
        await loadOrderById(selectedOrder.orderId, selectedOrder.shopId);
        for (let i = 0; i < 2; i += 1) {
          await wait(600);
          await loadOrderById(selectedOrder.orderId, selectedOrder.shopId);
        }
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to start payment. Please try again.';
        Alert.alert('Error', message);
      } finally {
        setRetryingPayment(false);
      }
    };

    Alert.alert(
      'Retry Payment',
      'Press Retry to proceed with payment.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: onConfirmRetry },
      ],
      { cancelable: true }
    );
  }, [selectedOrder, authData?.jwt, authData?.phone, refreshOrders, loadOrderById]);

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
    // //console.log('Get help pressed');
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
    if (!selectedOrder) return { subTotal: 0, deliveryFee: 0, additionalCharges: 0, total: 0 };

    const apiOrder = selectedOrder as unknown as ApiOrderShape;
    const subTotal = selectedOrder.totalInvoiceAmount ?? selectedOrder.totalAmount;
    const deliveryFee = Number(
      selectedOrder.deliveryFees ?? apiOrder?.deliveryDetails?.deliveryFees ?? 0
    );
    const additionalCharges = Number(selectedOrder.additionalPaymentCharges ?? 0);
    const total = Number(subTotal + deliveryFee + additionalCharges);
    return { subTotal, deliveryFee, additionalCharges, total };
  }, [selectedOrder]);

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

        {/* Notification Permission Bar */}
        {showPermissionBar && (
          <View style={[styles.notificationBar, { backgroundColor: getColor('main') }]}>
            <View style={styles.notificationContent}>
              <Icon name="bell-outline" size={20} color={getColor('background')} />
              <Text style={[styles.notificationText, { color: getColor('background') }]}>
                Enable notifications to get order updates
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.enableButton,
                {
                  backgroundColor: getColor('error'),
                  borderColor: getColor('border'),
                },
              ]}
              onPress={handleEnableNotifications}
              activeOpacity={0.8}
            >
              <Text style={[styles.enableButtonText, { color: getColor('white') }]}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

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
                <View style={styles.actionButtonContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.retryButton]}
                    onPress={handleRetryPayment}
                    disabled={retryingPayment}
                  >
                    {retryingPayment ? (
                      <ActivityIndicator size="small" color="#2196F3" />
                    ) : (
                      <Text style={[styles.actionButtonText, styles.retryButtonText]}>
                        Retry Payment
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancelOrder}
                    disabled={cancellingOrder}
                  >
                    {cancellingOrder ? (
                      <ActivityIndicator size="small" color="#F44336" />
                    ) : (
                      <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                        Cancel Order
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : selectedOrder.status === 'processing' ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelOrder}
                  disabled={cancellingOrder}
                >
                  {cancellingOrder ? (
                    <ActivityIndicator size="small" color="#F44336" />
                  ) : (
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
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

          {/* Shop Details Section */}
          <SectionDivider text="Shop Details" />
          <View style={[styles.itemsCard, { backgroundColor: getColor('card') }]}>
            {vendorDetails ? (
              <View style={styles.shopDetailsContainer}>
                <Text style={[styles.shopName, { color: getColor('text') }]}>
                  {vendorDetails.name}
                </Text>
                <Text style={[styles.shopInfo, { color: getColor('subText') }]}>
                  {vendorDetails.description}
                </Text>
                {vendorDetails.phone && (
                  <Text style={[styles.shopContact, { color: getColor('text') }]}>
                    Contact: {vendorDetails.phone}
                  </Text>
                )}
                {vendorDetails.shopAddress && (
                  <Text style={[styles.shopAddress, { color: getColor('subText') }]}>
                    {vendorDetails.shopAddress.address}, {vendorDetails.shopAddress.city}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: getColor('subText') }]}>
                Shop details not available
              </Text>
            )}
          </View>

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
                      ₹{item.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
                {hasMoreItems && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllItems(!showAllItems)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.showMoreText, styles.showMoreTextColor]}>
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
            additionalPaymentCharges={summary.additionalCharges}
            paymentMethod={selectedOrder.paymentMethod}
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
  actionButtonContainer: {
    flexDirection: 'column',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 30,
    minWidth: 100,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.2,
    // shadowRadius: 1.41,
    marginBottom: 8,
  },
  retryButton: {
    // marginRight: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'BricolageGrotesque-Regular',
  },
  retryButtonText: {
    color: '#2196F3',
  },
  cancelButtonText: {
    color: '#F44336',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 0 : 25,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
  showMoreTextColor: {
    color: '#FFA500',
  },
  // Shop details styles
  shopDetailsContainer: {
    padding: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  shopInfo: {
    fontSize: 14,
    marginBottom: 8,
  },
  shopContact: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
  },
  // Notification permission bar styles
  notificationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  enableButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  enableButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OrderDetailsScreen;
