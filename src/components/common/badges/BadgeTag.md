# BadgeTag Component

A customizable discount tag component that displays promotional badges with various styles, colors, and orientations.

## Features

- **Dynamic Values**: Supports both numbers and strings
- **Multiple Colors**: Customizable background colors
- **Size Variants**: Small, medium, and large sizes
- **Orientation**: Vertical and horizontal layouts
- **3D Effect**: Shadow and scalloped bottom edge
- **Text Effects**: Bold text with shadow for better visibility

## Props

| Prop          | Type                             | Default      | Description                   |
| ------------- | -------------------------------- | ------------ | ----------------------------- |
| `value`       | `string \| number`               | **Required** | The value to display          |
| `color`       | `string`                         | `'#F44336'`  | Background color of the badge |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`   | Size of the badge             |
| `orientation` | `'vertical' \| 'horizontal'`     | `'vertical'` | Layout direction              |
| `style`       | `StyleProp<ViewStyle>`           | `undefined`  | Additional styles             |

## Design Features

- **Scalloped Bottom**: Rounded bottom corners for tag-like appearance
- **3D Shadow**: Subtle shadow for depth and visual appeal
- **Text Shadow**: White text with dark shadow for better contrast
- **Auto-formatting**: Numbers automatically get "%" suffix
- **Smart Layout**: Vertical mode splits "50%" into "50%" and "OFF"

## Usage Examples

```tsx
import BadgeTag from '../components/common/BadgeTag';

// Basic usage (like the reference image)
<BadgeTag value={50} />

// Different colors
<BadgeTag value={30} color="#4CAF50" />
<BadgeTag value={40} color="#2196F3" />

// Different sizes
<BadgeTag value={50} size="small" />
<BadgeTag value={50} size="large" />

// Horizontal layout
<BadgeTag value={50} orientation="horizontal" />

// Custom text
<BadgeTag value="SALE" color="#FF9800" />

// With custom styles
<BadgeTag
  value={50}
  style={{ transform: [{ rotate: '-15deg' }] }}
/>
```

## Color Recommendations

| Use Case      | Color Code | Description   |
| ------------- | ---------- | ------------- |
| Discount      | `#F44336`  | Red (default) |
| Sale          | `#FF9800`  | Orange        |
| Special Offer | `#4CAF50`  | Green         |
| Limited Time  | `#2196F3`  | Blue          |
| Hot Deal      | `#FF5722`  | Deep Orange   |

## Integration

The BadgeTag can be used in:

- Product cards for discount display
- Promotional banners
- Category headers
- Special offer indicators

## Design Reference

Based on the reference image showing a red tag with "50% OFF" text, scalloped bottom edge, and 3D shadow effect.
