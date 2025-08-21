import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useProductsStore } from '../../../store/products/productsStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import ProductCard from './ProductCard';

interface SuggestedItem {
  id: string;
  name: string;
  price: number;
  mrp: number;
  rating: number;
  image: number;
  quantity: number;
}

interface SuggestedItemsProps {
  categories?: string; // Comma-separated categories
  products?: Product[]; // Direct products to show
  onItemPress: (item: SuggestedItem) => void;
  onAdd: (item: SuggestedItem) => void;
  onIncrement: (item: SuggestedItem) => void;
  onDecrement: (item: SuggestedItem) => void;
}

const SuggestedItems: React.FC<SuggestedItemsProps> = ({
  categories,
  products,
  onItemPress,
  onAdd,
  onIncrement,
  onDecrement,
}) => {
  const { getColor, getTypography } = useTheme();
  const { getProductsByCategories } = useProductsStore();
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedItem[]>([]);
  // Resolve items from provided products or categories
  useEffect(() => {
    if (products && products.length > 0) {
      const fromProducts: SuggestedItem[] = products.slice(0, 10).map(p => ({
        id: p.sku,
        name: p.name,
        price: p.sellingPrice,
        mrp: p.mrp,
        rating: (p as any).rating || 4.5,
        image: (p.imageUrl as unknown as number) || 0,
        quantity: 0,
      }));
      setSuggestedProducts(fromProducts);
      return;
    }

    if (categories && categories.trim()) {
      const categoryProducts = getProductsByCategories(categories);
      const convertedItems: SuggestedItem[] = categoryProducts.slice(0, 10).map(product => ({
        id: product.sku,
        name: product.name,
        price: product.sellingPrice,
        mrp: product.mrp,
        rating: 4.5,
        image: (product.imageUrl as unknown as number) || 0,
        quantity: 0,
      }));
      setSuggestedProducts(convertedItems);
      return;
    }

    setSuggestedProducts([]);
  }, [products, categories, getProductsByCategories]);

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 20,
      backgroundColor: getColor('card'),
      margin: 16,
      marginBottom: 100,
      borderRadius: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    title: {
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
      color: getColor('text'),
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewAllText: {
      fontSize: getTypography('small'),
      color: getColor('primary'),
      fontWeight: '500',
      marginRight: 4,
    },
    itemsList: {
      paddingLeft: 20,
    },
  });

  const renderItem = ({ item }: { item: SuggestedItem }) => {
    // Create a mock product object from SuggestedItem
    const mockProduct = {
      sku: item.id,
      shopId: 'suggested_shop',
      name: item.name,
      mrp: item.mrp,
      sellingPrice: item.price,
      gst: 0,
      category: 'suggested',
      division: 'suggested',
      subDivision: 'suggested',
      brand: 'suggested',
      description: '',
      imageUrl: item.image,
      discount: 0,
      numberOfVariants: 1,
      currentStock: 10,
      inStock: true,
      primarySKU: item.id,
      tags: [],
    };

    return (
      <ProductCard
        product={mockProduct}
        quantity={item.quantity}
        onAdd={() => onAdd(item)}
        onIncrement={() => onIncrement(item)}
        onDecrement={() => onDecrement(item)}
        size="xs"
        onPress={() => onItemPress(item)}
        backgroundColor={getColor('card')}
        rating={item.rating || 0}
      />
    );
  };

  // Don't render if no suggested products
  if (suggestedProducts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add a little somethin&apos;</Text>
      </View>

      <FlatList
        data={suggestedProducts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemsList}
      />
    </View>
  );
};

export default SuggestedItems;
