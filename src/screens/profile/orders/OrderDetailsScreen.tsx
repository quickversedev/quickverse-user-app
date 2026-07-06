import notifee, { AuthorizationStatus } from '@notifee/react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import usePricingStore from '../../../store/pricingStore';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';
import { AppNavigationProp } from '../../../types/navigation';

const { width: screenWidth } = Dimensions.get('window');

// Shimmer skeleton block
const SkeletonBlock = ({
  w,
  h,
  borderRadius = 8,
  style,
  shimmer,
  baseColor,
  highlightColor,
}: {
  w: number | string;
  h: number;
  borderRadius?: number;
  style?: object;
  shimmer: Animated.Value;
  baseColor: string;
  highlightColor: string;
}) => {
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });
  return (
    <View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: highlightColor,
          transform: [{ translateX }],
          opacity: 0.4,
        }}
      />
    </View>
  );
};

const OrderDetailsSkeleton = ({ getColor }: { getColor: (key: string) => string }) => {
  const shimmer = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const base = getColor('border');
  const highlight = getColor('card');
  const S = (props: { w: number | string; h: number; borderRadius?: number; style?: object }) => (
    <SkeletonBlock {...props} shimmer={shimmer} baseColor={base} highlightColor={highlight} />
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Order Info Card */}
      <View
        style={{
          backgroundColor: getColor('card'),
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        {/* Address */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <S w={36} h={36} borderRadius={18} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <S w={140} h={14} borderRadius={4} />
            <S w={100} h={12} borderRadius={4} style={{ marginTop: 6 }} />
            <S w={180} h={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
        {/* Date + Status */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <S w={160} h={14} borderRadius={4} />
          <S w={90} h={28} borderRadius={14} />
        </View>
        {/* Customer + Phone */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <S w={70} h={10} borderRadius={3} />
            <S w={90} h={14} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <S w={50} h={10} borderRadius={3} />
            <S w={110} h={14} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>

      {/* Shop Details Divider */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <S w={120} h={12} borderRadius={4} />
      </View>

      {/* Shop Details Card */}
      <View
        style={{
          backgroundColor: getColor('card'),
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <S w={180} h={16} borderRadius={4} />
        <S w={screenWidth - 96} h={12} borderRadius={4} style={{ marginTop: 8 }} />
        <S w={screenWidth - 120} h={12} borderRadius={4} style={{ marginTop: 4 }} />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          <S w={140} h={14} borderRadius={4} />
          <S w={90} h={32} borderRadius={16} />
        </View>
        <S w={screenWidth - 96} h={12} borderRadius={4} style={{ marginTop: 10 }} />
      </View>

      {/* Order Items Divider */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <S w={100} h={12} borderRadius={4} />
      </View>

      {/* Order Item rows */}
      <View
        style={{
          backgroundColor: getColor('card'),
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        {[0, 1].map(i => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
            <S w={48} h={48} borderRadius={8} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <S w={120} h={14} borderRadius={4} />
              <S w={50} h={10} borderRadius={3} style={{ marginTop: 6 }} />
            </View>
            <S w={60} h={14} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Bill Summary */}
      <View
        style={{
          backgroundColor: getColor('card'),
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}
          >
            <S w={100 + i * 10} h={12} borderRadius={4} />
            <S w={50} h={12} borderRadius={4} />
          </View>
        ))}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: getColor('border'),
            paddingTop: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <S w={80} h={14} borderRadius={4} />
          <S w={60} h={14} borderRadius={4} />
        </View>
      </View>
    </ScrollView>
  );
};

const OrderDetailsScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const route = useRoute();
  const { getColor } = useTheme();
  const { selectedOrder, loadOrderById, refreshOrders, setSelectedOrder } = useOrders();
  const { authData } = useAuth();
  const { orderId, shopId } = route.params as { orderId: string; shopId?: string };
  const { getVendorById } = useVendorStore();
  const { requestPermissions } = useNotifications();

  // Notification permission state
  const [showPermissionBar, setShowPermissionBar] = useState(false);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL_MS = 30000; // 30 seconds

  // Custom dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    confirmColor?: string;
  } | null>(null);

  // Get vendor details if we have a shopId
  const vendorDetails = useMemo(() => {
    if (!selectedOrder?.shopId) return null;
    return getVendorById(selectedOrder.shopId);
  }, [selectedOrder?.shopId, getVendorById]);

  const isGrocery = vendorDetails?.category?.toLowerCase().includes('grocery');
  const serviceType = isGrocery ? ('GROCERY' as const) : ('FOOD' as const);

  // Select the stable array to trigger re-renders only when it changes.
  // Using getPricingValues directly in the selector returns a new object every time,
  // causing useSyncExternalStore to throw an infinite loop warning/error.
  const pricingConfig = usePricingStore(state => state.configs[serviceType]);
  const pricing = useMemo(() => {
    return usePricingStore.getState().getPricingValues(serviceType);
  }, [pricingConfig, serviceType]);

  // Capture shopId before clearing stale data (list API doesn't have orderMasterStatus,
  // so stale selectedOrder would show wrong status for 1-2s until fetchOrderById completes)
  const shopIdRef = useRef(shopId || selectedOrder?.shopId);

  // Clear stale data and fetch fresh on mount
  useEffect(() => {
    if (orderId) {
      setSelectedOrder(null);
      loadOrderById(orderId, shopIdRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Poll for status updates while order is active
  useEffect(() => {
    const shouldPoll =
      selectedOrder?.status &&
      selectedOrder.status !== 'delivered' &&
      selectedOrder.status !== 'cancelled';

    if (shouldPoll) {
      pollingIntervalRef.current = setInterval(() => {
        loadOrderById(orderId, shopIdRef.current);
      }, POLLING_INTERVAL_MS);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [selectedOrder?.status, orderId, loadOrderById]);

  // Check notification permission on component mount
  useEffect(() => {
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

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOrderById(orderId, selectedOrder?.shopId);
    } finally {
      setRefreshing(false);
    }
  }, [orderId, selectedOrder?.shopId, loadOrderById]);

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

    setDialogConfig({
      title: 'Retry Payment',
      message: 'Press Retry to proceed with payment.',
      confirmText: 'Retry',
      cancelText: 'Cancel',
      onConfirm: onConfirmRetry,
      confirmColor: getColor('secondary'),
    });
    setDialogVisible(true);
  }, [selectedOrder, authData?.jwt, authData?.phone, refreshOrders, loadOrderById, getColor]);

  const handleCancelOrder = useCallback(async () => {
    if (!selectedOrder || !authData?.jwt || !authData?.phone) return;

    const onConfirmCancel = async () => {
      setDialogVisible(false);
      setCancellingOrder(true);
      try {
        await orderService.cancelOrder(
          selectedOrder.orderId,
          selectedOrder.shopId,
          'Need to change address', // Default reason
          authData.jwt,
          authData.phone
        );

        // Refresh orders list
        await refreshOrders();
        setCancellingOrder(false);

        // Show success dialog
        setDialogConfig({
          title: 'Success',
          message: 'Order cancelled successfully',
          confirmText: 'OK',
          cancelText: '',
          onConfirm: () => {
            setDialogVisible(false);
            navigation.goBack();
          },
          confirmColor: getColor('secondary'),
        });
        setDialogVisible(true);
      } catch (error) {
        setCancellingOrder(false);
        // Show error dialog
        setDialogConfig({
          title: 'Error',
          message:
            error instanceof Error ? error.message : 'Failed to cancel order. Please try again.',
          confirmText: 'OK',
          cancelText: '',
          onConfirm: () => setDialogVisible(false),
          confirmColor: getColor('secondary'),
        });
        setDialogVisible(true);
      }
    };

    setDialogConfig({
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order?',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: onConfirmCancel,
      confirmColor: '#F44336',
    });
    setDialogVisible(true);
  }, [selectedOrder, authData?.jwt, authData?.phone, refreshOrders, navigation, getColor]);

  const handleGetHelp = useCallback(() => {
    // TODO: Navigate to help screen
    // //console.log('Get help pressed');
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
  // Fee structure must match Cart's PaymentSummary.tsx exactly
  const summary = useMemo(() => {
    if (!selectedOrder)
      return {
        subTotal: 0,
        deliveryFee: 0,
        deliveryFeeOriginal: 0,
        additionalCharges: 0,
        total: 0,
        platformFee: 0,
        platformFeeOriginal: 0,
        packagingCharges: 0,
        packagingChargesOriginal: 0,
        taxes: 0,
        commission: 0,
        taxableAmount: 0,
        isGrocery: false,
      };

    // Calculate subTotal from items — item.price is already the line total (unit price × quantity)
    const subTotal = derivedItems.reduce((sum, item) => sum + item.price, 0);

    // Fee structure from dynamic pricing config
    const commission = pricing.commissionRate * Number(subTotal);
    const taxableAmount = commission + pricing.deliveryFee + pricing.platformFee;
    const taxes = Math.round(pricing.gstRate * taxableAmount);

    const total =
      Number(subTotal) +
      pricing.deliveryFee +
      pricing.platformFee +
      pricing.packagingCharges +
      taxes;

    return {
      subTotal,
      deliveryFee: pricing.deliveryFee,
      deliveryFeeOriginal: pricing.deliveryFeeOriginal,
      total,
      platformFee: pricing.platformFee,
      platformFeeOriginal: pricing.platformFeeOriginal,
      packagingCharges: pricing.packagingCharges,
      packagingChargesOriginal: pricing.packagingChargesOriginal,
      taxes,
      commission,
      taxableAmount,
      isGrocery: !!isGrocery,
    };
  }, [selectedOrder, derivedItems, pricing, isGrocery]);

  const [showAllItems, setShowAllItems] = React.useState(false);
  const displayedItems = showAllItems ? derivedItems : derivedItems.slice(0, 2);
  const hasMoreItems = derivedItems.length > 2;

  if (!selectedOrder) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: getColor('background') }]}>
        <View style={[styles.container, { backgroundColor: getColor('background') }]}>
          <OrderHeader orderId={orderId || 'Loading...'} onBackPress={handleBackPress} />
          <OrderDetailsSkeleton getColor={getColor} />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={getColor('secondary')}
              colors={[getColor('secondary')]}
              progressBackgroundColor={getColor('card')}
            />
          }
        >
          <OrderInfoCard
            order={selectedOrder}
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

          <OrderProgress
            status={selectedOrder.status}
            orderCreationTime={selectedOrder.orderDate}
            category={vendorDetails?.category}
            preparationTime={vendorDetails?.preparationTime}
            orderMasterStatus={selectedOrder.orderMasterStatus}
            orderDate={selectedOrder.orderDate}
          />

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
                  <View style={styles.contactRow}>
                    <Text style={[styles.shopContact, { color: getColor('text') }]}>
                      Contact: {vendorDetails.phone}
                    </Text>
                    <TouchableOpacity
                      style={[styles.callButton, { backgroundColor: getColor('primary') }]}
                      onPress={() => Linking.openURL(`tel:${vendorDetails.phone}`)}
                    >
                      <Icon name="phone" size={16} color="#FFF" />
                      <Text style={styles.callButtonText}>Call Shop</Text>
                    </TouchableOpacity>
                  </View>
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
            finance={selectedOrder?.finance}
            totalAmount={summary.total}
            subtotal={summary.subTotal}
            deliveryFee={summary.deliveryFee}
            deliveryFeeOriginal={summary.deliveryFeeOriginal}
            platformFee={summary.platformFee}
            platformFeeOriginal={summary.platformFeeOriginal}
            packagingCharges={summary.packagingCharges}
            packagingChargesOriginal={summary.packagingChargesOriginal}
            taxes={summary.taxes}
            commission={summary.commission}
            taxableAmount={summary.taxableAmount}
            isGrocery={summary.isGrocery}
            commissionRate={pricing.commissionRate}
            gstRate={pricing.gstRate}
            onPress={handleViewSummary}
          />

          <View
            style={[
              styles.itemsCard,
              {
                backgroundColor: getColor('card'),
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Icon name="headset" size={24} color={getColor('primary')} />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: getColor('text') }}>
                  QuickVerse Support
                </Text>
                <Text style={{ fontSize: 12, color: getColor('subText'), marginTop: 2 }}>
                  We are available to help
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.callButton, { backgroundColor: getColor('primary') }]}
              onPress={() => Linking.openURL(`tel:8459418525`)}
            >
              <Icon name="phone" size={16} color="#FFF" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>

          <HelpCard onPress={handleGetHelp} order={selectedOrder} />
        </ScrollView>
      </View>

      {/* Custom Themed Dialog */}
      <Modal
        visible={dialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDialogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: getColor('card') }]}>
            <Text style={[styles.modalTitle, { color: getColor('text') }]}>
              {dialogConfig?.title}
            </Text>
            <Text style={[styles.modalMessage, { color: getColor('subText') }]}>
              {dialogConfig?.message}
            </Text>
            <View style={styles.modalButtonRow}>
              {dialogConfig?.cancelText ? (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalCancelButton,
                    { borderColor: getColor('border') },
                  ]}
                  onPress={() => setDialogVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: getColor('text') }]}>
                    {dialogConfig?.cancelText}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  { backgroundColor: dialogConfig?.confirmColor || getColor('secondary') },
                ]}
                onPress={() => {
                  dialogConfig?.onConfirm();
                }}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    {
                      color:
                        dialogConfig?.confirmColor === '#F44336'
                          ? '#FFFFFF'
                          : getColor('background'),
                    },
                  ]}
                >
                  {dialogConfig?.confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
  // Custom modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalConfirmButton: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OrderDetailsScreen;
