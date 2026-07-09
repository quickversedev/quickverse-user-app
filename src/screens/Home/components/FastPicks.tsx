import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { FastPick } from '../../../types/fastPick';
import { getCleanImageUri } from '../../../utils/imageUtils';
import { ThemeText } from '../../../components/common/theme/ThemeText';
import { useAuth } from '../../../contexts/login/AuthProvider';
import useCartStore from '../../../store/cart/cartStore';
import useFastPicks from '../../../hooks/useFastPicks';
import MaterialIcons from '@react-native-vector-icons/material-icons';

const COLUMNS = 4;
const COLLAPSED_ROWS = 2;
const HORIZONTAL_PADDING = 16;
const GAP = 10;
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

const SkeletonTile = () => {
  const pulseAnim = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.pickItem}>
      <Animated.View style={[styles.skeletonImage, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.skeletonText, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.skeletonPrice, { opacity: pulseAnim }]} />
    </View>
  );
};

const PickItem = React.memo(
  ({
    pick,
    quantity,
    onAdd,
    onIncrement,
    onDecrement,
  }: {
    pick: FastPick;
    quantity: number;
    onAdd: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
  }) => {
    const { theme } = useTheme();
    const imageUri = getCleanImageUri(pick.imageUrl);

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
          {pick.name}
        </ThemeText>
        <ThemeText style={styles.productPrice}>
          {'₹'}
          {pick.sellingPrice || pick.mrp}
        </ThemeText>
        {quantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAdd}
            activeOpacity={0.7}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <MaterialIcons name="add" size={16} color="#D97706" />
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityRow}>
            <TouchableOpacity
              onPress={onDecrement}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <MaterialIcons name="remove" size={14} color="#D97706" />
            </TouchableOpacity>
            <ThemeText style={styles.quantityText}>{quantity}</ThemeText>
            <TouchableOpacity
              onPress={onIncrement}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <MaterialIcons name="add" size={14} color="#D97706" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
);

PickItem.displayName = 'PickItem';

const FastPicks = () => {
  const { theme } = useTheme();
  const { authData } = useAuth();
  const { fastPicks, loading } = useFastPicks();
  const carts = useCartStore(s => s.carts);
  const addToCart = useCartStore(s => s.addToCart);
  const increment = useCartStore(s => s.increment);
  const decrement = useCartStore(s => s.decrement);
  const [expanded, setExpanded] = useState(false);

  const visiblePicks = useMemo(() => {
    if (expanded) return fastPicks;
    return fastPicks.slice(0, COLUMNS * COLLAPSED_ROWS);
  }, [fastPicks, expanded]);

  const hasMore = fastPicks.length > COLUMNS * COLLAPSED_ROWS;

  const getQuantity = useCallback(
    (pick: FastPick) => {
      const cartId = `vendor_${pick.shopId}`;
      return carts[cartId]?.products[pick.sku]?.quantity || 0;
    },
    [carts]
  );

  const handleAdd = useCallback(
    (pick: FastPick) => {
      const cartId = `vendor_${pick.shopId}`;
      addToCart(
        cartId,
        {
          sku: pick.sku,
          shopId: pick.shopId,
          name: pick.name,
          price: pick.sellingPrice || pick.mrp,
          mrp: pick.mrp,
          image: pick.imageUrl || '',
          veg: true,
        },
        authData?.jwt || '',
        authData?.phone || ''
      );
    },
    [addToCart, authData]
  );

  const handleIncrement = useCallback(
    (pick: FastPick) => {
      const cartId = `vendor_${pick.shopId}`;
      increment(cartId, pick.sku, authData?.jwt || '', authData?.phone || '');
    },
    [increment, authData]
  );

  const handleDecrement = useCallback(
    (pick: FastPick) => {
      const cartId = `vendor_${pick.shopId}`;
      decrement(cartId, pick.sku, authData?.jwt || '', authData?.phone || '');
    },
    [decrement, authData]
  );

  const handleToggle = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  if (!loading && fastPicks.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemeText style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Fast Picks
        </ThemeText>
        {hasMore && (
          <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
            <ThemeText style={[styles.viewAll, { color: theme.colors.subText }]}>
              {expanded ? 'Show less' : 'View all'}
            </ThemeText>
          </TouchableOpacity>
        )}
      </View>
      {loading && fastPicks.length === 0 ? (
        <View style={styles.grid}>
          {Array.from({ length: COLUMNS * COLLAPSED_ROWS }, (_, i) => (
            <SkeletonTile key={`skeleton-${i}`} />
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {visiblePicks.map(item => (
            <PickItem
              key={`${item.shopId}-${item.sku}`}
              pick={item}
              quantity={getQuantity(item)}
              onAdd={() => handleAdd(item)}
              onIncrement={() => handleIncrement(item)}
              onDecrement={() => handleDecrement(item)}
            />
          ))}
        </View>
      )}
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
    paddingHorizontal: HORIZONTAL_PADDING,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GAP,
  },
  pickItem: {
    alignItems: 'center',
    width: ITEM_WIDTH,
    marginBottom: 4,
  },
  imageContainer: {
    width: ITEM_WIDTH - 8,
    height: ITEM_WIDTH - 8,
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
    width: '100%',
    height: '100%',
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
  addButton: {
    marginTop: 4,
    width: 28,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 2,
    height: 20,
    gap: 2,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    minWidth: 12,
    textAlign: 'center',
  },
  skeletonImage: {
    width: ITEM_WIDTH - 8,
    height: ITEM_WIDTH - 8,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  skeletonText: {
    width: 36,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  skeletonPrice: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginTop: 2,
  },
});

export default React.memo(FastPicks);
