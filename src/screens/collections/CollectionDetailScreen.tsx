import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Images } from '../../assets';
import CartBar from '../../components/common/Cart/CartBar';
import HorizontalProductCard from '../../components/modules/Product/HorizontalProductCard';
import ProductDetailModal from '../../components/modules/Product/ProductDetailModal';
import VariantsModal from '../../components/modules/Product/VariantsModal';
import VendorProductSkeleton from '../../components/modules/Vendor/VendorProductSkeleton';
import CategoryHeader from '../../components/vendor/CategoryHeader';
import CategoryTabs, { CategoryItem } from '../../components/vendor/CategoryTabs';
import { useAuth } from '../../contexts/login/AuthProvider';
import { Collection } from '../../data/collectionsData';
import { RootStackParamList } from '../../routes/AppStack';
import useCartStore from '../../store/cart/cartStore';
import { useProductsStore } from '../../store/products/productsStore';
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

// Helper: create a row-based list with headers and product rows
const getRowBasedProductList = (
  categories: CategoryItem[],
  products: Product[],
  numColumns: number
) => {
  const rows: Array<
    { type: 'header'; category: CategoryItem } | { type: 'products'; products: Product[] }
  > = [];

  // Create a Map for O(1) product lookup by division
  const productsByDivision = new Map<string, Product[]>();
  products.forEach(product => {
    const division = product.division || '';
    if (!productsByDivision.has(division)) {
      productsByDivision.set(division, []);
    }
    productsByDivision.get(division)!.push(product);
  });

  categories.forEach((cat: CategoryItem) => {
    rows.push({ type: 'header', category: cat });

    // Get products for this category using Map lookup
    const catProducts = productsByDivision.get(cat.id) || [];

    // Sort products within each category: in-stock first, then out-of-stock
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

  // Get the first Grocery vendor from store to use for collections
  const { getVendorsByCategory, vendors } = useVendorStore();
  const groceryVendors = getVendorsByCategory('Grocery');
  const vendor = groceryVendors.length > 0 ? groceryVendors[0] : null;
  const collectionsVendorId = vendor?.shopId || '';

  // Search state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // Search bar animation
  const searchBarHeight = useRef(new Animated.Value(0)).current;
  const searchBarOpacity = useRef(new Animated.Value(0)).current;

  // Products store integration
  const {
    products,
    loading: productsLoading,
    error: productsError,
    fetchProducts,
    resetProducts,
    categories: vendorCategories,
    fetchCategories,
    setShopId,
  } = useProductsStore();

  // Memoized values
  const hasAuth = useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);
  const isVendorConfigured = useMemo(() => Boolean(collectionsVendorId), [collectionsVendorId]);

  // Fetch products and categories on mount (only if vendor is configured)
  useEffect(() => {
    if (!isVendorConfigured || !collectionsVendorId) return;

    setShopId(collectionsVendorId);
    resetProducts();
    fetchProducts({ offset: 0, limit: 1000 });
    fetchCategories(collectionsVendorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVendorConfigured, collectionsVendorId]);

  // Map collection categories to vendor categories using "contains match"
  // This filters vendor categories to only those that contain a collection category name
  const mappedCategories: CategoryItem[] = useMemo(() => {
    if (!vendorCategories || vendorCategories.length === 0) {
      // If no vendor categories, use collection categories as fallback
      return collection.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: Images.bg1,
      }));
    }

    // Filter vendor categories where the vendor category name contains
    // any of the collection category names (case-insensitive)
    const matchedCategories: CategoryItem[] = [];

    for (const vendorCat of vendorCategories) {
      const vendorCatNameLower = vendorCat.name.toLowerCase();

      for (const collectionCat of collection.categories) {
        const collectionCatNameLower = collectionCat.name.toLowerCase();

        // Check if vendor category name contains collection category name
        if (vendorCatNameLower.includes(collectionCatNameLower) ||
            collectionCatNameLower.includes(vendorCatNameLower)) {
          matchedCategories.push({
            id: vendorCat.id,
            name: vendorCat.name,
            icon: vendorCat.imageURLs?.[0] || Images.bg1,
          });
          break; // Don't add same vendor category multiple times
        }
      }
    }

    return matchedCategories;
  }, [vendorCategories, collection.categories]);

  // Filter products to only those in matched categories
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      // Filter products to only those in our mapped categories
      const categoryIds = new Set(mappedCategories.map(cat => cat.id));
      return products.filter(product => categoryIds.has(product.division || ''));
    }

    // Apply search filter
    const searchLower = searchQuery.toLowerCase();
    const categoryIds = new Set(mappedCategories.map(cat => cat.id));

    return products.filter(product => {
      const inCategory = categoryIds.has(product.division || '');
      if (!inCategory) return false;

      const productNameMatch = product.name.toLowerCase().includes(searchLower);
      const categoryMatch = mappedCategories.some(
        cat => cat.id === product.division && cat.name.toLowerCase().includes(searchLower)
      );

      return productNameMatch || categoryMatch;
    });
  }, [products, searchQuery, mappedCategories]);

  // Filter categories to only those with products
  const categoriesWithProducts = useMemo(() => {
    const productDivisions = new Set(filteredProducts.map(p => p.division));
    return mappedCategories.filter(cat => productDivisions.has(cat.id));
  }, [mappedCategories, filteredProducts]);

  // Cart store integration
  const { addToCart, increment, decrement, setActiveCart, carts } = useCartStore();

  // Create vendor-specific cart ID
  const cartId = useMemo(() => `vendor_${collectionsVendorId}`, [collectionsVendorId]);

  // Set this cart as active when component mounts
  useEffect(() => {
    setActiveCart(cartId);
  }, [cartId, setActiveCart]);

  // Get item count for this cart
  const itemCount = useMemo(
    () => Object.values(carts[cartId]?.products || {}).reduce((sum, p) => sum + p.quantity, 0),
    [carts, cartId]
  );

  const [selectedCategory, setSelectedCategory] = useState('');

  // Update selected category when filtered categories change
  useEffect(() => {
    if (categoriesWithProducts.length > 0) {
      const isCurrentCategoryValid = categoriesWithProducts.some(cat => cat.id === selectedCategory);
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
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  // Memoized row product list
  const rowProductList = useMemo(
    () => getRowBasedProductList(categoriesWithProducts, filteredProducts, NUM_COLUMNS),
    [categoriesWithProducts, filteredProducts]
  );

  // Memoized product quantity map for O(1) lookup
  const productQuantityMap = useMemo(() => {
    const cart = carts[cartId];
    if (!cart?.products) return new Map<string, number>();

    const map = new Map<string, number>();
    Object.entries(cart.products).forEach(([sku, product]) => {
      map.set(sku, product.quantity);
    });
    return map;
  }, [carts, cartId]);

  type RowProductListItem =
    | { type: 'header'; category: CategoryItem }
    | { type: 'products'; products: Product[] };

  const flatListRef = useRef<FlatList<RowProductListItem> | null>(null);

  // Map category id to index in flatProductList for scrollToIndex
  const categoryIndexMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    rowProductList.forEach((item, idx) => {
      if (item.type === 'header') {
        map[item.category.id] = idx;
      }
    });
    return map;
  }, [rowProductList]);

  // Viewability config and handler
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: RowProductListItem }> }) => {
      const firstHeader = viewableItems.find(item => item.item.type === 'header');
      if (
        firstHeader &&
        selectedCategory !== (firstHeader.item as { type: 'header'; category: CategoryItem }).category.id
      ) {
        setSelectedCategory(
          (firstHeader.item as { type: 'header'; category: CategoryItem }).category.id
        );
      }
    }
  ).current;

  // On category select, scroll to its header
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

  // Listen to scroll for category selection
  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
        listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          if (offsetY <= 0) {
            if (categoriesWithProducts.length > 0 && selectedCategory !== categoriesWithProducts[0].id) {
              setSelectedCategory(categoriesWithProducts[0].id);
            }
          }
        },
      }),
    [scrollY, categoriesWithProducts, selectedCategory]
  );

  // Search bar animation functions
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

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (text && categoriesWithProducts.length > 0) {
        setSelectedCategory(categoriesWithProducts[0].id);
      }
    },
    [categoriesWithProducts]
  );

  // Cart operation handlers
  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!hasAuth || !product.inStock) return;

      if (product.numberOfVariants && product.numberOfVariants > 1) {
        setSelectedProductForVariants(product);
        setVariantsModalVisible(true);
        return;
      }

      addToCart(
        cartId,
        {
          sku: product.sku,
          shopId: collectionsVendorId,
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
    [hasAuth, addToCart, cartId, authData]
  );

  const handleVariantSelect = useCallback(
    (variant: Product) => {
      if (!selectedProductForVariants || !hasAuth) return;

      addToCart(
        cartId,
        {
          sku: variant.sku,
          shopId: collectionsVendorId,
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
    [selectedProductForVariants, hasAuth, addToCart, cartId, authData]
  );

  const handleIncrement = useCallback(
    (sku: string) => {
      if (!hasAuth) return;
      const product = filteredProducts.find(p => p.sku === sku);
      if (product && !product.inStock) return;
      increment(cartId, sku, authData!.jwt, authData!.phone);
    },
    [hasAuth, increment, cartId, authData, filteredProducts]
  );

  const handleDecrement = useCallback(
    (sku: string) => {
      if (!hasAuth) return;
      decrement(cartId, sku, authData!.jwt, authData!.phone);
    },
    [hasAuth, decrement, cartId, authData]
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

  // Memoize styles
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
                disabled={!product.inStock}
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

  // Create a mock vendor object for modals
  const mockVendor = useMemo(() => {
    if (vendor) return vendor;
    return {
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
      storeActive: true,
    };
  }, [vendor, collection.name]);

  // Show configuration message if vendor ID is not set
  if (!isVendorConfigured) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: getColor('background'), paddingTop: safeAreaTop }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {collection.name}
            </Text>
          </View>

          {/* Collection Header Card */}
          <View style={styles.collectionHeader}>
            <View style={styles.collectionIconContainer}>
              <MaterialCommunityIcons name={collection.icon} size={32} color="#6366F1" />
            </View>
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionCategories}>
                {collection.categories.length} categories
              </Text>
            </View>
          </View>

          {/* Configuration Message */}
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

  if (productsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background') }}>
        <VendorProductSkeleton showVendorCard={true} />
      </SafeAreaView>
    );
  }

  if (productsError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background') }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: getColor('error'), fontSize: 16, textAlign: 'center' }}>
            Error loading products: {productsError}
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
          {/* Header */}
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

          {/* Search Bar */}
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

          {/* Collection Header Card */}
          <View style={styles.collectionHeader}>
            <View style={styles.collectionIconContainer}>
              <MaterialCommunityIcons name={collection.icon} size={32} color="#6366F1" />
            </View>
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionCategories}>
                {categoriesWithProducts.length} categories • {filteredProducts.length} products
              </Text>
            </View>
          </View>

          {/* Empty State */}
          {!productsLoading && filteredProducts.length === 0 && (
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
                  : 'This collection doesn\'t have any products available at the moment.'}
              </Text>
              {searchQuery && (
                <TouchableOpacity style={styles.clearSearchButton} onPress={handleSearchClose}>
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Main Content: Categories + Products */}
          {filteredProducts.length > 0 && (
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
                          flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                        }
                      }, 100);
                    }}
                  />
                </Animated.View>
              </View>
            </View>
          )}

          {/* CartBar at the bottom */}
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

          {/* Variants Modal */}
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
      </SafeAreaView>

      {/* Product Detail Modal */}
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
