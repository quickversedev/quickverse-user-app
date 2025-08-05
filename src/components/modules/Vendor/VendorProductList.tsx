import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import useCartStore from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import ProductDetailModal from '../Product/ProductDetailModal';
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
  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(null);

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

  const handleProductPress = (product: Product, vendor: Vendor) => {
    setSelectedProductForDetail(product);
    setSelectedVendorForDetail(vendor);
    setProductDetailModalVisible(true);
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
            onProductPress={product => handleProductPress(product, vendor)}
            onAddToCart={product => handleAddToCart(product, vendor)}
          />
        </View>
      ))}

      {/* Product Detail Modal */}
      {selectedProductForDetail && selectedVendorForDetail && (
        <ProductDetailModal
          visible={productDetailModalVisible}
          onClose={() => {
            setProductDetailModalVisible(false);
            setSelectedProductForDetail(null);
            setSelectedVendorForDetail(null);
          }}
          product={selectedProductForDetail}
          vendor={selectedVendorForDetail}
        />
      )}
    </View>
  );
};

export default VendorProductList;
