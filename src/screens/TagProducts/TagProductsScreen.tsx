import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import HorizontalProductCard from '../../components/modules/Product/HorizontalProductCard';
import ProductDetailModal from '../../components/modules/Product/ProductDetailModal';
import VariantsModal from '../../components/modules/Product/VariantsModal';
import VendorProductSkeleton from '../../components/modules/Vendor/VendorProductSkeleton';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import productsService from '../../services/productsService';
import useCartStore from '../../store/cart/cartStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Product } from '../../types/product';

const PAGE_SIZE = 20;

type TagProductsRouteProp = RouteProp<RootStackParamList, 'TagProducts'>;

type RowItem =
  | { type: 'vendor-header'; shopId: string; vendorName: string }
  | { type: 'product'; product: Product };

const TagProductsScreen: React.FC = () => {
  const { getColor, getTypography } = useTheme();
  const { authData } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<TagProductsRouteProp>();
  const { tagCode, tagLabel } = route.params;

  const { vendors } = useVendorStore();
  const { addToCart, increment, decrement, carts } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const [variantsModalVisible, setVariantsModalVisible] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(
    null
  );
  const [productDetailModalVisible, setProductDetailModalVisible] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  const hasAuth = useMemo(() => Boolean(authData?.jwt), [authData?.jwt]);

  const fetchProducts = useCallback(
    async (offset: number) => {
      try {
        const batch = await productsService.fetchProductsByTag({
          tagCode,
          limit: PAGE_SIZE,
          offset,
        });
        return batch;
      } catch (err) {
        console.error('[TagProducts] Fetch error:', err);
        throw err;
      }
    },
    [tagCode]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      offsetRef.current = 0;
      try {
        const batch = await fetchProducts(0);
        if (!cancelled) {
          setProducts(batch);
          setHasMore(batch.length >= PAGE_SIZE);
          offsetRef.current = batch.length;
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load products');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchProducts]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const batch = await fetchProducts(offsetRef.current);
      setProducts(prev => {
        const seen = new Set(prev.map(p => `${p.shopId}:${p.sku}`));
        const fresh = batch.filter((p: Product) => !seen.has(`${p.shopId}:${p.sku}`));
        return [...prev, ...fresh];
      });
      setHasMore(batch.length >= PAGE_SIZE);
      offsetRef.current += batch.length;
    } catch {
      // Silently fail on pagination — user can scroll again
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchProducts]);

  const vendorNameMap = useMemo(() => {
    const map = new Map<string, string>();
    vendors.forEach(v => map.set(v.shopId, v.name));
    products.forEach(p => {
      if (p.shopName && !map.has(p.shopId)) map.set(p.shopId, p.shopName);
    });
    return map;
  }, [vendors, products]);

  const rowData: RowItem[] = useMemo(() => {
    const grouped = new Map<string, Product[]>();
    products.forEach(p => {
      const sid = p.shopId || 'unknown';
      if (!grouped.has(sid)) grouped.set(sid, []);
      grouped.get(sid)!.push(p);
    });

    const rows: RowItem[] = [];
    grouped.forEach((prods, shopId) => {
      rows.push({
        type: 'vendor-header',
        shopId,
        vendorName: vendorNameMap.get(shopId) || `Shop ${shopId}`,
      });
      prods.forEach(product => {
        rows.push({ type: 'product', product });
      });
    });
    return rows;
  }, [products, vendorNameMap]);

  const getProductQuantity = useCallback(
    (product: Product) => {
      const cartId = `vendor_${product.shopId}`;
      return carts[cartId]?.products?.[product.sku]?.quantity || 0;
    },
    [carts]
  );

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!hasAuth || !product.inStock) return;
      if (product.numberOfVariants && product.numberOfVariants > 1) {
        setSelectedProductForVariants(product);
        setVariantsModalVisible(true);
        return;
      }
      const cartId = `vendor_${product.shopId}`;
      addToCart(
        cartId,
        {
          sku: product.sku,
          shopId: product.shopId,
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
    [hasAuth, addToCart, authData]
  );

  const handleVariantSelect = useCallback(
    (variant: Product) => {
      if (!selectedProductForVariants || !hasAuth) return;
      const cartId = `vendor_${selectedProductForVariants.shopId || variant.shopId}`;
      addToCart(
        cartId,
        {
          sku: variant.sku,
          shopId: selectedProductForVariants.shopId || variant.shopId,
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
    [selectedProductForVariants, hasAuth, addToCart, authData]
  );

  const handleIncrement = useCallback(
    (product: Product) => {
      if (!hasAuth || !product.inStock) return;
      const cartId = `vendor_${product.shopId}`;
      increment(cartId, product.sku, authData!.jwt, authData!.phone);
    },
    [hasAuth, increment, authData]
  );

  const handleDecrement = useCallback(
    (product: Product) => {
      if (!hasAuth) return;
      const cartId = `vendor_${product.shopId}`;
      decrement(cartId, product.sku, authData!.jwt, authData!.phone);
    },
    [hasAuth, decrement, authData]
  );

  const handleProductPress = useCallback((product: Product) => {
    setSelectedProductForDetail(product);
    setProductDetailModalVisible(true);
  }, []);

  const handleVendorPress = useCallback(
    (shopId: string) => {
      const vendor = vendors.find(v => v.shopId === shopId);
      if (vendor) {
        navigation.navigate('VendorProduct', { vendor });
      }
    },
    [vendors, navigation]
  );

  const mockVendorForModal = useMemo(() => {
    const product = selectedProductForVariants || selectedProductForDetail;
    if (!product) return null;
    const vendor = vendors.find(v => v.shopId === product.shopId);
    if (vendor) return { ...vendor, storeActive: true };
    return {
      shopId: product.shopId,
      name: vendorNameMap.get(product.shopId) || 'Shop',
      logo: '',
      banner: '',
      owner: '',
      phone: '',
      openingTime: '00:00',
      closingTime: '23:59',
      preparationTime: '30',
      description: '',
      category: 'Food',
      storeEnabled: true,
      storeActive: true,
    };
  }, [selectedProductForVariants, selectedProductForDetail, vendors, vendorNameMap]);

  const keyExtractor = useCallback((item: RowItem, idx: number) => {
    if (item.type === 'vendor-header') return `vh-${item.shopId}`;
    return `p-${item.product.shopId}-${item.product.sku}-${idx}`;
  }, []);

  const MemoizedCard = useMemo(() => React.memo(HorizontalProductCard), []);

  const renderItem = useCallback(
    ({ item }: { item: RowItem }) => {
      if (item.type === 'vendor-header') {
        return (
          <TouchableOpacity
            style={[styles.vendorHeader, { borderBottomColor: getColor('border') }]}
            onPress={() => handleVendorPress(item.shopId)}
            activeOpacity={0.7}
          >
            <Text style={[styles.vendorName, { color: getColor('text') }]}>{item.vendorName}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={getColor('subText')} />
          </TouchableOpacity>
        );
      }
      const { product } = item;
      return (
        <MemoizedCard
          product={product}
          quantity={getProductQuantity(product)}
          onAdd={() => handleAddToCart(product)}
          onIncrement={() => handleIncrement(product)}
          onDecrement={() => handleDecrement(product)}
          disabled={false}
          showVariantsCount={true}
          onPress={() => handleProductPress(product)}
        />
      );
    },
    [
      getColor,
      handleVendorPress,
      getProductQuantity,
      handleAddToCart,
      handleIncrement,
      handleDecrement,
      handleProductPress,
      MemoizedCard,
    ]
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={getColor('primary')} />
      </View>
    );
  }, [loadingMore, getColor]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background') }}>
        <VendorProductSkeleton showVendorCard={false} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background') }}>
        <View style={[styles.container, { backgroundColor: getColor('background') }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
            </TouchableOpacity>
            <Text
              style={[
                styles.headerTitle,
                { color: getColor('text'), fontSize: getTypography('h2') },
              ]}
              numberOfLines={1}
            >
              {tagLabel}
            </Text>
          </View>

          {error && products.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={48}
                color={getColor('subText')}
              />
              <Text style={[styles.emptyTitle, { color: getColor('text') }]}>
                Something went wrong
              </Text>
              <Text style={[styles.emptyMessage, { color: getColor('subText') }]}>{error}</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="food-off-outline"
                size={48}
                color={getColor('subText')}
              />
              <Text style={[styles.emptyTitle, { color: getColor('text') }]}>
                No {tagLabel} items yet
              </Text>
              <Text style={[styles.emptyMessage, { color: getColor('subText') }]}>
                {`Products tagged as "${tagLabel}" will appear here.`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={rowData}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={renderFooter}
              removeClippedSubviews={true}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={7}
            />
          )}

          {selectedProductForVariants && mockVendorForModal && (
            <VariantsModal
              visible={variantsModalVisible}
              onClose={() => {
                setVariantsModalVisible(false);
                setSelectedProductForVariants(null);
              }}
              product={selectedProductForVariants}
              vendor={mockVendorForModal}
              onVariantSelect={handleVariantSelect}
            />
          )}
        </View>
        <FloatingCartsStack />
      </SafeAreaView>

      {selectedProductForDetail && mockVendorForModal && (
        <ProductDetailModal
          visible={productDetailModalVisible}
          onClose={() => {
            setProductDetailModalVisible(false);
            setSelectedProductForDetail(null);
          }}
          product={selectedProductForDetail}
          vendor={mockVendorForModal}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default React.memo(TagProductsScreen);
