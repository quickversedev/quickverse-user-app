import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';
import { ThemeText } from '../theme/ThemeText';

interface OrderInfoCardProps {
  order: Order;
  getStatusColor: (status: string) => string;
  actionButton?: React.ReactNode;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order, getStatusColor, actionButton }) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    title: {
      color: getColor('text'),
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    label: {
      color: getColor('subText'),
    },
    value: {
      color: getColor('text'),
    },
    status: {
      color: getColor('primary'),
    },
    totalAmount: {
      color: getColor('text'),
    },
  });

  return (
    <View style={styles.container}>
      <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
        Order Information
      </ThemeText>

      <View style={styles.infoRow}>
        <ThemeText variant="body" color={getColor('subText')} style={styles.label}>
          Order ID
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={styles.value}>
          #{order.orderId}
        </ThemeText>
      </View>

      <View style={styles.infoRow}>
        <ThemeText variant="body" color={getColor('subText')} style={styles.label}>
          Order Date
        </ThemeText>
        <ThemeText variant="body" color={getColor('text')} style={styles.value}>
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
        </ThemeText>
      </View>

      <View style={styles.infoRow}>
        <ThemeText variant="body" color={getColor('subText')} style={styles.label}>
          Status
        </ThemeText>
        <ThemeText variant="body" color={getStatusColor(order.status)} style={styles.status}>
          {order.status === 'delivered' ? 'DELIVERED' : order.status.toUpperCase()}
        </ThemeText>
      </View>

      <View style={styles.infoRow}>
        <ThemeText variant="body" color={getColor('subText')} style={styles.label}>
          Total Amount
        </ThemeText>
        <ThemeText variant="h2" color={getColor('text')} style={styles.totalAmount}>
          ₹{order.totalAmount}
        </ThemeText>
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
