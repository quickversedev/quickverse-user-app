import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../constants/catalogue';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import essentialsOrderService, {
  displayStatusOf,
  EssentialsOrder,
  EssentialsOrderItem,
  EssentialsOrderPart,
} from '../../services/essentialsOrderService';
import { useTheme } from '../../theme/ThemeContext';

/**
 * One Daily Essentials order: the success screen right after placing it, and its details from
 * order history.
 *
 * It is one order to the customer: one status, one amount, one list of items. The kiranas
 * behind it are never named or counted. When a kirana cannot supply its part, its items show as
 * unavailable in the list and the total drops — that is all the customer needs to know.
 * Straight after placing, the server is still sending the kiranas their parts, so the screen
 * polls until every part has an outcome.
 */

type Route = RouteProp<RootStackParamList, 'EssentialsOrder'>;
type Nav = StackNavigationProp<RootStackParamList, 'EssentialsOrder'>;

const POLL_MS = 2000;
const AWAIT_POLL_MS = 5000;
/** Placement takes seconds and the accept SLA is 5 minutes; stop polling well after both. */
const POLL_FOR_MS = 8 * 60 * 1000;

const rupees = (amount: number) => `₹${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

/**
 * A part's items are out of the order: never placed, refused, timed out or cancelled on its own
 * while the rest of the order carries on. Shown per item, never per store.
 */
const partDropped = (part: EssentialsOrderPart) =>
  part.placementStatus === 'FAILED' ||
  part.vendorDecision === 'REJECTED' ||
  part.vendorDecision === 'TIMED_OUT' ||
  (part.vendorDecision === 'CANCELLED' && part.placementStatus === 'PLACED');

type ShownItem = EssentialsOrderItem & { unavailable: boolean };

/** Still worth polling: parts being placed, or kiranas still deciding. */
const isSettling = (order: EssentialsOrder | null) =>
  !order || order.status === 'PLACING' || order.acceptanceStatus === 'AWAITING_STORES';

const EssentialsOrderScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { getColor } = useTheme();
  const { authData } = useAuth();
  const [order, setOrder] = useState<EssentialsOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pollStarted = useRef(Date.now());

  const load = useCallback(
    async (live: boolean) => {
      if (!authData?.jwt || !authData?.phone) return null;
      try {
        const next = await essentialsOrderService.getOrder(
          params.orderId,
          authData.jwt,
          authData.phone,
          live
        );
        setOrder(next);
        setError(null);
        return next;
      } catch (e) {
        setError((e as { message?: string })?.message || 'Could not load this order');
        return null;
      }
    },
    [params.orderId, authData?.jwt, authData?.phone]
  );

  // Poll while the kiranas' parts are being placed and while they decide; then one live read.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      const current = await load(false);
      if (cancelled) return;
      if (isSettling(current) && Date.now() - pollStarted.current < POLL_FOR_MS) {
        timer = setTimeout(tick, current?.status === 'PLACING' ? POLL_MS : AWAIT_POLL_MS);
      } else if (current) {
        load(true);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const [cancelling, setCancelling] = useState(false);
  const cancelOrder = useCallback(() => {
    if (!order || !authData?.jwt || !authData?.phone) return;
    const jwt = authData.jwt;
    const phone = authData.phone;
    Alert.alert(
      'Cancel this order?',
      order.paymentStatus === 'PAID'
        ? `Your order will be cancelled and ${rupees(order.payableAmount)} refunded to your payment method.`
        : 'Your order will be cancelled.',
      [
        { text: 'Keep order', style: 'cancel' },
        {
          text: 'Cancel order',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              setOrder(await essentialsOrderService.cancelOrder(order.orderId, jwt, phone));
            } catch (e) {
              Alert.alert(
                'Could not cancel',
                (e as { message?: string })?.message || 'Please try again.'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }, [order, authData?.jwt, authData?.phone]);

  const done = useCallback(() => {
    if (params.justPlaced) {
      navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainApp');
    }
  }, [navigation, params.justPlaced]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: getColor('background') },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: CATALOGUE_GUTTER,
          paddingVertical: 12,
        },
        headerTitle: { fontSize: 20, fontWeight: '800', color: getColor('text') },
        scroll: { paddingHorizontal: CATALOGUE_GUTTER, paddingBottom: 120, gap: 12 },
        hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
        heroTitle: {
          fontSize: 20,
          fontWeight: '800',
          textAlign: 'center',
          color: getColor('text'),
        },
        heroSub: { fontSize: 13, textAlign: 'center', color: getColor('subText') },
        amountCard: {
          padding: 14,
          borderRadius: 12,
          backgroundColor: getColor('white'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
        },
        row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
        label: { fontSize: 13, color: getColor('subText') },
        value: { fontSize: 13, color: getColor('text') },
        total: { fontSize: 16, fontWeight: '800', color: getColor('text') },
        part: {
          borderRadius: 12,
          backgroundColor: getColor('white'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
          overflow: 'hidden',
        },
        partHead: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: getColor('border'),
        },
        partName: { flex: 1, fontSize: 14, fontWeight: '700', color: getColor('text') },
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        thumb: { width: 36, height: 36, borderRadius: 6, backgroundColor: getColor('overlay') },
        itemText: { flex: 1, minWidth: 0 },
        itemName: { fontSize: 13, color: getColor('text') },
        itemQty: { fontSize: 13, color: getColor('subText') },
        unavailable: { fontSize: 11, marginTop: 2, color: getColor('error') },
        dimmed: { opacity: 0.5 },
        struck: { textDecorationLine: 'line-through' },
        orderRef: { fontSize: 11, textAlign: 'center', color: getColor('subText') },
        footer: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: CATALOGUE_GUTTER,
          backgroundColor: getColor('white'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: getColor('border'),
        },
        doneBtn: {
          height: 48,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: getColor('primary'),
        },
        doneText: { fontSize: 15, fontWeight: '800', color: '#fff' },
        cancelBtn: {
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          borderWidth: 1,
          borderColor: getColor('error'),
        },
        cancelText: { fontSize: 14, fontWeight: '700', color: getColor('error') },
        error: { fontSize: 13, textAlign: 'center', color: getColor('error'), marginTop: 24 },
      }),
    [getColor]
  );

  /**
   * Every item in one list. Items of a part that dropped out show as unavailable — unless the
   * whole order is off, when the status above already says so and marking each item adds nothing.
   */
  const items = useMemo<ShownItem[]>(() => {
    if (!order) return [];
    const wholeOrderOff = displayStatusOf(order) === 'CANCELLED' || order.status === 'FAILED';
    return order.shops.flatMap(part =>
      part.items.map(item => ({ ...item, unavailable: !wholeOrderOff && partDropped(part) }))
    );
  }, [order]);

  const hero = () => {
    if (!order || order.status === 'PLACING') {
      return {
        icon: 'progress-clock' as const,
        color: getColor('primary'),
        title: 'Placing your order…',
        sub: 'This takes a few seconds.',
      };
    }
    const shown = displayStatusOf(order);
    if (shown === 'AWAITING_PAYMENT') {
      return {
        icon: 'credit-card-clock-outline' as const,
        color: getColor('primary'),
        title: 'Waiting for payment',
        sub: 'Your order is placed as soon as it is paid.',
      };
    }
    if (shown === 'PAYMENT_EXPIRED') {
      return {
        icon: 'credit-card-off-outline' as const,
        color: getColor('error'),
        title: 'Payment not completed',
        sub: 'This order was never paid, so it was not placed.',
      };
    }
    if (shown === 'CANCELLED') {
      return {
        icon: 'cancel' as const,
        color: getColor('error'),
        title: 'Order cancelled',
        sub:
          order.acceptanceStatus === 'REJECTED'
            ? `We couldn't fulfil this order. ${order.paymentStatus === 'PAID' ? "You'll get a full refund." : "You won't be charged for it."}`
            : order.paymentStatus === 'PAID'
              ? "You cancelled this order. You'll get a full refund."
              : "You cancelled this order. You won't be charged for it.",
      };
    }
    if (shown === 'DELIVERED') {
      return {
        icon: 'check-circle' as const,
        color: CATALOGUE_ACCENT,
        title: 'Delivered',
        sub: 'Your order has been delivered.',
      };
    }
    if (shown === 'AWAITING_STORES') {
      return {
        icon: 'progress-clock' as const,
        color: getColor('primary'),
        title: params.justPlaced ? 'Order placed!' : 'Confirming your order',
        sub: "We're confirming your items. You'll only pay for what we can deliver.",
      };
    }
    if (shown === 'ACCEPTED') {
      return {
        icon: 'check-circle' as const,
        color: CATALOGUE_ACCENT,
        title: 'Order confirmed',
        sub: 'Your order is being prepared.',
      };
    }
    if (shown === 'PARTIALLY_ACCEPTED') {
      return {
        icon: 'alert-circle' as const,
        color: '#FFA726',
        title: 'Order confirmed, with a change',
        sub: "Some items aren't available, so they were removed and your total updated.",
      };
    }
    if (order.status === 'CONFIRMED') {
      return {
        icon: 'check-circle' as const,
        color: CATALOGUE_ACCENT,
        title: params.justPlaced ? 'Order placed!' : 'Daily Essentials order',
        sub: 'Your order has been placed.',
      };
    }
    if (order.status === 'PARTIALLY_CONFIRMED') {
      return {
        icon: 'alert-circle' as const,
        color: '#FFA726',
        title: 'Order placed, with a change',
        sub: "Some items couldn't be added to your order. You won't be charged for them.",
      };
    }
    return {
      icon: 'close-circle' as const,
      color: getColor('error'),
      title: "We couldn't place this order",
      sub: "You won't be charged. Please try again.",
    };
  };
  const h = hero();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={done} accessibilityRole="button" accessibilityLabel="Close">
          <MaterialCommunityIcons
            name={params.justPlaced ? 'close' : 'arrow-left'}
            size={26}
            color={getColor('text')}
          />
        </TouchableOpacity>
        <ThemeText style={styles.headerTitle}>Order details</ThemeText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.hero}>
          {!order || order.status === 'PLACING' ? (
            <ActivityIndicator size="large" color={h.color} />
          ) : (
            <MaterialCommunityIcons name={h.icon} size={56} color={h.color} />
          )}
          <ThemeText style={styles.heroTitle}>{h.title}</ThemeText>
          <ThemeText style={styles.heroSub}>{h.sub}</ThemeText>
        </View>

        {error && !order ? <ThemeText style={styles.error}>{error}</ThemeText> : null}

        {order ? (
          <>
            <View style={styles.amountCard}>
              <View style={styles.row}>
                <ThemeText style={styles.label}>Items · {order.itemCount}</ThemeText>
                <ThemeText style={styles.value}>{rupees(order.itemTotal)}</ThemeText>
              </View>
              <View style={styles.row}>
                <ThemeText style={styles.label}>Delivery fee</ThemeText>
                <ThemeText style={styles.value}>{rupees(order.deliveryFee)}</ThemeText>
              </View>
              {order.couponCode ? (
                <View style={styles.row}>
                  <ThemeText style={styles.label}>Coupon</ThemeText>
                  <ThemeText style={styles.value}>{order.couponCode}</ThemeText>
                </View>
              ) : null}
              <View style={styles.row}>
                <ThemeText style={styles.total}>
                  {order.paymentStatus === 'PAID'
                    ? 'Paid online'
                    : displayStatusOf(order) === 'CANCELLED'
                      ? 'Nothing to pay'
                      : order.paymentMethod === 'COD'
                        ? 'Pay on delivery'
                        : 'To pay online'}
                </ThemeText>
                <ThemeText style={styles.total}>
                  {rupees(
                    order.paymentStatus === 'PAID'
                      ? order.payableAmount
                      : displayStatusOf(order) === 'CANCELLED'
                        ? 0
                        : order.amountToPay
                  )}
                </ThemeText>
              </View>
              {order.paymentStatus === 'PAID' && order.refundDue > 0 ? (
                <View style={styles.row}>
                  <ThemeText style={[styles.label, { color: CATALOGUE_ACCENT }]}>
                    {order.refundedAmount >= order.refundDue
                      ? 'Refunded to your payment method'
                      : 'Refund on its way'}
                  </ThemeText>
                  <ThemeText style={[styles.value, { color: CATALOGUE_ACCENT }]}>
                    −{rupees(order.refundDue)}
                  </ThemeText>
                </View>
              ) : null}
              {order.paymentStatus !== 'PAID' &&
              displayStatusOf(order) !== 'CANCELLED' &&
              order.amountToPay < order.payableAmount ? (
                <ThemeText style={styles.label}>
                  Was {rupees(order.payableAmount)}; less the items that weren&apos;t available.
                </ThemeText>
              ) : null}
            </View>

            <View style={styles.part}>
              <View style={styles.partHead}>
                <ThemeText style={styles.partName}>Items</ThemeText>
              </View>
              {items.map(item => (
                <View key={item.sku} style={styles.item}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={[styles.thumb, item.unavailable && styles.dimmed]}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.thumb} />
                  )}
                  <View style={styles.itemText}>
                    <ThemeText
                      style={[styles.itemName, item.unavailable && styles.dimmed]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </ThemeText>
                    {item.unavailable ? (
                      <ThemeText style={styles.unavailable}>Unavailable · not charged</ThemeText>
                    ) : null}
                  </View>
                  <ThemeText style={[styles.itemQty, item.unavailable && styles.struck]}>
                    {item.quantity} × {rupees(item.unitPrice)}
                  </ThemeText>
                </View>
              ))}
            </View>

            <ThemeText style={styles.orderRef}>
              Order {order.orderId.replace(/^OGM/, '').slice(0, 8).toUpperCase()}
            </ThemeText>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {order?.cancellable ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={cancelOrder}
            disabled={cancelling}
            accessibilityRole="button"
          >
            {cancelling ? (
              <ActivityIndicator color={getColor('error')} />
            ) : (
              <ThemeText style={styles.cancelText}>Cancel order</ThemeText>
            )}
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.doneBtn} onPress={done} accessibilityRole="button">
          <ThemeText style={styles.doneText}>{params.justPlaced ? 'Done' : 'Back'}</ThemeText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EssentialsOrderScreen;
