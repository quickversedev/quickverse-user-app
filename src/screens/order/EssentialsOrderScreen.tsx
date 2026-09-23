import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  EssentialsOrderPart,
} from '../../services/essentialsOrderService';
import { useTheme } from '../../theme/ThemeContext';

/**
 * One Daily Essentials order: the success screen right after placing it, and its details from
 * order history.
 *
 * It is one order to the customer, so there is one header, one amount and one status; each
 * kirana's part is listed below with its own outcome. Straight after placing, the server is
 * still sending the kiranas their parts, so the screen polls until every part has an outcome.
 */

type Route = RouteProp<RootStackParamList, 'EssentialsOrder'>;
type Nav = StackNavigationProp<RootStackParamList, 'EssentialsOrder'>;

const POLL_MS = 2000;
const POLL_LIMIT = 45;

const rupees = (amount: number) => `₹${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

/** What the customer should read for a kirana order's state. */
const partLabel = (part: EssentialsOrderPart): { text: string; tone: 'ok' | 'wait' | 'bad' } => {
  if (part.placementStatus === 'FAILED') return { text: 'Could not be placed', tone: 'bad' };
  if (part.placementStatus !== 'PLACED') return { text: 'Placing…', tone: 'wait' };
  switch ((part.orderState ?? '').toUpperCase()) {
    case 'CANCELLED':
    case 'REJECTED':
      return { text: 'Cancelled', tone: 'bad' };
    case 'DELIVERED':
    case 'COMPLETED':
      return { text: 'Delivered', tone: 'ok' };
    case 'ACCEPTED':
    case 'CONFIRMED':
      return { text: 'Accepted by store', tone: 'ok' };
    default:
      return { text: 'Sent to store', tone: 'ok' };
  }
};

const EssentialsOrderScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { getColor } = useTheme();
  const { authData } = useAuth();
  const [order, setOrder] = useState<EssentialsOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const polls = useRef(0);

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

  // Poll while the kiranas' parts are being placed; then one live read for their states.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      const current = await load(false);
      if (cancelled) return;
      if (current?.status === 'PLACING' && polls.current < POLL_LIMIT) {
        polls.current += 1;
        timer = setTimeout(tick, POLL_MS);
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
        seq: {
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${getColor('primary')}1F`,
        },
        seqText: { fontSize: 11, fontWeight: '800', color: getColor('primary') },
        partName: { flex: 1, fontSize: 14, fontWeight: '700', color: getColor('text') },
        partState: { fontSize: 12, fontWeight: '700' },
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        thumb: { width: 36, height: 36, borderRadius: 6, backgroundColor: getColor('overlay') },
        itemName: { flex: 1, fontSize: 13, color: getColor('text') },
        itemQty: { fontSize: 13, color: getColor('subText') },
        failNote: {
          fontSize: 12,
          paddingHorizontal: 12,
          paddingBottom: 10,
          color: getColor('error'),
        },
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
        error: { fontSize: 13, textAlign: 'center', color: getColor('error'), marginTop: 24 },
      }),
    [getColor]
  );

  const tone = (t: 'ok' | 'wait' | 'bad') =>
    t === 'bad' ? getColor('error') : t === 'wait' ? getColor('subText') : CATALOGUE_ACCENT;

  const hero = () => {
    if (!order || order.status === 'PLACING') {
      return {
        icon: 'progress-clock' as const,
        color: getColor('primary'),
        title: 'Placing your order…',
        sub: 'Sending it to each store. This takes a few seconds.',
      };
    }
    const shown = displayStatusOf(order);
    if (shown === 'CANCELLED') {
      return {
        icon: 'cancel' as const,
        color: getColor('error'),
        title: 'Order cancelled',
        sub: "This order was cancelled. You won't be charged for it.",
      };
    }
    if (shown === 'DELIVERED') {
      return {
        icon: 'check-circle' as const,
        color: CATALOGUE_ACCENT,
        title: 'Delivered',
        sub: 'Everything from every store has been delivered.',
      };
    }
    if (order.status === 'CONFIRMED') {
      return {
        icon: 'check-circle' as const,
        color: CATALOGUE_ACCENT,
        title: params.justPlaced ? 'Order placed!' : 'Daily Essentials order',
        sub:
          order.shops.length > 1
            ? `One order from ${order.shops.length} stores, delivered together.`
            : 'Your order has been sent to the store.',
      };
    }
    if (order.status === 'PARTIALLY_CONFIRMED') {
      return {
        icon: 'alert-circle' as const,
        color: '#FFA726',
        title: 'Order placed, with a change',
        sub: "One store couldn't take its part. You won't be charged for it.",
      };
    }
    return {
      icon: 'close-circle' as const,
      color: getColor('error'),
      title: "We couldn't place this order",
      sub: "No store could take it, so you won't be charged. Please try again.",
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
                <ThemeText style={styles.label}>
                  Items · {order.itemCount} from {order.shops.length}{' '}
                  {order.shops.length === 1 ? 'store' : 'stores'}
                </ThemeText>
                <ThemeText style={styles.value}>{rupees(order.itemTotal)}</ThemeText>
              </View>
              <View style={styles.row}>
                <ThemeText style={styles.label}>
                  Delivery · {order.routeDistanceKm} km route
                </ThemeText>
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
                  {displayStatusOf(order) === 'CANCELLED'
                    ? 'Nothing to pay'
                    : order.paymentMethod === 'COD'
                      ? 'Pay on delivery'
                      : 'Paid'}
                </ThemeText>
                <ThemeText style={styles.total}>
                  {rupees(displayStatusOf(order) === 'CANCELLED' ? 0 : order.amountToPay)}
                </ThemeText>
              </View>
              {displayStatusOf(order) !== 'CANCELLED' && order.amountToPay < order.payableAmount ? (
                <ThemeText style={styles.label}>
                  Was {rupees(order.payableAmount)}; less the part a store couldn&apos;t take.
                </ThemeText>
              ) : null}
            </View>

            {order.shops.map(part => {
              const label = partLabel(part);
              return (
                <View key={part.shopId} style={styles.part}>
                  <View style={styles.partHead}>
                    <View style={styles.seq}>
                      <ThemeText style={styles.seqText}>{part.pickupSequence}</ThemeText>
                    </View>
                    <ThemeText style={styles.partName} numberOfLines={1}>
                      {part.shopName ?? 'Store'}
                    </ThemeText>
                    <ThemeText style={[styles.partState, { color: tone(label.tone) }]}>
                      {label.text}
                    </ThemeText>
                  </View>
                  {part.items.map(item => (
                    <View key={item.sku} style={styles.item}>
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.thumb}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.thumb} />
                      )}
                      <ThemeText style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </ThemeText>
                      <ThemeText style={styles.itemQty}>
                        {item.quantity} × {rupees(item.unitPrice)}
                      </ThemeText>
                    </View>
                  ))}
                  {part.failureReason ? (
                    <ThemeText style={styles.failNote}>{part.failureReason}</ThemeText>
                  ) : null}
                </View>
              );
            })}

            <ThemeText style={styles.orderRef}>
              Order {order.orderId.replace(/^OGM/, '').slice(0, 8).toUpperCase()}
            </ThemeText>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneBtn} onPress={done} accessibilityRole="button">
          <ThemeText style={styles.doneText}>{params.justPlaced ? 'Done' : 'Back'}</ThemeText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EssentialsOrderScreen;
