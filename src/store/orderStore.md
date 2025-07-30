# Order Store Documentation

## Overview

The Order Store is a Zustand-based state management solution for handling user orders in the QuickVerse app. It provides a complete interface for fetching, filtering, and managing orders with pagination support.

## Features

- ✅ Fetch orders with pagination
- ✅ Filter orders by status, shop, and date range
- ✅ Search and filter functionality
- ✅ Error handling and loading states
- ✅ Optimized for React Native
- ✅ TypeScript support

## API Integration

The store integrates with the QuickVerse API endpoint:

```
POST /v2/getSMZBIZOrders?pageSize={pageSize}
```

### Headers

- `SessionKey`: JWT token for authentication
- `Request-Origin`: Set to 'QUICKVERSE'
- `Content-Type`: application/json

### Request Body

```json
{
  "cursor": "string | null"
}
```

## Usage

### Basic Usage with Hook

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useOrders } from '../hooks/useOrders';

const OrdersScreen = () => {
  const { orders, loading, error, loadOrders, getOrdersByStatus, hasMoreOrders } = useOrders();

  React.useEffect(() => {
    // Load orders on component mount
    loadOrders();
  }, []);

  if (loading) {
    return <Text>Loading orders...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      {orders.map(order => (
        <Text key={order.orderId}>
          Order #{order.orderId} - {order.shopName}
        </Text>
      ))}
    </View>
  );
};
```

### Direct Store Usage

```tsx
import useOrderStore from '../store/orderStore';

const MyComponent = () => {
  const { orders, fetchOrders, getOrdersByStatus, setFilters } = useOrderStore();

  const handleLoadOrders = async () => {
    await fetchOrders(); // Load first page
  };

  const handleLoadMore = async () => {
    await fetchOrders(pagination.cursor); // Load next page
  };

  const pendingOrders = getOrdersByStatus('pending');
};
```

### Using the OrderList Component

```tsx
import React from 'react';
import OrderList from '../components/common/OrderList';
import { Order } from '../types/order';

const OrdersScreen = () => {
  const handleOrderPress = (order: Order) => {
    // Navigate to order details
    navigation.navigate('OrderDetails', { orderId: order.orderId });
  };

  return <OrderList onOrderPress={handleOrderPress} showStatusFilter={true} />;
};
```

## Store Methods

### State Properties

- `orders: Order[]` - Array of all fetched orders
- `selectedOrder: Order | null` - Currently selected order
- `loading: boolean` - Loading state
- `error: string | null` - Error message if any
- `filters: OrderFilters` - Current filter settings
- `pagination: OrderPagination` - Pagination information

### Actions

#### `fetchOrders(cursor?: string | null, pageSize?: number)`

Fetches orders from the API with pagination support.

```tsx
// Load first page
await fetchOrders();

// Load next page
await fetchOrders(pagination.cursor);
```

#### `fetchOrderById(orderId: string)`

Fetches a specific order by ID.

```tsx
await fetchOrderById('order123');
```

#### `setFilters(filters: Partial<OrderFilters>)`

Updates the filter settings.

```tsx
setFilters({ status: 'pending' });
setFilters({ shopId: 'shop123' });
setFilters({
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  },
});
```

#### `clearFilters()`

Clears all active filters.

```tsx
clearFilters();
```

### Computed Values

#### `getOrdersByStatus(status: Order['status'])`

Returns orders filtered by status.

```tsx
const pendingOrders = getOrdersByStatus('pending');
const deliveredOrders = getOrdersByStatus('delivered');
```

#### `getFilteredOrders()`

Returns orders based on current filter settings.

```tsx
const filteredOrders = getFilteredOrders();
```

#### `getOrderById(orderId: string)`

Finds an order by ID in the current state.

```tsx
const order = getOrderById('order123');
```

#### `getRecentOrders(limit?: number)`

Returns the most recent orders.

```tsx
const recentOrders = getRecentOrders(5); // Last 5 orders
```

## Order Types

### Order Status

- `pending` - Order is pending confirmation
- `confirmed` - Order has been confirmed
- `preparing` - Order is being prepared
- `ready` - Order is ready for pickup/delivery
- `delivered` - Order has been delivered
- `cancelled` - Order has been cancelled

### Order Structure

```typescript
interface Order {
  orderId: string;
  shopId: string;
  shopName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryAddress: OrderAddress;
  paymentMethod: 'cash' | 'card' | 'upi';
  paymentStatus: 'pending' | 'paid' | 'failed';
  specialInstructions?: string;
  customerName: string;
  customerPhone: string;
}
```

## Error Handling

The store provides comprehensive error handling:

```tsx
const { error, loading } = useOrders();

if (error) {
  return (
    <View>
      <Text>Error: {error}</Text>
      <Button onPress={() => loadOrders()} title="Retry" />
    </View>
  );
}
```

## Best Practices

1. **Use the hook**: Prefer `useOrders()` hook over direct store access for better performance
2. **Handle loading states**: Always check loading state before rendering
3. **Implement pagination**: Use cursor-based pagination for large order lists
4. **Filter efficiently**: Use the built-in filter methods instead of manual filtering
5. **Error boundaries**: Wrap order components in error boundaries
6. **Refresh on focus**: Consider refreshing orders when the screen comes into focus

## Example: Complete Orders Screen

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useOrders } from '../hooks/useOrders';
import OrderList from '../components/common/OrderList';
import { Order } from '../types/order';

const OrdersScreen = ({ navigation }) => {
  const { loadOrders } = useOrders();

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetails', {
      orderId: order.orderId,
    });
  };

  const handleRefresh = () => {
    loadOrders(); // Refresh orders
  };

  return (
    <View style={styles.container}>
      <OrderList onOrderPress={handleOrderPress} showStatusFilter={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default OrdersScreen;
```

## Troubleshooting

### Common Issues

1. **Orders not loading**: Check API endpoint and authentication headers
2. **Pagination not working**: Ensure cursor is being passed correctly
3. **Filters not applying**: Verify filter object structure matches `OrderFilters` interface
4. **Performance issues**: Use `useCallback` for event handlers and implement proper memoization

### Debug Mode

Enable debug logging by setting:

```tsx
// In your development environment
console.log('Orders:', useOrderStore.getState().orders);
console.log('Filters:', useOrderStore.getState().filters);
```
