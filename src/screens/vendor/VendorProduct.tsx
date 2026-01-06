import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Images } from '../../assets';
import CartBar from '../../components/common/Cart/CartBar';
import SectionDivider from '../../components/common/SectionDivider';
import ProductCard from '../../components/modules/Product/ProductCard';
import ProductDetailModal from '../../components/modules/Product/ProductDetailModal';
import VariantsModal from '../../components/modules/Product/VariantsModal';
import VendorProductSkeleton from '../../components/modules/Vendor/VendorProductSkeleton';
import CategoryHeader from '../../components/vendor/CategoryHeader';
import CategoryTabs, { CategoryItem } from '../../components/vendor/CategoryTabs';
import VendorHeaderCard from '../../components/vendor/VendorHeaderCard';
import VendorTopBar from '../../components/vendor/VendorTopBar';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import useCartStore from '../../store/cart/cartStore';
import { useProductsStore } from '../../store/products/productsStore';
import { useTheme } from '../../theme/ThemeContext';
import { Product } from '../../types/product';
import { Vendor } from '../../types/vendor';
import { formatTimeToAMPM, getStoreStatus } from '../../utils/storeUtils';

// Category type for local use (as expected by CategoryTabs)
type Category = CategoryItem;

// Categories will be filtered based on fetched products

interface VendorProductRouteParams {
  vendor: Vendor;
  searchQuery?: string;
}
type VendorProductRouteProp = RouteProp<
  { VendorProduct: VendorProductRouteParams },
  'VendorProduct'
>;

const { width } = Dimensions.get('window');

// Constants for better performance
const NUM_COLUMNS = 2;
const CATEGORY_WIDTH = 120;
const SCROLL_DELAY = 100;
const ANIMATION_DURATION = 300;

// Helper: create a row-based list with headers and product rows
// Optimized with Map for O(1) lookup
const getRowBasedProductList = (
  categories: Category[],
  products: Product[],
  numColumns: number
) => {
  const rows: Array<
    { type: 'header'; category: Category } | { type: 'products'; products: Product[] }
  > = [];

  // Create a Map for O(1) product lookup by division
  const productsByDivision = new Map<string, Product[]>();
  products.forEach(product => {
    const division = product.division;
    if (!productsByDivision.has(division || '')) {
      productsByDivision.set(division || '', []);
    }
    productsByDivision.get(division || '')!.push(product);
  });

  categories.forEach((cat: Category) => {
    rows.push({ type: 'header', category: cat });

    let catProducts: Product[] = [];

    // Handle "Other" category specially
    if (cat.id === 'other') {
      // Get all uncategorized products (products without division or with division not matching any category)
      catProducts = products.filter(product => {
        const hasValidDivision = product.division && product.division.trim() !== '';
        const divisionMatchesCategory = categories.some(
          c => c.id !== 'other' && c.id === product.division
        );
        return !hasValidDivision || !divisionMatchesCategory;
      });
    } else {
      // Get products for this category using Map lookup
      catProducts = productsByDivision.get(cat.id || '') || [];
    }

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

const VendorProductComponent: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const { authData } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<VendorProductRouteProp>();
  const { vendor, searchQuery: initialSearchQuery } = route.params;

  // Search state
  const [isSearchVisible, setIsSearchVisible] = useState(!!initialSearchQuery);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
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
    categories,
    fetchCategories,
    setShopId,
  } = useProductsStore();

  // Memoized values
  const hasAuth = useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);
  const storeStatus = useMemo(() => getStoreStatus(vendor), [vendor]);
  const isStoreActive = useMemo(() => storeStatus.isOpen, [storeStatus.isOpen]);

  // Fetch products and categories on mount or when vendor.shopId changes
  useEffect(() => {
    setShopId(vendor.shopId);
    resetProducts();
    fetchProducts({ offset: 0, limit: 1000 });
    fetchCategories(vendor.shopId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor.shopId]);

  // Show search bar and focus input when initialSearchQuery is provided
  useEffect(() => {
    if (initialSearchQuery) {
      showSearchBar();
    }
  }, [initialSearchQuery]);
  // Optimized search with memoized category lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories?.forEach(cat => map.set(cat.id, cat.name.toLowerCase()));
    // Add "Other" category for search
    map.set('other', 'other');
    return map;
  }, [categories]);

  // Filter products based on search query (product name and category name)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const searchLower = searchQuery.toLowerCase();
    return products.filter(product => {
      const productNameMatch = product.name.toLowerCase().includes(searchLower);

      // Handle category matching for both categorized and uncategorized products
      let categoryNameMatch = false;
      if (product.division && product.division.trim() !== '') {
        const categoryName = categoryMap.get(product.division);
        categoryNameMatch = categoryName?.includes(searchLower) || false;
      } else {
        // For uncategorized products, check if search includes "other"
        categoryNameMatch = searchLower.includes('other');
      }

      return productNameMatch || categoryNameMatch;
    });
  }, [products, searchQuery, categoryMap]);

  // Always show filtered products when searching, or all products when not searching
  const productsToShow = useMemo(
    () => (searchQuery ? filteredProducts : products),
    [searchQuery, filteredProducts, products]
  );

  // Map store categories to CategoryTabs items with a placeholder icon
  const categoriesForTabs: Category[] = useMemo(
    () =>
      (categories || []).map(c => ({
        id: c.id,
        name: c.name,
        icon: c.imageURLs?.[0] || Images.bg1,
      })),
    [categories]
  );

  // Only include categories that have at least one product (match product.division)
  // When searching, show all categories that have matching products
  // Also include an "Other" category for uncategorized products
  const filteredCategories: Category[] = useMemo(() => {
    // Get categories that have products
    const categoriesWithProducts = categoriesForTabs.filter(cat =>
      productsToShow.some(product => product.division === cat.id)
    );

    // Find uncategorized products (products without division or with division not matching any category)
    const uncategorizedProducts = productsToShow.filter(product => {
      const hasValidDivision = product.division && product.division.trim() !== '';
      const divisionMatchesCategory = categoriesForTabs.some(cat => cat.id === product.division);
      return !hasValidDivision || !divisionMatchesCategory;
    });

    // If there are uncategorized products, add an "Other" category
    if (uncategorizedProducts.length > 0) {
      const otherCategory: Category = {
        id: 'other',
        name: 'Other',
        icon: Images.bg1,
      };
      return [...categoriesWithProducts, otherCategory];
    }

    return categoriesWithProducts;
  }, [categoriesForTabs, productsToShow]);

  // Cart store integration
  const { addToCart, increment, decrement, setActiveCart, carts } = useCartStore();

  // Create vendor-specific cart ID
  const cartId = useMemo(() => `vendor_${vendor.shopId}`, [vendor.shopId]);

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
    if (filteredCategories.length > 0) {
      // If current selected category is not in filtered categories, select the first one
      const isCurrentCategoryValid = filteredCategories.some(cat => cat.id === selectedCategory);
      if (!isCurrentCategoryValid) {
        setSelectedCategory(filteredCategories[0].id);
      }
    } else {
      setSelectedCategory('');
    }
  }, [filteredCategories, selectedCategory]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const categoryScrollRef = useRef<ScrollView>(null);

  // Animated value for timing section opacity
  const timingOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  // Animated value for timing section height
  const timingHeight = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [40, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  // Animated value for category images opacity
  const categoryImageOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  // Animated value for category images height
  const categoryImageHeight = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [32, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  // Auto-scroll to selected category when categories are loaded
  useEffect(() => {
    if (filteredCategories.length > 0 && selectedCategory && categoryScrollRef.current) {
      const categoryIndex = filteredCategories.findIndex(cat => cat.id === selectedCategory);
      if (categoryIndex !== -1) {
        // Small delay to ensure the ScrollView is rendered
        setTimeout(() => {
          const screenWidth = width;
          const scrollToX = Math.max(
            0,
            categoryIndex * CATEGORY_WIDTH - screenWidth / 2 + CATEGORY_WIDTH / 2
          );

          categoryScrollRef.current?.scrollTo({
            x: scrollToX,
            animated: true,
          });
        }, SCROLL_DELAY);
      }
    }
  }, [filteredCategories, selectedCategory]);

  // Variants state
  const [variantsModalVisible, setVariantsModalVisible] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(
    null
  );
  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  // Memoized row product list with optimized dependencies
  const rowProductList = useMemo(
    () => getRowBasedProductList(filteredCategories, productsToShow, NUM_COLUMNS),
    [filteredCategories, productsToShow]
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
    | { type: 'header'; category: Category }
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

  // --- Viewability config and handler for FlatList ---
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10, // lower threshold for better first header detection
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ item: RowProductListItem }> }) => {
      // Find the first visible header
      const firstHeader = viewableItems.find(item => item.item.type === 'header');
      if (
        firstHeader &&
        selectedCategory !==
          (firstHeader.item as { type: 'header'; category: Category }).category.id
      ) {
        setSelectedCategory(
          (firstHeader.item as { type: 'header'; category: Category }).category.id
        );
      }
    }
  ).current;
  // --- End viewability ---

  // On category select, scroll to its header and center the category
  const handleCategorySelect = useCallback(
    (catId: string) => {
      setSelectedCategory(catId);

      // Scroll to the category in the horizontal scroll view
      const categoryIndex = filteredCategories.findIndex(cat => cat.id === catId);
      if (categoryIndex !== -1 && categoryScrollRef.current) {
        // Calculate the position to center the selected category
        const screenWidth = width;
        const scrollToX = Math.max(
          0,
          categoryIndex * CATEGORY_WIDTH - screenWidth / 2 + CATEGORY_WIDTH / 2
        );

        categoryScrollRef.current.scrollTo({
          x: scrollToX,
          animated: true,
        });
      }

      // Scroll to the category header in the product list
      const idx = categoryIndexMap[catId];
      if (idx !== undefined && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: idx, animated: true });
      }
    },
    [filteredCategories, categoryIndexMap]
  );

  // Listen to scroll for category selection
  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
        listener: (event: { nativeEvent: { contentOffset: { y: number } } }) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          if (offsetY <= 0) {
            // At the very top, force select the first category
            if (filteredCategories.length > 0 && selectedCategory !== filteredCategories[0].id) {
              setSelectedCategory(filteredCategories[0].id);
            }
          }
        },
      }),
    [scrollY, filteredCategories, selectedCategory]
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
      // Focus the search input after animation completes
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

  // Search handlers
  const handleSearchPress = useCallback(() => {
    showSearchBar();
  }, [showSearchBar]);

  const handleSearchClose = useCallback(() => {
    if (searchQuery === '') {
      // If no search string, hide the search bar with animation
      hideSearchBar();
    } else {
      // If search string exists, clear it but keep search bar visible
      setSearchQuery('');
    }
  }, [searchQuery, hideSearchBar]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      // Reset to first category when searching
      if (text && filteredCategories.length > 0) {
        setSelectedCategory(filteredCategories[0].id);
      }
    },
    [filteredCategories]
  );

  // Cart operation handlers
  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!isStoreActive || !hasAuth || !product.inStock) return; // Disable when store is closed, no auth, or out of stock

      // If product has multiple variants, show variants modal
      if (product.numberOfVariants && product.numberOfVariants > 1) {
        setSelectedProductForVariants(product);
        setVariantsModalVisible(true);
        return;
      }

      // Otherwise, add directly to cart
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
        authData!.jwt,
        authData!.phone
      );
    },
    [isStoreActive, hasAuth, addToCart, cartId, vendor.shopId, authData]
  );

  const handleVariantSelect = useCallback(
    (variant: Product) => {
      if (!selectedProductForVariants || !hasAuth) return;

      addToCart(
        cartId,
        {
          sku: variant.sku,
          shopId: vendor.shopId,
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
    [selectedProductForVariants, hasAuth, addToCart, cartId, vendor.shopId, authData]
  );

  const handleIncrement = useCallback(
    (sku: string) => {
      if (!isStoreActive || !hasAuth) return; // Disable when store is closed or no auth
      // Check if the product is in stock before incrementing
      const product = products.find(p => p.sku === sku);
      if (product && !product.inStock) return; // Disable if product is out of stock
      increment(cartId, sku, authData!.jwt, authData!.phone);
    },
    [isStoreActive, hasAuth, increment, cartId, authData, products]
  );

  const handleDecrement = useCallback(
    (sku: string) => {
      if (!isStoreActive || !hasAuth) return; // Disable when store is closed or no auth
      decrement(cartId, sku, authData!.jwt, authData!.phone);
    },
    [isStoreActive, hasAuth, decrement, cartId, authData]
  );

  // Optimized product quantity lookup using memoized map
  const getProductQuantity = useCallback(
    (sku: string) => {
      return productQuantityMap.get(sku) || 0;
    },
    [productQuantityMap]
  );

  // Memoize modal handlers
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
          paddingBottom: 0,
        },
        backButton: {
          marginRight: 12,
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
        vendorCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getColor('card'),
          borderRadius: 12,
          margin: 16,
          padding: 12,
          shadowColor: getColor('primary'),
          shadowOpacity: 0.2,
          shadowRadius: 8,
          borderWidth: 1,
          borderColor: getColor('primary'),
        },
        vendorLogo: {
          width: 48,
          height: 48,
          borderRadius: 12,
          marginRight: 12,
          backgroundColor: getColor('border'),
        },
        vendorInfo: {
          flex: 1,
        },
        vendorName: {
          color: getColor('text'),
          fontSize: getTypography('h2'),
          // fontWeight: 'bold',
        },
        vendorMeta: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4,
        },
        vendorMetaText: {
          color: getColor('subText'),
          fontSize: getTypography('caption'),
          marginRight: 8,
        },
        ratingBox: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1ec28b',
          borderRadius: 6,
          paddingHorizontal: 6,
          paddingVertical: 2,
          marginLeft: 8,
        },
        ratingText: {
          color: '#fff',
          fontSize: getTypography('caption'),
          // fontWeight: 'bold',
          marginLeft: 2,
        },
        categoryContainer: {
          backgroundColor: getColor('background'),
          paddingHorizontal: 16,
          borderBottomWidth: 2,
          borderBottomColor: getColor('border'),
        },
        categoryItem: {
          alignItems: 'center',
          marginRight: 24,
          paddingVertical: 4,
          paddingHorizontal: 12,
          borderBottomWidth: 3,
          borderBottomColor: 'transparent',
          minHeight: 40, // Ensure consistent height even when image disappears
        },
        categoryItemActive: {
          borderBottomColor: getColor('primary'),
          backgroundColor: getColor('card'),
          borderRadius: 8,
          shadowColor: getColor('primary'),
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 2,
        },
        categoryIcon: {
          width: 32,
          height: 32,
          marginBottom: 4,
          borderRadius: 16,
          overflow: 'hidden', // Ensure smooth scaling
        },
        productList: {
          flex: 1,
          padding: 8,
        },
        productCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getColor('card'),
          borderRadius: 12,
          marginBottom: 16,
          padding: 12,
          shadowColor: getColor('shadow').color,
          shadowOpacity: getColor('shadow').opacity,
          shadowRadius: getColor('shadow').radius,
          elevation: 2,
        },
        productImage: {
          width: 60,
          height: 60,
          borderRadius: 8,
          marginRight: 12,
          backgroundColor: getColor('border'),
        },
        productInfo: {
          flex: 1,
        },
        productName: {
          color: getColor('text'),
          fontSize: getTypography('body'),
          // fontWeight: 'bold',
        },
        productMeta: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 2,
        },
        productRating: {
          color: '#1ec28b',
          // fontWeight: 'bold',
          marginRight: 8,
        },
        productPriceRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 2,
        },
        productMRP: {
          color: getColor('subText'),
          fontSize: getTypography('caption'),
          textDecorationLine: 'line-through',
          marginRight: 6,
        },
        productPrice: {
          color: getColor('text'),
          fontSize: getTypography('body'),
          // fontWeight: 'bold',
        },
        addButton: {
          borderWidth: 1,
          borderColor: getColor('primary'),
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginLeft: 12,
          flexDirection: 'row',
          alignItems: 'center',
        },
        addButtonText: {
          color: getColor('primary'),
          // fontWeight: 'bold',
          fontSize: getTypography('body'),
          marginLeft: 4,
        },
        bookmarkIcon: {
          marginLeft: 8,
        },
        headerTitle: {
          color: getColor('text'),
          fontSize: getTypography('h2'),
          // fontWeight: 'bold',
        },
        vendorTime: {
          color: getColor('subText'),
          fontSize: getTypography('caption'),
          letterSpacing: 2,
          textAlign: 'center',
          marginBottom: 8,
        },
        categoryHeader: {
          width: '100%',
          backgroundColor: getColor('background'),
          paddingHorizontal: 16,
          marginTop: 16,
          marginBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        line: {
          flex: 1,
          height: 2,
          marginHorizontal: 8,
          opacity: 0.5,
        },
        categoryHeaderText: {
          color: getColor('primary'),
          // fontWeight: 'bold',
          fontSize: getTypography('h2'),
          letterSpacing: 1,
        },
        productRow: {
          flexDirection: 'row',
          justifyContent: 'flex-start',
        },
        emptyProductCell: {
          flex: 1,
          margin: 8,
          backgroundColor: 'transparent',
        },
        closedBanner: {
          backgroundColor: getColor('error'),
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          marginTop: -26,
          marginBottom: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          marginHorizontal: 16,
        },
        closedText: {
          color: getColor('white'),
          fontSize: getTypography('caption'),
          fontWeight: 'bold',
          fontFamily: 'BricolageGrotesque-Regular',
          textTransform: 'uppercase',
        },
        mainContent: {
          flex: 1,
        },
        categoryProductContainer: {
          flex: 1,
          flexDirection: 'row',
          marginTop: 8,
        },
        contentDisabled: {
          // No visual effect - just gray colors
        },
        categoryItemDisabled: {
          // No visual effect - just gray colors
        },
        iconDisabled: {
          // No visual effect - just gray colors
        },
        vendorCardClosed: {
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        },
        emptyStateContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
        },
        emptyStateTitle: {
          color: getColor('text'),
          fontSize: getTypography('h2'),
          // fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 8,
        },
        emptyStateMessage: {
          color: getColor('subText'),
          fontSize: getTypography('body'),
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 24,
        },
        clearSearchButton: {
          backgroundColor: getColor('primary'),
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
        },
        clearSearchButtonText: {
          color: getColor('white'),
          fontSize: getTypography('body'),
          // fontWeight: 'bold',
        },
        emptyStateMessageContainer: {
          backgroundColor: getColor('card'),
          margin: 16,
          marginTop: 8,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: getColor('border'),
          alignItems: 'center',
        },
        zeroStateContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32,
          paddingVertical: 40,
        },
        zeroStateIconContainer: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: getColor('card'),
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
          shadowColor: getColor('shadow').color,
          shadowOpacity: getColor('shadow').opacity,
          shadowRadius: getColor('shadow').radius,
          elevation: 4,
        },
        zeroStateIcon: {
          fontSize: 40,
        },
        zeroStateTitle: {
          color: getColor('text'),
          fontSize: getTypography('h2'),
          // fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 12,
        },
        zeroStateMessage: {
          color: getColor('subText'),
          fontSize: getTypography('body'),
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 24,
          paddingHorizontal: 16,
        },
        businessHoursContainer: {
          backgroundColor: getColor('card'),
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: getColor('border'),
          alignItems: 'center',
          marginTop: 8,
        },
        businessHoursTitle: {
          color: getColor('text'),
          fontSize: getTypography('body'),
          // fontWeight: 'bold',
          marginBottom: 4,
        },
        businessHoursText: {
          color: getColor('subText'),
          fontSize: getTypography('caption'),
          textAlign: 'center',
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

  // Memoize key extractor for FlatList
  const keyExtractor = useCallback((item: RowProductListItem, idx: number) => {
    if (item.type === 'header') return `header-${item.category.id}`;
    if (item.type === 'products') return `products-row-${idx}`;
    return `row-${idx}`;
  }, []);

  // Memoized ProductCard component for better performance
  const MemoizedProductCard = useMemo(() => React.memo(ProductCard), []);
  //  Memoize render item for FlatList
  const renderItem = useCallback(
    ({ item, index }: { item: RowProductListItem; index: number }) => {
      if (item.type === 'header') {
        return <CategoryHeader title={item.category.name} isFirst={index === 0} />;
      } else if (item.type === 'products') {
        return (
          <View style={styles.productRow}>
            {item.products.map((product: Product) => (
              <MemoizedProductCard
                key={product.sku}
                product={product}
                quantity={getProductQuantity(product.sku)}
                onAdd={() => handleAddToCart(product)}
                onIncrement={() => handleIncrement(product.sku)}
                onDecrement={() => handleDecrement(product.sku)}
                disabled={!isStoreActive || !product.inStock}
                showVariantsCount={true}
                onPress={() => handleProductPress(product)}
                backgroundColor={getColor('background')}
                rating={0}
                size="big"
              />
            ))}
            {/* Fill empty columns if needed */}
            {item.products.length < NUM_COLUMNS &&
              Array.from({ length: NUM_COLUMNS - item.products.length }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.emptyProductCell} />
              ))}
          </View>
        );
      }
      return null;
    },
    [
      styles.productRow,
      styles.emptyProductCell,
      handleAddToCart,
      handleIncrement,
      handleDecrement,
      getProductQuantity,
      isStoreActive,
      handleProductPress,
      getColor,
      MemoizedProductCard,
    ]
  );

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
          <VendorTopBar
            title={vendor.name}
            onBack={() => navigation.goBack()}
            onSearchPress={handleSearchPress}
          />

          {/* Search Bar */}
          {isSearchVisible && (
            <Animated.View
              style={[
                styles.searchContainer,
                {
                  opacity: searchBarOpacity,
                  maxHeight: searchBarHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 60], // Adjust based on your search container height
                  }),
                  overflow: 'hidden',
                },
              ]}
            >
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search products or categories..."
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

          {/* Vendor Card */}
          <VendorHeaderCard
            vendor={vendor}
            onPress={() => navigation.navigate('VendorProfile', { vendor })}
            style={!isStoreActive ? styles.vendorCardClosed : undefined}
          />

          {/* Store Status Banner */}
          {/* {!isStoreActive && (
            <View style={styles.closedBanner}>
              <Text style={styles.closedText}>WE ARE CLOSED</Text>
            </View>
          )} */}

          {/* Zero State - Show when no products available */}
          {!productsLoading && products.length === 0 && (
            <View style={styles.zeroStateContainer}>
              <View style={styles.zeroStateIconContainer}>
                <Text style={styles.zeroStateIcon}>📦</Text>
              </View>
              <Text style={styles.zeroStateTitle}>No Products Available</Text>
              <Text style={styles.zeroStateMessage}>
                {!isStoreActive
                  ? 'This store is currently closed. Please check back during business hours.'
                  : "This store doesn't have any products available at the moment."}
              </Text>
              {!isStoreActive && (
                <View style={styles.businessHoursContainer}>
                  <Text style={styles.businessHoursTitle}>Business Hours</Text>
                  <Text style={styles.businessHoursText}>
                    {formatTimeToAMPM(vendor.openingTime)} - {formatTimeToAMPM(vendor.closingTime)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Search Empty State - Show when search has no results */}
          {!productsLoading &&
            searchQuery &&
            filteredProducts.length === 0 &&
            products.length > 0 && (
              <View style={styles.emptyStateMessageContainer}>
                <Text style={styles.emptyStateMessage}>
                  {`No products or categories match "${searchQuery}". Try a different search term.`}
                </Text>
                <TouchableOpacity style={styles.clearSearchButton} onPress={handleSearchClose}>
                  <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            )}

          {/* Main Content: Categories + Products - Only show when products exist */}
          {products.length > 0 && (
            <View style={styles.mainContent}>
              {/* Category List (absolute overlay with animation) */}
              <Animated.View
                style={{
                  opacity: timingOpacity,
                  height: timingHeight,
                  overflow: 'hidden',
                }}
              >
                <SectionDivider
                  text={`${formatTimeToAMPM(vendor.openingTime)} - ${formatTimeToAMPM(
                    vendor.closingTime
                  )}`}
                  textStyle={{ fontSize: 14, fontWeight: 'normal' }}
                />
              </Animated.View>

              {/* Horizontal layout: Categories on left, Products on right */}
              <View style={styles.categoryProductContainer}>
                <CategoryTabs
                  categories={filteredCategories}
                  selectedCategoryId={selectedCategory}
                  onSelect={handleCategorySelect}
                  iconOpacity={categoryImageOpacity}
                  iconSize={categoryImageHeight}
                  disabled={!isStoreActive}
                />
                {/* Product List with headers */}
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
                      console.warn('Scroll failed', info);

                      // scroll to the nearest rendered index instead
                      flatListRef.current?.scrollToOffset({
                        offset: info.averageItemLength * info.index,
                        animated: true,
                      });

                      // retry after a delay
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
              shopId={vendor.shopId}
              cartId={cartId}
            />
          )}

          {/* Variants Modal */}
          {selectedProductForVariants && (
            <VariantsModal
              visible={variantsModalVisible}
              onClose={handleCloseVariantsModal}
              product={selectedProductForVariants}
              vendor={vendor}
              onVariantSelect={handleVariantSelect}
            />
          )}
        </View>
        {/* Product Detail Modal */}
      </SafeAreaView>
      {selectedProductForDetail && (
        <ProductDetailModal
          visible={productDetailModalVisible}
          onClose={handleCloseProductDetailModal}
          product={selectedProductForDetail}
          vendor={vendor}
        />
      )}
    </>
  );
};

VendorProductComponent.displayName = 'VendorProduct';

export default React.memo(VendorProductComponent);
