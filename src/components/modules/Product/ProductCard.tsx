import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import AddButton from './AddButton';
import QuantitySelector from './QuantitySelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = ((SCREEN_WIDTH - CARD_MARGIN * 4) / 3) * 0.92;

interface ProductCardProps {
  image: number;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: 'small' | 'regular';
  disabled?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  image,
  name,
  price,
  mrp,
  rating,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  size = 'regular',
  disabled = false,
}) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: getColor('card'),
      borderRadius: 18,
      // padding: 12,
      margin: CARD_MARGIN,
      width: CARD_WIDTH,
      alignItems: 'center',
      shadowColor: getColor('shadow').color,
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      position: 'relative',
      overflow: 'hidden',
    },
    imageContainer: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 8,
      position: 'relative',
      alignSelf: 'stretch',
      backgroundColor: getColor('border'),
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
    },
    ratingBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#1ec28b',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 2,
    },
    ratingText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
      marginLeft: 2,
    },

    name: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      marginBottom: 4,
      alignSelf: 'flex-start',
      marginHorizontal: 4,
      maxWidth: 140,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginHorizontal: 4,
      marginBottom: 8,
    },
    mrp: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      textDecorationLine: 'line-through',
      marginRight: 6,
    },
    price: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
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
  });

  return (
    <View style={styles.card}>
      {disabled && <View style={styles.disabledOverlay} />}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={14} color="#fff" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
        {quantity === 0 ? (
          <AddButton onPress={onAdd} size={size} />
        ) : (
          <QuantitySelector
            quantity={quantity}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            size={size}
          />
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.mrp}>₹{mrp}</Text>
        <Text style={styles.price}>₹{price}</Text>
      </View>
    </View>
  );
};

export default ProductCard;
