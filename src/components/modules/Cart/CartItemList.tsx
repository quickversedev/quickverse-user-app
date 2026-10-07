import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../../constants/catalogue';
import { RootStackParamList } from '../../../routes/AppStack';
import { CartProduct } from '../../../store/cart/cartStore';
import useVendorStore from '../../../store/vendorStore';
import { useTheme } from '../../../theme/ThemeContext';
import { Vendor } from '../../../types/vendor';
import { ThemeText } from '../../common/theme/ThemeText';
import CartItem from './CartItem';

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

interface CartItemListProps {
  /** `tag` is shown under a line's stepper, e.g. to mark it unavailable. */
  items: Array<CartProduct & { tag?: string; tagTone?: 'accent' | 'error' }>;
  onInc: (sku: string) => void;
  onDec: (sku: string) => void;
  vendor?: Vendor;
  /** "1.2 km away", computed by the screen from vendor and customer coordinates. */
  distanceText?: string | null;
  navigation: CartScreenNavigationProp;
  /**
   * One list with no store headers, whatever shops the lines come from. The Daily Essentials
   * cart is one order to the customer — which kiranas supply it is ours to know, not theirs.
   */
  storeless?: boolean;
  /** With `storeless`, where "Add more items" goes; there is no one store to send them to. */
  onAddMore?: () => void;
}

/**
 * The cart's items, in the QV Cart design: a section heading, a store header, then one
 * raised card per line.
 *
 * The single bordered panel that used to wrap all of this is gone — in the design each
 * row is its own surface sitting on the page, so the outer box was a box around boxes.
 *
 * One store header per store. A QuickVerse cart is keyed `vendor_<shopId>` and holds
 * exactly one vendor, so for a normal basket this is a single header and the output is
 * unchanged. A Daily Essentials basket checks out several kiranas together under one
 * payment, and the screen passes every one of their carts here — hence the grouping,
 * which is the design's multi-store sourcing case finally applying to something real.
 */
const CartItemList: React.FC<CartItemListProps> = ({
  items,
  onInc,
  onDec,
  vendor,
  distanceText,
  navigation,
  storeless = false,
  onAddMore,
}) => {
  const { getColor, theme } = useTheme();
  const getVendorById = useVendorStore(state => state.getVendorById);

  /**
   * Items grouped by the shop that sells them, in the order they first appear so the
   * list does not reshuffle as quantities change.
   */
  const sections = useMemo(() => {
    if (storeless) return [{ shopId: '', items }];
    const order: string[] = [];
    const byShop = new Map<string, CartProduct[]>();
    for (const item of items) {
      const shopId = item.shopId || vendor?.shopId || '';
      if (!byShop.has(shopId)) {
        byShop.set(shopId, []);
        order.push(shopId);
      }
      byShop.get(shopId)!.push(item);
    }
    return order.map(shopId => ({ shopId, items: byShop.get(shopId)! }));
  }, [items, vendor?.shopId, storeless]);

  const isMultiStore = sections.length > 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginHorizontal: CATALOGUE_GUTTER,
          marginTop: 14,
        },
        sectionHeading: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: getColor('subText'),
          marginBottom: 8,
        },
        storeCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: getColor('white'),
          borderRadius: 16,
          padding: 12,
          marginBottom: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 3,
          elevation: 2,
        },
        storeIcon: {
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${getColor('primary')}1F`,
        },
        storeText: { flex: 1, minWidth: 0 },
        storeName: {
          fontSize: 13,
          lineHeight: 17,
          fontWeight: '700',
          color: getColor('text'),
        },
        storeMeta: {
          fontSize: 11,
          lineHeight: 14,
          color: getColor('subText'),
        },
        // The design's filled-green time pill, bolt and all.
        etaPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 3,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: CATALOGUE_ACCENT,
        },
        etaLabel: {
          fontSize: 10,
          lineHeight: 12,
          fontWeight: '800',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: getColor('white'),
        },
        items: { gap: 10 },
        /** Breathing room between stores, so each reads as its own block. */
        storeSections: { gap: 18 },
        /**
         * A muted surface rather than the dashed amber outline it replaced. Nothing
         * else in the QV design is dashed, and a 1.5px amber rule spanning the full
         * width pulled more attention than "add more" deserves sitting under the
         * items — it read louder than the products themselves.
         */
        addMoreButton: {
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 12,
          paddingVertical: 11,
          backgroundColor: getColor('overlay'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
        },
        // Small tinted disc, echoing the store and tip cards' leading icons.
        addMoreIcon: {
          width: 22,
          height: 22,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${getColor('primary')}1F`,
        },
        addMoreText: {
          fontSize: 13,
          lineHeight: 17,
          fontWeight: '700',
          color: getColor('primary'),
        },
      }),
    [getColor, theme]
  );

  const renderCartItem = useCallback(
    (item: CartProduct & { tag?: string; tagTone?: 'accent' | 'error' }) => (
      <CartItem
        key={item.sku}
        {...item}
        onInc={() => onInc(item.sku)}
        onDec={() => onDec(item.sku)}
      />
    ),
    [onInc, onDec]
  );

  const renderStoreless = () => (
    <View>
      <View style={styles.items}>{items.map(renderCartItem)}</View>
      {onAddMore ? (
        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={onAddMore}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add more items"
        >
          <View style={styles.addMoreIcon}>
            <MaterialCommunityIcons name="plus" size={14} color={getColor('primary')} />
          </View>
          <ThemeText style={styles.addMoreText}>Add more items</ThemeText>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderSection = (section: {
    shopId: string;
    items: Array<CartProduct & { tag?: string; tagTone?: 'accent' | 'error' }>;
  }) => {
    // With one store the vendor is already resolved by the screen, along with the
    // distance it measured from the customer. Across stores only the shop id is known
    // per row, so the rest is looked up here.
    const sectionVendor = isMultiStore ? getVendorById(section.shopId) : vendor;
    // Distance is measured against a single vendor by the screen, so it would be wrong
    // on every other store's header. No distance beats the wrong distance.
    const sectionDistance = isMultiStore ? null : distanceText;
    // The API sends this as free text, not minutes, so it is rendered as given.
    const preparationTime = sectionVendor?.preparationTime || '30 mins';

    return (
      <View key={section.shopId || 'unknown'}>
        {sectionVendor ? (
          <View style={styles.storeCard}>
            <View style={styles.storeIcon}>
              <MaterialCommunityIcons name="storefront" size={18} color={getColor('primary')} />
            </View>
            <View style={styles.storeText}>
              <ThemeText style={styles.storeName} numberOfLines={1}>
                {sectionVendor.name}
              </ThemeText>
              {sectionDistance ? (
                <ThemeText style={styles.storeMeta} numberOfLines={1}>
                  {sectionDistance}
                </ThemeText>
              ) : null}
            </View>
            <View style={styles.etaPill}>
              <MaterialCommunityIcons name="flash" size={12} color={getColor('white')} />
              <ThemeText style={styles.etaLabel}>{preparationTime}</ThemeText>
            </View>
          </View>
        ) : null}

        <View style={styles.items}>{section.items.map(renderCartItem)}</View>

        {sectionVendor ? (
          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={() => navigation.navigate('VendorProduct', { vendor: sectionVendor })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Add more items from ${sectionVendor.name}`}
          >
            <View style={styles.addMoreIcon}>
              <MaterialCommunityIcons name="plus" size={14} color={getColor('primary')} />
            </View>
            <ThemeText style={styles.addMoreText}>
              {isMultiStore ? `Add more from ${sectionVendor.name}` : 'Add more items'}
            </ThemeText>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <ThemeText style={styles.sectionHeading}>
        {isMultiStore ? `Cart Items · ${sections.length} stores` : 'Cart Items'}
      </ThemeText>

      {storeless ? (
        renderStoreless()
      ) : (
        <View style={isMultiStore ? styles.storeSections : undefined}>
          {sections.map(renderSection)}
        </View>
      )}
    </View>
  );
};

export default CartItemList;
