# RatingBadge Component

A reusable rating badge component that displays a star icon with a rating value and changes background color based on the rating.

## Features

- **Dynamic Color**: Background color changes based on rating value
- **Multiple Sizes**: Small, medium, and large size options
- **Decimal Control**: Option to show/hide decimal places
- **Consistent Design**: Matches the design from the reference image

## Props

| Prop          | Type                             | Default      | Description                    |
| ------------- | -------------------------------- | ------------ | ------------------------------ |
| `rating`      | `number`                         | **Required** | Rating value (1-5)             |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`   | Size of the badge              |
| `showDecimal` | `boolean`                        | `true`       | Whether to show decimal places |
| `style`       | `StyleProp<ViewStyle>`           | `undefined`  | Additional styles              |

## Color Scheme

| Rating Range | Background Color       | Description   |
| ------------ | ---------------------- | ------------- |
| 4.5 - 5.0    | `#1ec28b` (Teal Green) | Excellent     |
| 4.0 - 4.4    | `#4CAF50` (Green)      | Good          |
| 3.5 - 3.9    | `#FF9800` (Orange)     | Average       |
| 3.0 - 3.4    | `#FFC107` (Yellow)     | Below Average |
| 1.0 - 2.9    | `#F44336` (Red)        | Poor          |

## Usage Examples

```tsx
import RatingBadge from '../components/common/RatingBadge';

// Basic usage
<RatingBadge rating={4.5} />

// Different sizes
<RatingBadge rating={4.2} size="small" />
<RatingBadge rating={4.2} size="medium" />
<RatingBadge rating={4.2} size="large" />

// Without decimal
<RatingBadge rating={4.5} showDecimal={false} />

// With custom styles
<RatingBadge
  rating={4.8}
  style={{ marginTop: 8 }}
/>
```

## Integration

The RatingBadge is automatically used in:

- `ProductCard` component (replaces the old rating display)
- `VendorProductCard` component (via ProductCard)

## Design Reference

Based on the reference image showing a teal-green badge with white star icon and "4.5" rating text.
