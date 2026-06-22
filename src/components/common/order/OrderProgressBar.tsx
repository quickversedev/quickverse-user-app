import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useOrderStore from '../../../store/cart/orderStore';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';
// import type { Order } from '../../../types/order';
import { AppNavigationProp } from '../../../types/navigation';

interface OrderProgressBarProps {
  style?: ViewStyle;
}

// Keeping the set here for future granularity if needed.

const statusLabel: Record<string, string> = {
  payment_pending: 'Retry',
  processing: 'Processing',
  confirmed: 'Confirmed',
  ready: 'Ready for dispatch',
  shipped: 'On the way',
  shipping: 'On the way',
};

// Pulsing dot component for live indicator
const PulsingDot: React.FC<{ color: string }> = ({ color }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, opacityAnim]);

  return (
    <View style={styles.dotContainer}>
      <Animated.View
        style={[
          styles.dotOuter,
          {
            backgroundColor: color,
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <View style={[styles.dotInner, { backgroundColor: color }]} />
    </View>
  );
};

const OrderProgressBar: React.FC<OrderProgressBarProps> = ({ style }) => {
  const { getColor, getTypography, isDarkMode } = useTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const { authData } = useAuth();
  const orders = useOrderStore(state => state.orders);
  const fetchOrders = useOrderStore(state => state.fetchOrders);
  const refreshInProgressStatuses = useOrderStore(state => state.refreshInProgressStatuses);
  const { width: screenWidth } = useWindowDimensions();
  const setSelectedOrder = useOrderStore(state => state.setSelectedOrder);
  const getVendorById = useVendorStore(state => state.getVendorById);

  // Match CartBar width
  const containerWidth = screenWidth - 32; // Match CartBar width exactly

  // Don't render until the first detail-API refresh confirms true statuses.
  // AppInitializer's list API data lacks orderMasterStatus, so statuses can be stale.
  const [statusesVerified, setStatusesVerified] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      const jwt = authData?.jwt || '';
      const phone = authData?.phone || '';
      if (!jwt || !phone) return;

      setStatusesVerified(false);

      const refresh = () =>
        refreshInProgressStatuses(jwt, phone)
          .then(() => setStatusesVerified(true))
          .catch(() => setStatusesVerified(true));

      const currentOrders = useOrderStore.getState().orders;
      if (currentOrders.length === 0) {
        fetchOrders(jwt, phone, null, 5).then(refresh).catch(refresh);
      } else {
        refresh();
      }

      pollingRef.current = setInterval(refresh, 30_000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authData?.jwt, authData?.phone])
  );

  const inProgressOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders]);

  const scrollRef = useRef<ScrollView | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel when multiple orders
  useEffect(() => {
    if (inProgressOrders.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % inProgressOrders.length;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * containerWidth, animated: true });
    }, 3500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, inProgressOrders.length, containerWidth]);

  if (!statusesVerified || inProgressOrders.length === 0) return null;

  const renderBar = (order: any) => {
    const items = order.items || [];
    const itemsCount = items.reduce((acc: number, it: any) => acc + (it.quantity || 0), 0) || 0;
    // Look up vendor name from vendorStore (same as CartBar)
    const vendor = getVendorById(order.shopId);
    const vendorName = vendor?.name || order.shopName || 'Order';
    // Show vendor name for multiple items, item name for single item
    const displayName = itemsCount > 1 ? vendorName : items[0]?.name || 'Order';
    const label = statusLabel[order.status] || 'Track';

    const handlePress = () => {
      if (order?.orderId) {
        setSelectedOrder(order);
        navigation.navigate('OrderDetails', { orderId: order.orderId, order });
      }
    };

    return (
      <TouchableOpacity
        key={order.orderId}
        style={[
          styles.bar,
          {
            backgroundColor: getColor('primary'),
          },
        ]}
        activeOpacity={0.95}
        onPress={handlePress}
      >
        {/* Pulsing dot indicator */}
        <PulsingDot color={getColor('background')} />

        {/* Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' },
          ]}
        />

        {/* Content: Item name and count */}
        <View style={styles.contentContainer}>
          <View style={styles.itemNameContainer}>
            <Text
              style={[
                styles.itemName,
                { color: getColor('background'), fontSize: getTypography('body') },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayName}
            </Text>
          </View>
          <View style={styles.itemCountContainer}>
            <Text
              style={[
                styles.itemCount,
                { color: getColor('background'), fontSize: getTypography('caption') },
              ]}
              numberOfLines={1}
            >
              {itemsCount} Item{itemsCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {/* Status button */}
        <TouchableOpacity
          style={[styles.statusButton, { backgroundColor: getColor('background') }]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.statusText,
              { color: getColor('text'), fontSize: getTypography('caption') },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color={getColor('text')}
            style={styles.chevron}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Single order: keep existing layout
  if (inProgressOrders.length === 1) {
    const order = inProgressOrders[0];
    return (
      <View style={[styles.stickyContainer, style]} pointerEvents="box-none">
        <View style={[styles.page, { width: containerWidth }]}>{renderBar(order)}</View>
      </View>
    );
  }

  // Multiple orders: horizontal, paging carousel with auto-advance
  return (
    <View style={[styles.stickyContainer, style]} pointerEvents="box-none">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
          setCurrentIndex(idx);
        }}
        scrollEventThrottle={16}
        style={{ width: containerWidth }}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {inProgressOrders.map(order => (
          <View key={order.orderId} style={[styles.page, { width: containerWidth }]}>
            {renderBar(order)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    zIndex: 100,
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  page: {
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 16,
    minHeight: 56,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: 10,
    borderRadius: 1,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  itemNameContainer: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  itemCountContainer: {
    flexShrink: 0,
    marginLeft: 8,
  },
  itemCount: {
    opacity: 0.85,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: {
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 2,
  },
  dotContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOuter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default OrderProgressBar;
