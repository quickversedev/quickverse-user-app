import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from '@react-native-vector-icons/ant-design';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import productsService from '../../../services/productsService';
import useCartStore from '../../../store/cart/cartStore';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import { triggerAddToCartHaptic } from '../../../utils/haptics';
import { formatTimeToAMPM, getStoreStatus } from '../../../utils/storeUtils';
import LoginPromptModal from '../../common/LoginPromptModal';
import { ThemeText } from '../../common/theme/ThemeText';

interface CategoryItem {
  id: string;
  name: string;
  image: string | number | { uri: string };
}

interface CollectionShowcaseWidgetProps {
  vendor: Vendor;
  onPressProduct?: (product: Product) => void;
  onPressExplore?: () => void;
}

const PLACEHOLDER_IMAGE = 'https://loremflickr.com/320/240/food';

// --- Extracted & Memoized Components ---

interface CategoryChipProps {
  item: CategoryItem;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const CategoryChipBase = ({ item, isSelected, onPress }: CategoryChipProps) => (
  <TouchableOpacity style={styles.categoryItem} onPress={() => onPress(item.id)}>
    <View
      style={[
        styles.categoryImageContainer,
        isSelected && { borderColor: '#1E6B50', borderWidth: 1.5 },
      ]}
    >
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.categoryImage}
      />
    </View>
    <ThemeText
      style={[styles.categoryName, isSelected && { color: '#1E6B50', fontWeight: '700' }]}
      numberOfLines={1}
    >
      {item.name}
    </ThemeText>
    {isSelected && <View style={styles.activeBar} />}
  </TouchableOpacity>
);

const CategoryChip = React.memo(CategoryChipBase);
CategoryChip.displayName = 'CategoryChip';

interface ProductCardProps {
  item: Product;
  quantity: number;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onIncrement: (sku: string) => void;
  onDecrement: (sku: string) => void;
}

const ProductCardBase: React.FC<ProductCardProps> = ({
  item,
  quantity,
  onPress,
  onAddToCart,
  onIncrement,
  onDecrement,
}) => (
  <TouchableOpacity style={styles.productCard} onPress={() => onPress(item)}>
    <View style={styles.productImageWrapper}>
      <Image source={{ uri: item.imageUrl || PLACEHOLDER_IMAGE }} style={styles.productImage} />
      {item.discount > 0 && (
        <View style={styles.discountBadge}>
          <ThemeText style={styles.discountText}>{item.discount}% OFF</ThemeText>
        </View>
      )}
    </View>

    <View style={styles.productContent}>
      <ThemeText style={styles.productName} numberOfLines={1}>
        {item.name}
      </ThemeText>

      <View style={styles.priceRow}>
        <View style={styles.prices}>
          <ThemeText style={styles.mrpText}>
            {item.mrp > item.sellingPrice ? `₹${item.mrp}` : ' '}
          </ThemeText>
          <ThemeText style={styles.sellingPriceText}>₹{item.sellingPrice}</ThemeText>
        </View>

        {quantity > 0 ? (
          <View>
            <LinearGradient
              colors={['#A7F3D0', '#6EE7B7']}
              style={styles.quantityContainer}
              useAngle={true}
              angle={180}
            >
              <TouchableOpacity style={styles.qtyBtnMinus} onPress={() => onDecrement(item.sku)}>
                <AntDesign name="minus" size={12} color="#065F46" />
              </TouchableOpacity>
              <ThemeText style={styles.qtyText}>{quantity}</ThemeText>
              <TouchableOpacity style={styles.qtyBtnPlus} onPress={() => onIncrement(item.sku)}>
                <AntDesign name="plus" size={12} color="#065F46" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          <TouchableOpacity onPress={() => onAddToCart(item)}>
            <LinearGradient
              colors={['#A7F3D0', '#6EE7B7']}
              style={styles.addButton}
              useAngle={true}
              angle={180}
            >
              <AntDesign name="plus" size={16} color="#065F46" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

const ProductCard = React.memo(ProductCardBase);
ProductCard.displayName = 'ProductCard';

// Pagination dots
interface ScrollDotsProps {
  scrollX: Animated.Value;
  itemWidth: number;
  itemCount: number;
  visibleCount: number;
}

const ScrollDotsBase: React.FC<ScrollDotsProps> = ({
  scrollX,
  itemWidth,
  itemCount,
  visibleCount,
}) => {
  const pageCount = Math.ceil(itemCount / visibleCount);
  if (pageCount <= 1) return null;

  const pageWidth = itemWidth * visibleCount;

  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: pageCount }).map((_, i) => {
        const inputRange = [(i - 1) * pageWidth, i * pageWidth, (i + 1) * pageWidth];
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.25, 1, 0.25],
          extrapolate: 'clamp',
        });
        return <Animated.View key={i} style={[styles.dot, { opacity }]} />;
      })}
    </View>
  );
};

const ScrollDots = React.memo(ScrollDotsBase);

// --- Shimmer Skeleton ---
const screenWidth = Dimensions.get('window').width;

const useShimmer = () => {
  const shimmerValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerValue]);
  return shimmerValue;
};

const ShimmerBlock = ({
  width: w,
  height: h,
  borderRadius = 8,
  style,
  shimmerValue,
}: {
  width: number;
  height: number;
  borderRadius?: number;
  style?: object;
  shimmerValue: Animated.Value;
}) => {
  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });
  return (
    <View
      style={[
        { width: w, height: h, borderRadius, backgroundColor: '#E5F5ED', overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: '#D1FAE5',
          transform: [{ translateX }],
          opacity: 0.5,
        }}
      />
    </View>
  );
};

const CollectionSkeleton = () => {
  const shimmer = useShimmer();
  return (
    <View>
      {/* Category row skeleton */}
      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={{ alignItems: 'center', marginRight: 16 }}>
            <ShimmerBlock width={42} height={42} borderRadius={21} shimmerValue={shimmer} />
            <ShimmerBlock
              width={40}
              height={8}
              borderRadius={4}
              shimmerValue={shimmer}
              style={{ marginTop: 4 }}
            />
          </View>
        ))}
      </View>
      {/* Product row skeleton */}
      <View style={{ flexDirection: 'row' }}>
        {[1, 2].map(i => (
          <View
            key={i}
            style={{ width: 120, marginRight: 12, borderRadius: 12, overflow: 'hidden' }}
          >
            <ShimmerBlock width={120} height={85} borderRadius={0} shimmerValue={shimmer} />
            <View style={{ padding: 6 }}>
              <ShimmerBlock width={80} height={10} borderRadius={4} shimmerValue={shimmer} />
              <ShimmerBlock
                width={50}
                height={12}
                borderRadius={4}
                shimmerValue={shimmer}
                style={{ marginTop: 6 }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const CollectionProductRowSkeleton = () => {
  const shimmer = useShimmer();
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ width: 120, marginRight: 12, borderRadius: 12, overflow: 'hidden' }}>
          <ShimmerBlock width={120} height={85} borderRadius={0} shimmerValue={shimmer} />
          <View style={{ padding: 6 }}>
            <ShimmerBlock width={80} height={10} borderRadius={4} shimmerValue={shimmer} />
            <ShimmerBlock
              width={50}
              height={12}
              borderRadius={4}
              shimmerValue={shimmer}
              style={{ marginTop: 6 }}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const CollectionShowcaseWidget: React.FC<CollectionShowcaseWidgetProps> = ({
  vendor,
  onPressProduct,
  onPressExplore,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchedProducts, setFetchedProducts] = React.useState<Product[]>([]);
  const [fetchedCategories, setFetchedCategories] = React.useState<CategoryItem[]>([]);

  // UI State for category switching
  const [isSwitchingCat, setIsSwitchingCat] = React.useState(false);
  const productsListRef = React.useRef<FlatList>(null);

  // Scroll indicators + haptic feedback on page change
  const catScrollX = useRef(new Animated.Value(0)).current;
  const prodScrollX = useRef(new Animated.Value(0)).current;
  const catPageRef = useRef(0);
  const prodPageRef = useRef(0);

  React.useEffect(() => {
    const catId = catScrollX.addListener(({ value }) => {
      const page = Math.round(value / (58 * 4));
      if (page !== catPageRef.current) {
        catPageRef.current = page;
        triggerAddToCartHaptic();
      }
    });
    const prodId = prodScrollX.addListener(({ value }) => {
      const page = Math.round(value / (132 * 2));
      if (page !== prodPageRef.current) {
        prodPageRef.current = page;
        triggerAddToCartHaptic();
      }
    });
    return () => {
      catScrollX.removeListener(catId);
      prodScrollX.removeListener(prodId);
    };
  }, [catScrollX, prodScrollX]);

  const allCategories = fetchedCategories;

  // Only show categories that have at least one product
  const activeCategories = React.useMemo(
    () => allCategories.filter(cat => fetchedProducts.some(p => p.division === cat.id)),
    [allCategories, fetchedProducts]
  );

  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Auto-select first category if current selection has no products
  React.useEffect(() => {
    if (activeCategories.length > 0) {
      const isValid =
        selectedCategory === 'all' || activeCategories.some(c => c.id === selectedCategory);
      if (!isValid) {
        setSelectedCategory(activeCategories[0].id);
      }
    }
  }, [activeCategories, selectedCategory]);

  // Cart Integration
  const { addToCart, increment, decrement, carts, setActiveCart } = useCartStore();
  const { authData } = useAuth();
  const hasAuth = React.useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const storeStatus = React.useMemo(() => getStoreStatus(vendor), [vendor]);
  const isStoreActive = React.useMemo(() => storeStatus.isOpen, [storeStatus.isOpen]);

  const cartId = React.useMemo(() => `vendor_${vendor.shopId}`, [vendor.shopId]);
  const cart = carts[cartId];

  // Filter products
  const displayedProducts = React.useMemo(() => {
    if (selectedCategory === 'all') return fetchedProducts;
    return fetchedProducts.filter(p => p.division === selectedCategory);
  }, [fetchedProducts, selectedCategory]);

  // Fetch data using collection-specific API
  React.useEffect(() => {
    if (!vendor?.shopId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const cats = await productsService.fetchCategories(vendor.shopId);

        // Fetch products for each category in parallel using collection API
        const categoryIds = cats.map(c => c.id);
        const productPromises = categoryIds.map(categoryId =>
          productsService
            .fetchProductsForCollection({ shopId: vendor.shopId, categoryId })
            .catch(() => [] as Product[])
        );

        const results = await Promise.all(productPromises);
        const allProducts = results.flat();

        // Deduplicate by SKU
        const seenSkus = new Set<string>();
        const uniqueProducts = allProducts.filter(p => {
          if (seenSkus.has(p.sku)) return false;
          seenSkus.add(p.sku);
          return true;
        });

        // Map API categories to UI model. Grocery shops often return empty
        // imageURLs for categories — fall back to the first in-category
        // product's image so each chip gets a representative thumbnail.
        const mappedCategories = cats.map(c => {
          const apiImage =
            c.imageURLs && c.imageURLs.length > 0 ? c.imageURLs[0] : null;
          const sampleProduct = uniqueProducts.find(p => p.division === c.id && p.imageUrl);
          return {
            id: c.id,
            name: c.name,
            image: { uri: apiImage || sampleProduct?.imageUrl || PLACEHOLDER_IMAGE },
          };
        });

        setFetchedCategories(mappedCategories);
        setFetchedProducts(uniqueProducts);

        // Select first category that has products
        const firstWithProducts = mappedCategories.find(cat =>
          uniqueProducts.some((p: Product) => p.division === cat.id)
        );
        if (firstWithProducts) {
          setSelectedCategory(firstWithProducts.id);
        }
      } catch (err) {
        console.error('Failed to load collection showcase data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vendor.shopId]);

  // Cart Handlers
  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!isStoreActive || !product.inStock) return;
      if (!hasAuth) {
        setShowLoginModal(true);
        return;
      }

      setActiveCart(cartId);

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
    [isStoreActive, hasAuth, cartId, vendor.shopId, addToCart, setActiveCart, authData]
  );

  const handleIncrement = useCallback(
    (sku: string) => {
      if (!isStoreActive) return;
      if (!hasAuth) {
        setShowLoginModal(true);
        return;
      }
      increment(cartId, sku, authData!.jwt, authData!.phone);
    },
    [isStoreActive, hasAuth, cartId, increment, authData]
  );

  const handleDecrement = useCallback(
    (sku: string) => {
      if (!isStoreActive) return;
      if (!hasAuth) {
        setShowLoginModal(true);
        return;
      }
      decrement(cartId, sku, authData!.jwt, authData!.phone);
    },
    [isStoreActive, hasAuth, cartId, decrement, authData]
  );

  const getProductQuantity = useCallback(
    (sku: string) => {
      if (!cart || !cart.products) return 0;
      return cart.products[sku]?.quantity || 0;
    },
    [cart]
  );

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      if (selectedCategory === categoryId) return;

      setIsSwitchingCat(true);
      setSelectedCategory(categoryId);

      if (productsListRef.current) {
        productsListRef.current.scrollToOffset({ offset: 0, animated: false });
      }

      setTimeout(() => {
        setIsSwitchingCat(false);
      }, 500);
    },
    [selectedCategory]
  );

  const handlePressProduct = useCallback(
    (product: Product) => {
      if (onPressProduct) onPressProduct(product);
    },
    [onPressProduct]
  );

  const renderCategoryItem = useCallback(
    ({ item }: { item: CategoryItem }) => (
      <CategoryChip
        item={item}
        isSelected={selectedCategory === item.id}
        onPress={handleCategorySelect}
      />
    ),
    [selectedCategory, handleCategorySelect]
  );

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={{ marginRight: 12 }}>
        <ProductCard
          item={item}
          quantity={getProductQuantity(item.sku)}
          onPress={handlePressProduct}
          onAddToCart={handleAddToCart}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
        />
      </View>
    ),
    [getProductQuantity, handlePressProduct, handleAddToCart, handleIncrement, handleDecrement]
  );

  // Hide widget entirely if no categories have products
  if (!isLoading && activeCategories.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.vendorInfo}>
          <ThemeText style={styles.vendorName}>{vendor.name}</ThemeText>
          <View style={styles.metaRow}>
            <FontAwesome6
              name="bolt-lightning"
              iconStyle="solid"
              size={10}
              color="#9CA3AF"
              style={{ marginRight: 4 }}
            />
            <ThemeText style={styles.metaText}>{vendor.preparationTime || '30 mins'}</ThemeText>
            <ThemeText style={{ marginHorizontal: 4, color: '#9CA3AF' }}>•</ThemeText>
            <ThemeText style={styles.metaText}>{vendor.shopAddress?.city || 'Location'}</ThemeText>
          </View>
        </View>
        <TouchableOpacity style={styles.exploreButtonSmall} onPress={onPressExplore}>
          <ThemeText style={styles.exploreTextSmall}>Explore</ThemeText>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#1E6B50" />
        </TouchableOpacity>
      </View>

      {/* Store Closed Banner */}
      {!isStoreActive && (
        <View style={styles.closedBanner}>
          <ThemeText style={styles.closedText}>WE ARE CLOSED</ThemeText>
          {vendor.openingTime && vendor.closingTime && (
            <ThemeText style={styles.closedTimingText}>
              {formatTimeToAMPM(vendor.openingTime)} - {formatTimeToAMPM(vendor.closingTime)}
            </ThemeText>
          )}
        </View>
      )}

      {isLoading ? (
        <CollectionSkeleton />
      ) : (
        <View
          pointerEvents={!isStoreActive ? 'none' : 'auto'}
        >
          {!isStoreActive && <View style={styles.disabledOverlay} />}
          {/* Categories */}
          <FlatList
            horizontal
            data={activeCategories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={{ paddingRight: 20 }}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: catScrollX } } }], {
              useNativeDriver: false,
            })}
            scrollEventThrottle={16}
          />
          <ScrollDots
            scrollX={catScrollX}
            itemWidth={58}
            itemCount={activeCategories.length}
            visibleCount={5}
          />

          {/* Products */}
          {isSwitchingCat ? (
            <View style={{ paddingTop: 8 }}>
              <CollectionProductRowSkeleton />
            </View>
          ) : (
            <>
              <FlatList
                ref={productsListRef}
                horizontal
                data={displayedProducts}
                renderItem={renderProductItem}
                keyExtractor={(item, index) => `${item.sku}-${index}`}
                showsHorizontalScrollIndicator={false}
                style={styles.productsContainer}
                contentContainerStyle={{ paddingRight: 10 }}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={true}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: prodScrollX } } }], {
                  useNativeDriver: false,
                })}
                scrollEventThrottle={16}
              />
              <ScrollDots
                scrollX={prodScrollX}
                itemWidth={132}
                itemCount={displayedProducts.length}
                visibleCount={2}
              />
            </>
          )}
        </View>
      )}

      <LoginPromptModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Login required"
        message="Please log in to add items to your cart."
      />
    </View>
  );
};

// Color constants — collection-themed (greenish tones vs vendor's blue)
const COLORS = {
  background: '#F0FDF4',
  textDark: '#1E3A2F',
  textGrey: '#6B7280',
  accent: '#059669',
  border: '#D1FAE5',
  discountRed: '#DC2626',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FEFB',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5F5ED',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
    fontFamily: 'BricolageGrotesque-Bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textGrey,
    fontWeight: '500',
  },
  // Categories
  categoriesContainer: {
    marginBottom: 2,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryImageContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
    maxWidth: 56,
    textAlign: 'center',
  },
  activeBar: {
    marginTop: 4,
    width: '100%',
    height: 2,
    backgroundColor: '#1E6B50',
    borderRadius: 2,
  },
  // Products
  productsContainer: {
    marginBottom: 10,
    paddingBottom: 4,
  },
  productCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5F5ED',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productImageWrapper: {
    width: '100%',
    height: 85,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: COLORS.discountRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  productContent: {
    padding: 6,
  },
  productName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
    height: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'space-between',
  },
  prices: {
    flexDirection: 'column',
  },
  mrpText: {
    fontSize: 10,
    lineHeight: 14,
    minHeight: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  sellingPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    elevation: 0,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    height: 28,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    elevation: 0,
  },
  qtyBtnMinus: {
    padding: 4,
  },
  qtyBtnPlus: {
    padding: 4,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    minWidth: 16,
    textAlign: 'center',
  },
  // Explore button (top-right)
  exploreButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  exploreTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E6B50',
  },
  // Closed state
  closedBanner: {
    marginBottom: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: {
    color: '#EF4444',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 4,
    fontSize: 13,
  },
  closedTimingText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    zIndex: 10,
    borderRadius: 12,
  },
  // Pagination dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 12,
    marginTop: 4,
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
  },
});

export default React.memo(CollectionShowcaseWidget);
