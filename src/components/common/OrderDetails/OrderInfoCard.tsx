import Icon from '@react-native-vector-icons/material-design-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';
import { Fonts } from '../theme/fonts';
import { ThemeText } from '../theme/ThemeText';

interface OrderInfoCardProps {
  order: Order;
  actionButton?: React.ReactNode;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order, actionButton }) => {
  const { getColor } = useTheme();

  return (
    <View
      style={[
        styles.orderCard,
        { backgroundColor: getColor('card'), borderColor: getColor('border') },
      ]}
    >
      {/* Top Row with Location and Action Button */}
      <View style={styles.locationRow}>
        <View style={styles.leftSection}>
          <View style={[styles.iconContainer, { backgroundColor: `${getColor('primary')}14` }]}>
            <Icon name="home" size={18} color={getColor('primary')} />
          </View>
          <View style={styles.locationInfo}>
            <ThemeText style={[styles.locationTitle, { color: getColor('text') }]}>
              Delivery Address
            </ThemeText>
            <ThemeText style={[styles.locationAddress, { color: getColor('subText') }]}>
              {order.deliveryAddress.address}
              {order.deliveryAddress.addressLine2 && `, ${order.deliveryAddress.addressLine2}`}
              {order.deliveryAddress.addressLine3 && `, ${order.deliveryAddress.addressLine3}`}
            </ThemeText>
            <ThemeText style={[styles.locationCity, { color: getColor('subText') }]}>
              {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
              {order.deliveryAddress.postalCode}
            </ThemeText>
          </View>
        </View>
        {/* actionButton now sits below on its own row when the card is
            narrow, rather than being force-squeezed beside a long
            address (previously flexDirection: row could clip the
            Retry/Cancel buttons on smaller screens). */}
      </View>

      {actionButton && <View style={styles.actionButtonRow}>{actionButton}</View>}

      {/* Delivery Details */}
      <View style={styles.deliveryStatusRow}>
        <View style={styles.deliveryDetails}>
          <ThemeText style={[styles.deliveryDate, { color: getColor('text') }]}>
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
          {Boolean(order.actualDeliveryTime) && (
            <ThemeText style={[styles.deliveryAgent, { color: getColor('subText') }]}>
              By {order.customerName}
            </ThemeText>
          )}
        </View>
      </View>

      {/* Customer Contact Information */}
      <View style={[styles.contactRow, { borderTopColor: getColor('border') }]}>
        <View style={styles.contactInfo}>
          <View
            style={[styles.contactIconContainer, { backgroundColor: `${getColor('primary')}14` }]}
          >
            <Icon name="account" size={14} color={getColor('primary')} />
          </View>
          <View style={styles.contactDetails}>
            <ThemeText style={[styles.contactLabel, { color: getColor('subText') }]}>
              Customer
            </ThemeText>
            <ThemeText style={[styles.contactValue, { color: getColor('text') }]}>
              {order.customerName}
            </ThemeText>
          </View>
        </View>
        <View style={styles.contactInfo}>
          <View
            style={[styles.contactIconContainer, { backgroundColor: `${getColor('primary')}14` }]}
          >
            <Icon name="phone" size={14} color={getColor('primary')} />
          </View>
          <View style={styles.contactDetails}>
            <ThemeText style={[styles.contactLabel, { color: getColor('subText') }]}>
              Phone
            </ThemeText>
            <ThemeText style={[styles.contactValue, { color: getColor('text') }]}>
              {order.customerPhone}
            </ThemeText>
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
  actionButtonRow: {
    marginTop: 4,
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    alignSelf: 'flex-start',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    letterSpacing: 0.1,
  },
  locationAddress: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 2,
    lineHeight: 19,
  },
  locationCity: {
    fontFamily: Fonts.regular,
    fontSize: 12,
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
    fontFamily: Fonts.medium,
    fontSize: 14,
    marginBottom: 4,
  },
  deliveryAgent: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    marginBottom: 2,
  },
  contactValue: {
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
});

export default OrderInfoCard;
