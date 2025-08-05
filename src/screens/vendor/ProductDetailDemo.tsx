import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

const ProductDetailDemo: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const navigation = useNavigation();

  const demoProducts = [
    {
      id: '1',
      name: 'Kurkure Puffcorn Yummy Cheese',
      mrp: 79,
      sellingPrice: 69,
      imageUrl: '',
      variants: [
        { id: 'variant_1', name: 'Weight', value: '75 gms' },
        { id: 'variant_2', name: 'Weight', value: '100 gms' },
      ],
    },
    {
      id: '2',
      name: 'Choco Lava Cake',
      mrp: 150,
      sellingPrice: 120,
      imageUrl: '',
      variants: [
        { id: 'variant_1', name: 'Size', value: 'Regular' },
        { id: 'variant_2', name: 'Size', value: 'Large' },
      ],
    },
    {
      id: '3',
      name: 'Vanilla Ice Cream',
      mrp: 99,
      sellingPrice: 79,
      imageUrl: '',
      variants: [
        { id: 'variant_1', name: 'Scoops', value: '1 Scoop' },
        { id: 'variant_2', name: 'Scoops', value: '2 Scoops' },
        { id: 'variant_3', name: 'Scoops', value: '3 Scoops' },
      ],
    },
  ];

  const mockVendor = {
    name: 'Meridian Icecream',
    shopId: '4512',
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: getColor('background'),
      padding: 20,
    },
    title: {
      fontSize: getTypography('h1'),
      fontWeight: 'bold',
      color: getColor('text'),
      textAlign: 'center',
      marginBottom: 30,
    },
    productCard: {
      backgroundColor: getColor('card'),
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: getColor('border'),
    },
    productName: {
      fontSize: getTypography('h3'),
      fontWeight: 'bold',
      color: getColor('text'),
      marginBottom: 8,
    },
    productPrice: {
      fontSize: getTypography('body'),
      color: getColor('subText'),
      marginBottom: 12,
    },
    viewButton: {
      backgroundColor: getColor('primary'),
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    viewButtonText: {
      color: getColor('white'),
      fontSize: getTypography('small'),
      fontWeight: 'bold',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Product Detail Demo</Text>

      {demoProducts.map(product => (
        <View key={product.id} style={styles.productCard}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>
            MRP: ₹{product.mrp} | Price: ₹{product.sellingPrice}
          </Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('ProductDetail', { product, vendor: mockVendor })}
          >
            <Text style={styles.viewButtonText}>View Product Details</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default ProductDetailDemo;
