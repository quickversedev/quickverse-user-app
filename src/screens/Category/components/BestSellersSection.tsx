import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import SectionDivider from '../../../components/common/SectionDivider';
import VendorProductCard from '../../../components/modules/Vendor/VendorProductCard';
import ProductDetailModal from '../../../components/modules/Product/ProductDetailModal';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useCartStore from '../../../store/cart/cartStore';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';

interface BestSellersSectionProps {
  vendors: Vendor[];
  onVendorPress: (vendor: Vendor) => void;
}

const BestSellersSection: React.FC<BestSellersSectionProps> = ({ vendors, onVendorPress }) => {
  const { authData } = useAuth();
  const addToCart = useCartStore(state => state.addToCart);

  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleAddToCart = useCallback(
    (product: Product, vendor: Vendor) => {
      const cartId = `vendor_${vendor.shopId}`;
      addToCart(
        cartId,
        {
          sku: product.sku,
          shopId: vendor.shopId,
          name: product.name,
          price: product.sellingPrice,
          mrp: product.mrp,
          image: typeof product.imageUrl === 'string' ? product.imageUrl : '',
          veg: product.veg,
        },
        authData?.jwt || '',
        authData?.phone || '',
      );
    },
    [addToCart, authData],
  );

  const handleProductPress = useCallback((product: Product, vendor: Vendor) => {
    setSelectedProduct({
      ...product,
      sku: product.sku,
      shopId: product.shopId,
      sellingPrice: product.sellingPrice,
    });
    setSelectedVendor(vendor);
    setProductDetailModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setProductDetailModalVisible(false);
    setSelectedProduct(null);
    setSelectedVendor(null);
  }, []);

  return (
    <View>
      <SectionDivider
        text="Best Sellers"
        style={{ marginTop: 6, marginBottom: 10, paddingHorizontal: 40 }}
        textStyle={{
          color: '#4B5563',
          fontWeight: '600',
          fontFamily: 'serif',
          fontStyle: 'italic',
          fontSize: 16,
        }}
      />

      {vendors.map(vendor => (
        <VendorProductCard
          key={vendor.shopId}
          vendor={vendor}
          onVendorPress={onVendorPress}
          onProductPress={product => handleProductPress(product, vendor)}
          onAddToCart={product => handleAddToCart(product, vendor)}
        />
      ))}

      {selectedProduct && selectedVendor && (
        <ProductDetailModal
          visible={productDetailModalVisible}
          onClose={handleCloseModal}
          product={selectedProduct}
          vendor={selectedVendor}
        />
      )}
    </View>
  );
};

export default React.memo(BestSellersSection);
