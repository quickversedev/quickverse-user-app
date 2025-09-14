import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  ViewToken,
} from 'react-native';
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
  header?: React.ReactNode;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollY?: Animated.Value;
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
  header,
  onScroll,
  scrollEventThrottle,
  showsVerticalScrollIndicator,
  contentContainerStyle,
  scrollY,
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
    // Render only a slice to avoid mounting a large number of cards at once
    return vendors.slice(0, loadedVendorsCount);
  }, [vendors, loadedVendorsCount]);

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
        headerSpacer: {
          marginBottom: 16,
        },
        footer: {
          paddingVertical: 12,
        },
      }),
    [getColor]
  );

  // Memoize FlatList performance props
  const flatListProps = useMemo(
    () => ({
      removeClippedSubviews: Platform.OS === 'android',
      maxToRenderPerBatch: BATCH_SIZE,
      windowSize: 7,
      initialNumToRender: INITIAL_BATCH_SIZE,
      updateCellsBatchingPeriod: 50,
      onEndReachedThreshold: 0.5,
    }),
    []
  );

  // Load more vendors when needed
  const loadMoreVendors = useCallback(async () => {
    if (isLoadingMore || loadedVendorsCount >= vendorsLength) return;

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
  }, [isLoadingMore, loadedVendorsCount, vendorsLength, vendors, prefetchForVendors]);

  // Handle viewability change for lazy loading
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<Vendor>[] }) => {
      if (viewableItems.length === 0) return;

      const highestVisibleIndex = Math.max(...viewableItems.map(item => item.index || 0));

      if (
        highestVisibleIndex >= VIEWABILITY_THRESHOLD &&
        loadedVendorsCount < vendorsLength &&
        !isLoadingMore
      ) {
        loadMoreVendors();
      }

      // Auto-boost initial batch if too few visible items (e.g., hidden cards)
      const desired = Math.min(INITIAL_BATCH_SIZE, vendorsLength);
      if (viewableItems.length < desired && loadedVendorsCount < vendorsLength) {
        setLoadedVendorsCount(c => Math.min(c + BATCH_SIZE, vendorsLength));
      }
    },
    [loadedVendorsCount, vendorsLength, isLoadingMore, loadMoreVendors]
  );

  // Memoize key extractor
  const keyExtractor = useCallback((vendor: Vendor) => vendor.shopId, []);

  // getItemLayout intentionally omitted: card heights may vary; avoiding jumpiness

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

  // Initial load of first batch
  useEffect(() => {
    if (vendorsLength > 0) {
      const initialVendors = vendors.slice(0, INITIAL_BATCH_SIZE);

      prefetchForVendors(initialVendors).catch(error => {
        console.warn('Failed to prefetch featured products:', error);
      });
    }
  }, [vendorsLength, vendors, prefetchForVendors]);

  // Render vendors with a safe top inset so header isn't hidden
  const renderVendors = useCallback(() => {
    const topInsetHeight = Platform.select({ ios: 80, android: 100 });
    const composedHeader = (
      <>
        <View style={{ height: topInsetHeight }} />
        {header || null}
      </>
    );

    return (
      <Animated.FlatList
        ref={flatListRef}
        data={visibleVendors}
        renderItem={renderVendorItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={composedHeader}
        ListHeaderComponentStyle={styles.headerSpacer}
        contentContainerStyle={[{ paddingBottom: 100 }, contentContainerStyle]}
        onScroll={
          scrollY
            ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                useNativeDriver: true,
                listener: onScroll,
              })
            : onScroll
        }
        scrollEventThrottle={scrollEventThrottle ?? 16}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={loadMoreVendors}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        {...flatListProps}
      />
    );
  }, [
    header,
    contentContainerStyle,
    visibleVendors,
    renderVendorItem,
    keyExtractor,
    onViewableItemsChanged,
    viewabilityConfig,
    loadMoreVendors,
    isLoadingMore,
    flatListProps,
    onScroll,
    scrollEventThrottle,
    showsVerticalScrollIndicator,
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
