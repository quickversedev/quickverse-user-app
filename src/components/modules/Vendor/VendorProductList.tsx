import React from 'react';
import { StyleSheet, View } from 'react-native';
import useCartStore from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import VendorProductCard from './VendorProductCard';

interface VendorProductListProps {
  vendors: Vendor[];
  onVendorPress: (vendor: Vendor) => void;
  onProductPress: (product: Product) => void;
}

const VendorProductList: React.FC<VendorProductListProps> = ({
  vendors,
  onVendorPress,
  onProductPress,
}) => {
  const { getColor } = useTheme();
  const addToCart = useCartStore(state => state.addToCart);

  const handleAddToCart = (product: Product, vendor: Vendor) => {
    const cartId = `vendor_${vendor.shopId}`;
    addToCart(cartId, {
      sku: product.sku || product.id,
      shopId: vendor.shopId,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      // quantity is handled by the store
    });
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('background'),
    },
  });

  return (
    <View style={styles.container}>
      {vendors.map(vendor => (
        <View key={vendor.shopId}>
          <VendorProductCard
            vendor={vendor}
            onVendorPress={onVendorPress}
            onProductPress={onProductPress}
            onAddToCart={product => handleAddToCart(product, vendor)}
          />
        </View>
      ))}
    </View>
  );
};

export default VendorProductList;
