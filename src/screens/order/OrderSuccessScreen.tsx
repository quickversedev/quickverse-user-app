import { CommonActions, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../constants/catalogue';
import { useEssentialsOrderDetails } from '../../hooks/useEssentialsOrderDetails';
import { useOrders } from '../../hooks/useOrders';
import useVendorStore from '../../store/vendorStore';
import { RootStackParamList } from '../../routes/AppStack';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Order confirmation, in the QV order-success design.
 *
 * It used to be a three-second splash: a tick, an order id, and an automatic jump to
 * OrderDetails. Everything the design puts here — a summary to check, a track button,
 * a support link — needs the screen to outlive that, so the redirect is gone and the
 * customer leaves by choice.
 *
 * The order is already fetched on mount and was being thrown away; the summary is
 * built from it rather than from the four route params.
 *
 * Deliberately not built, from the design: the mystery-reward scratch card, "Instant
 * QuickVerse Cashback", "Claim & Add to QV Balance", the ₹25 WhatsApp referral, and
 * the "QUICK150 unlocked for tomorrow" banner. There is no wallet, cashback, rewards,
 * referral or coupon-unlock system in the app or the server — a scratch card promising
 * "guaranteed cash back in your wallet" would be telling a customer they had won money
 * that cannot be paid. See QV-19.
 */

const HERO_RING = 64;

/**
 * Params come from RootStackParamList rather than being restated here. They were
 * duplicated inline, which meant the navigator could grow a param this screen could not
 * see — exactly what happened when grouped orders added `shopCount`.
 */
interface OrderSuccessScreenProps {
  route: RouteProp<RootStackParamList, 'OrderSuccess'>;
}

const OrderSuccessScreen: React.FC<OrderSuccessScreenProps> = ({ route }) => {
  const { getColor, theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'OrderSuccess'>>();
  const { orderId, amount, shopId, shopCount, essentialsOrderId } = route.params;
  const { loadOrderById, selectedOrder: storeOrder } = useOrders();
  // A Daily Essentials order is shown here like any order, loaded as itself.
  const { order: essentialsOrder } = useEssentialsOrderDetails(essentialsOrderId);
  const selectedOrder = essentialsOrderId ? essentialsOrder : storeOrder;
  const vendors = useVendorStore(state => state.vendors);

  useEffect(() => {
    if (!orderId || essentialsOrderId) return;
    loadOrderById(orderId, shopId).catch(err =>
      console.error('Failed to fetch order details:', err)
    );
  }, [orderId, shopId, loadOrderById, essentialsOrderId]);

  /* ---- entrance animation ------------------------------------------------ */

  const pop = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // The design has a prefers-reduced-motion branch; honour the OS setting rather
    // than pulsing at someone who asked the system not to.
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pop.setValue(1);
      return;
    }
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pop, ripple]);

  /* ---- what the order actually says -------------------------------------- */

  const items = useMemo(() => selectedOrder?.items ?? [], [selectedOrder]);
  const unitCount = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [items]
  );
  const firstItem = items[0];
  /**
   * What the listed items cost. The strip names the items, so it prices the items; the header
   * above already states the order total (fees included). Showing the total here made a ₹1 item
   * read as ₹32.
   */
  const itemsSubtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + Number(item.totalPrice ?? Number(item.price ?? 0) * (item.quantity || 1)),
        0
      ),
    [items]
  );
  const restNames = items
    .slice(1)
    .map(item => item.name)
    .filter(Boolean)
    .join(', ');
  /**
   * `finance.payableAmount` is what the customer is actually charged. The order's
   * own `totalInvoiceAmount` sounds like the bill but the store fills it from
   * `totalOrderAmount`, which is the item subtotal — on a live order those read 180
   * against a real payable of 210, so the fees would silently vanish.
   */
  const total =
    selectedOrder?.finance?.payableAmount ??
    selectedOrder?.totalInvoiceAmount ??
    selectedOrder?.totalAmount ??
    amount;

  /**
   * Stated as a fact about the method, not about whether money has moved: a COD order
   * is placed unpaid, so asserting "paid" on it would be wrong.
   *
   * Compared loosely because the stored value is not what the type claims. The API
   * sends `COD` / `PREPAID`, and orderStore lowercases and casts it straight into a
   * `'cash' | 'card' | 'upi'` union it does not belong to — so this arrives as `cod`.
   */
  const isCashOnDelivery = ['cod', 'cash'].includes(
    String(selectedOrder?.paymentMethod ?? '').toLowerCase()
  );
  const paymentLabel = isCashOnDelivery ? 'Cash on delivery' : 'Paid online';
  const eta = selectedOrder?.tracking?.preparationTime;

  /**
   * The order endpoint does not return a shop name at all, so it is resolved from the
   * vendors already in the store by the shopId this screen was given.
   */
  const shopName = useMemo(() => {
    // A grouped Daily Essentials order covers several kiranas under one payment, and
    // naming only the first would misrepresent what was bought. The screen still loads
    // that first sub-order for the tracking link — there is no combined tracking view
    // yet — so the count is the honest thing to show here.
    // Never a kiranas' name for a Daily Essentials order: to the customer it is one order.
    if (essentialsOrderId) return 'Daily Essentials';
    if (shopCount && shopCount > 1) {
      return `${shopCount} stores`;
    }
    const fromOrder = selectedOrder?.shopName || selectedOrder?.tracking?.shopName;
    if (fromOrder) return fromOrder;
    const id = shopId || selectedOrder?.shopId;
    return id ? vendors.find(v => v.shopId === id)?.name : undefined;
  }, [selectedOrder, shopId, shopCount, vendors, essentialsOrderId]);

  const handleTrackOrder = useCallback(() => {
    // Reset rather than push, so back from OrderDetails lands on the app and never
    // returns to a confirmation for an order already placed.
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'MainApp' },
          { name: 'OrderDetails', params: { orderId, shopId, essentialsOrderId } },
        ],
      })
    );
  }, [navigation, orderId, shopId, essentialsOrderId]);

  const handleBackToHome = useCallback(() => navigation.navigate('MainApp'), [navigation]);
  const handleSupport = useCallback(() => navigation.navigate('HelpDesk'), [navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: getColor('background') },
        content: { padding: CATALOGUE_GUTTER, gap: 12, paddingBottom: 28 },
        card: {
          backgroundColor: getColor('white'),
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
          shadowColor: theme.colors.shadow.color,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 3,
          elevation: 2,
        },
        hero: { padding: 20, alignItems: 'center', overflow: 'hidden' },
        // Soft colour wash behind the tick, as the design has it.
        blobTop: {
          position: 'absolute',
          top: -40,
          left: -40,
          width: 112,
          height: 112,
          borderRadius: 999,
          backgroundColor: `${CATALOGUE_ACCENT}14`,
        },
        blobBottom: {
          position: 'absolute',
          bottom: -32,
          right: -32,
          width: 112,
          height: 112,
          borderRadius: 999,
          backgroundColor: `${getColor('primary')}14`,
        },
        ringWrap: {
          width: HERO_RING,
          height: HERO_RING,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        },
        ripple: {
          position: 'absolute',
          width: HERO_RING,
          height: HERO_RING,
          borderRadius: 999,
          backgroundColor: `${CATALOGUE_ACCENT}33`,
        },
        ring: {
          width: HERO_RING,
          height: HERO_RING,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${CATALOGUE_ACCENT}1F`,
        },
        tick: {
          width: 48,
          height: 48,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: CATALOGUE_ACCENT,
        },
        title: {
          fontSize: 20,
          lineHeight: 26,
          fontWeight: '700',
          color: getColor('text'),
          textAlign: 'center',
        },
        subtitle: {
          fontSize: 13,
          lineHeight: 18,
          color: getColor('subText'),
          textAlign: 'center',
          marginTop: 2,
        },
        strong: { color: getColor('text'), fontWeight: '700' },
        etaStrip: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          alignSelf: 'stretch',
          gap: 8,
          marginTop: 14,
          padding: 10,
          borderRadius: 12,
          backgroundColor: getColor('overlay'),
        },
        etaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
        etaIcon: {
          width: 32,
          height: 32,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${CATALOGUE_ACCENT}1A`,
        },
        etaTitle: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: CATALOGUE_ACCENT },
        etaSub: { fontSize: 11, lineHeight: 15, color: getColor('subText') },
        liveDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: CATALOGUE_ACCENT },

        /* ---- summary ---- */
        summary: { padding: 12, gap: 8 },
        storeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        storeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
        storeIcon: {
          width: 32,
          height: 32,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: getColor('overlay'),
        },
        storeName: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: getColor('text') },
        countBadge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          backgroundColor: getColor('overlay'),
        },
        countText: {
          fontSize: 10,
          lineHeight: 12,
          fontWeight: '700',
          letterSpacing: 0.4,
          color: getColor('subText'),
        },
        itemStrip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 8,
          borderRadius: 12,
          backgroundColor: getColor('overlay'),
        },
        thumb: {
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: getColor('white'),
        },
        itemText: { flex: 1, minWidth: 0 },
        itemTitle: {
          fontSize: 13,
          lineHeight: 18,
          fontWeight: '700',
          color: getColor('text'),
        },
        itemRest: { fontSize: 11, lineHeight: 15, color: getColor('subText') },
        itemTotal: { fontSize: 15, lineHeight: 18, fontWeight: '800', color: getColor('text') },
        trackBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 44,
          borderRadius: 12,
          backgroundColor: getColor('overlay'),
        },
        trackLabel: { fontSize: 14, lineHeight: 18, fontWeight: '700', color: getColor('primary') },

        /* ---- footer ---- */
        supportRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 6,
        },
        supportText: { fontSize: 11, lineHeight: 15, color: getColor('subText') },
        supportLink: {
          fontSize: 11,
          lineHeight: 15,
          fontWeight: '700',
          color: getColor('primary'),
          textDecorationLine: 'underline',
        },
        homeBtn: { alignItems: 'center', paddingVertical: 12 },
        homeLabel: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: getColor('subText') },
      }),
    [getColor, theme]
  );

  const rippleStyle = {
    opacity: ripple.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0, 0] }),
    transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.65] }) }],
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={getColor('background')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---- celebration ---- */}
        <View style={[styles.card, styles.hero]}>
          <View style={styles.blobTop} pointerEvents="none" />
          <View style={styles.blobBottom} pointerEvents="none" />

          <View style={styles.ringWrap}>
            {reduceMotion ? null : <Animated.View style={[styles.ripple, rippleStyle]} />}
            <Animated.View style={[styles.ring, { transform: [{ scale: pop }] }]}>
              <View style={styles.tick}>
                <MaterialCommunityIcons name="check" size={28} color={getColor('white')} />
              </View>
            </Animated.View>
          </View>

          <ThemeText style={styles.title}>Order Placed Successfully!</ThemeText>
          <ThemeText style={styles.subtitle}>
            Order <ThemeText style={styles.strong}>#{orderId}</ThemeText> • ₹
            {Number(total).toFixed(2)} • {paymentLabel}
          </ThemeText>

          {/* Only when the order actually carries a preparation time. */}
          {eta ? (
            <View style={styles.etaStrip}>
              <View style={styles.etaLeft}>
                <View style={styles.etaIcon}>
                  <MaterialCommunityIcons name="moped" size={18} color={CATALOGUE_ACCENT} />
                </View>
                <View style={styles.itemText}>
                  <ThemeText style={styles.etaTitle}>Arriving in {eta}</ThemeText>
                  {shopName ? (
                    <ThemeText style={styles.etaSub} numberOfLines={1}>
                      Being packed at {shopName}
                    </ThemeText>
                  ) : null}
                </View>
              </View>
              <View style={styles.liveDot} />
            </View>
          ) : null}
        </View>

        {/* ---- summary ---- */}
        {items.length > 0 ? (
          <View style={[styles.card, styles.summary]}>
            <View style={styles.storeRow}>
              <View style={styles.storeLeft}>
                <View style={styles.storeIcon}>
                  <MaterialCommunityIcons name="storefront" size={18} color={getColor('subText')} />
                </View>
                <ThemeText style={styles.storeName} numberOfLines={1}>
                  {shopName || 'Your order'}
                </ThemeText>
              </View>
              <View style={styles.countBadge}>
                <ThemeText style={styles.countText}>
                  {unitCount} {unitCount === 1 ? 'Item' : 'Items'}
                </ThemeText>
              </View>
            </View>

            <View style={styles.itemStrip}>
              {firstItem?.image ? (
                <Image
                  source={{ uri: firstItem.image }}
                  style={styles.thumb}
                  resizeMode="contain"
                />
              ) : null}
              <View style={styles.itemText}>
                <ThemeText style={styles.itemTitle} numberOfLines={1}>
                  {firstItem?.name}
                  {items.length > 1 ? ` + ${items.length - 1} more` : ''}
                </ThemeText>
                {restNames ? (
                  <ThemeText style={styles.itemRest} numberOfLines={1}>
                    {restNames}
                  </ThemeText>
                ) : null}
              </View>
              <ThemeText style={styles.itemTotal}>
                ₹{Number(items.length > 0 ? itemsSubtotal : total).toFixed(2)}
              </ThemeText>
            </View>

            <TouchableOpacity
              style={styles.trackBtn}
              onPress={handleTrackOrder}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="map-marker" size={18} color={getColor('primary')} />
              <ThemeText style={styles.trackLabel}>Track your order</ThemeText>
              <MaterialCommunityIcons name="arrow-right" size={18} color={getColor('primary')} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, styles.summary]}>
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={handleTrackOrder}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="map-marker" size={18} color={getColor('primary')} />
              <ThemeText style={styles.trackLabel}>Track your order</ThemeText>
              <MaterialCommunityIcons name="arrow-right" size={18} color={getColor('primary')} />
            </TouchableOpacity>
          </View>
        )}

        {/* ---- support ---- */}
        <View style={styles.supportRow}>
          <MaterialCommunityIcons name="headset" size={16} color={getColor('subText')} />
          <ThemeText style={styles.supportText}>Need help with this order?</ThemeText>
          <TouchableOpacity onPress={handleSupport} accessibilityRole="button">
            <ThemeText style={styles.supportLink}>24x7 Support</ThemeText>
          </TouchableOpacity>
        </View>

        {/* The design leaves via the bottom nav; this screen is a stack push with no
            tab bar, so it needs its own way back. */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={handleBackToHome}
          accessibilityRole="button"
        >
          <ThemeText style={styles.homeLabel}>Back to home</ThemeText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderSuccessScreen;
