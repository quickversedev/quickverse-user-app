# Cart Store Usage Guide

## New Helper Functions

The cart store now includes helper functions for optimistic updates with automatic rollback on API failure, plus debounced versions to handle rapid clicks.

### Optimistic Update Functions

These functions update the local state immediately and then call the API. If the API fails, they automatically revert to the previous state.

#### 1. `addToCartOptimistic`

```typescript
import useCartStore from '../store/cart/cartStore';

const { addToCartOptimistic } = useCartStore();

// Usage
try {
  await addToCartOptimistic(
    'vendor_shop123',
    {
      sku: 'PROD001',
      shopId: 'shop123',
      name: 'Product Name',
      price: 100,
      mrp: 120,
      image: 'image_url',
      veg: true,
    },
    'jwt_token_here',
    '+1234567890'
  );
} catch (error) {
  // Handle error - state is already reverted
  console.error('Failed to add to cart:', error);
}
```

#### 2. `incrementOptimistic`

```typescript
const { incrementOptimistic } = useCartStore();

// Usage
try {
  await incrementOptimistic('vendor_shop123', 'PROD001', 'jwt_token_here', '+1234567890');
} catch (error) {
  // Handle error - state is already reverted
  console.error('Failed to increment:', error);
}
```

#### 3. `decrementOptimistic`

```typescript
const { decrementOptimistic } = useCartStore();

// Usage
try {
  await decrementOptimistic('vendor_shop123', 'PROD001', 'jwt_token_here', '+1234567890');
} catch (error) {
  // Handle error - state is already reverted
  console.error('Failed to decrement:', error);
}
```

#### 4. `removeFromCartOptimistic`

```typescript
const { removeFromCartOptimistic } = useCartStore();

// Usage
try {
  await removeFromCartOptimistic('vendor_shop123', 'PROD001', 'jwt_token_here', '+1234567890');
} catch (error) {
  // Handle error - state is already reverted
  console.error('Failed to remove from cart:', error);
}
```

### Debounced Functions

These functions automatically debounce rapid clicks (300ms delay) to prevent API spam:

#### 1. `addToCartDebounced`

```typescript
const { addToCartDebounced } = useCartStore();

// Usage - can be called rapidly without API spam
addToCartDebounced(
  'vendor_shop123',
  {
    sku: 'PROD001',
    shopId: 'shop123',
    name: 'Product Name',
    price: 100,
    mrp: 120,
    image: 'image_url',
    veg: true,
  },
  'jwt_token_here',
  '+1234567890'
);
```

#### 2. `incrementDebounced`

```typescript
const { incrementDebounced } = useCartStore();

// Usage - rapid clicks are debounced
incrementDebounced('vendor_shop123', 'PROD001', 'jwt_token_here', '+1234567890');
```

#### 3. `decrementDebounced`

```typescript
const { decrementDebounced } = useCartStore();

// Usage - rapid clicks are debounced
decrementDebounced('vendor_shop123', 'PROD001', 'jwt_token_here', '+1234567890');
```

#### 4. `removeFromCartDebounced`

```typescript
const { removeFromCartDebounced } = useCartStore();

// Usage - rapid clicks are debounced
removeFromCartDebounced('vendor_shop123', 'PROD001', 'jwt_token_here', '+1234567890');
```

## Key Benefits

1. **Immediate UI Response**: Local state updates instantly for better UX
2. **Automatic Rollback**: If API fails, state automatically reverts
3. **Debouncing**: Prevents rapid API calls from multiple clicks
4. **Error Handling**: Built-in error handling with state consistency
5. **Type Safety**: Full TypeScript support

## When to Use Which Function

- **Use optimistic functions** when you need to handle errors and want immediate feedback
- **Use debounced functions** when you want to prevent rapid API calls (e.g., quantity buttons)
- **Use original functions** when you need loading states and explicit error handling

## Example: Product Quantity Controls

```typescript
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import useCartStore from '../store/cart/cartStore';

const QuantityControls = ({ cartId, sku, jwtToken, phone }) => {
  const { incrementDebounced, decrementDebounced } = useCartStore();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity
        onPress={() => decrementDebounced(cartId, sku, jwtToken, phone)}
        style={{ padding: 10, backgroundColor: '#f0f0f0' }}
      >
        <Text>-</Text>
      </TouchableOpacity>

      <Text style={{ marginHorizontal: 15 }}>1</Text>

      <TouchableOpacity
        onPress={() => incrementDebounced(cartId, sku, jwtToken, phone)}
        style={{ padding: 10, backgroundColor: '#f0f0f0' }}
      >
        <Text>+</Text>
      </TouchableOpacity>
    </View>
  );
};
```

This approach ensures smooth user experience while maintaining data consistency and preventing API abuse.
