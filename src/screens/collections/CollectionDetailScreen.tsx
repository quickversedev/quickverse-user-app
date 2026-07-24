import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { Images } from '../../assets';
import CartBar from '../../components/common/Cart/CartBar';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import HorizontalProductCard from '../../components/modules/Product/HorizontalProductCard';
import ProductDetailModal from '../../components/modules/Product/ProductDetailModal';
import VariantsModal from '../../components/modules/Product/VariantsModal';
import VendorProductSkeleton from '../../components/modules/Vendor/VendorProductSkeleton';
import CategoryHeader from '../../components/vendor/CategoryHeader';
import CategoryTabs, { CategoryItem } from '../../components/vendor/CategoryTabs';
import { useAuth } from '../../contexts/login/AuthProvider';
import { Collection, API_STORE_ID } from '../../data/collectionsData';
import { RootStackParamList } from '../../routes/AppStack';
import collectionsService, { CollectionCategoryApi } from '../../services/collectionsService';
import useCartStore from '../../store/cart/cartStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Product } from '../../types/product';

interface CollectionDetailRouteParams {
  collection: Collection;
}

type CollectionDetailRouteProp = RouteProp<
  { CollectionDetail: CollectionDetailRouteParams },
  'CollectionDetail'
>;

const NUM_COLUMNS = 1;
const ANIMATION_DURATION = 300;

const getRowBasedProductList = (
  categories: CategoryItem[],
  products: Product[],
  numColumns: number
) => {
  const rows: Array<
    { type: 'header'; category: CategoryItem } | { type: 'products'; products: Product[] }
  > = [];

  const productsByDivision = new Map<string, Product[]>();
  products.forEach(product => {
    const division = product.division || '';
    if (!productsByDivision.has(division)) {
      productsByDivision.set(division, []);
    }
    productsByDivision.get(division)!.push(product);
  });

  categories.forEach((cat: CategoryItem) => {
    const catProducts = productsByDivision.get(cat.id) || [];
    if (catProducts.length === 0) return;

    rows.push({ type: 'header', category: cat });

    const sortedCatProducts = catProducts.sort((a, b) => {
      if (a.inStock === b.inStock) return 0;
      return a.inStock ? -1 : 1;
    });

    for (let i = 0; i < sortedCatProducts.length; i += numColumns) {
      rows.push({ type: 'products', products: sortedCatProducts.slice(i, i + numColumns) });
    }
  });
  return rows;
};

const CollectionDetailScreen: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const { authData } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<CollectionDetailRouteProp>();
  const { collection } = route.params;

  const { getVendorsByCategory, vendors } = useVendorStore();

  const collectionsVendorId = useMemo(() => {
    const apiVendor = vendors.find(v => v.shopId === API_STORE_ID);
    if (apiVendor) return apiVendor.shopId;
    const groceryVendors = getVendorsByCategory('Grocery');
    return groceryVendors.length > 0 ? groceryVendors[0].shopId : '';
  }, [vendors, getVendorsByCategory]);

  const vendor = vendors.find(v => v.shopId === collectionsVendorId);

  // Search state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // Data state (from backend)
  const [products, setProducts] = useState<Product[]>([]);
  const [apiCategories, setApiCategories] = useState<CollectionCategoryApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search bar animation
  const searchBarHeight = useRef(new Animated.Value(0)).current;
  const searchBarOpacity = useRef(new Animated.Value(0)).current;

  const hasAuth = useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);
  const isVendorConfigured = useMemo(() => Boolean(collectionsVendorId), [collectionsVendorId]);

  // Fetch products from backend
  const fetchData = useCallback(
    async (search?: string) => {
      if (!collectionsVendorId || !collection.id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await collectionsService.fetchCollectionProducts(
          collectionsVendorId,
          collection.id,
          {
            limit: 500,
            offset: 0,
            search: search || undefined,
          }
        );

        setProducts(response.products || []);
        if (!search) {
          setApiCategories(response.categories || []);
        }
      } catch (err) {
        console.error('[CollectionDetail] Fetch error:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    },
    [collectionsVendorId, collection.id]
  );

  useEffect(() => {
    if (isVendorConfigured) {
      fetchData();
    }
  }, [isVendorConfigured, fetchData]);

  // Debounced search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (searchQuery.trim()) {
      searchTimerRef.current = setTimeout(() => {
        fetchData(searchQuery.trim());
      }, 400);
    } else {
      fetchData();
    }

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Map backend categories to CategoryItem, using first product image per division as icon
  const mappedCategories: CategoryItem[] = useMemo(() => {
    const imageByDivision = new Map<string, string>();
    products.forEach(p => {
      if (p.division && p.imageUrl && !imageByDivision.has(p.division)) {
        imageByDivision.set(p.division, p.imageUrl);
      }
    });

    return apiCategories
      .filter(c => (c.productCount ?? 0) > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        icon: imageByDivision.get(c.id) || Images.bg1,
      }));
  }, [apiCategories, products]);

  // Filter categories to only those with products in current results
  const categoriesWithProducts = useMemo(() => {
    const productDivisions = new Set(products.map(p => p.division).filter(Boolean));
    return mappedCategories.filter(cat => productDivisions.has(cat.id));
  }, [mappedCategories, products]);

  // Cart store integration
  const { addToCart, increment, decrement, setActiveCart, carts } = useCartStore();

  const cartId = useMemo(() => `vendor_${collectionsVendorId}`, [collectionsVendorId]);

  useEffect(() => {
    setActiveCart(cartId);
  }, [cartId, setActiveCart]);

  const itemCount = useMemo(
    () => Object.values(carts[cartId]?.products || {}).reduce((sum, p) => sum + p.quantity, 0),
    [carts, cartId]
  );

  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    if (categoriesWithProducts.length > 0) {
      const isCurrentCategoryValid = categoriesWithProducts.some(
        cat => cat.id === selectedCategory
      );
      if (!isCurrentCategoryValid) {
        setSelectedCategory(categoriesWithProducts[0].id);
      }
    } else {
      setSelectedCategory('');
    }
  }, [categoriesWithProducts, selectedCategory]);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Variants state
  const [variantsModalVisible, setVariantsModalVisible] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(
    null
  );
  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  const rowProductList = useMemo(() => {
    return getRowBasedProductList(categoriesWithProducts, products, NUM_COLUMNS);
  }, [categoriesWithProducts, products]);

  const productBySku = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => map.set(p.sku, p));
    return map;
  }, [products]);

  const productQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    productBySku.forEach((product, sku) => {
      const targetCartId = `vendor_${product.shopId || collectionsVendorId}`;
      const qty = carts[targetCartId]?.products?.[sku]?.quantity || 0;
      if (qty > 0) map.set(sku, qty);
    });
    return map;
  }, [carts, productBySku, collectionsVendorId]);

  type RowProductListItem =
    | { type: 'header'; category: CategoryItem }
    | { type: 'products'; products: Product[] };

  const flatListRef = useRef<FlatList<RowProductListItem> | null>(null);

  const categoryIndexMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    rowProductList.forEach((item, idx) => {
      if (item.type === 'header') {
        map[item.category.id] = idx;
      }
    });
    return map;
  }, [rowProductList]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: RowProductListItem }> }) => {
      const firstHeader = viewableItems.find(item => item.item.type === 'header');
      if (
        firstHeader &&
        selectedCategory !==
          (firstHeader.item as { type: 'header'; category: CategoryItem }).category.id
      ) {
        setSelectedCategory(
          (firstHeader.item as { type: 'header'; category: CategoryItem }).category.id
        );
      }
    }
  ).current;

  const handleCategorySelect = useCallback(
    (catId: string) => {
      setSelectedCategory(catId);

      const idx = categoryIndexMap[catId];
      if (idx !== undefined && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: idx, animated: true });
      }
    },
    [categoryIndexMap]
  );

  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
        listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          if (offsetY <= 0) {
            if (
              categoriesWithProducts.length > 0 &&
              selectedCategory !== categoriesWithProducts[0].id
            ) {
              setSelectedCategory(categoriesWithProducts[0].id);
            }
          }
        },
      }),
    [scrollY, categoriesWithProducts, selectedCategory]
  );

  const showSearchBar = useCallback(() => {
    setIsSearchVisible(true);
    Animated.parallel([
      Animated.timing(searchBarHeight, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(searchBarOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => {
      searchInputRef.current?.focus();
    });
  }, [searchBarHeight, searchBarOpacity]);

  const hideSearchBar = useCallback(() => {
    Animated.parallel([
      Animated.timing(searchBarHeight, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(searchBarOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsSearchVisible(false);
    });
  }, [searchBarHeight, searchBarOpacity]);

  const handleSearchPress = useCallback(() => {
    showSearchBar();
  }, [showSearchBar]);

  const handleSearchClose = useCallback(() => {
    if (searchQuery === '') {
      hideSearchBar();
    } else {
      setSearchQuery('');
    }
  }, [searchQuery, hideSearchBar]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!hasAuth || !product.inStock) return;

      if (product.numberOfVariants && product.numberOfVariants > 1) {
        setSelectedProductForVariants(product);
        setVariantsModalVisible(true);
        return;
      }

      const targetShopId = product.shopId || collectionsVendorId;
      const targetCartId = `vendor_${targetShopId}`;

      addToCart(
        targetCartId,
        {
          sku: product.sku,
          shopId: targetShopId,
          name: product.name,
          price: product.sellingPrice,
          mrp: product.mrp,
          image: typeof product.imageUrl === 'string' ? product.imageUrl : '',
          veg: product.veg,
        },
        authData!.jwt,
        authData!.phone
      );
    },
    [hasAuth, addToCart, collectionsVendorId, authData]
  );

  const handleVariantSelect = useCallback(
    (variant: Product) => {
      if (!selectedProductForVariants || !hasAuth) return;

      const targetShopId =
        selectedProductForVariants.shopId || variant.shopId || collectionsVendorId;
      const targetCartId = `vendor_${targetShopId}`;

      addToCart(
        targetCartId,
        {
          sku: variant.sku,
          shopId: targetShopId,
          name: variant.name,
          price: variant.sellingPrice,
          mrp: variant.mrp,
          image:
            typeof selectedProductForVariants.imageUrl === 'string'
              ? selectedProductForVariants.imageUrl
              : '',
          veg: selectedProductForVariants.veg ?? true,
        },
        authData!.jwt,
        authData!.phone
      );
    },
    [selectedProductForVariants, hasAuth, addToCart, collectionsVendorId, authData]
  );

  const handleIncrement = useCallback(
    (sku: string) => {
      if (!hasAuth) return;
      const product = productBySku.get(sku);
      if (product && !product.inStock) return;
      const targetCartId = `vendor_${product?.shopId || collectionsVendorId}`;
      increment(targetCartId, sku, authData!.jwt, authData!.phone);
    },
    [hasAuth, increment, collectionsVendorId, authData, productBySku]
  );

  const handleDecrement = useCallback(
    (sku: string) => {
      if (!hasAuth) return;
      const product = productBySku.get(sku);
      const targetCartId = `vendor_${product?.shopId || collectionsVendorId}`;
      decrement(targetCartId, sku, authData!.jwt, authData!.phone);
    },
    [hasAuth, decrement, collectionsVendorId, authData, productBySku]
  );

  const getProductQuantity = useCallback(
    (sku: string) => {
      return productQuantityMap.get(sku) || 0;
    },
    [productQuantityMap]
  );

  const handleCloseVariantsModal = useCallback(() => {
    setVariantsModalVisible(false);
    setSelectedProductForVariants(null);
  }, []);

  const handleCloseProductDetailModal = useCallback(() => {
    setProductDetailModalVisible(false);
    setSelectedProductForDetail(null);
  }, []);

  const handleProductPress = useCallback((product: Product) => {
    setSelectedProductForDetail(product);
    setProductDetailModalVisible(true);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: getColor('background'),
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          paddingBottom: 8,
        },
        backButton: {
          marginRight: 12,
        },
        headerTitle: {
          flex: 1,
          color: getColor('text'),
          fontSize: getTypography('h2'),
          fontWeight: 'bold',
        },
        actionButtons: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        actionButton: {
          marginLeft: 16,
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getColor('card'),
          borderRadius: 12,
          marginHorizontal: 16,
          marginTop: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: getColor('border'),
        },
        searchInput: {
          flex: 1,
          color: getColor('text'),
          fontSize: getTypography('body'),
          paddingVertical: 8,
        },
        searchCloseButton: {
          padding: 4,
        },
        collectionHeader: {
          backgroundColor: getColor('card'),
          marginHorizontal: 16,
          marginVertical: 8,
          padding: 16,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
        },
        collectionIconContainer: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
        },
        collectionInfo: {
          flex: 1,
        },
        collectionName: {
          color: getColor('text'),
          fontSize: getTypography('h2'),
          fontWeight: 'bold',
          marginBottom: 4,
        },
        collectionCategories: {
          color: getColor('subText'),
          fontSize: getTypography('caption'),
        },
        mainContent: {
          flex: 1,
        },
        categoryProductContainer: {
          flex: 1,
          flexDirection: 'row',
          marginTop: 8,
        },
        productList: {
          flex: 1,
          padding: 8,
        },
        emptyStateContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
          paddingVertical: 40,
        },
        emptyStateIconContainer: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: getColor('card'),
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
        },
        emptyStateIcon: {
          fontSize: 40,
        },
        emptyStateTitle: {
          color: getColor('text'),
          fontSize: getTypography('h2'),
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 12,
        },
        emptyStateMessage: {
          color: getColor('subText'),
          fontSize: getTypography('body'),
          textAlign: 'center',
          lineHeight: 22,
        },
        clearSearchButton: {
          backgroundColor: getColor('primary'),
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
          marginTop: 16,
        },
        clearSearchButtonText: {
          color: getColor('white'),
          fontSize: getTypography('body'),
          fontWeight: 'bold',
        },
      }),
    [getColor, getTypography]
  );

  const safeAreaTop = useMemo(
    () =>
      Platform.select({
        ios: 0,
        android: StatusBar.currentHeight || 0,
        default: 0,
      }),
    []
  );

  const keyExtractor = useCallback((item: RowProductListItem, idx: number) => {
    if (item.type === 'header') return `header-${item.category.id}`;
    if (item.type === 'products') return `products-row-${idx}`;
    return `row-${idx}`;
  }, []);

  const MemoizedHorizontalProductCard = useMemo(() => React.memo(HorizontalProductCard), []);

  const renderItem = useCallback(
    ({ item, index }: { item: RowProductListItem; index: number }) => {
      if (item.type === 'header') {
        return <CategoryHeader title={item.category.name} isFirst={index === 0} />;
      } else if (item.type === 'products') {
        return (
          <View>
            {item.products.map((product: Product) => (
              <MemoizedHorizontalProductCard
                key={product.sku}
                product={product}
                quantity={getProductQuantity(product.sku)}
                onAdd={() => handleAddToCart(product)}
                onIncrement={() => handleIncrement(product.sku)}
                onDecrement={() => handleDecrement(product.sku)}
                disabled={false}
                showVariantsCount={true}
                onPress={() => handleProductPress(product)}
              />
            ))}
          </View>
        );
      }
      return null;
    },
    [
      handleAddToCart,
      handleIncrement,
      handleDecrement,
      getProductQuantity,
      handleProductPress,
      MemoizedHorizontalProductCard,
    ]
  );

  const mockVendor = useMemo(() => {
    const base = vendor
      ? { ...vendor }
      : {
          shopId: collectionsVendorId,
          name: collection.name,
          logo: '',
          banner: '',
          owner: '',
          phone: '',
          openingTime: '00:00',
          closingTime: '23:59',
          preparationTime: '30',
          description: '',
          category: 'Collections',
          storeEnabled: true,
        };
    return {
      ...base,
      openingTime: base.openingTime ?? '00:00',
      closingTime: base.closingTime ?? '23:59',
      storeActive: true,
    };
  }, [vendor, collection.name, collectionsVendorId]);

  if (!isVendorConfigured) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: getColor('background'), paddingTop: safeAreaTop }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {collection.name}
            </Text>
          </View>

          <View style={styles.collectionHeader}>
            <View style={styles.collectionIconContainer}>
              <MaterialCommunityIcons name={collection.icon as any} size={32} color="#6366F1" />
            </View>
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionCategories}>
                {collection.categories.length} categories
              </Text>
            </View>
          </View>

          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconContainer}>
              <Text style={styles.emptyStateIcon}>🏪</Text>
            </View>
            <Text style={styles.emptyStateTitle}>No Vendors Available</Text>
            <Text style={styles.emptyStateMessage}>
              No grocery vendors available in your area. Please check back later or change your
              location.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background') }}>
        <VendorProductSkeleton showVendorCard={true} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background') }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: getColor('error'), fontSize: 16, textAlign: 'center' }}>
            Error loading products: {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: getColor('background'), paddingTop: safeAreaTop }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {collection.name}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSearchPress}>
                <MaterialCommunityIcons name="magnify" size={24} color={getColor('text')} />
              </TouchableOpacity>
            </View>
          </View>

          {isSearchVisible && (
            <Animated.View
              style={[
                styles.searchContainer,
                {
                  opacity: searchBarOpacity,
                  maxHeight: searchBarHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 60],
                  }),
                  overflow: 'hidden',
                },
              ]}
            >
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={getColor('subText')}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.searchCloseButton} onPress={handleSearchClose}>
                <Text style={{ color: getColor('text'), fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={styles.collectionHeader}>
            <View style={styles.collectionIconContainer}>
              <MaterialCommunityIcons name={collection.icon as any} size={32} color="#6366F1" />
            </View>
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionCategories}>
                {categoriesWithProducts.length} categories • {products.length} products
              </Text>
            </View>
          </View>

          {!loading && products.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconContainer}>
                <Text style={styles.emptyStateIcon}>📦</Text>
              </View>
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No Results Found' : 'No Products Available'}
              </Text>
              <Text style={styles.emptyStateMessage}>
                {searchQuery
                  ? `No products match "${searchQuery}". Try a different search term.`
                  : "This collection doesn't have any products available at the moment."}
              </Text>
              {searchQuery && (
                <TouchableOpacity style={styles.clearSearchButton} onPress={handleSearchClose}>
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {products.length > 0 && (
            <View style={styles.mainContent}>
              <View style={styles.categoryProductContainer}>
                <CategoryTabs
                  categories={categoriesWithProducts}
                  selectedCategoryId={selectedCategory}
                  onSelect={handleCategorySelect}
                />
                <Animated.View style={[styles.productList, { flex: 1 }]}>
                  <Animated.FlatList
                    ref={flatListRef}
                    data={rowProductList}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    numColumns={1}
                    key={'row-based'}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={rowProductList.length}
                    updateCellsBatchingPeriod={50}
                    initialNumToRender={10}
                    windowSize={10}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    onScrollToIndexFailed={info => {
                      flatListRef.current?.scrollToOffset({
                        offset: info.averageItemLength * info.index,
                        animated: true,
                      });

                      setTimeout(() => {
                        if (rowProductList.length > 0) {
                          flatListRef.current?.scrollToIndex({
                            index: info.index,
                            animated: true,
                          });
                        }
                      }, 100);
                    }}
                  />
                </Animated.View>
              </View>
            </View>
          )}

          {itemCount > 0 && (
            <CartBar
              itemCount={itemCount}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 30,
              }}
              shopId={collectionsVendorId}
              cartId={cartId}
            />
          )}

          {selectedProductForVariants && (
            <VariantsModal
              visible={variantsModalVisible}
              onClose={handleCloseVariantsModal}
              product={selectedProductForVariants}
              vendor={mockVendor}
              onVariantSelect={handleVariantSelect}
            />
          )}
        </View>
        <FloatingCartsStack />
      </SafeAreaView>

      {selectedProductForDetail && (
        <ProductDetailModal
          visible={productDetailModalVisible}
          onClose={handleCloseProductDetailModal}
          product={selectedProductForDetail}
          vendor={mockVendor}
        />
      )}
    </>
  );
};

export default React.memo(CollectionDetailScreen);
