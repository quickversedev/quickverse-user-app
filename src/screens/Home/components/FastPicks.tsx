import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Product } from '../../../types/product';
import { AppNavigationProp } from '../../../types/navigation';
import { getCleanImageUri } from '../../../utils/imageUtils';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import useVendorStore from '../../../store/vendorStore';
import axiosInstance from '../../../config/api/axios.config';
import { getAuthHeader } from '../../../config/api/axios.config';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const ITEM_WIDTH = 52;

interface FastPickItem extends Product {
  vendorName?: string;
}

const STATIC_PICKS: FastPickItem[] = [
  {
    sku: 'sp_milk',
    shopId: '',
    name: 'Milk',
    mrp: 25,
    sellingPrice: 25,
    rating: 4.5,
    discount: 0,
    veg: true,
    numberOfVariants: 0,
    primarySKU: 'sp_milk',
  },
  {
    sku: 'sp_bread',
    shopId: '',
    name: 'Bread',
    mrp: 50,
    sellingPrice: 50,
    rating: 4.3,
    discount: 0,
    veg: true,
    numberOfVariants: 0,
    primarySKU: 'sp_bread',
  },
  {
    sku: 'sp_banana',
    shopId: '',
    name: 'Banana',
    mrp: 60,
    sellingPrice: 60,
    rating: 4.4,
    discount: 0,
    veg: true,
    numberOfVariants: 0,
    primarySKU: 'sp_banana',
  },
  {
    sku: 'sp_egg',
    shopId: '',
    name: 'Egg',
    mrp: 150,
    sellingPrice: 150,
    rating: 4.6,
    discount: 0,
    veg: false,
    numberOfVariants: 0,
    primarySKU: 'sp_egg',
  },
  {
    sku: 'sp_maggi',
    shopId: '',
    name: 'Maggi',
    mrp: 15,
    sellingPrice: 15,
    rating: 4.7,
    discount: 0,
    veg: true,
    numberOfVariants: 0,
    primarySKU: 'sp_maggi',
  },
  {
    sku: 'sp_coke',
    shopId: '',
    name: 'Coke',
    mrp: 40,
    sellingPrice: 40,
    rating: 4.2,
    discount: 0,
    veg: true,
    numberOfVariants: 0,
    primarySKU: 'sp_coke',
  },
];

const PickItem = React.memo(({ product }: { product: FastPickItem }) => {
  const { theme } = useTheme();
  const imageUri = getCleanImageUri(product.imageUrl);

  return (
    <View style={styles.pickItem}>
      <View style={[styles.imageContainer, { backgroundColor: theme.colors.card }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="shopping-bag" size={24} color="#D1D5DB" />
          </View>
        )}
      </View>
      <ThemeText style={styles.productName} numberOfLines={1}>
        {product.name}
      </ThemeText>
      <ThemeText style={styles.productPrice}>
        {'₹'}
        {product.sellingPrice || product.mrp}
      </ThemeText>
    </View>
  );
});

PickItem.displayName = 'PickItem';

const FastPicks = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { theme } = useTheme();
  const vendors = useVendorStore(s => s.vendors);
  const [products, setProducts] = useState<FastPickItem[]>(STATIC_PICKS);
  const [fetchedShopId, setFetchedShopId] = useState<string | null>(null);

  const lastGroceryVendor = useMemo(() => {
    const groceryVendors = vendors.filter(
      v => v.category === 'Grocery' && v.storeEnabled !== false && v.storeActive !== false
    );
    return groceryVendors.length > 0 ? groceryVendors[groceryVendors.length - 1] : null;
  }, [vendors]);

  const targetShopId = lastGroceryVendor?.shopId ?? null;

  useEffect(() => {
    if (!targetShopId || fetchedShopId === targetShopId) return;

    let cancelled = false;

    const fetchPicks = async () => {
      try {
        const authHeader = getAuthHeader();
        const res = await axiosInstance.post(
          `/v3/products?shopId=${targetShopId}`,
          { filters: {}, offset: '0', limit: '12' },
          { headers: { Authorization: authHeader } }
        );
        const data = res.data;
        const raw: Product[] = Array.isArray(data) ? data : (data?.products ?? []);
        const mapped: FastPickItem[] = raw.slice(0, 12).map(p => ({
          sku: p.sku,
          shopId: p.shopId,
          name: p.name,
          mrp: p.mrp,
          sellingPrice: p.sellingPrice,
          rating: p.rating ?? 0,
          discount: p.discount ?? 0,
          veg: p.veg ?? true,
          numberOfVariants: p.numberOfVariants ?? 0,
          primarySKU: p.primarySKU ?? p.sku,
          imageUrl: p.imageUrl,
          vendorName: lastGroceryVendor?.name,
        }));
        if (!cancelled) {
          if (mapped.length > 0) setProducts(mapped);
          setFetchedShopId(targetShopId);
        }
      } catch {
        if (!cancelled) {
          setFetchedShopId(targetShopId);
        }
      }
    };

    fetchPicks();
    return () => {
      cancelled = true;
    };
  }, [targetShopId, fetchedShopId, lastGroceryVendor?.name]);

  const handleViewAll = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemeText style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Fast Picks
        </ThemeText>
        <TouchableOpacity onPress={handleViewAll} activeOpacity={0.7}>
          <ThemeText style={[styles.viewAll, { color: theme.colors.subText }]}>View all</ThemeText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.sku}-${index}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <PickItem product={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pickItem: {
    alignItems: 'center',
    width: ITEM_WIDTH,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  productImage: {
    width: '75%',
    height: '75%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1,
  },
});

export default React.memo(FastPicks);
