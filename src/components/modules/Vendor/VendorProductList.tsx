import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, ViewToken } from 'react-native';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useFeaturedProductsStoreHook from '../../../hooks/useFeaturedProductsStore';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import ProductDetailModal from '../Product/ProductDetailModal';
import VendorProductCard from './VendorProductCard';

interface VendorProductListProps {
  vendors: Vendor[];
  onVendorPress: (vendor: Vendor) => void;
  onProductPress: (product: Product) => void;
  useFlatList?: boolean;
}

// Constants for better performance
const INITIAL_BATCH_SIZE = 6;
const BATCH_SIZE = 6;
const VIEWABILITY_THRESHOLD = 4;
const ITEM_HEIGHT = 200;

const VendorProductListComponent: React.FC<VendorProductListProps> = ({
  vendors,
  onVendorPress,
  onProductPress: _onProductPress,
  useFlatList = true,
}) => {
  const { getColor } = useTheme();
  const { authData } = useAuth();
  const addToCart = useCartStore(state => state.addToCart);

  // State management
  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(null);
  const [loadedVendorsCount, setLoadedVendorsCount] = useState(INITIAL_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);

  // Featured products store
  const { prefetchForVendors } = useFeaturedProductsStoreHook();

  // Memoized values
  const hasAuth = useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);
  const vendorsLength = useMemo(() => vendors.length, [vendors.length]);

  // Get currently visible vendors (for lazy loading)
  const visibleVendors = useMemo(() => {
    if (useFlatList) {
      return vendors.slice(0, loadedVendorsCount);
    }
    return vendors;
  }, [vendors, loadedVendorsCount, useFlatList]);

  // Memoize viewability config
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    []
  );

  // Memoize styles
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: getColor('background'),
        },
      }),
    [getColor]
  );

  // Memoize FlatList performance props
  const flatListProps = useMemo(
    () => ({
      removeClippedSubviews: true,
      maxToRenderPerBatch: BATCH_SIZE,
      windowSize: 10,
      initialNumToRender: INITIAL_BATCH_SIZE,
      showsVerticalScrollIndicator: false,
    }),
    []
  );

  // Load more vendors when needed
  const loadMoreVendors = useCallback(async () => {
    if (!useFlatList || isLoadingMore || loadedVendorsCount >= vendorsLength) return;

    setIsLoadingMore(true);
    try {
      const nextBatchStart = loadedVendorsCount;
      const nextBatchEnd = Math.min(nextBatchStart + BATCH_SIZE, vendorsLength);
      const nextBatchVendors = vendors.slice(nextBatchStart, nextBatchEnd);

      await prefetchForVendors(nextBatchVendors);
      setLoadedVendorsCount(nextBatchEnd);
    } catch (error) {
      console.warn('Failed to load more vendors:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [useFlatList, isLoadingMore, loadedVendorsCount, vendorsLength, vendors, prefetchForVendors]);

  // Handle viewability change for lazy loading
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Vendor>[] }) => {
      if (!useFlatList || viewableItems.length === 0) return;

      const highestVisibleIndex = Math.max(...viewableItems.map(item => item.index || 0));

      if (
        highestVisibleIndex >= VIEWABILITY_THRESHOLD &&
        loadedVendorsCount < vendorsLength &&
        !isLoadingMore
      ) {
        loadMoreVendors();
      }
    },
    [useFlatList, loadedVendorsCount, vendorsLength, isLoadingMore, loadMoreVendors]
  );

  // Memoize key extractor
  const keyExtractor = useCallback((vendor: Vendor) => vendor.shopId, []);

  // Memoize getItemLayout
  const getItemLayout = useCallback(
    (data: ArrayLike<Vendor> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Memoize handleAddToCart
  const handleAddToCart = useCallback(
    (product: Product, vendor: Vendor) => {
      if (!hasAuth) return;

      const cartId = `vendor_${vendor.shopId}`;
      addToCart(
        cartId,
        {
          sku: product.sku,
          shopId: vendor.shopId,
          name: product.name,
          price: product.sellingPrice,
          mrp: product.mrp,
          image: product.imageUrl || '',
          veg: product.veg,
        },
        authData!.jwt,
        authData!.phone
      );
    },
    [hasAuth, addToCart, authData]
  );

  // Memoize handleProductPress
  const handleProductPress = useCallback((product: Product, vendor: Vendor) => {
    const productWithSellingPrice = {
      ...product,
      sku: product.sku,
      shopId: product.shopId,
      sellingPrice: product.sellingPrice,
    };

    setSelectedProductForDetail(productWithSellingPrice);
    setSelectedVendorForDetail(vendor);
    setProductDetailModalVisible(true);
  }, []);

  // Memoize renderVendorItem
  const renderVendorItem = useCallback(
    ({ item: vendor }: { item: Vendor }) => (
      <View key={vendor.shopId}>
        <VendorProductCard
          vendor={vendor}
          onVendorPress={onVendorPress}
          onProductPress={product => handleProductPress(product, vendor)}
          onAddToCart={product => handleAddToCart(product, vendor)}
        />
      </View>
    ),
    [onVendorPress, handleProductPress, handleAddToCart]
  );

  // Memoize modal handlers
  const handleCloseModal = useCallback(() => {
    setProductDetailModalVisible(false);
    setSelectedProductForDetail(null);
    setSelectedVendorForDetail(null);
  }, []);

  // Memoize product ID for modal
  const selectedProductId = useMemo(
    () => selectedProductForDetail?.sku || '',
    [selectedProductForDetail?.sku]
  );

  // Initial load of first batch
  useEffect(() => {
    if (vendorsLength > 0) {
      const initialVendors = useFlatList ? vendors.slice(0, INITIAL_BATCH_SIZE) : vendors;

      prefetchForVendors(initialVendors).catch(error => {
        console.warn('Failed to prefetch featured products:', error);
      });
    }
  }, [vendorsLength, vendors, prefetchForVendors, useFlatList]);

  // Render vendors based on the useFlatList prop
  const renderVendors = useCallback(() => {
    if (useFlatList) {
      return (
        <FlatList
          ref={flatListRef}
          data={visibleVendors}
          renderItem={renderVendorItem}
          keyExtractor={keyExtractor}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          {...flatListProps}
        />
      );
    }

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
  }, [
    useFlatList,
    visibleVendors,
    renderVendorItem,
    keyExtractor,
    onViewableItemsChanged,
    viewabilityConfig,
    getItemLayout,
    flatListProps,
    onVendorPress,
    handleProductPress,
    handleAddToCart,
  ]);

  return (
    <View style={styles.container}>
      {renderVendors()}

      {selectedProductForDetail && selectedVendorForDetail && (
        <ProductDetailModal
          visible={productDetailModalVisible}
          onClose={handleCloseModal}
          product={selectedProductForDetail}
          vendor={selectedVendorForDetail}
        />
      )}
    </View>
  );
};

VendorProductListComponent.displayName = 'VendorProductList';

export default React.memo(VendorProductListComponent);
