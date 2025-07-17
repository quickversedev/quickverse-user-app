import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = ((SCREEN_WIDTH - CARD_MARGIN * 4) / 3) * 0.92;

interface ProductCardProps {
  image: any;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  onAdd: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ image, name, price, mrp, rating, onAdd }) => {
  const { getColor, getTypography } = useTheme();
  const [quantity, setQuantity] = useState(0);

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
    addButton: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: 12,
      minWidth: 70,
      height: 36,
      paddingHorizontal: 0,
      paddingVertical: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('card'),
      zIndex: 3,
    },
    addButtonText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
      marginLeft: 4,
    },
    quantitySelector: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      borderWidth: 1,
      borderColor: getColor('primary'),
      borderRadius: 12,
      minWidth: 80,
      height: 36,
      paddingHorizontal: 0,
      paddingVertical: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: getColor('card'),
      zIndex: 3,
    },
    qtyBtn: {
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    qtyText: {
      color: '#FFD600',
      fontSize: getTypography('caption'),
      fontWeight: 'bold',
      minWidth: 15,
      textAlign: 'center',
    },
    qtyNum: {
      color: '#fff',
      fontSize: getTypography('caption'),
      marginHorizontal: 4,
      minWidth: 18,
      textAlign: 'center',
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
  });

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={14} color="#fff" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
        {quantity === 0 ? (
          <TouchableOpacity style={styles.addButton} onPress={() => setQuantity(1)}>
            <Text style={styles.addButtonText}>ADD +</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(qty => Math.max(0, qty - 1))}
            >
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(qty => qty + 1)}>
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>
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
