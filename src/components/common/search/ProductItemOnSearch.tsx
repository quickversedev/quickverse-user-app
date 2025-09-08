import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { ThemeText } from '../../common/theme/ThemeText';

interface ProductItemOnSearchProps {
  product: Product;
  onPress: (product: Product) => void;
}

const ProductItemOnSearch: React.FC<ProductItemOnSearchProps> = ({ product, onPress }) => {
  const { getColor } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      width: '100%',
      paddingHorizontal: 8,
    },
    imageContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getColor('card'),
      marginRight: 8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: 20,
    },
    textContainer: {
      flex: 1,
    },
    productName: {
      color: getColor('text'),
      lineHeight: 16 * 1.2,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(product)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.imageUrl || '' }} style={styles.image} />
      </View>
      <View style={styles.textContainer}>
        <ThemeText
          variant="caption"
          color={getColor('text')}
          style={styles.productName}
          numberOfLines={2}
        >
          {product.name}
        </ThemeText>
      </View>
    </TouchableOpacity>
  );
};

export default ProductItemOnSearch;
