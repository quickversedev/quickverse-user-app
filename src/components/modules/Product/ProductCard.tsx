import React, { memo, useMemo } from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { BadgeTag, VegIcon } from '../../common';
import RatingBadge from '../../common/badges/RatingBadge';
import AddButton from './AddButton';
import QuantitySelector from './QuantitySelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 4;
const SIDEBAR_WIDTH = 70;
const PRODUCT_LIST_PADDING = 8;
const AVAILABLE_WIDTH = SCREEN_WIDTH - SIDEBAR_WIDTH - PRODUCT_LIST_PADDING * 2;
const CARD_WIDTH = ((SCREEN_WIDTH - CARD_MARGIN * 4) / 3) * 0.92;
const CARD_WIDTH_SMALL = CARD_WIDTH * 0.8;
const EXTRA_SMALL_CARD_WIDTH = ((SCREEN_WIDTH - CARD_MARGIN * 6) / 4) * 0.9;
const CARD_WIDTH_BIG = (AVAILABLE_WIDTH - CARD_MARGIN * 3) / 2; // 2 cards per row with sidebar

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'xs' | 'small' | 'regular' | 'big';
  disabled?: boolean;
  showVariantsCount?: boolean;
  onPress?: () => void;
  backgroundColor?: string;
  rating?: number;
  isStoreClosed?: boolean;
}

// Helper to get card width based on size
const getCardWidth = (size: 'xs' | 'small' | 'regular' | 'big') => {
  switch (size) {
    case 'xs':
      return EXTRA_SMALL_CARD_WIDTH;
    case 'small':
      return CARD_WIDTH_SMALL;
    case 'big':
      return CARD_WIDTH_BIG;
    default:
      return CARD_WIDTH;
  }
};

// Extract styles outside component to prevent recreation on every render
const createStyles = (
  size: 'xs' | 'small' | 'regular' | 'big',
  getColor: (color: any) => string,
  getTypography: (type: 'small' | 'caption' | 'h1' | 'h2' | 'subtitle' | 'body') => number,
  theme: { borderRadius: { sm: number } },
  veg: boolean,
  backgroundColor?: string
) =>
  StyleSheet.create({
    card: {
      backgroundColor: backgroundColor || getColor('background'),
      borderRadius: theme.borderRadius.sm,
      margin: CARD_MARGIN,
      width: getCardWidth(size),
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    imageContainer: {
      width: '100%',
      aspectRatio: size === 'small' ? 4.8 / 5 : size === 'big' ? 1 : 7 / 5,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
      marginBottom: size === 'xs' ? 4 : 8,
      position: 'relative',
      alignSelf: 'stretch',
      backgroundColor: getColor('border'),
      // Ensure proper image container sizing
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: theme.borderRadius.sm,
      // Ensure image fits properly within container
      flex: 1,
      alignSelf: 'stretch',
    },
    ratingBadge: {
      position: 'absolute',
      top: size === 'xs' ? 4 : 8,
      right: size === 'xs' ? 4 : 8,
      zIndex: 2,
    },
    badgeTag: {
      position: 'absolute',
      top: 0,
      left: -1,
      zIndex: 2,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginHorizontal: size === 'xs' ? 2 : 4,
      marginBottom: size === 'xs' ? 2 : 4,
    },

    name: {
      color: getColor('text'),
      // Keep a consistent two-line block height
      fontSize:
        size === 'xs'
          ? getTypography('caption') - 3
          : size === 'big'
            ? getTypography('body')
            : getTypography('caption') - 2,
      lineHeight:
        (size === 'xs'
          ? getTypography('caption') - 3
          : size === 'big'
            ? getTypography('body')
            : getTypography('caption') - 2) * 1.2,
      minHeight:
        (size === 'xs'
          ? getTypography('caption') - 3
          : size === 'big'
            ? getTypography('body')
            : getTypography('caption') - 2) *
        1.2 *
        2,
      fontWeight: 'bold',
      flex: 1,
      maxWidth: size === 'xs' ? 90 : size === 'small' ? 110 : size === 'big' ? 180 : 130,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch',
      width: '100%',
      marginHorizontal: size === 'xs' ? 2 : 4,
      marginBottom: size === 'xs' ? 4 : 8,
    },
    priceLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mrp: {
      color: getColor('subText'),
      fontSize:
        size === 'xs'
          ? getTypography('caption') - 2
          : size === 'big'
            ? getTypography('body')
            : getTypography('caption'),
      textDecorationLine: 'line-through',
      marginRight: size === 'xs' ? 4 : 6,
    },
    price: {
      color: getColor('text'),
      fontSize:
        size === 'xs'
          ? getTypography('caption') - 2
          : size === 'big'
            ? getTypography('body')
            : getTypography('caption'),
      fontWeight: 'bold',
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 10,
    },
    outOfStockOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(202, 198, 198, 0.15)',
      zIndex: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    outOfStockText: {
      color: getColor('white'),
      fontSize: size === 'xs' ? getTypography('caption') - 2 : getTypography('caption'),
      fontWeight: 'bold',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    grayedOutImage: {
      width: '100%',
      height: '100%',
      borderRadius: theme.borderRadius.sm,
      opacity: 0.5,
    },
  });

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  size = 'regular',
  disabled = false,
  showVariantsCount = false,
  onPress,
  backgroundColor,
  rating = 0,
  isStoreClosed = false,
}) => {
  const { getColor, getTypography, theme } = useTheme();

  // Memoize expensive calculations
  const {
    imageUrl: image,
    name,
    sellingPrice: price,
    mrp,
    discount,
    numberOfVariants,
    inStock,
    veg,
  } = product;

  const imageSource: ImageSourcePropType = useMemo(() => {
    if (typeof image === 'string' && image.trim()) {
      // Clean the URL by removing invalid characters and whitespace
      const cleanUrl = image.trim().replace(/^@+/, ''); // Remove leading @ symbols
      if (cleanUrl && cleanUrl.startsWith('http')) {
        return { uri: cleanUrl };
      }
    }
    if (image && typeof image === 'object') {
      return image;
    }
    return require('../../../assets/images/food.png');
  }, [image]);

  const styles = useMemo(
    () => createStyles(size, getColor, getTypography, theme, veg, backgroundColor),
    [size, getColor, getTypography, theme, veg, backgroundColor]
  );

  const showMrp = useMemo(() => mrp !== price, [mrp, price]);
  const showDiscount = useMemo(() => discount > 0, [discount]);
  const showRating = useMemo(() => size !== 'xs', [size]);
  const isOutOfStock = useMemo(() => !inStock, [inStock]);
  const hasQuantity = useMemo(() => quantity > 0, [quantity]);

  const cardContent = (
    <View style={styles.card}>
      {disabled && <View style={styles.disabledOverlay} />}
      {isOutOfStock && <View style={styles.outOfStockOverlay} />}

      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={[styles.image, isOutOfStock && styles.grayedOutImage]}
          resizeMode="cover"
          // Ensure proper image fitting
          onError={() => console.warn('Failed to load image:', image)}
          // Add fallback image
          defaultSource={require('../../../assets/images/food.png')}
          // Add loading indicator
        />

        {showRating && (
          <View style={styles.ratingBadge}>
            <RatingBadge
              rating={rating}
              size={size === 'regular' ? 'medium' : size === 'xs' ? 'small' : 'medium'}
            />
          </View>
        )}

        {showDiscount && (
          <View style={styles.badgeTag}>
            <BadgeTag
              text={`${discount}%`}
              variant="error"
              size={size === 'xs' ? 'small' : size === 'regular' ? 'medium' : size}
            />
          </View>
        )}

        {isOutOfStock || isStoreClosed ? (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>
              {isStoreClosed ? 'STORE CLOSED' : 'OUT OF STOCK'}
            </Text>
          </View>
        ) : !hasQuantity ? (
          <AddButton
            onPress={onAdd}
            size={size}
            numberOfVariants={numberOfVariants}
            showVariantsCount={showVariantsCount}
            disabled={isStoreClosed}
          />
        ) : (
          <QuantitySelector
            quantity={quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            size={size}
            disabled={isStoreClosed}
          />
        )}
      </View>

      <View style={styles.nameContainer}>
        <Text style={[styles.name, isOutOfStock && { opacity: 0.6 }]} numberOfLines={2}>
          {name}
        </Text>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceLeft}>
          {showMrp && <Text style={[styles.mrp, isOutOfStock && { opacity: 0.6 }]}>₹{mrp}</Text>}
          <Text style={[styles.price, isOutOfStock && { opacity: 0.6 }]}>₹{price}</Text>
        </View>
        <View style={{ marginRight: 4 }}>
          <VegIcon veg={veg} size="xs" />
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

ProductCard.displayName = 'ProductCard';

export default memo(ProductCard);
