import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Order } from '../../../types/order';

interface OrderItemsSectionProps {
  order: Order;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({ order }) => {
  const { getColor } = useTheme();

  return (
    <View style={[styles.itemsSection, { backgroundColor: getColor('card') }]}>
      {order.items.map((item, index) => (
        <View key={index} style={styles.itemContainer}>
          <View style={styles.itemContent}>
            <View style={styles.itemLeft}>
              <View style={styles.nonVegIcon}>
                <Icon name="triangle" size={8} color="#FF4444" />
              </View>
              <Text style={[styles.itemName, { color: getColor('text') }]}>
                {item.name} x{item.quantity}
              </Text>
            </View>
            <Text style={[styles.itemPrice, { color: getColor('text') }]}>
              ₹{item.totalPrice.toFixed(0)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  itemsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nonVegIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#FF4444',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderItemsSection;
