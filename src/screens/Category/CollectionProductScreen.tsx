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
import ProductDetailModal from '../../components/modules/Product/ProductDetailModal';
import VariantsModal from '../../components/modules/Product/VariantsModal';
import CategoryTabs, { CategoryItem } from '../../components/vendor/CategoryTabs';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import useCartStore from '../../store/cart/cartStore';
import productsService from '../../services/productsService';
import { useTheme } from '../../theme/ThemeContext';
import { Product } from '../../types/product';
import { Vendor } from '../../types/vendor';
import { getStoreStatus } from '../../utils/storeUtils';
import Feather from 'react-native-vector-icons/Feather';
import { Collection, CollectionCategory } from '../../data/collectionsData';
// We'll reuse components from VendorProduct and common modules
import HorizontalProductCard from '../../components/modules/Product/HorizontalProductCard';

// Category type for local use
type Category = CategoryItem;

interface CollectionProductRouteParams {
    collection: Collection;
    vendor?: Vendor; // Optional, logic might need adjustment if not passed
    // We might just need shopId if vendor object isn't fully available
    shopId?: string;
}
type CollectionProductRouteProp = RouteProp<
    { CollectionProduct: CollectionProductRouteParams },
    'CollectionProduct'
>;

const { width } = Dimensions.get('window');

// Constants
const NUM_COLUMNS = 1;
const CATEGORY_WIDTH = 120;
const SCROLL_DELAY = 100;
const ANIMATION_DURATION = 300;

// Helper: create a row-based list (Same as VendorProduct)
const getRowBasedProductList = (
    categories: Category[],
    products: Product[],
    numColumns: number
) => {
    const rows: Array<
        { type: 'header'; category: Category } | { type: 'products'; products: Product[] }
    > = [];

    const productsByDivision = new Map<string, Product[]>();
    products.forEach(product => {
        const division = product.division;
        if (!productsByDivision.has(division || '')) {
            productsByDivision.set(division || '', []);
        }
        productsByDivision.get(division || '')!.push(product);
    });

    categories.forEach((cat: Category) => {
        // Only add header if we have products for it
        const catProducts = productsByDivision.get(cat.id || '') || [];

        if (catProducts.length > 0) {
            rows.push({ type: 'header', category: cat });

            // Sort
            const sortedCatProducts = catProducts.sort((a, b) => {
                if (a.inStock === b.inStock) return 0;
                return a.inStock ? -1 : 1;
            });

            for (let i = 0; i < sortedCatProducts.length; i += numColumns) {
                rows.push({ type: 'products', products: sortedCatProducts.slice(i, i + numColumns) });
            }
        }
    });
    return rows;
};

const CollectionProductScreen: React.FC = () => {
    const { getColor, getTypography } = useTheme();
    const { authData } = useAuth();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<CollectionProductRouteProp>();
    const { collection, vendor: routeVendor, shopId: routeShopId } = route.params;

    console.log('CollectionProductScreen route.params:', route.params);
    console.log('Collection:', collection);
    console.log('Vendor:', routeVendor);
    console.log('Shop ID:', routeShopId);

    // Derive vendor/shopId
    const shopId = routeShopId || routeVendor?.shopId;
    const vendor = routeVendor; // Can be undefined

    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Search state
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<TextInput>(null);
    const searchBarHeight = useRef(new Animated.Value(0)).current;
    const searchBarOpacity = useRef(new Animated.Value(0)).current;

    // Memoized auth
    const hasAuth = useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);
    // Verify with store util if vendor exists
    const storeStatus = useMemo(() => vendor ? getStoreStatus(vendor) : { isOpen: true }, [vendor]);
    const isStoreActive = useMemo(() => storeStatus.isOpen, [storeStatus.isOpen]);

    // CATEGORIES from Collection
    // Map collection categories to the Category type used for tabs
    const categories: Category[] = useMemo(() => {
        // Use collection.categories directly
        // Map name/id. Icon is placeholder unless we have specific ones.
        return collection.categories.map(c => ({
            id: c.id,
            name: c.name,
            icon: Images.bg1 // Placeholder or from API if we extended CollectionCategory
        }));
    }, [collection]);

    // Fetch Logic
    useEffect(() => {
        const fetchAllData = async () => {
            if (!shopId) return;
            setLoading(true);
            console.log(`[CollectionProduct] Fetching products for collection '${collection.name}' from shop ${shopId}`);

            try {
                // Concurrent fetch for all categories in collection
                const promises = collection.categories.map(cat =>
                    productsService.fetchProductsForCollection({
                        shopId,
                        categoryId: cat.id
                    })
                );

                const results = await Promise.all(promises);
                const allProducts = results.flat();

                console.log(`[CollectionProduct] Fetched total ${allProducts.length} products`);
                // Remove duplicates just in case (by SKU)
                const uniqueProducts = Array.from(new Map(allProducts.map(p => [p.sku, p])).values());
                setProducts(uniqueProducts);

            } catch (err) {
                console.error('[CollectionProduct] Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [shopId, collection]);

    // Filter Logic (Search)
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const lowerQ = searchQuery.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(lowerQ));
    }, [products, searchQuery]);


    // Cart Integration
    const { addToCart, increment, decrement, setActiveCart, carts } = useCartStore();
    const cartId = useMemo(() => shopId ? `vendor_${shopId}` : 'default_cart', [shopId]);

    useEffect(() => {
        setActiveCart(cartId);
    }, [cartId, setActiveCart]);

    const productQuantityMap = useMemo(() => {
        const cart = carts[cartId];
        if (!cart?.products) return new Map<string, number>();
        const map = new Map<string, number>();
        Object.entries(cart.products).forEach(([sku, product]) => {
            map.set(sku, product.quantity);
        });
        return map;
    }, [carts, cartId]);

    // Helper for quantity
    const getProductQuantity = (sku: string) => productQuantityMap.get(sku) || 0;

    // Cart Item Count
    const cartItemCount = Object.values(carts[cartId]?.products || {}).reduce((sum, p) => sum + p.quantity, 0);

    // Modal State
    const [variantsModalVisible, setVariantsModalVisible] = useState(false);
    const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
    const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
    const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

    // Filter valid categories (only those with products)
    const filteredCategories = useMemo(() => {
        const validIds = new Set(filteredProducts.map(p => p.division));
        return categories.filter(c => validIds.has(c.id));
    }, [categories, filteredProducts]);

    // State for selected category (tabs)
    const [selectedCategory, setSelectedCategory] = useState('');
    useEffect(() => {
        if (filteredCategories.length > 0 && !filteredCategories.some(c => c.id === selectedCategory)) {
            setSelectedCategory(filteredCategories[0].id);
        }
    }, [filteredCategories, selectedCategory]);

    // Row List
    const rowProductList = useMemo(
        () => getRowBasedProductList(filteredCategories, filteredProducts, NUM_COLUMNS),
        [filteredCategories, filteredProducts]
    );

    // Scrolling logic (Same as VendorProduct)
    const flatListRef = useRef<FlatList<any> | null>(null);
    const categoryScrollRef = useRef<ScrollView>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    // Handlers
    const handleCategorySelect = useCallback((catId: string) => {
        setSelectedCategory(catId);
        // Logic to scroll FlatList to that header...
        // Requires mapping category ID to index
        const index = rowProductList.findIndex(item => item.type === 'header' && item.category.id === catId);
        if (index !== -1 && flatListRef.current) {
            flatListRef.current.scrollToIndex({ index, animated: true });
        }
    }, [rowProductList]);

    // Viewability for tracking scroll
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        const firstHeader = viewableItems.find((item: any) => item.item.type === 'header');
        if (firstHeader && selectedCategory !== firstHeader.item.category.id) {
            setSelectedCategory(firstHeader.item.category.id);
            // Also sync top tabs scroll if needed
        }
    }).current;

    // Cart Handlers
    const handleAddToCart = useCallback((product: Product) => {
        if (!shopId) return;
        // ... Same logic as VendorProduct but simplified checks
        addToCart(cartId, {
            sku: product.sku,
            shopId: shopId,
            name: product.name,
            price: product.sellingPrice,
            mrp: product.mrp,
            image: typeof product.imageUrl === 'string' ? product.imageUrl : '',
            veg: product.veg ?? true,
        }, authData?.jwt || '', authData?.phone || '');
    }, [shopId, cartId, authData, addToCart]);

    const handleIncrement = useCallback((sku: string) => {
        if (!shopId) return;
        increment(cartId, sku, authData?.jwt || '', authData?.phone || '');
    }, [shopId, cartId, authData, increment]);

    const handleDecrement = useCallback((sku: string) => {
        if (!shopId) return;
        decrement(cartId, sku, authData?.jwt || '', authData?.phone || '');
    }, [shopId, cartId, authData, decrement]);


    // Styles
    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: getColor('background') },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 50,
            backgroundColor: '#fff',
            elevation: 2,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginLeft: 16,
            color: '#000',
            flex: 1,
        },
        searchContainer: {
            padding: 10,
            backgroundColor: '#fff',
        },
        footerSpacer: { height: 100 },
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {collection.name}
                </Text>
                {/* Could add Search Icon here */}
            </View>

            {/* Category Tabs */}
            {filteredCategories.length > 0 && (
                <View style={{ height: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
                    <CategoryTabs
                        categories={filteredCategories}
                        selectedCategoryId={selectedCategory}
                        onSelect={handleCategorySelect}
                    />
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={rowProductList}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 10 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => {
                    if (item.type === 'header') {
                        // return <Text style={{padding: 15, fontSize: 18, fontWeight: 'bold'}}>{item.category.name}</Text>;
                        // Use a nice header component if available, or simple text
                        return (
                            <View style={{ padding: 16, backgroundColor: '#f9f9f9' }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#333' }}>{item.category.name}</Text>
                            </View>
                        );
                    } else {
                        return (
                            <View style={{ paddingHorizontal: 16 }}>
                                {item.products.map(product => (
                                    <HorizontalProductCard
                                        key={product.sku}
                                        product={product}
                                        quantity={getProductQuantity(product.sku)}
                                        onIncrement={() => handleIncrement(product.sku)}
                                        onDecrement={() => handleDecrement(product.sku)}
                                        onAdd={() => handleAddToCart(product)}
                                        onPress={() => {
                                            setSelectedProductForDetail(product);
                                            setProductDetailModalVisible(true);
                                        }}
                                    />
                                ))}
                            </View>
                        );
                    }
                }}
            />

            {shopId && (
                <CartBar
                    itemCount={cartItemCount}
                    shopId={shopId}
                    cartId={cartId}
                />
            )}

            {/* Product Detail Modal */}
            {selectedProductForDetail && vendor && (
                <ProductDetailModal
                    visible={productDetailModalVisible}
                    onClose={() => setProductDetailModalVisible(false)}
                    product={selectedProductForDetail}
                    vendor={vendor}
                />
            )}

            {/* Variants Modal placeholder if needed */}
        </View>
    );
};

export default CollectionProductScreen;
