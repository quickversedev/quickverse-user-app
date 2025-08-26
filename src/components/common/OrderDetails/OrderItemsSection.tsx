import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../theme/ThemeText';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderItemsSectionProps {
  items: OrderItem[];
  title?: string;
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({ items, title = 'Order Items' }) => {
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
    itemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: getColor('border'),
    },
    lastItem: {
      borderBottomWidth: 0,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      color: getColor('text'),
      marginBottom: 4,
    },
    itemQuantity: {
      color: getColor('subText'),
    },
    itemPrice: {
      color: getColor('text'),
    },
  });

  return (
    <View style={styles.container}>
      <ThemeText variant="h2" color={getColor('text')} style={styles.title}>
        {title}
      </ThemeText>

      {items.map((item, index) => (
        <View
          key={item.id}
          style={[styles.itemContainer, index === items.length - 1 && styles.lastItem]}
        >
          <View style={styles.itemInfo}>
            <ThemeText variant="body" color={getColor('text')} style={styles.itemName}>
              {item.name}
            </ThemeText>
            <ThemeText variant="caption" color={getColor('subText')} style={styles.itemQuantity}>
              Qty: {item.quantity} × ₹{item.price}
            </ThemeText>
          </View>
          <ThemeText variant="body" color={getColor('text')} style={styles.itemPrice}>
            ₹{item.total}
          </ThemeText>
        </View>
      ))}
    </View>
  );
};

export default OrderItemsSection;
