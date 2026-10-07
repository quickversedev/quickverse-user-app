import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FloatingCartsStack from '../../components/common/Cart/FloatingCartsStack';
import { ThemeText } from '../../components/common/theme/ThemeText';
import EssentialsProductCard from '../../components/modules/Essentials/EssentialsProductCard';
import { CATALOGUE_GUTTER } from '../../constants/catalogue';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useEssentialsProductActions } from '../../hooks/useEssentialsProductActions';
import { RootStackParamList } from '../../routes/AppStack';
import catalogGroupsService from '../../services/catalogGroupsService';
import { GroceryGroupProduct } from '../../services/groceryGroupsService';
import { useTheme } from '../../theme/ThemeContext';

type EssentialsSubgroupRouteProp = RouteProp<RootStackParamList, 'EssentialsSubgroup'>;

/**
 * One Daily Essentials subgroup ("Chips & Namkeen"), opened from its tile: the products the
 * kiranas near the delivery address have, cheapest first, going into the one Essentials cart.
 */
const EssentialsSubgroupScreen: React.FC = () => {
  const { getColor } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { subgroupId, title } = useRoute<EssentialsSubgroupRouteProp>().params;
  const { selectedAddress } = useAuth();
  const nearLat = selectedAddress?.coordinates?.latitude;
  const nearLng = selectedAddress?.coordinates?.longitude;
  const { quantityFor, add, increment, decrement } = useEssentialsProductActions();

  const [products, setProducts] = useState<GroceryGroupProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const near =
        Number.isFinite(nearLat) && Number.isFinite(nearLng)
          ? { latitude: nearLat as number, longitude: nearLng as number }
          : undefined;
      const subgroup = await catalogGroupsService.fetchSubgroup(subgroupId, near);
      setProducts(Array.isArray(subgroup?.products) ? subgroup.products : []);
      setError(null);
    } catch (e) {
      console.warn('[EssentialsSubgroup] could not load:', e);
      setError('Could not load these items. Pull down to try again.');
    }
  }, [subgroupId, nearLat, nearLng]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: getColor('background') },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: getColor('border'),
        },
        backButton: { padding: 6 },
        title: {
          flex: 1,
          fontSize: 17,
          lineHeight: 22,
          fontWeight: '800',
          color: getColor('text'),
        },
        list: { paddingHorizontal: CATALOGUE_GUTTER, paddingTop: 14, paddingBottom: 140 },
        emptyList: { flexGrow: 1 },
        row: { justifyContent: 'space-between', marginBottom: 8 },
        count: { fontSize: 12, color: getColor('subText'), marginBottom: 10 },
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
        emptyTitle: {
          marginTop: 12,
          fontSize: 15,
          fontWeight: '700',
          color: getColor('text'),
          textAlign: 'center',
        },
        emptyText: { marginTop: 4, fontSize: 13, color: getColor('subText'), textAlign: 'center' },
      }),
    [getColor]
  );

  const renderEmpty = () => (
    <View style={styles.center}>
      <MaterialCommunityIcons
        name={error ? 'alert-circle-outline' : 'basket-off-outline'}
        size={44}
        color={getColor('subText')}
      />
      <ThemeText style={styles.emptyTitle}>
        {error ? 'Something went wrong' : 'Nothing here right now'}
      </ThemeText>
      <ThemeText style={styles.emptyText}>
        {error || 'The stores near you have none of these in stock. Check back soon.'}
      </ThemeText>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={getColor('text')} />
        </TouchableOpacity>
        <ThemeText style={styles.title} numberOfLines={1}>
          {title}
        </ThemeText>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={getColor('primary')} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => `${item.shopId}-${item.sku}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={products.length ? styles.list : styles.emptyList}
          ListHeaderComponent={
            products.length ? (
              <ThemeText style={styles.count}>
                {products.length} {products.length === 1 ? 'item' : 'items'}
              </ThemeText>
            ) : null
          }
          ListEmptyComponent={renderEmpty}
          renderItem={({ item }) => (
            <EssentialsProductCard
              product={item}
              quantity={quantityFor(item)}
              onAdd={() => add(item)}
              onIncrement={() => increment(item)}
              onDecrement={() => decrement(item)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <FloatingCartsStack />
    </SafeAreaView>
  );
};

export default EssentialsSubgroupScreen;
