# Order Screens

This directory contains the order success and failure screens for the QV User App.

## Screens

### OrderSuccessScreen

Displays a success confirmation when an order is placed successfully.

**Features:**

- Green checkmark icon with decorative dots
- Order amount display
- Success message
- Order ID and date
- "Back to Home" and "Track Order" buttons

**Navigation:**

```typescript
navigation.navigate('OrderSuccess', {
  orderId: '12345',
  amount: 240,
  date: '10th July 2025 • Tuesday',
});
```

### OrderFailureScreen

Displays an error message when an order placement fails.

**Features:**

- Red X icon
- Error message
- Optional detailed error description
- "Back to Home" and "Try Again" buttons

**Navigation:**

```typescript
navigation.navigate('OrderFailure', {
  errorMessage: 'Payment failed. Please try again with a different payment method.',
});
```

## Usage Example

```typescript
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../routes/AppStack';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MyComponent = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleOrderSuccess = () => {
    navigation.navigate('OrderSuccess', {
      orderId: '12345',
      amount: 240,
      date: '10th July 2025 • Tuesday',
    });
  };

  const handleOrderFailure = () => {
    navigation.navigate('OrderFailure', {
      errorMessage: 'Payment failed. Please try again.',
    });
  };

  return (
    // Your component JSX
  );
};
```

## Styling

Both screens use the app's theme system and are designed to work with both Android and iOS platforms. They follow the existing design patterns:

- Dark background (`#111827`)
- Yellow accent color (`#FEDB51`)
- Green success color (`#4ADE80`)
- Red error color (`#F87171`)
- BricolageGrotesque font family

## Demo

Use `OrderScreensDemo.tsx` to test both screens during development.
