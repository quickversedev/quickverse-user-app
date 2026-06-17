import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';

interface OrderInfoCardProps {
  order: Order;
  getStatusColor: (status: string) => string;
  actionButton?: React.ReactNode;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order, getStatusColor, actionButton }) => {
  const { getColor } = useTheme();

  return (
    <View style={[styles.orderCard, { backgroundColor: getColor('card') }]}>
      {/* Top Row with Location and Action Button */}
      <View style={styles.locationRow}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Icon name="home" size={20} color={getColor('primary')} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={[styles.locationTitle, { color: getColor('text') }]}>
              Delivery Address
            </Text>
            <Text style={[styles.locationAddress, { color: getColor('subText') }]}>
              {order.deliveryAddress.address}
              {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
              {order.deliveryAddress.addressLine3 && `, ${order.deliveryAddress.addressLine3}`}
            </Text>
            <Text style={[styles.locationCity, { color: getColor('subText') }]}>
              {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
              {order.deliveryAddress.postalCode}
            </Text>
          </View>
        </View>
        {actionButton && <View style={styles.actionButtonContainer}>{actionButton}</View>}
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
        <View style={styles.rightSection}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>
              {order.status === 'delivered' ? 'DELIVERED' : order.status.toUpperCase()}
            </Text>
          </View>
          {order.orderMasterStatus && (
            <Text style={[styles.masterStatusText, { color: getColor('subText') }]}>
              {order.orderMasterStatus.replace(/_/g, ' ')}
            </Text>
          )}
        </View>
      </View>

      {/* Customer Contact Information */}
      <View style={styles.contactRow}>
        <View style={styles.contactInfo}>
          <View style={styles.contactIconContainer}>
            <Icon name="account" size={16} color={getColor('primary')} />
          </View>
          <View style={styles.contactDetails}>
            <Text style={[styles.contactLabel, { color: getColor('subText') }]}>Customer</Text>
            <Text style={[styles.contactValue, { color: getColor('text') }]}>
              {order.customerName}
            </Text>
          </View>
        </View>
        <View style={styles.contactInfo}>
          <View style={styles.contactIconContainer}>
            <Icon name="phone" size={16} color={getColor('primary')} />
          </View>
          <View style={styles.contactDetails}>
            <Text style={[styles.contactLabel, { color: getColor('subText') }]}>Phone</Text>
            <Text style={[styles.contactValue, { color: getColor('text') }]}>
              {order.customerPhone}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionButtonContainer: {
    marginLeft: 12,
    alignSelf: 'center',
  },
  orderCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
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
  masterStatusText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'right',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OrderInfoCard;
