import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface ProductBottomBarProps {
  price: number;
  mrp: number;
  onAddToCart: () => void;
  disabled?: boolean;
}

const ProductBottomBar: React.FC<ProductBottomBarProps> = ({
  price,
  mrp,
  onAddToCart,
  disabled = false,
}) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceContainer: {
      flex: 1,
    },
    mrpText: {
      color: getColor('subText'),
      textDecorationLine: 'line-through',
      marginBottom: 2,
    },
    priceText: {
      color: getColor('text'),
    },
    addToCartButton: {
      backgroundColor: getColor('primary'),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
    },
    addToCartText: {
      color: getColor('white'),
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.priceContainer}>
        {mrp !== price && (
          <ThemeText variant="caption" color={getColor('subText')} style={styles.mrpText}>
            MRP ₹{mrp}
          </ThemeText>
        )}
        <ThemeText variant="h2" color={getColor('text')} style={styles.priceText}>
          ₹{price}
        </ThemeText>
      </View>

      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={onAddToCart}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="cart-plus" size={20} color={getColor('white')} />
        <ThemeText variant="body" color={getColor('white')} style={styles.addToCartText}>
          Add to Cart
        </ThemeText>
      </TouchableOpacity>
    </View>
  );
};

export default ProductBottomBar;
