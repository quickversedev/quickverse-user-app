import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { BadgeTag } from '../../common';
import RatingBadge from '../../common/badges/RatingBadge';
import AddButton from './AddButton';
import QuantitySelector from './QuantitySelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = ((SCREEN_WIDTH - CARD_MARGIN * 4) / 3) * 0.92;
const EXTRA_SMALL_CARD_WIDTH = ((SCREEN_WIDTH - CARD_MARGIN * 6) / 4) * 0.9;

interface ProductCardProps {
  image: number;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  discount: number;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'xs' | 'small' | 'regular';
  disabled?: boolean;
  numberOfVariants?: number;
  showVariantsCount?: boolean;
  onPress?: () => void;
  backgroundColor?: string;
  productId?: string; // Add productId prop
  inStock?: boolean; // Add inStock prop
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  name,
  price,
  mrp,
  rating,
  discount,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  size = 'regular',
  disabled = false,
  numberOfVariants = 1,
  showVariantsCount = false,
  onPress,
  backgroundColor,
  inStock = true, // Default to true for backward compatibility
}) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: backgroundColor || getColor('background'),
      borderRadius: theme.borderRadius.sm,
      // padding: 12,
      margin: CARD_MARGIN,
      width: size === 'xs' ? EXTRA_SMALL_CARD_WIDTH : CARD_WIDTH,
      alignItems: 'center',
      // shadowColor: getColor('shadow').color,
      // shadowOpacity: 0.08,
      // shadowRadius: 4,
      // elevation: 2,
      position: 'relative',
      overflow: 'hidden',
    },
    imageContainer: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
      marginBottom: size === 'xs' ? 4 : 8,
      position: 'relative',
      alignSelf: 'stretch',
      backgroundColor: getColor('border'),
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: theme.borderRadius.sm,
    },
    ratingBadge: {
      position: 'absolute',
      top: size === 'xs' ? 4 : 8,
      right: size === 'xs' ? 4 : 8,
      zIndex: 2,
    },
    BadgeTag: {
      position: 'absolute',
      top: 0,
      left: -1,
      zIndex: 2,
    },

    name: {
      color: getColor('text'),
      fontSize: size === 'xs' ? getTypography('caption') - 2 : getTypography('caption'),
      fontWeight: 'bold',
      marginBottom: size === 'xs' ? 2 : 4,
      alignSelf: 'flex-start',
      marginHorizontal: size === 'xs' ? 2 : 4,
      maxWidth: size === 'xs' ? 100 : 140,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginHorizontal: size === 'xs' ? 2 : 4,
      marginBottom: size === 'xs' ? 4 : 8,
    },
    mrp: {
      color: getColor('subText'),
      fontSize: size === 'xs' ? getTypography('caption') - 2 : getTypography('caption'),
      textDecorationLine: 'line-through',
      marginRight: size === 'xs' ? 4 : 6,
    },
    price: {
      color: getColor('text'),
      fontSize: size === 'xs' ? getTypography('caption') - 2 : getTypography('caption'),
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
      backgroundColor: 'rgba(128, 128, 128, 0.7)',
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

  const cardContent = (
    <View style={styles.card}>
      {disabled && <View style={styles.disabledOverlay} />}
      {!inStock && <View style={styles.outOfStockOverlay} />}
      <View style={styles.imageContainer}>
        <Image
          source={image}
          style={[styles.image, !inStock && styles.grayedOutImage]}
          resizeMode="cover"
        />
        <View style={styles.ratingBadge}>
          {size !== 'xs' && (
            <RatingBadge rating={rating} size={size === 'regular' ? 'medium' : size} />
          )}
        </View>
        {discount > 0 && (
          <View style={styles.BadgeTag}>
            <BadgeTag
              value={discount}
              color="#F44336"
              size={size === 'xs' ? 'small' : size === 'regular' ? 'medium' : size}
              orientation="vertical"
            />
          </View>
        )}
        {!inStock ? (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        ) : quantity === 0 ? (
          <AddButton
            onPress={onAdd}
            size={size}
            numberOfVariants={numberOfVariants}
            showVariantsCount={showVariantsCount}
          />
        ) : (
          <QuantitySelector
            quantity={quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            size={size}
          />
        )}
      </View>
      <Text style={[styles.name, !inStock && { opacity: 0.6 }]} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={[styles.mrp, !inStock && { opacity: 0.6 }]}>₹{mrp}</Text>
        <Text style={[styles.price, !inStock && { opacity: 0.6 }]}>₹{price}</Text>
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

export default ProductCard;
