import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { Images } from '../../assets';
import { Product } from '../../assets/mock/products';
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
import { Variant } from '../../services/api/variantsService';
import useCartStore from '../../store/cart/cartStore';
import { useProductsStore } from '../../store/products/productsStore';
import { useTheme } from '../../theme/ThemeContext';
import { Vendor } from '../../types/vendor';

// Category type for local use (as expected by CategoryTabs)
type Category = CategoryItem;

// Categories will be filtered based on fetched products

interface VendorProductRouteParams {
  vendor: Vendor;
}
type VendorProductRouteProp = RouteProp<
  { VendorProduct: VendorProductRouteParams },
  'VendorProduct'
>;

const { width } = Dimensions.get('window');

// Helper: create a row-based list with headers and product rows
const getRowBasedProductList = (
  categories: Category[],
  products: Product[],
  numColumns: number
) => {
  const rows: Array<
    { type: 'header'; category: Category } | { type: 'products'; products: Product[] }
  > = [];
  categories.forEach((cat: Category) => {
    rows.push({ type: 'header', category: cat });
    // Map category.id to product.division per API contract
    const catProducts = products.filter((p: Product) => p.division === cat.id);
    for (let i = 0; i < catProducts.length; i += numColumns) {
      rows.push({ type: 'products', products: catProducts.slice(i, i + numColumns) });
    }
  });
  return rows;
};

const VendorProduct: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const { authData } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<VendorProductRouteProp>();
  const { vendor } = route.params;

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

  // Fetch products and categories on mount or when vendor.shopId changes
  useEffect(() => {
    setShopId(vendor.shopId);
    resetProducts();
    fetchProducts({ offset: 0, limit: 50 });
    fetchCategories(vendor.shopId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor.shopId]);

  // Map store categories to CategoryTabs items with a placeholder icon
  const categoriesForTabs: Category[] = (categories || []).map(c => ({
    id: c.id,
    name: c.name,
    icon: Images.bg1,
  }));

  // Only include categories that have at least one product (match product.division)
  const filteredCategories: Category[] = categoriesForTabs.filter(cat =>
    products.some(product => product.division === cat.id)
  );

  // Cart store integration
  const { addToCart, increment, decrement, setActiveCart, carts } = useCartStore();

  // Create vendor-specific cart ID
  const cartId = `vendor_${vendor.shopId}`;

  // Set this cart as active when component mounts
  useEffect(() => {
    setActiveCart(cartId);
  }, [cartId, setActiveCart]);

  // Get item count for this cart
  const itemCount = Object.values(carts[cartId]?.products || {}).reduce(
    (sum, p) => sum + p.quantity,
    0
  );

  const [selectedCategory, setSelectedCategory] = useState(
    filteredCategories.length > 0 ? filteredCategories[0].id : ''
  );
  const scrollY = useRef(new Animated.Value(0)).current;
  const categoryScrollRef = useRef<ScrollView>(null);

  // Animated value for timing section opacity
  const timingOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Animated value for timing section height
  const timingHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [40, 0],
    extrapolate: 'clamp',
  });

  // Animated value for category images opacity
  const categoryImageOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Animated value for category images height
  const categoryImageHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [32, 0],
    extrapolate: 'clamp',
  });

  // Auto-scroll to selected category when categories are loaded
  useEffect(() => {
    if (filteredCategories.length > 0 && selectedCategory && categoryScrollRef.current) {
      const categoryIndex = filteredCategories.findIndex(cat => cat.id === selectedCategory);
      if (categoryIndex !== -1) {
        // Small delay to ensure the ScrollView is rendered
        setTimeout(() => {
          const categoryWidth = 120; // Approximate width of each category item
          const screenWidth = width;
          const scrollToX = Math.max(
            0,
            categoryIndex * categoryWidth - screenWidth / 2 + categoryWidth / 2
          );

          categoryScrollRef.current?.scrollTo({
            x: scrollToX,
            animated: true,
          });
        }, 100);
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
  const numColumns = 3;
  const rowProductList = getRowBasedProductList(filteredCategories, products, numColumns);
  type RowProductListItem =
    | { type: 'header'; category: Category }
    | { type: 'products'; products: Product[] };
  const flatListRef = useRef<FlatList<RowProductListItem> | null>(null);

  // Map category id to index in flatProductList for scrollToIndex
  const categoryIndexMap: { [key: string]: number } = {};
  rowProductList.forEach((item, idx) => {
    if (item.type === 'header') {
      categoryIndexMap[item.category.id] = idx;
    }
  });

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
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);

    // Scroll to the category in the horizontal scroll view
    const categoryIndex = filteredCategories.findIndex(cat => cat.id === catId);
    if (categoryIndex !== -1 && categoryScrollRef.current) {
      // Calculate the position to center the selected category
      const categoryWidth = 120; // Approximate width of each category item
      const screenWidth = width;
      const scrollToX = Math.max(
        0,
        categoryIndex * categoryWidth - screenWidth / 2 + categoryWidth / 2
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
  };

  // Listen to scroll for category selection
  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
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
  });

  // Cart operation handlers
  const handleAddToCart = (product: Product) => {
    if (!vendor.storeActive || !authData?.jwt) return; // Disable when store is closed or no auth

    // If product has multiple variants, show variants modal
    if (product.numberOfVariants > 1) {
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
        image: product.imageUrl, // Now a URL string
      },
      authData.jwt
    );
  };

  const handleVariantSelect = (variant: Variant) => {
    if (!selectedProductForVariants || !authData?.jwt) return;

    addToCart(
      cartId,
      {
        sku: variant.id,
        shopId: vendor.shopId,
        name: variant.name,
        price: variant.price,
        mrp: variant.mrp,
        image: selectedProductForVariants.imageUrl,
      },
      authData.jwt
    );
  };

  const handleIncrement = (sku: string) => {
    if (!vendor.storeActive || !authData?.jwt) return; // Disable when store is closed or no auth
    increment(cartId, sku, authData.jwt);
  };

  const handleDecrement = (sku: string) => {
    if (!vendor.storeActive || !authData?.jwt) return; // Disable when store is closed or no auth
    decrement(cartId, sku, authData.jwt);
  };

  const getProductQuantity = (sku: string) => {
    const cart = useCartStore.getState().carts[cartId];
    return cart?.products[sku]?.quantity || 0;
  };

  // If there are no categories or products, show a message
  if (!productsLoading && filteredCategories.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background') }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: getColor('text'), fontSize: 16 }}>
            No products available for this vendor.
          </Text>
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

  const styles = StyleSheet.create({
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
    vendorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: 12,
      margin: 16,
      // marginBottom: 12,
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
      fontWeight: 'bold',
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
      fontWeight: 'bold',
      marginLeft: 2,
    },
    categoryContainer: {
      backgroundColor: getColor('background'),
      // paddingVertical: 12,
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
      fontWeight: 'bold',
    },
    productMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    productRating: {
      color: '#1ec28b',
      fontWeight: 'bold',
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
      fontWeight: 'bold',
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
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginLeft: 4,
    },
    bookmarkIcon: {
      marginLeft: 8,
    },
    headerTitle: {
      color: getColor('text'),
      fontSize: getTypography('h2'),
      fontWeight: 'bold',
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
      // paddingVertical: 18,
      paddingHorizontal: 16,
      // borderBottomWidth: 1,
      // borderBottomColor: getColor('border'),
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
      fontWeight: 'bold',
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
      marginTop: -16,
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
  });

  const safeAreaTop = Platform.select({
    ios: 0,
    android: StatusBar.currentHeight || 0,
    default: 0,
  });

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: getColor('background'), paddingTop: safeAreaTop }}
      >
        <View style={styles.container}>
          {/* Header */}
          <VendorTopBar title={vendor.name} onBack={() => navigation.goBack()} />

          {/* Vendor Card */}
          <VendorHeaderCard
            vendor={vendor}
            onPress={() => navigation.navigate('VendorProfile', { vendor })}
            style={!vendor.storeActive ? styles.vendorCardClosed : undefined}
          />

          {/* Store Status Banner */}
          {!vendor.storeActive && (
            <View style={styles.closedBanner}>
              <Text style={styles.closedText}>WE ARE CLOSED</Text>
            </View>
          )}

          {/* Main Content: Categories + Products */}
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
                text={`${vendor.openingTime} - ${vendor.closingTime}`}
                textStyle={{ fontSize: 14, fontWeight: 'normal' }}
              />
            </Animated.View>

            <CategoryTabs
              categories={filteredCategories}
              selectedCategoryId={selectedCategory}
              onSelect={handleCategorySelect}
              iconOpacity={categoryImageOpacity}
              iconSize={categoryImageHeight}
              disabled={!vendor.storeActive}
            />
            {/* Product List with headers */}
            <Animated.View style={[styles.productList, { width: '100%' }]}>
              <Animated.FlatList
                ref={flatListRef}
                data={rowProductList}
                keyExtractor={(item, idx) => {
                  if (item.type === 'header') return `header-${item.category.id}`;
                  if (item.type === 'products') return `products-row-${idx}`;
                  return `row-${idx}`;
                }}
                renderItem={({ item }) => {
                  if (item.type === 'header') {
                    return <CategoryHeader title={item.category.name} />;
                  } else if (item.type === 'products') {
                    return (
                      <View style={styles.productRow}>
                        {item.products.map((product: Product) => (
                          <ProductCard
                            key={product.sku}
                            image={Images.bg1}
                            name={product.name}
                            price={product.sellingPrice}
                            mrp={product.mrp}
                            discount={product.discount || 0}
                            rating={0}
                            onAdd={() => handleAddToCart(product)}
                            onIncrement={() => handleIncrement(product.sku)}
                            onDecrement={() => handleDecrement(product.sku)}
                            quantity={getProductQuantity(product.sku)}
                            disabled={!vendor.storeActive}
                            numberOfVariants={product.numberOfVariants}
                            showVariantsCount={true}
                            onPress={() => {
                              setSelectedProductForDetail(product);
                              setProductDetailModalVisible(true);
                            }}
                            backgroundColor={getColor('background')}
                          />
                        ))}
                        {/* Fill empty columns if needed */}
                        {item.products.length < numColumns &&
                          Array.from({ length: numColumns - item.products.length }).map(
                            (_, idx) => (
                              <View key={`empty-${idx}`} style={styles.emptyProductCell} />
                            )
                          )}
                      </View>
                    );
                  }
                  return null;
                }}
                numColumns={1}
                key={'row-based'}
                showsVerticalScrollIndicator={false}
                getItemLayout={undefined}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
              />
            </Animated.View>
          </View>
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
              onClose={() => {
                setVariantsModalVisible(false);
                setSelectedProductForVariants(null);
              }}
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
          onClose={() => {
            setProductDetailModalVisible(false);
            setSelectedProductForDetail(null);
          }}
          product={selectedProductForDetail}
          vendor={vendor}
        />
      )}
    </>
  );
};

export default VendorProduct;
