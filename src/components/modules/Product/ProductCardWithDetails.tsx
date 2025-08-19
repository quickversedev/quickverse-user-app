import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Product } from '../../../assets/mock/products';
import ProductDetailModal from './ProductDetailModal';

interface ProductCardWithDetailsProps {
  product: Product;
  vendor: {
    name: string;
    shopId: string;
  };
}

const ProductCardWithDetails: React.FC<ProductCardWithDetailsProps> = ({ product, vendor }) => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const handleProductPress = () => {
    setIsModalVisible(true);
  };

  const hideProductDetails = () => {
    setIsModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={handleProductPress}>
        <Text>Click to view product details</Text>
      </TouchableOpacity>

      <ProductDetailModal
        visible={isModalVisible}
        onClose={hideProductDetails}
        product={product}
        vendor={vendor}
      />
    </View>
  );
};

export default ProductCardWithDetails;
