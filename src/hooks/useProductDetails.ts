import { useState } from 'react';
import productDetailsService, { ProductDetailsResponse } from '../services/productDetailsService';

export const useProductDetails = () => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showProductDetails = (productId: string) => {
    setSelectedProductId(productId);
    setIsModalVisible(true);
    setProductDetails(null);
    setError(null);
  };

  const hideProductDetails = () => {
    setIsModalVisible(false);
    setSelectedProductId(null);
    setProductDetails(null);
    setError(null);
  };

  const fetchProductDetails = async (productId: string, includeVariants: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const details = await productDetailsService.getProductDetails(productId, includeVariants);
      setProductDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedProductId,
    isModalVisible,
    productDetails,
    loading,
    error,
    showProductDetails,
    hideProductDetails,
    fetchProductDetails,
  };
};
