import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';

interface OrderInfoCardProps {
  order: Order;
  getStatusColor: (status: string) => string;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order, getStatusColor }) => {
  const { getColor } = useTheme();

  return (
    <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
      {/* Source (Restaurant) */}
      <View style={styles.locationRow}>
        <View style={styles.iconContainer}>
          <Icon name="map-marker" size={20} color={getColor('primary')} />
        </View>
        <View style={styles.locationInfo}>
          <Text style={[styles.locationTitle, { color: getColor('text') }]}>{order.shopName}</Text>
          <Text style={[styles.locationAddress, { color: getColor('subText') }]}>
            {order.deliveryAddress.address}
          </Text>
        </View>
      </View>

      {/* Connecting Line */}
      <View style={styles.connectingLine}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: getColor('border') },
              { marginBottom: index < 3 ? 2 : 0 },
            ]}
          />
        ))}
      </View>

      {/* Destination (Delivery Address) */}
      <View style={styles.locationRow}>
        <View style={styles.iconContainer}>
          <Icon name="home" size={20} color={getColor('primary')} />
        </View>
        <View style={styles.locationInfo}>
          <Text style={[styles.locationTitle, { color: getColor('text') }]}>Home</Text>
          <Text style={[styles.locationAddress, { color: getColor('subText') }]}>
            {order.deliveryAddress.city}, {order.deliveryAddress.state}
          </Text>
        </View>
      </View>

      {/* Delivery Details and Status */}
      <View style={styles.deliveryStatusRow}>
        <View style={styles.deliveryDetails}>
          <Text style={[styles.deliveryDate, { color: getColor('text') }]}>
            {new Date(order.orderDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
            ,{' '}
            {new Date(order.orderDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
          {order.actualDeliveryTime && (
            <Text style={[styles.deliveryAgent, { color: getColor('subText') }]}>
              By {order.customerName}
            </Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>
            {order.status === 'delivered' ? 'DELIVERED' : order.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  orderCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
    alignSelf: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
  },
  connectingLine: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  deliveryStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  deliveryDetails: {
    flex: 1,
  },
  deliveryDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  deliveryAgent: {
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OrderInfoCard;
