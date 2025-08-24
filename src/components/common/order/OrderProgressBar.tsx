import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
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
  payment_pending: 'Payment pending',
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

  useEffect(() => {
    const jwt = authData?.jwt || '';
    const phone = authData?.phone || '';
    if (!loading && orders.length === 0 && jwt && phone) {
      // Fetch a small page to keep it lightweight
      fetchOrders(jwt, phone, null, 5).catch(() => {
        // no-op; UI stays quiet on failure
      });
    }
  }, [authData?.jwt, authData?.phone, orders.length, loading, fetchOrders]);
  const inProgressOrder = useMemo(() => {
    return orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [orders]);
  if (!inProgressOrder) return null;

  const items = inProgressOrder.items || [];
  const itemsCount = items.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0;
  const firstItemName = items[0]?.name || 'Order';
  const remainingItems = Math.max(itemsCount - 1, 0);
  const label = statusLabel[inProgressOrder.status] || 'In progress';

  return (
    <View style={[styles.stickyContainer, style]} pointerEvents="box-none">
      <TouchableOpacity
        style={[
          styles.bar,
          {
            backgroundColor: getColor('card'),
            borderColor: getColor('primary'),
            borderWidth: 1.5,
          },
        ]}
        activeOpacity={0.92}
        onPress={() => {
          if (inProgressOrder?.orderId) {
            navigation.navigate('OrderDetails', { orderId: inProgressOrder.orderId });
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
            {inProgressOrder.totalAmount.toFixed(0)}
          </Text>
        </View>
        <Text
          style={[styles.status, { color: getColor('primary'), fontSize: getTypography('body') }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={getColor('background')}
          style={styles.trailingIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  stickyContainer: {
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 52,
    width: '92%',
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
});

export default OrderProgressBar;
