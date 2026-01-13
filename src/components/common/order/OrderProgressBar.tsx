import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useOrderStore from '../../../store/cart/orderStore';
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
};

const OrderProgressBar: React.FC<OrderProgressBarProps> = ({ style }) => {
  const { getColor, getTypography } = useTheme();
  const navigation = useNavigation<AppNavigationProp>();
  const { authData } = useAuth();
  const orders = useOrderStore(state => state.orders);
  const fetchOrders = useOrderStore(state => state.fetchOrders);
  const loading = useOrderStore(state => state.loading);
  const { width: screenWidth } = useWindowDimensions();
  const setSelectedOrder = useOrderStore(state => state.setSelectedOrder);

  // Match CartBar width
  const containerWidth = screenWidth - 30; // Same as CartBar width

  // Guard to prevent multiple fetches
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const jwt = authData?.jwt || '';
    const phone = authData?.phone || '';
    // Only fetch once per component mount, and only if orders are empty
    if (!hasFetchedRef.current && !loading && orders.length === 0 && jwt && phone) {
      hasFetchedRef.current = true;
      // Fetch a small page to keep it lightweight
      fetchOrders(jwt, phone, null, 5).catch(() => {
        // no-op; UI stays quiet on failure
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authData?.jwt, authData?.phone]);

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

  if (inProgressOrders.length === 0) return null;

  const renderBar = (order: any) => {
    const items = order.items || [];
    const itemsCount = items.reduce((acc: number, it: any) => acc + (it.quantity || 0), 0) || 0;
    const firstItemName = items[0]?.name || 'Order';
    const remainingItems = Math.max(itemsCount - 1, 0);
    const label = statusLabel[order.status] || 'In progress';

    return (
      <TouchableOpacity
        key={order.orderId}
        style={[
          styles.bar,
          {
            backgroundColor: getColor('card'),
            borderColor: getColor('primary'),
          },
        ]}
        activeOpacity={0.92}
        onPress={() => {
          if (order?.orderId) {
            setSelectedOrder(order);
            console.log('navigating to order details', order);
            navigation.navigate('OrderDetails', { orderId: order.orderId, order });
          }
        }}
      >
        <MaterialCommunityIcons
          name="truck-delivery-outline"
          size={22}
          color={getColor('primary')}
          style={styles.leadingIcon}
        />
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: getColor('text'), fontSize: getTypography('body') }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {firstItemName} {remainingItems > 0 ? `and ${remainingItems} other` : ''}
            </Text>
          </View>
          <Text
            style={[
              styles.subtitle,
              { color: getColor('subText'), fontSize: getTypography('caption') },
            ]}
            numberOfLines={1}
          >
            {itemsCount} item{itemsCount === 1 ? '' : 's'} • ₹
            {order.totalAmount?.toFixed ? order.totalAmount.toFixed(0) : order.totalAmount}
          </Text>
        </View>
        <View style={styles.rightSection}>
          <Text
            style={[styles.status, { color: getColor('primary'), fontSize: getTypography('body') }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={getColor('primary')}
            style={styles.trailingIcon}
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Single order: keep existing layout
  if (inProgressOrders.length === 1) {
    const order = inProgressOrders[0];
    return (
      <View style={[styles.stickyContainer, style]} pointerEvents="box-none">
        <View style={[styles.page]}>{renderBar(order)}</View>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 52,
    width: '100%',
    borderWidth: 1.5,
    // Cross-platform shadow
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // Android elevation
    elevation: 4,
  },
  leadingIcon: {
    marginRight: 10,
  },
  trailingIcon: {
    marginLeft: 6,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.85,
    fontWeight: '500',
  },
  status: {
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rightSection: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default OrderProgressBar;
