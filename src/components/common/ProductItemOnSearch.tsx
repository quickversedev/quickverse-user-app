import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface ProductItemOnSearchProps {
  product: {
    id: string;
    name: string;
    image: string;
  };
  onPress: (product: any) => void;
}

const ProductItemOnSearch: React.FC<ProductItemOnSearchProps> = ({ product, onPress }) => {
  const { getColor, getTypography, theme } = useTheme();

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
      fontSize: getTypography('caption'),
      fontWeight: '500',
      lineHeight: getTypography('caption') * 1.2,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(product)}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ProductItemOnSearch;
