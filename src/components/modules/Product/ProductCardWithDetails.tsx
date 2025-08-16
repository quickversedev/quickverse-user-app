import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useProductDetails } from '../../../hooks/useProductDetails';
import ProductDetailModal from './ProductDetailModal';

interface ProductCardWithDetailsProps {
  productId: string;
  vendor: {
    name: string;
    shopId: string;
  };
}

const ProductCardWithDetails: React.FC<ProductCardWithDetailsProps> = ({ productId, vendor }) => {
  const { showProductDetails, hideProductDetails, isModalVisible, fetchProductDetails } =
    useProductDetails();

  const handleProductPress = () => {
    showProductDetails(productId);
    fetchProductDetails(productId);
  };

  return (
    <View>
      <TouchableOpacity onPress={handleProductPress}>
        <Text>Click to view product details</Text>
      </TouchableOpacity>

      <ProductDetailModal
        visible={isModalVisible}
        onClose={hideProductDetails}
        productId={productId}
        vendor={vendor}
      />
    </View>
  );
};

export default ProductCardWithDetails;
