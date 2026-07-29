import AntDesign from '@react-native-vector-icons/ant-design';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useCallback, useEffect, useRef } from 'react';
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
import { useAuth } from '../../../contexts/login/AuthProvider';
import { storage } from '../../../services/localStorage/storage.service';
import productsService from '../../../services/productsService';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import { triggerAddToCartHaptic } from '../../../utils/haptics';
import { formatTimeToAMPM, getStoreStatus } from '../../../utils/storeUtils';
import { ThemeText } from '../../common/theme/ThemeText';

interface CategoryItem {
  id: string;
  name: string;
  image: any; // Using any for require() images or string for URIs
}

interface VendorShowcaseWidgetProps {
  vendor?: Vendor;
  products?: Product[];
  categories?: CategoryItem[];
  onPressProduct?: (product: Product) => void;
  onPressExplore?: () => void;
}

// Mock Data to match screenshot if no props provided
const MOCK_VENDOR: Vendor = {
  shopId: 'mock-1',
  name: 'Night Nescafe',
  rating: 4.3,
  preparationTime: '30 mins',
  shopAddress: {
    city: 'FC Road',
    address: '',
    state: '',
    postalCode: '',
  },
  logo: '',
  banner: '',
  owner: '',
  phone: '',
  openingTime: '',
  closingTime: '',
  description: '',
  category: 'Food',
  storeEnabled: true,
  storeActive: true,
};

const MOCK_IMAGE = 'https://loremflickr.com/320/240/pizza';

const WIDGET_CACHE_TTL = 5 * 60 * 1000;
const MMKV_PREFIX = 'vsw-cache-';

interface WidgetCacheEntry {
  categories: CategoryItem[];
  products: Product[];
  firstCategoryId: string;
  ts: number;
}

const memCache = new Map<string, WidgetCacheEntry>();

function getWidgetCache(shopId: string): WidgetCacheEntry | null {
  const mem = memCache.get(shopId);
  if (mem && Date.now() - mem.ts < WIDGET_CACHE_TTL) return mem;

  try {
    const raw = storage.getString(MMKV_PREFIX + shopId);
    if (raw) {
      const entry: WidgetCacheEntry = JSON.parse(raw);
      if (Date.now() - entry.ts < WIDGET_CACHE_TTL) {
        memCache.set(shopId, entry);
        return entry;
      }
    }
  } catch {
    // corrupted — ignore
  }
  return null;
}

function setWidgetCache(shopId: string, entry: WidgetCacheEntry) {
  memCache.set(shopId, entry);
  try {
    storage.set(MMKV_PREFIX + shopId, JSON.stringify(entry));
  } catch {
    // storage full — in-memory still works
  }
}

// --- Extracted & Memoized Components ---

interface CategoryRenderItemProps {
  item: CategoryItem;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const CategoryRenderItem = React.memo(({ item, isSelected, onPress }: CategoryRenderItemProps) => (
  <TouchableOpacity style={styles.categoryItem} onPress={() => onPress(item.id)}>
    <View
      style={[
        styles.categoryImageContainer,
        isSelected && { borderColor: '#003F66', borderWidth: 1.5 },
      ]}
    >
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.categoryImage}
      />
    </View>
    <ThemeText
      style={[styles.categoryName, isSelected && { color: '#003F66', fontWeight: '700' }]}
      numberOfLines={1}
    >
      {item.name}
    </ThemeText>
    {isSelected && <View style={styles.activeBar} />}
  </TouchableOpacity>
));
CategoryRenderItem.displayName = 'CategoryRenderItem';

interface ProductRenderItemProps {
  item: Product;
  quantity: number;
  onPress: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onIncrement: (sku: string) => void;
  onDecrement: (sku: string) => void;
}

const ProductRenderItem = React.memo(
  ({ item, quantity, onPress, onAddToCart, onIncrement, onDecrement }: ProductRenderItemProps) => (
    <TouchableOpacity style={styles.productCard} onPress={() => onPress(item)}>
      <View style={styles.productImageWrapper}>
        <Image source={{ uri: item.imageUrl || MOCK_IMAGE }} style={styles.productImage} />
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
            {item.mrp > item.sellingPrice && (
              <ThemeText style={styles.mrpText}>₹{item.mrp}</ThemeText>
            )}
            <ThemeText style={styles.sellingPriceText}>₹{item.sellingPrice}</ThemeText>
          </View>

          {quantity > 0 ? (
            <View>
              <LinearGradient
                colors={['#FFE566', '#FEDB51']} // Lighter yellow top to standard yellow bottom
                style={styles.quantityContainer}
                useAngle={true}
                angle={180}
              >
                <TouchableOpacity style={styles.qtyBtnMinus} onPress={() => onDecrement(item.sku)}>
                  <AntDesign name="minus" size={12} color="#1F2937" />
                </TouchableOpacity>
                <ThemeText style={styles.qtyText}>{quantity}</ThemeText>
                <TouchableOpacity style={styles.qtyBtnPlus} onPress={() => onIncrement(item.sku)}>
                  <AntDesign name="plus" size={12} color="#1F2937" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <TouchableOpacity onPress={() => onAddToCart(item)}>
              <LinearGradient
                colors={['#FFE566', '#FEDB51']} // Lighter yellow top to standard yellow bottom
                style={styles.addButton}
                useAngle={true}
                angle={180}
              >
                <AntDesign name="plus" size={16} color="#1F2937" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
);
ProductRenderItem.displayName = 'ProductRenderItem';

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
        { width: w, height: h, borderRadius, backgroundColor: '#F3F4F6', overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: '#E5E7EB',
          transform: [{ translateX }],
          opacity: 0.4,
        }}
      />
    </View>
  );
};

const ShowcaseSkeleton = () => {
  const shimmer = useShimmer();
  return (
    <View>
      {/* Category row skeleton */}
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={{ alignItems: 'center', marginRight: 20 }}>
            <ShimmerBlock width={56} height={56} borderRadius={28} shimmerValue={shimmer} />
            <ShimmerBlock
              width={48}
              height={10}
              borderRadius={4}
              shimmerValue={shimmer}
              style={{ marginTop: 6 }}
            />
          </View>
        ))}
      </View>
      {/* Product row skeleton */}
      <View style={{ flexDirection: 'row' }}>
        {[1, 2].map(i => (
          <View
            key={i}
            style={{ width: 140, marginRight: 12, borderRadius: 14, overflow: 'hidden' }}
          >
            <ShimmerBlock width={140} height={110} borderRadius={0} shimmerValue={shimmer} />
            <View style={{ padding: 8 }}>
              <ShimmerBlock width={100} height={12} borderRadius={4} shimmerValue={shimmer} />
              <ShimmerBlock
                width={60}
                height={14}
                borderRadius={4}
                shimmerValue={shimmer}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const ProductRowSkeleton = () => {
  const shimmer = useShimmer();
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ width: 140, marginRight: 12, borderRadius: 14, overflow: 'hidden' }}>
          <ShimmerBlock width={140} height={110} borderRadius={0} shimmerValue={shimmer} />
          <View style={{ padding: 8 }}>
            <ShimmerBlock width={100} height={12} borderRadius={4} shimmerValue={shimmer} />
            <ShimmerBlock
              width={60}
              height={14}
              borderRadius={4}
              shimmerValue={shimmer}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

// Pagination dots — one dot per visible "page", not per item
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

const VendorShowcaseWidget: React.FC<VendorShowcaseWidgetProps> = ({
  vendor = MOCK_VENDOR,
  products,
  categories,
  onPressProduct,
  onPressExplore,
}) => {
  const _theme = useTheme(); // kept for potential future use
  const cached = !products && !categories ? getWidgetCache(vendor.shopId) : null;

  const [isLoading, setIsLoading] = React.useState(!cached);
  const [fetchedProducts, setFetchedProducts] = React.useState<Product[]>(
    cached?.products ?? []
  );
  const [fetchedCategories, setFetchedCategories] = React.useState<CategoryItem[]>(
    cached?.categories ?? []
  );

  const productsListRef = React.useRef<FlatList>(null);

  // Scroll indicators + haptic feedback on page change
  const catScrollX = useRef(new Animated.Value(0)).current;
  const prodScrollX = useRef(new Animated.Value(0)).current;
  const catPageRef = useRef(0);
  const prodPageRef = useRef(0);

  React.useEffect(() => {
    const catId = catScrollX.addListener(({ value }) => {
      const page = Math.round(value / (76 * 4));
      if (page !== catPageRef.current) {
        catPageRef.current = page;
        triggerAddToCartHaptic();
      }
    });
    const prodId = prodScrollX.addListener(({ value }) => {
      const page = Math.round(value / (152 * 2));
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

  const activeProducts = products || fetchedProducts;
  const allCategories = categories || fetchedCategories;

  // Only show categories that have at least one product
  const activeCategories = React.useMemo(
    () => allCategories.filter(cat => activeProducts.some(p => p.division === cat.id)),
    [allCategories, activeProducts]
  );

  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    cached?.firstCategoryId ?? 'all'
  );

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
  const storeStatus = React.useMemo(() => getStoreStatus(vendor), [vendor]);
  const isStoreActive = React.useMemo(() => storeStatus.isOpen, [storeStatus.isOpen]);

  const cartId = React.useMemo(() => `vendor_${vendor.shopId}`, [vendor.shopId]);
  const cart = carts[cartId];

  // Filter products
  const displayedProducts = React.useMemo(() => {
    if (selectedCategory === 'all') return activeProducts;
    return activeProducts.filter(p => p.division === selectedCategory);
  }, [activeProducts, selectedCategory]);

  React.useEffect(() => {
    if (products && categories) {
      setIsLoading(false);
      return;
    }

    if (getWidgetCache(vendor.shopId)) return;

    const loadData = async () => {
      if (!vendor?.shopId) return;

      setIsLoading(true);
      try {
        const [cats, prodsResponse] = await Promise.all([
          productsService.fetchCategories(vendor.shopId),
          productsService.fetchAllProducts({ shopId: vendor.shopId, limit: 100 }),
        ]);

        const mappedCategories = cats.map(c => ({
          id: c.id,
          name: c.name,
          image:
            c.imageURLs && c.imageURLs.length > 0
              ? { uri: c.imageURLs[0] }
              : { uri: 'https://loremflickr.com/320/240/food' },
        }));

        const prods = Array.isArray(prodsResponse) ? prodsResponse : prodsResponse.products || [];

        const firstWithProducts = mappedCategories.find(cat =>
          prods.some((p: Product) => p.division === cat.id)
        );
        const firstId = firstWithProducts?.id || 'all';

        setWidgetCache(vendor.shopId, {
          categories: mappedCategories,
          products: prods,
          firstCategoryId: firstId,
          ts: Date.now(),
        });

        setFetchedCategories(mappedCategories);
        setFetchedProducts(prods);
        if (firstWithProducts) {
          setSelectedCategory(firstId);
        }
      } catch (err) {
        console.error('Failed to load vendor showcase data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [vendor?.shopId, products, categories]);

  // Cart Handlers
  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!isStoreActive || !product.inStock) return;

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
        authData?.jwt || '',
        authData?.phone || ''
      );
    },
    [isStoreActive, cartId, vendor.shopId, addToCart, setActiveCart, authData]
  );

  const handleIncrement = useCallback(
    (sku: string) => {
      if (!isStoreActive) return;
      increment(cartId, sku, authData?.jwt || '', authData?.phone || '');
    },
    [isStoreActive, cartId, increment, authData]
  );

  const handleDecrement = useCallback(
    (sku: string) => {
      if (!isStoreActive) return;
      decrement(cartId, sku, authData?.jwt || '', authData?.phone || '');
    },
    [isStoreActive, cartId, decrement, authData]
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
      setSelectedCategory(categoryId);

      if (productsListRef.current) {
        productsListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
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
      <CategoryRenderItem
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
        <ProductRenderItem
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
          <MaterialCommunityIcons name="chevron-right" size={16} color="#003F66" />
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
        <ShowcaseSkeleton />
      ) : (
        <View pointerEvents={!isStoreActive ? 'none' : 'auto'}>
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
            itemWidth={76}
            itemCount={activeCategories.length}
            visibleCount={4}
          />

          {/* Products */}
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
            itemWidth={152}
            itemCount={displayedProducts.length}
            visibleCount={2}
          />
        </View>
      )}
    </View>
  );
};

// Color constants from design
const COLORS = {
  background: '#F9FAFB',
  textDark: '#003F66', // Adjusted dark blue/slate
  textGrey: '#6B7280',
  primaryGreen: '#12A58C',
  greenDot: '#10B981',
  redDot: '#EF4444',
  yellowBtn: '#FCD34D',
  discountRed: '#DC2626',
  border: '#E5E7EB',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFCF5',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  ratingCount: {
    color: COLORS.textGrey,
    fontSize: 12,
    marginLeft: 4,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E5E7EB', // Light grey divider
    marginVertical: 16,
    width: '100%',
  },
  // Categories
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    maxWidth: 64,
    textAlign: 'center',
  },
  activeBar: {
    marginTop: 6,
    width: '100%',
    height: 3,
    backgroundColor: '#003F66', // Deep Blue
    borderRadius: 2,
  },
  // Products
  productsContainer: {
    marginBottom: 20,
    paddingBottom: 4,
  },
  productCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  productImageWrapper: {
    width: '100%',
    height: 110,
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
  vegIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.greenDot,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.greenDot,
  },
  productContent: {
    padding: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    height: 20, // limit to 1 line approx
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  prices: {
    flexDirection: 'column',
  },
  mrpText: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  sellingPriceText: {
    fontSize: 14,
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
    borderColor: '#FEDB51',
    elevation: 0,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    height: 28,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FEDB51',
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
    color: '#1F2937',
    minWidth: 16,
    textAlign: 'center',
  },
  // Footer
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
  exploreButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exploreTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#003F66',
  },
  // Pagination dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: -6,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
});

export default React.memo(VendorShowcaseWidget);
