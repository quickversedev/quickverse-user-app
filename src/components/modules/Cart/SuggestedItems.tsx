import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { ThemeText } from '../../common/theme/ThemeText';
import ProductCard from '../Product/ProductCard';

export interface SuggestedItem {
  sku: string;
  name: string;
  price: number;
  image: number;
}

interface SuggestedItemsProps {
  items: SuggestedItem[];
}

const SuggestedItems: React.FC<SuggestedItemsProps> = ({ items }) => {
  const { getColor, theme } = useTheme();

  const styles = StyleSheet.create({
    suggestedBox: {
      margin: 16,
      backgroundColor: getColor('card'),
      padding: 16,
      borderRadius: theme.borderRadius.md,
    },
    suggestedTitle: {
      color: getColor('text'),
      marginBottom: 8,
    },
  });

  const suggestedProducts = useMemo(
    () =>
      items.map((item, idx) => ({
        sku: `${idx}`,
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
        imageUrl: item.image.toString(),
        discount: 0,
        numberOfVariants: 1,
        currentStock: 10,
        inStock: true,
        primarySKU: `suggested_${idx}`,
        tags: [],
        veg: true,
        rating: 4.5,
      })),
    [items]
  );

  const { carts, activeCartId, addToCart, increment, decrement } = useCartStore();
  const { authData } = useAuth();
  const activeCart = activeCartId ? carts[activeCartId] : null;

  const handleAdd = (idx: number) => {
    const product = suggestedProducts[idx];
    if (activeCartId && authData?.jwt && authData?.phone) {
      const cartProduct = {
        sku: product.sku,
        shopId: product.shopId,
        name: product.name,
        price: product.sellingPrice,
        mrp: product.mrp,
        image: product.imageUrl,
        veg: product.veg,
      };
      addToCart(activeCartId, cartProduct, authData.jwt, authData.phone);
    }
  };

  const handleIncrement = (idx: number) => {
    const product = suggestedProducts[idx];
    if (activeCartId && authData?.jwt && authData?.phone) {
      increment(activeCartId, product.sku, authData.jwt, authData.phone);
    }
  };

  const handleDecrement = (idx: number) => {
    const product = suggestedProducts[idx];
    if (activeCartId && authData?.jwt && authData?.phone) {
      decrement(activeCartId, product.sku, authData.jwt, authData.phone);
    }
  };

  const renderSuggestedItem = (product: Product, idx: number) => (
    <ProductCard
      key={idx}
      product={product}
      quantity={activeCart?.products[product.sku]?.quantity || 0}
      onAdd={() => handleAdd(idx)}
      onIncrement={() => handleIncrement(idx)}
      onDecrement={() => handleDecrement(idx)}
      size="xs"
      backgroundColor={getColor('card')}
      rating={4.5}
    />
  );

  return (
    <View style={styles.suggestedBox}>
      <ThemeText variant="body" color={getColor('text')} style={styles.suggestedTitle}>
        Add a little somethin&apos;
      </ThemeText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {suggestedProducts.map(renderSuggestedItem)}
      </ScrollView>
    </View>
  );
};

export default SuggestedItems;
