import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATALOGUE_GUTTER } from '../../../constants/catalogue';
import { EssentialsIssue } from '../../../services/essentialsCartService';
import { useTheme } from '../../../theme/ThemeContext';
import { ThemeText } from '../../common/theme/ThemeText';

interface EssentialsIssuesSheetProps {
  visible: boolean;
  issues: EssentialsIssue[];
  /** True while the cart is being updated. */
  resolving: boolean;
  /** Remove what cannot be ordered, accept new prices, and carry on. */
  onResolve: () => void;
  /** Leave the order as it is and go back to the cart. */
  onBack: () => void;
  /**
   * Choose another delivery address. Offered when items cannot be delivered to the chosen one —
   * the fix there is usually the address, not removing the items.
   */
  onChangeAddress?: () => void;
  /** Removing what is flagged would leave nothing to order: "Update cart" is then not offered. */
  wouldEmptyCart?: boolean;
}

const ICON: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  PRICE_CHANGED: 'tag-arrow-up-outline',
  OUT_OF_RADIUS: 'map-marker-distance',
  SHOP_CLOSED: 'clock-outline',
  QUANTITY_LIMIT: 'numeric-9-plus-box-outline',
  STORE_LIMIT: 'cart-remove',
};

/** What "update cart & continue" will do, so the customer knows before they tap. */
const consequence = (issues: EssentialsIssue[]): string => {
  const removes = issues.some(
    i => i.type !== 'PRICE_CHANGED' && i.type !== 'QUANTITY_LIMIT' && i.type !== 'STORE_LIMIT'
  );
  const reprices = issues.some(i => i.type === 'PRICE_CHANGED');
  if (removes && reprices) return 'Unavailable items will be removed and new prices applied.';
  if (removes) return 'Unavailable items will be removed from your order.';
  if (reprices) return 'Your order will use the new prices.';
  return 'Your cart will be updated so the order can go through.';
};

/**
 * Shown when the Essentials bill finds something that stops the order: an item out of stock, an
 * item that cannot be delivered to the chosen address, a price that has moved. The messages come
 * from the server and speak of items, never of the stores behind them.
 *
 * The customer decides — nothing is dropped or re-priced behind their back. "Update cart" asks
 * the server to remove what cannot be ordered and accept current prices, then the bill is
 * recomputed for the customer to see before placing; "Back to cart" leaves everything as it is.
 */
const EssentialsIssuesSheet: React.FC<EssentialsIssuesSheetProps> = ({
  visible,
  issues,
  resolving,
  onResolve,
  onBack,
  onChangeAddress,
  wouldEmptyCart = false,
}) => {
  const { getColor } = useTheme();
  const insets = useSafeAreaInsets();
  const onlyStoreLimit = issues.length > 0 && issues.every(i => i.type === 'STORE_LIMIT');
  const emptyCart = issues.some(i => i.type === 'EMPTY_CART');
  const outOfRadius = issues.some(i => i.type === 'OUT_OF_RADIUS');
  const canUpdate = !emptyCart && !onlyStoreLimit && !wouldEmptyCart;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
        sheet: {
          backgroundColor: getColor('background'),
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: Math.max(insets.bottom, 12) + 8,
          maxHeight: '75%',
        },
        grabber: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 999,
          backgroundColor: getColor('border'),
          marginTop: 10,
          marginBottom: 6,
        },
        head: { paddingHorizontal: CATALOGUE_GUTTER, paddingVertical: 10 },
        title: { fontSize: 16, lineHeight: 20, fontWeight: '800', color: getColor('text') },
        subtitle: { fontSize: 12, lineHeight: 17, marginTop: 4, color: getColor('subText') },
        list: { paddingHorizontal: CATALOGUE_GUTTER, gap: 8, paddingBottom: 8 },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          padding: 12,
          borderRadius: 12,
          backgroundColor: getColor('white'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
        },
        message: { flex: 1, fontSize: 13, lineHeight: 18, color: getColor('text') },
        actions: { paddingHorizontal: CATALOGUE_GUTTER, paddingTop: 8, gap: 8 },
        primary: {
          height: 48,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: getColor('primary'),
        },
        primaryText: { fontSize: 15, fontWeight: '800', color: '#fff' },
        secondary: {
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: getColor('border'),
        },
        secondaryText: { fontSize: 14, fontWeight: '700', color: getColor('text') },
      }),
    [getColor, insets.bottom]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onBack}>
      <Pressable style={styles.backdrop} onPress={onBack}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grabber} />
          <View style={styles.head}>
            <ThemeText style={styles.title}>
              {emptyCart ? 'Nothing to order yet' : 'Some items need your attention'}
            </ThemeText>
            {canUpdate ? (
              <ThemeText style={styles.subtitle}>{consequence(issues)}</ThemeText>
            ) : outOfRadius && onChangeAddress ? (
              <ThemeText style={styles.subtitle}>
                Choose an address these items can be delivered to.
              </ThemeText>
            ) : null}
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {issues.map((issue, index) => (
              <View key={`${issue.type}-${issue.sku ?? issue.shopId ?? index}`} style={styles.row}>
                <MaterialCommunityIcons
                  name={ICON[issue.type] ?? 'alert-circle-outline'}
                  size={20}
                  color={issue.type === 'PRICE_CHANGED' ? getColor('primary') : getColor('error')}
                />
                <ThemeText style={styles.message}>{issue.message}</ThemeText>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            {outOfRadius && onChangeAddress ? (
              <TouchableOpacity
                style={canUpdate ? styles.secondary : styles.primary}
                onPress={onChangeAddress}
                accessibilityRole="button"
              >
                <ThemeText style={canUpdate ? styles.secondaryText : styles.primaryText}>
                  Change address
                </ThemeText>
              </TouchableOpacity>
            ) : null}
            {canUpdate ? (
              <TouchableOpacity
                style={styles.primary}
                onPress={onResolve}
                disabled={resolving}
                accessibilityRole="button"
              >
                {resolving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemeText style={styles.primaryText}>Update cart</ThemeText>
                )}
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.secondary} onPress={onBack} accessibilityRole="button">
              <ThemeText style={styles.secondaryText}>Back to cart</ThemeText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default EssentialsIssuesSheet;
