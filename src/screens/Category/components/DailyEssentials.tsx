import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import QuantitySelector from '../../../components/modules/Product/QuantitySelector';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../../constants/catalogue';
import { useAuth } from '../../../contexts/login/AuthProvider';
import { GroceryGroupProduct } from '../../../services/groceryGroupsService';
import useCartStore from '../../../store/cart/cartStore';
import useEssentialsCartStore, {
  EssentialsProductMeta,
  EssentialsSetResult,
} from '../../../store/cart/essentialsCartStore';
import useGroceryGroupsStore from '../../../store/grocery/groceryGroupsStore';
import { useTheme } from '../../../theme/ThemeContext';

/**
 * Daily Essentials — curated grocery groups, rendered from QuickVerse's own data.
 *
 * Everything else on this screen is proxied: the collections grid comes from a single
 * hardcoded shop, and grocery product grids are pulled by the device from SmartPOS.
 * These groups come from `qv.product_group`, which is why they can span shops — one
 * group legitimately mixes products from several kiranas, and each card says which.
 *
 * Built on its own card rather than ProductCard. ProductCard's `Product` requires
 * `discount`, `numberOfVariants` and `primarySKU`, none of which this endpoint returns,
 * and below `size="big"` it draws a rating badge with 0. The shape here is the one
 * Product/SuggestedItems settled on for exactly this reason.
 */

const THUMB = 56;
/** ADD and the stepper share this, so a card cannot resize on first add. */
const CONTROL_H = 28;

// Hoisted so the source fallback and defaultSource share one reference.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PLACEHOLDER = require('../../../assets/images/food.png');

/** Mirrors ProductCard's handling, including the leading `@` some catalogue URLs carry. */
const imageSourceFor = (image?: string): ImageSourcePropType => {
  const cleanUrl = typeof image === 'string' ? image.trim().replace(/^@+/, '') : '';
  return cleanUrl.startsWith('http') ? { uri: cleanUrl } : PLACEHOLDER;
};

const showMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Daily Essentials', message);
  }
};

const metaFor = (product: GroceryGroupProduct): EssentialsProductMeta => ({
  sku: product.sku,
  shopId: product.shopId,
  shopName: product.shopName,
  name: product.name,
  price: product.sellingPrice || product.mrp,
  mrp: product.mrp,
  imageUrl: product.imageUrl,
});

const DailyEssentials: React.FC = () => {
  const { getColor, theme } = useTheme();
  const { authData } = useAuth();
  const groups = useGroceryGroupsStore(s => s.groups);
  const loading = useGroceryGroupsStore(s => s.loading);
  const fetchGroups = useGroceryGroupsStore(s => s.fetchGroups);

  const carts = useCartStore(s => s.carts);
  const addToCart = useCartStore(s => s.addToCart);
  const increment = useCartStore(s => s.increment);
  const decrement = useCartStore(s => s.decrement);

  /**
   * Where this section's items go. With the server's Essentials cart on, every product here
   * lands in one QuickVerse cart whatever its kirana, and checks out as one order. With it
   * off — or before the server has said — it falls back to the per-shop SmartBiz carts,
   * which is how this section worked before the Essentials cart existed.
   */
  const essentialsEnabled = useEssentialsCartStore(s => s.enabled === true);
  const essentialsView = useEssentialsCartStore(s => s.view);
  const essentialsPending = useEssentialsCartStore(s => s.pending);
  const fetchEssentialsCart = useEssentialsCartStore(s => s.fetchCart);
  const setEssentialsQuantity = useEssentialsCartStore(s => s.setQuantity);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    fetchEssentialsCart(authData?.jwt, authData?.phone);
  }, [fetchEssentialsCart, authData?.jwt, authData?.phone]);

  /**
   * Legacy path only: the cart is chosen by the *product's* shop, so adding from two shops
   * in one group opens two carts. The Essentials cart replaces this when enabled.
   */
  const cartIdFor = (product: GroceryGroupProduct) => `vendor_${product.shopId}`;

  const quantityFor = useCallback(
    (product: GroceryGroupProduct) => {
      if (essentialsEnabled) {
        if (essentialsPending[product.sku] !== undefined) return essentialsPending[product.sku];
        return essentialsView?.items.find(l => l.sku === product.sku)?.quantity ?? 0;
      }
      return carts[cartIdFor(product)]?.products[product.sku]?.quantity || 0;
    },
    [carts, essentialsEnabled, essentialsPending, essentialsView]
  );

  const setEssentials = useCallback(
    async (product: GroceryGroupProduct, quantity: number) => {
      const result: EssentialsSetResult = await setEssentialsQuantity(
        metaFor(product),
        quantity,
        authData?.jwt,
        authData?.phone
      );
      if (!result.ok && result.message) showMessage(result.message);
    },
    [setEssentialsQuantity, authData]
  );

  const handleAdd = useCallback(
    (product: GroceryGroupProduct) => {
      if (essentialsEnabled) {
        setEssentials(product, quantityFor(product) + 1);
        return;
      }
      addToCart(
        cartIdFor(product),
        {
          sku: product.sku,
          shopId: product.shopId,
          name: product.name,
          price: product.sellingPrice || product.mrp,
          mrp: product.mrp,
          image: product.imageUrl || '',
          // No diet flag on this endpoint. Inert either way: every server sync
          // overwrites it, and the cart row deliberately renders no veg marker from it.
          veg: true,
        },
        authData?.jwt || '',
        authData?.phone || ''
      );
    },
    [addToCart, authData, essentialsEnabled, setEssentials, quantityFor]
  );

  const handleIncrement = useCallback(
    (product: GroceryGroupProduct) => {
      if (essentialsEnabled) {
        setEssentials(product, quantityFor(product) + 1);
        return;
      }
      increment(cartIdFor(product), product.sku, authData?.jwt || '', authData?.phone || '');
    },
    [increment, authData, essentialsEnabled, setEssentials, quantityFor]
  );

  const handleDecrement = useCallback(
    (product: GroceryGroupProduct) => {
      if (essentialsEnabled) {
        setEssentials(product, quantityFor(product) - 1);
        return;
      }
      decrement(cartIdFor(product), product.sku, authData?.jwt || '', authData?.phone || '');
    },
    [decrement, authData, essentialsEnabled, setEssentials, quantityFor]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: { marginHorizontal: CATALOGUE_GUTTER, marginTop: 14 },
        sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
        sectionTitle: {
          fontSize: 14,
          lineHeight: 18,
          fontWeight: '700',
          color: getColor('text'),
        },
        group: { marginBottom: 14 },
        groupHead: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          gap: 8,
        },
        groupName: {
          fontSize: 13,
          lineHeight: 17,
          fontWeight: '700',
          color: getColor('text'),
          flex: 1,
          minWidth: 0,
        },
        countBadge: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 999,
          backgroundColor: getColor('overlay'),
        },
        countText: {
          fontSize: 10,
          lineHeight: 13,
          fontWeight: '700',
          color: getColor('subText'),
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 8,
        },
        card: {
          width: '49%',
          justifyContent: 'space-between',
          backgroundColor: getColor('white'),
          borderRadius: 12,
          padding: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 3,
          elevation: 2,
        },
        cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
        thumbWrap: {
          width: THUMB,
          height: THUMB,
          borderRadius: 8,
          backgroundColor: getColor('overlay'),
          padding: 4,
        },
        // `contain`, not `cover`: at 56px these are packshots, and cropping one to fill
        // the square cuts the product out of its own thumbnail.
        thumb: { width: '100%', height: '100%' },
        cardText: { flex: 1, minWidth: 0 },
        name: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: getColor('text') },
        // A group mixes shops, so the row that says which one is not decoration.
        shopRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
        shopName: { fontSize: 10, lineHeight: 13, color: getColor('subText'), flex: 1 },
        priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 3 },
        price: { fontSize: 15, lineHeight: 18, fontWeight: '800', color: getColor('text') },
        mrp: {
          fontSize: 11,
          lineHeight: 14,
          color: getColor('subText'),
          textDecorationLine: 'line-through',
        },
        addBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          height: CONTROL_H,
          marginTop: 8,
          borderRadius: 8,
          backgroundColor: getColor('overlay'),
        },
        addLabel: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: '800',
          letterSpacing: 0.4,
          color: CATALOGUE_ACCENT,
        },
        soldOutLabel: { color: getColor('placeholder') },
        /** Filled green in the cart, as on the PLP grid, the PDP and the cart itself. */
        stepper: {
          position: 'relative',
          right: 0,
          bottom: 0,
          alignSelf: 'stretch',
          minWidth: 0,
          height: CONTROL_H,
          marginTop: 8,
          borderRadius: 8,
          backgroundColor: CATALOGUE_ACCENT,
          borderColor: CATALOGUE_ACCENT,
          paddingHorizontal: 0,
        },
      }),
    [getColor, theme]
  );

  // Nothing to show and nothing on the way — take up no space at all.
  if (!loading && groups.length === 0) return null;

  const renderProduct = (product: GroceryGroupProduct) => {
    const quantity = quantityFor(product);
    const soldOut = !product.inStock;
    const discounted = product.mrp > product.sellingPrice;

    return (
      <View key={`${product.shopId}-${product.sku}`} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.thumbWrap}>
            <Image
              source={imageSourceFor(product.imageUrl)}
              style={styles.thumb}
              resizeMode="contain"
              defaultSource={PLACEHOLDER}
            />
          </View>
          <View style={styles.cardText}>
            <ThemeText style={styles.name} numberOfLines={2}>
              {product.name}
            </ThemeText>
            {product.shopName ? (
              <View style={styles.shopRow}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={11}
                  color={getColor('subText')}
                />
                <ThemeText style={styles.shopName} numberOfLines={1}>
                  {product.shopName}
                </ThemeText>
              </View>
            ) : null}
            <View style={styles.priceRow}>
              <ThemeText style={styles.price}>₹{product.sellingPrice}</ThemeText>
              {discounted ? <ThemeText style={styles.mrp}>₹{product.mrp}</ThemeText> : null}
            </View>
          </View>
        </View>

        {quantity > 0 && !soldOut ? (
          <QuantitySelector
            quantity={quantity}
            onIncrement={() => handleIncrement(product)}
            onDecrement={() => handleDecrement(product)}
            size="xs"
            containerStyle={styles.stepper}
            tintColor={getColor('white')}
            quantityColor={getColor('white')}
          />
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleAdd(product)}
            disabled={soldOut}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              soldOut
                ? `${product.name} is sold out`
                : `Add ${product.name} from ${product.shopName}`
            }
          >
            {soldOut ? null : (
              <MaterialCommunityIcons name="plus" size={14} color={CATALOGUE_ACCENT} />
            )}
            <ThemeText style={[styles.addLabel, soldOut && styles.soldOutLabel]}>
              {soldOut ? 'SOLD OUT' : 'ADD'}
            </ThemeText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name="basket-outline" size={18} color={getColor('primary')} />
        <ThemeText style={styles.sectionTitle}>Daily Essentials</ThemeText>
      </View>

      {groups.map(group => (
        <View key={group.groupId} style={styles.group}>
          <View style={styles.groupHead}>
            <ThemeText style={styles.groupName} numberOfLines={1}>
              {group.name}
            </ThemeText>
            {group.productCount > 0 ? (
              <View style={styles.countBadge}>
                <ThemeText style={styles.countText}>
                  {group.productCount} {group.productCount === 1 ? 'item' : 'items'}
                </ThemeText>
              </View>
            ) : null}
          </View>
          <View style={styles.grid}>{group.products.map(renderProduct)}</View>
        </View>
      ))}
    </View>
  );
};

export default DailyEssentials;
