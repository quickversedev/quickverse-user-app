import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, ViewToken } from 'react-native';
import useFeaturedProductsStoreHook from '../../../hooks/useFeaturedProductsStore';
import useCartStore from '../../../store/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import ProductDetailModal from '../Product/ProductDetailModal';
import VendorProductCard from './VendorProductCard';

// Interface for ProductDetailModal's expected Product type
interface ProductDetailModalProduct extends Product {
  sellingPrice: number;
  sku: string; // Ensure sku is always defined
  shopId: string; // Ensure shopId is always defined
}

interface VendorProductListProps {
  vendors: Vendor[];
  onVendorPress: (vendor: Vendor) => void;
  onProductPress: (product: Product) => void;
  useFlatList?: boolean; // New prop to control rendering mode
}

const VendorProductList: React.FC<VendorProductListProps> = ({
  vendors,
  onVendorPress,
  onProductPress: _onProductPress,
  useFlatList = true, // Default to FlatList for standalone usage
}) => {
  const { getColor } = useTheme();
  const addToCart = useCartStore(state => state.addToCart);
  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] =
    useState<ProductDetailModalProduct | null>(null);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(null);

  // Featured products store
  const { prefetchForVendors } = useFeaturedProductsStoreHook();

  // Lazy loading state (only used when useFlatList is true)
  const [loadedVendorsCount, setLoadedVendorsCount] = useState(6); // Initial batch size
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sortedVendors = useMemo(() => {
    // Active stores first, inactive at the bottom
    return [...vendors].sort((a, b) => {
      if (a.storeActive === b.storeActive) return 0;
      return a.storeActive ? -1 : 1;
    });
  }, [vendors]);

  // Get currently visible vendors (for lazy loading)
  const visibleVendors = useMemo(() => {
    if (useFlatList) {
      return sortedVendors.slice(0, loadedVendorsCount);
    }
    return sortedVendors; // Show all vendors when not using FlatList
  }, [sortedVendors, loadedVendorsCount, useFlatList]);

  // Load more vendors when needed (only for FlatList mode)
  const loadMoreVendors = useCallback(async () => {
    if (!useFlatList || isLoadingMore || loadedVendorsCount >= sortedVendors.length) return;

    setIsLoadingMore(true);
    try {
      const nextBatchStart = loadedVendorsCount;
      const nextBatchEnd = Math.min(nextBatchStart + 6, sortedVendors.length);
      const nextBatchVendors = sortedVendors.slice(nextBatchStart, nextBatchEnd);

      // Prefetch featured products for the next batch
      await prefetchForVendors(nextBatchVendors);

      setLoadedVendorsCount(nextBatchEnd);
    } catch (error) {
      console.warn('Failed to load more vendors:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [useFlatList, isLoadingMore, loadedVendorsCount, sortedVendors.length, prefetchForVendors]);

  // Initial load of first batch
  useEffect(() => {
    if (sortedVendors.length > 0) {
      if (useFlatList) {
        // Load first batch for FlatList mode
        const initialVendors = sortedVendors.slice(0, 6);
        prefetchForVendors(initialVendors).catch(error => {
          console.warn('Failed to prefetch initial featured products:', error);
        });
      } else {
        // Load all vendors for non-FlatList mode
        prefetchForVendors(sortedVendors).catch(error => {
          console.warn('Failed to prefetch featured products:', error);
        });
      }
    }
  }, [sortedVendors, prefetchForVendors, useFlatList]);

  // Handle viewability change for lazy loading (only for FlatList mode)
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Vendor>[] }) => {
      if (!useFlatList || viewableItems.length === 0) return;

      // Find the highest visible index
      const highestVisibleIndex = Math.max(...viewableItems.map(item => item.index || 0));

      // If 5th shop (index 4) is visible and we haven't loaded all vendors yet, load more
      if (highestVisibleIndex >= 4 && loadedVendorsCount < sortedVendors.length && !isLoadingMore) {
        loadMoreVendors();
      }
    },
    [useFlatList, loadedVendorsCount, sortedVendors.length, isLoadingMore, loadMoreVendors]
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50, // Trigger when 50% of item is visible
    }),
    []
  );

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
    // Convert Product to include sellingPrice for ProductDetailModal
    // Using type assertion since ProductDetailModal expects a different Product interface
    const productWithSellingPrice = {
      ...product,
      sku: product.sku || product.id,
      shopId: product.shopId || vendor.shopId,
      sellingPrice: product.price,
    } as ProductDetailModalProduct; // Type assertion to bypass complex type mismatch
    setSelectedProductForDetail(productWithSellingPrice);
    setSelectedVendorForDetail(vendor);
    setProductDetailModalVisible(true);
  };

  const renderVendorItem = ({ item: vendor }: { item: Vendor }) => (
    <View key={vendor.shopId}>
      <VendorProductCard
        vendor={vendor}
        onVendorPress={onVendorPress}
        onProductPress={product => handleProductPress(product, vendor)}
        onAddToCart={product => handleAddToCart(product, vendor)}
      />
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: getColor('background'),
    },
  });

  // Render vendors based on the useFlatList prop
  const renderVendors = () => {
    if (useFlatList) {
      return (
        <FlatList
          ref={flatListRef}
          data={visibleVendors}
          renderItem={renderVendorItem}
          keyExtractor={vendor => vendor.shopId}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          windowSize={10}
          initialNumToRender={6}
          getItemLayout={(data, index) => ({
            length: 200, // Approximate height of VendorProductCard
            offset: 200 * index,
            index,
          })}
        />
      );
    } else {
      // Render all vendors in a simple View when nested in ScrollView
      return (
        <View>
          {visibleVendors.map(vendor => (
            <View key={vendor.shopId}>
              <VendorProductCard
                vendor={vendor}
                onVendorPress={onVendorPress}
                onProductPress={product => handleProductPress(product, vendor)}
                onAddToCart={product => handleAddToCart(product, vendor)}
              />
            </View>
          ))}
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderVendors()}

      {/* Product Detail Modal */}
      {selectedProductForDetail && selectedVendorForDetail && (
        <ProductDetailModal
          visible={productDetailModalVisible}
          onClose={() => {
            setProductDetailModalVisible(false);
            setSelectedProductForDetail(null);
            setSelectedVendorForDetail(null);
          }}
          product={selectedProductForDetail as ProductDetailModalProduct}
          vendor={selectedVendorForDetail}
        />
      )}
    </View>
  );
};

export default VendorProductList;
