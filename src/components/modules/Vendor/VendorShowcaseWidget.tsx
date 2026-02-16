import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../contexts/login/AuthProvider';
import productsService from '../../../services/productsService';
import useCartStore from '../../../store/cart/cartStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { Vendor } from '../../../types/vendor';
import { getStoreStatus } from '../../../utils/storeUtils';
import { ThemeText } from '../../common/theme/ThemeText';

const { width } = Dimensions.get('window');

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

// --- Extracted & Memoized Components ---

interface CategoryRenderItemProps {
    item: CategoryItem;
    isSelected: boolean;
    onPress: (id: string) => void;
}

const CategoryRenderItem = React.memo(({ item, isSelected, onPress }: CategoryRenderItemProps) => (
    <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => onPress(item.id)}
    >
        <View style={[
            styles.categoryImageContainer,
            isSelected && { borderColor: '#003F66', borderWidth: 1.5 }
        ]}>
            <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.categoryImage} />
        </View>
        <ThemeText style={[
            styles.categoryName,
            isSelected && { color: '#003F66', fontWeight: '700' }
        ]}>{item.name}</ThemeText>
        {isSelected && <View style={styles.activeBar} />}
    </TouchableOpacity>
));

interface ProductRenderItemProps {
    item: Product;
    quantity: number;
    onPress: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    onIncrement: (sku: string) => void;
    onDecrement: (sku: string) => void;
}

const ProductRenderItem = React.memo(({ item, quantity, onPress, onAddToCart, onIncrement, onDecrement }: ProductRenderItemProps) => (
    <TouchableOpacity
        style={styles.productCard}
        onPress={() => onPress(item)}
    >
        <View style={styles.productImageWrapper}>
            <Image source={{ uri: item.imageUrl || MOCK_IMAGE }} style={styles.productImage} />
            {item.discount > 0 && (
                <View style={styles.discountBadge}>
                    <ThemeText style={styles.discountText}>{item.discount}% OFF</ThemeText>
                </View>
            )}
            <View style={[styles.vegIcon, !item.veg && { borderColor: '#EF4444' }]}>
                <View style={[styles.vegDot, !item.veg && { backgroundColor: '#EF4444' }]} />
            </View>
        </View>

        <View style={styles.productContent}>
            <ThemeText style={styles.productName} numberOfLines={1}>{item.name}</ThemeText>

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
                            <TouchableOpacity
                                style={styles.qtyBtnMinus}
                                onPress={() => onDecrement(item.sku)}
                            >
                                <AntDesign name="minus" size={12} color="#1F2937" />
                            </TouchableOpacity>
                            <ThemeText style={styles.qtyText}>{quantity}</ThemeText>
                            <TouchableOpacity
                                style={styles.qtyBtnPlus}
                                onPress={() => onIncrement(item.sku)}
                            >
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
));

const VendorShowcaseWidget: React.FC<VendorShowcaseWidgetProps> = ({
    vendor = MOCK_VENDOR,
    products,
    categories,
    onPressProduct,
    onPressExplore,
}) => {
    const { getColor } = useTheme();
    const [isLoading, setIsLoading] = React.useState(true);
    const [fetchedProducts, setFetchedProducts] = React.useState<Product[]>([]);
    const [fetchedCategories, setFetchedCategories] = React.useState<CategoryItem[]>([]);

    // UI State for category switching
    const [isSwitchingCat, setIsSwitchingCat] = React.useState(false);
    const productsListRef = React.useRef<FlatList>(null);

    const activeProducts = products || fetchedProducts;
    const activeCategories = categories || fetchedCategories;

    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

    // Cart Integration
    const { addToCart, increment, decrement, carts, setActiveCart } = useCartStore();
    const { authData } = useAuth();
    const hasAuth = React.useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);
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
        // If props are provided, don't fetch
        if (products && categories) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            if (!vendor?.shopId) return;

            setIsLoading(true);
            try {
                const [cats, prodsResponse] = await Promise.all([
                    productsService.fetchCategories(vendor.shopId),
                    productsService.fetchAllProducts({ shopId: vendor.shopId, limit: 100 })
                ]);

                // Map API categories to UI model
                const mappedCategories = cats.map(c => ({
                    id: c.id,
                    name: c.name,
                    image: (c.imageURLs && c.imageURLs.length > 0) ? { uri: c.imageURLs[0] } : { uri: 'https://loremflickr.com/320/240/food' }
                }));

                const prods = Array.isArray(prodsResponse) ? prodsResponse : prodsResponse.products || [];

                setFetchedCategories(mappedCategories);
                setFetchedProducts(prods);

                // Select first category by default if available
                if (mappedCategories.length > 0) {
                    setSelectedCategory(mappedCategories[0].id);
                }
            } catch (err) {
                console.error("Failed to load vendor showcase data", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [vendor?.shopId, products, categories]);

    // Cart Handlers
    const handleAddToCart = useCallback((product: Product) => {
        if (!isStoreActive || !hasAuth || !product.inStock) return;

        // Ensure active cart is set
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
    }, [isStoreActive, hasAuth, cartId, vendor.shopId, addToCart, setActiveCart, authData]);

    const handleIncrement = useCallback((sku: string) => {
        if (!isStoreActive || !hasAuth) return;
        increment(cartId, sku, authData!.jwt, authData!.phone);
    }, [isStoreActive, hasAuth, cartId, increment, authData]);

    const handleDecrement = useCallback((sku: string) => {
        if (!isStoreActive || !hasAuth) return;
        decrement(cartId, sku, authData!.jwt, authData!.phone);
    }, [isStoreActive, hasAuth, cartId, decrement, authData]);

    const getProductQuantity = useCallback((sku: string) => {
        if (!cart || !cart.products) return 0;
        return cart.products[sku]?.quantity || 0;
    }, [cart]);

    const handleCategorySelect = useCallback((categoryId: string) => {
        if (selectedCategory === categoryId) return;

        setIsSwitchingCat(true);
        setSelectedCategory(categoryId);

        // Reset scroll position
        if (productsListRef.current) {
            productsListRef.current.scrollToOffset({ offset: 0, animated: false });
        }

        // Brief delay to show loading state
        setTimeout(() => {
            setIsSwitchingCat(false);
        }, 500);
    }, [selectedCategory]);

    const handlePressProduct = useCallback((product: Product) => {
        if (onPressProduct) onPressProduct(product);
    }, [onPressProduct]);

    const renderCategoryItem = useCallback(({ item }: { item: CategoryItem }) => (
        <CategoryRenderItem
            item={item}
            isSelected={selectedCategory === item.id}
            onPress={handleCategorySelect}
        />
    ), [selectedCategory, handleCategorySelect]);

    const renderProductItem = useCallback(({ item }: { item: Product }) => (
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
    ), [getProductQuantity, handlePressProduct, handleAddToCart, handleIncrement, handleDecrement]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.vendorInfo}>
                    <ThemeText style={styles.vendorName}>{vendor.name}</ThemeText>
                    <View style={styles.metaRow}>
                        <FontAwesome6 name="bolt-lightning" size={10} color="#9CA3AF" style={{ marginRight: 4 }} />
                        <ThemeText style={styles.metaText}>{vendor.preparationTime || '30 mins'}</ThemeText>
                        <ThemeText style={{ marginHorizontal: 4, color: '#9CA3AF' }}>•</ThemeText>
                        <ThemeText style={styles.metaText}>{vendor.shopAddress?.city || 'Location'}</ThemeText>
                    </View>
                </View>

                <View style={styles.ratingContainer}>
                    <View style={styles.ratingBadge}>
                        <AntDesign name="star" size={10} color="#fff" />
                        <ThemeText style={styles.ratingText}>{vendor.rating || 4.3}</ThemeText>
                    </View>
                    <ThemeText style={styles.ratingCount}>(242)</ThemeText>
                </View>
            </View>

            {isLoading ? (
                <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={COLORS.primaryGreen} />
                </View>
            ) : (
                <>
                    {/* Categories */}
                    <FlatList
                        horizontal
                        data={activeCategories}
                        renderItem={renderCategoryItem}
                        keyExtractor={(item) => item.id}
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoriesContainer}
                        contentContainerStyle={{ paddingRight: 20 }}
                    />

                    {/* Products */}
                    {isSwitchingCat ? (
                        <View style={{ height: 230, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                            <ActivityIndicator size="small" color={COLORS.primaryGreen} />
                        </View>
                    ) : (
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
                        />
                    )}
                </>
            )}

            {/* Footer */}
            <TouchableOpacity style={styles.exploreButton} onPress={onPressExplore}>
                <ThemeText style={styles.exploreText}>Explore More</ThemeText>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#003F66" />
            </TouchableOpacity>
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
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 16,
        marginVertical: 10,
        // Box Shadow: 0px 1px 9.3px 0px #0000001A
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, // 1A is approx 10%
        shadowRadius: 9.3,
        elevation: 2, // Android approximation
        width: '100%',
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
    },
    productCard: {
        width: 140, // Fixed width for horizontal items
        // marginRight: 12, // Moved to wrapper view in renderItem
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
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
        shadowColor: "#253EA7",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.48,
        shadowRadius: 2,
        elevation: 2,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 6,
        height: 28,
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: '#FEDB51',
        shadowColor: "#253EA7",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.48,
        shadowRadius: 2,
        elevation: 2,
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
    exploreButton: {
        backgroundColor: '#E5E7EB', // Light grey bg
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    exploreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#003F66', // Dark blue
    },
});

export default React.memo(VendorShowcaseWidget);
