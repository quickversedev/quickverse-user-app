import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import ProductCard from '../Product/ProductCard';

interface SuggestedItem {
  name: string;
  price: number;
  image: number;
}

interface SuggestedItemsProps {
  items: SuggestedItem[];
  onAdd: (idx: number) => void;
}

const SuggestedItems: React.FC<SuggestedItemsProps> = ({ items, onAdd }) => {
  const { getColor, getTypography, theme } = useTheme();

  const styles = StyleSheet.create({
    suggestedBox: {
      margin: 16,
      backgroundColor: getColor('card'),
      padding: 16,
      borderRadius: theme.borderRadius.md,
    },
    suggestedTitle: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginBottom: 8,
    },
  });

  const suggestedProducts = useMemo(
    () =>
      items.map((item, idx) => ({
        sku: `suggested_${idx}`,
        shopId: 'mock_shop',
        name: item.name,
        mrp: item.price + 10,
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
        primarySKU: `suggested_${idx}`,
        tags: [],
        veg: true,
      })),
    [items]
  );

  const renderSuggestedItem = useMemo(
    () => (product: any, idx: number) =>
      (
        <ProductCard
          key={idx}
          product={product}
          quantity={0}
          onAdd={() => onAdd(idx)}
          onIncrement={() => onAdd(idx)}
          onDecrement={() => {}}
          size="xs"
          showVariantsCount={false}
          backgroundColor={getColor('card')}
          rating={4.5}
        />
      ),
    [onAdd, getColor]
  );

  return (
    <View style={styles.suggestedBox}>
      <Text style={styles.suggestedTitle}>Add a little somethin&apos;</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {suggestedProducts.map(renderSuggestedItem)}
      </ScrollView>
    </View>
  );
};

export default SuggestedItems;
