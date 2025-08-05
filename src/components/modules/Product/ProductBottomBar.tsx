import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface ProductBottomBarProps {
  mrp: number;
  sellingPrice: number;
  onAddToCart: () => void;
}

const ProductBottomBar: React.FC<ProductBottomBarProps> = ({ mrp, sellingPrice, onAddToCart }) => {
  const { getColor, getTypography } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('card'),
      borderTopWidth: 1,
      borderTopColor: getColor('border'),
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    priceContainer: {
      flex: 1,
    },
    mrpText: {
      fontSize: getTypography('caption'),
      color: getColor('subText'),
      textDecorationLine: 'line-through',
      marginBottom: 2,
    },
    sellingPriceText: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
    },
    addButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
    },
    addButtonText: {
      color: getColor('white'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.priceContainer}>
        <Text style={styles.mrpText}>MRP ₹{mrp}</Text>
        <Text style={styles.sellingPriceText}>₹{sellingPrice}</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
        <Text style={styles.addButtonText}>ADD +</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProductBottomBar;
