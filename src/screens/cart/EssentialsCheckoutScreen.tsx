import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeText } from '../../components/common/theme/ThemeText';
import { CouponSheet } from '../../components/modules/Cart';
import { SheetCoupon } from '../../components/modules/Cart/CouponSheet';
import EssentialsIssuesSheet from '../../components/modules/Cart/EssentialsIssuesSheet';
import { AddressSelectionModal } from '../../components/modules/Header';
import { CATALOGUE_ACCENT, CATALOGUE_GUTTER } from '../../constants/catalogue';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import couponService from '../../services/api/couponSevice';
import essentialsCartService, {
  EssentialsCheckoutSummary,
  EssentialsPaymentMethod,
} from '../../services/essentialsCartService';
import essentialsOrderService from '../../services/essentialsOrderService';
import useEssentialsCartStore from '../../store/cart/essentialsCartStore';
import useConfigStore from '../../store/configStore';
import { useTheme } from '../../theme/ThemeContext';
import { Address } from '../../types/address';

/**
 * Checkout for the Daily Essentials cart: one order, one bill, across up to three kiranas.
 *
 * Every figure on this screen comes from the server's summary — delivery on the whole
 * kirana → kirana → customer route, the platform fee and the one coupon, each charged once.
 * The screen never adds anything up itself, so what it shows is what the order will charge.
 *
 * Anything that stops the order (an item out of stock, a store too far from the address, a
 * price that moved) opens the issues sheet, and the customer chooses: update the cart and
 * carry on, or go back.
 */

type Nav = StackNavigationProp<RootStackParamList, 'EssentialsCheckout'>;

const rupees = (amount: number) => `₹${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

const showMessage = (message: string) => {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.LONG);
  else Alert.alert('Daily Essentials', message);
};

const addressLine = (address: Address) =>
  [address.addressLine1, address.addressLine2, address.city].filter(Boolean).join(', ');

const EssentialsCheckoutScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { getColor, theme } = useTheme();
  const { authData, selectedAddress, setSelectedAddress } = useAuth();
  const regionId = useConfigStore(s => s.getRegionId());
  const cartVersion = useEssentialsCartStore(s => s.view?.version ?? 0);
  const fetchCart = useEssentialsCartStore(s => s.fetchCart);
  const resolveIssues = useEssentialsCartStore(s => s.resolveIssues);

  const [paymentMethod, setPaymentMethod] = useState<EssentialsPaymentMethod>('COD');
  const [coupon, setCoupon] = useState<SheetCoupon | null>(null);
  const [coupons, setCoupons] = useState<SheetCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [summary, setSummary] = useState<EssentialsCheckoutSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuesDismissed, setIssuesDismissed] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [placing, setPlacing] = useState(false);
  const requestSeq = useRef(0);

  const addressId = selectedAddress?.addressID ?? null;
  const jwt = authData?.jwt ?? '';
  const phone = authData?.phone ?? '';

  const loadSummary = useCallback(async () => {
    if (!jwt || !addressId) return;
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const next = await essentialsCartService.getSummary(
        { customerAddressId: addressId, paymentMethod, couponId: coupon?.id ?? null },
        jwt,
        phone
      );
      // A slower earlier request (say, before a coupon change) must not overwrite a newer bill.
      if (seq !== requestSeq.current) return;
      setSummary(next);
      setIssuesDismissed(false);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError((e as { message?: string })?.message || 'Could not load your bill');
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [jwt, phone, addressId, paymentMethod, coupon?.id]);

  // Re-price whenever something that changes the bill changes, including the cart itself.
  useEffect(() => {
    loadSummary();
  }, [loadSummary, cartVersion]);

  useFocusEffect(
    useCallback(() => {
      fetchCart(jwt || undefined, phone || undefined);
    }, [fetchCart, jwt, phone])
  );

  useEffect(() => {
    if (!regionId) return;
    setCouponsLoading(true);
    // No shopId: only platform coupons, which are the only ones a multi-store order can take.
    couponService
      .getAvailableCoupons(regionId, undefined, 'GROCERY')
      .then(data => setCoupons(Array.isArray(data) ? data : []))
      .catch(() => setCoupons([]))
      .finally(() => setCouponsLoading(false));
  }, [regionId]);

  const handleResolve = useCallback(async () => {
    if (!addressId) return;
    setResolving(true);
    const result = await resolveIssues(addressId, jwt, phone);
    setResolving(false);
    if (!result.ok) {
      setError(result.message ?? 'Could not update your cart');
      setIssuesDismissed(true);
    }
    // The cart version bump re-prices the order through the effect above.
  }, [addressId, jwt, phone, resolveIssues]);

  /**
   * Places the order on the terms of the bill on screen. If the bill has changed since (a price,
   * stock, the route), the server refuses with the new one, which replaces it here for the
   * customer to review — nothing is charged that they did not see.
   */
  const handlePlaceOrder = useCallback(async () => {
    if (!summary?.summaryHash || !addressId || placing) return;
    setPlacing(true);
    const result = await essentialsOrderService.placeOrder(
      {
        customerAddressId: addressId,
        paymentMethod,
        couponId: coupon?.id ?? null,
        summaryHash: summary.summaryHash,
      },
      jwt,
      phone
    );
    setPlacing(false);
    if (result.ok) {
      const { order } = result;
      if (order.payment) {
        // Prepaid: the order is taken but nothing is sent to the stores until it is paid.
        try {
          // No method restriction: the methods enabled on the Razorpay account decide. (The
          // single-shop checkout restricts to UPI, which leaves nothing where UPI is unavailable.)
          const options = {
            description: 'QuickVerse Daily Essentials',
            currency: order.payment.currency,
            key: order.payment.keyId,
            amount: order.payment.amountPaise,
            name: 'QuickVerse',
            order_id: order.payment.razorpayOrderId,
            prefill: { email: '', contact: phone, name: authData?.username ?? '' },
          };
          const paid = await RazorpayCheckout.open(options);
          setPlacing(true);
          await essentialsOrderService.confirmPayment(
            order.orderId,
            {
              razorpayOrderId: paid.razorpay_order_id,
              razorpayPaymentId: paid.razorpay_payment_id,
              razorpaySignature: paid.razorpay_signature,
            },
            jwt,
            phone
          );
        } catch (e) {
          setPlacing(false);
          // Closed or failed: nothing was charged, the cart is untouched, and the unpaid order
          // lapses on its own. The customer can simply try again.
          showMessage(
            (e as { description?: string; message?: string })?.description ||
              'Payment was not completed. Your cart is still here.'
          );
          return;
        }
        setPlacing(false);
      }
      // The server has emptied the Essentials cart (for prepaid, once the payment was confirmed).
      fetchCart(jwt, phone);
      navigation.replace('EssentialsOrder', { orderId: order.orderId, justPlaced: true });
      return;
    }
    if (result.summary) {
      requestSeq.current += 1;
      setSummary(result.summary);
      setIssuesDismissed(false);
    }
    showMessage(result.message);
  }, [
    summary,
    addressId,
    placing,
    paymentMethod,
    coupon?.id,
    jwt,
    phone,
    authData?.username,
    fetchCart,
    navigation,
  ]);

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('EssentialsCart');
  }, [navigation]);

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
        scroll: { paddingHorizontal: CATALOGUE_GUTTER, paddingBottom: 160, gap: 12 },
        card: {
          borderRadius: 12,
          padding: 12,
          backgroundColor: getColor('white'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: getColor('border'),
        },
        cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
        cardTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: getColor('text') },
        link: { fontSize: 13, fontWeight: '700', color: getColor('primary') },
        body: { fontSize: 13, lineHeight: 18, color: getColor('text') },
        muted: { fontSize: 12, lineHeight: 17, color: getColor('subText') },
        stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
        stopBadge: {
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${getColor('primary')}1F`,
        },
        stopBadgeText: { fontSize: 11, fontWeight: '800', color: getColor('primary') },
        stopName: { flex: 1, fontSize: 13, fontWeight: '600', color: getColor('text') },
        stopAmount: { fontSize: 13, fontWeight: '700', color: getColor('text') },
        couponRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        couponText: { flex: 1 },
        couponCode: { fontSize: 14, fontWeight: '800', color: getColor('text') },
        couponError: { fontSize: 12, marginTop: 2, color: getColor('error') },
        couponApplied: { fontSize: 12, marginTop: 2, color: CATALOGUE_ACCENT },
        payRow: { flexDirection: 'row', gap: 8 },
        payOption: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: getColor('border'),
        },
        payOptionSelected: {
          borderColor: getColor('primary'),
          backgroundColor: `${getColor('primary')}14`,
        },
        payLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: getColor('text') },
        billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
        billLabel: { flex: 1, fontSize: 13, color: getColor('subText') },
        billValue: { fontSize: 13, color: getColor('text') },
        strike: { textDecorationLine: 'line-through', color: getColor('subText') },
        free: { color: CATALOGUE_ACCENT, fontWeight: '700' },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: getColor('border'),
          marginVertical: 8,
        },
        totalLabel: { fontSize: 15, fontWeight: '800', color: getColor('text') },
        totalValue: { fontSize: 15, fontWeight: '800', color: getColor('text') },
        savings: {
          marginTop: 8,
          padding: 8,
          borderRadius: 8,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: '700',
          color: CATALOGUE_ACCENT,
          backgroundColor: `${CATALOGUE_ACCENT}14`,
        },
        errorBox: { padding: 12, borderRadius: 12, backgroundColor: `${getColor('error')}14` },
        errorText: { fontSize: 13, color: getColor('error') },
        retry: { marginTop: 6, fontSize: 13, fontWeight: '700', color: getColor('primary') },
        footer: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: CATALOGUE_GUTTER,
          paddingBottom: CATALOGUE_GUTTER + 4,
          backgroundColor: getColor('white'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: getColor('border'),
          shadowColor: theme.colors.shadow.color,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: 6,
          elevation: 8,
        },
        footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        footerTotal: { flex: 1 },
        footerAmount: { fontSize: 18, fontWeight: '800', color: getColor('text') },
        placeBtn: {
          flex: 1.4,
          height: 48,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: getColor('primary'),
        },
        placeDisabled: { backgroundColor: getColor('placeholder') },
        placeText: { fontSize: 15, fontWeight: '800', color: '#fff' },
        hint: { fontSize: 11, textAlign: 'center', marginTop: 6, color: getColor('subText') },
        center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
      }),
    [getColor, theme]
  );

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={goBack} accessibilityRole="button" accessibilityLabel="Back">
        <MaterialCommunityIcons name="arrow-left" size={26} color={getColor('text')} />
      </TouchableOpacity>
      <ThemeText style={styles.headerTitle}>Checkout</ThemeText>
    </View>
  );

  if (!jwt) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {header}
        <View style={styles.center}>
          <ThemeText style={styles.body}>Log in to check out your Daily Essentials.</ThemeText>
        </View>
      </SafeAreaView>
    );
  }

  const issues = summary?.issues ?? [];
  const canPlace = !!summary?.canPlaceOrder && !!summary.summaryHash && !loading && !placing;
  const showIssues = issues.length > 0 && !issuesDismissed && !loading;
  const selectedIsDelivery = coupon?.type === 'FREE_DELIVERY';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {header}
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Delivery address */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={18}
              color={getColor('primary')}
            />
            <ThemeText style={styles.cardTitle}>
              {selectedAddress
                ? `Deliver to ${selectedAddress.tag || 'address'}`
                : 'Delivery address'}
            </ThemeText>
            <TouchableOpacity onPress={() => setShowAddresses(true)} accessibilityRole="button">
              <ThemeText style={styles.link}>{selectedAddress ? 'Change' : 'Select'}</ThemeText>
            </TouchableOpacity>
          </View>
          <ThemeText style={selectedAddress ? styles.body : styles.muted} numberOfLines={2}>
            {selectedAddress ? addressLine(selectedAddress) : 'Choose where to deliver this order.'}
          </ThemeText>
        </View>

        {/* Pickup route */}
        {summary && summary.shops.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={18}
                color={getColor('primary')}
              />
              <ThemeText style={styles.cardTitle}>
                One order from {summary.shops.length}{' '}
                {summary.shops.length === 1 ? 'store' : 'stores'}
              </ThemeText>
            </View>
            {summary.shops.map(part => (
              <View key={part.shopId} style={styles.stopRow}>
                <View style={styles.stopBadge}>
                  <ThemeText style={styles.stopBadgeText}>{part.pickupSequence}</ThemeText>
                </View>
                <ThemeText style={styles.stopName} numberOfLines={1}>
                  {part.shopName ?? 'Store'} · {part.itemCount}{' '}
                  {part.itemCount === 1 ? 'item' : 'items'}
                </ThemeText>
                <ThemeText style={styles.stopAmount}>{rupees(part.itemTotal)}</ThemeText>
              </View>
            ))}
            <ThemeText style={styles.muted}>
              Delivered together · {summary.routeDistanceKm} km route
            </ThemeText>
          </View>
        ) : null}

        {/* Coupon */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => setShowCoupons(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <View style={styles.couponRow}>
            <MaterialCommunityIcons name="tag-outline" size={20} color={getColor('primary')} />
            <View style={styles.couponText}>
              <ThemeText style={styles.couponCode}>
                {coupon ? coupon.code : 'Apply a coupon'}
              </ThemeText>
              {summary?.couponApplied ? (
                <ThemeText style={styles.couponApplied}>
                  {summary.freeDelivery
                    ? 'Free delivery applied'
                    : `You save ${rupees(summary.couponDiscount)}`}
                </ThemeText>
              ) : summary?.couponErrorMessage ? (
                <ThemeText style={styles.couponError}>{summary.couponErrorMessage}</ThemeText>
              ) : null}
            </View>
            {coupon ? (
              <TouchableOpacity onPress={() => setCoupon(null)} accessibilityRole="button">
                <ThemeText style={styles.link}>Remove</ThemeText>
              </TouchableOpacity>
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={20} color={getColor('subText')} />
            )}
          </View>
        </TouchableOpacity>

        {/* Payment */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <MaterialCommunityIcons name="wallet-outline" size={18} color={getColor('primary')} />
            <ThemeText style={styles.cardTitle}>Payment</ThemeText>
          </View>
          <View style={styles.payRow}>
            <TouchableOpacity
              style={[styles.payOption, paymentMethod === 'COD' && styles.payOptionSelected]}
              onPress={() => setPaymentMethod('COD')}
              accessibilityRole="radio"
              accessibilityState={{ selected: paymentMethod === 'COD' }}
            >
              <MaterialCommunityIcons name="cash" size={20} color={getColor('text')} />
              <ThemeText style={styles.payLabel}>Cash on delivery</ThemeText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payOption, paymentMethod === 'PREPAID' && styles.payOptionSelected]}
              onPress={() => setPaymentMethod('PREPAID')}
              accessibilityRole="radio"
              accessibilityState={{ selected: paymentMethod === 'PREPAID' }}
            >
              <MaterialCommunityIcons name="cellphone-check" size={20} color={getColor('text')} />
              <ThemeText style={styles.payLabel}>Pay online</ThemeText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bill */}
        {error ? (
          <View style={styles.errorBox}>
            <ThemeText style={styles.errorText}>{error}</ThemeText>
            <TouchableOpacity onPress={loadSummary}>
              <ThemeText style={styles.retry}>Try again</ThemeText>
            </TouchableOpacity>
          </View>
        ) : !addressId ? null : !summary ? (
          <ActivityIndicator color={getColor('primary')} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={18}
                color={getColor('primary')}
              />
              <ThemeText style={styles.cardTitle}>Bill details</ThemeText>
              {loading ? <ActivityIndicator size="small" color={getColor('primary')} /> : null}
            </View>
            <View style={styles.billRow}>
              <ThemeText style={styles.billLabel}>
                Item total · {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
              </ThemeText>
              <ThemeText style={styles.billValue}>
                {summary.mrpTotal > summary.itemTotal ? (
                  <>
                    <ThemeText style={styles.strike}>{rupees(summary.mrpTotal)}</ThemeText>{' '}
                  </>
                ) : null}
                {rupees(summary.itemTotal)}
              </ThemeText>
            </View>
            {summary.couponDiscount > 0 ? (
              <View style={styles.billRow}>
                <ThemeText style={styles.billLabel}>Coupon ({summary.couponCode})</ThemeText>
                <ThemeText style={[styles.billValue, styles.free]}>
                  −{rupees(summary.couponDiscount)}
                </ThemeText>
              </View>
            ) : null}
            <View style={styles.billRow}>
              <ThemeText style={styles.billLabel}>
                Delivery · {summary.routeDistanceKm} km, {summary.shops.length}{' '}
                {summary.shops.length === 1 ? 'store' : 'stores'}
              </ThemeText>
              {summary.freeDelivery ? (
                <ThemeText style={styles.billValue}>
                  <ThemeText style={styles.strike}>{rupees(summary.actualDeliveryFee)}</ThemeText>{' '}
                  <ThemeText style={styles.free}>FREE</ThemeText>
                </ThemeText>
              ) : (
                <ThemeText style={styles.billValue}>{rupees(summary.deliveryFee)}</ThemeText>
              )}
            </View>
            <View style={styles.billRow}>
              <ThemeText style={styles.billLabel}>Platform fee</ThemeText>
              <ThemeText style={styles.billValue}>{rupees(summary.platformFee)}</ThemeText>
            </View>
            {summary.packagingCharges > 0 ? (
              <View style={styles.billRow}>
                <ThemeText style={styles.billLabel}>Packaging</ThemeText>
                <ThemeText style={styles.billValue}>{rupees(summary.packagingCharges)}</ThemeText>
              </View>
            ) : null}
            {summary.codCharges > 0 ? (
              <View style={styles.billRow}>
                <ThemeText style={styles.billLabel}>Cash on delivery charge</ThemeText>
                <ThemeText style={styles.billValue}>{rupees(summary.codCharges)}</ThemeText>
              </View>
            ) : null}
            <View style={styles.billRow}>
              <ThemeText style={styles.billLabel}>GST ({summary.gstRate}% on fees)</ThemeText>
              <ThemeText style={styles.billValue}>{rupees(summary.totalGst)}</ThemeText>
            </View>
            <View style={styles.divider} />
            <View style={styles.billRow}>
              <ThemeText style={styles.totalLabel}>To pay</ThemeText>
              <ThemeText style={styles.totalValue}>{rupees(summary.payableAmount)}</ThemeText>
            </View>
            {summary.totalSavings > 0 ? (
              <ThemeText style={styles.savings}>
                You save {rupees(summary.totalSavings)} on this order
              </ThemeText>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <View style={styles.footerTotal}>
            <ThemeText style={styles.muted}>To pay</ThemeText>
            <ThemeText style={styles.footerAmount}>
              {summary ? rupees(summary.payableAmount) : '—'}
            </ThemeText>
          </View>
          <TouchableOpacity
            style={[styles.placeBtn, !canPlace && styles.placeDisabled]}
            onPress={handlePlaceOrder}
            disabled={!canPlace}
            accessibilityRole="button"
            accessibilityLabel="Place order"
          >
            {placing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemeText style={styles.placeText}>Place order</ThemeText>
            )}
          </TouchableOpacity>
        </View>
        <ThemeText style={styles.hint}>
          {!addressId
            ? 'Select a delivery address to see your bill.'
            : summary && !summary.canPlaceOrder
              ? 'Resolve the items flagged above to continue.'
              : paymentMethod === 'PREPAID'
                ? "One order, delivered together. If a store can't supply its part, it's refunded."
                : 'One order, delivered together. Pay in cash on delivery.'}
        </ThemeText>
      </View>

      <AddressSelectionModal
        visible={showAddresses}
        onClose={() => setShowAddresses(false)}
        onAddressSelect={(address: Address) => {
          setSelectedAddress(address);
          setShowAddresses(false);
        }}
        selectedAddress={selectedAddress}
      />
      <CouponSheet
        visible={showCoupons}
        onClose={() => setShowCoupons(false)}
        coupons={coupons}
        loading={couponsLoading}
        cartTotal={summary?.itemTotal ?? 0}
        selectedDiscountCoupon={coupon && !selectedIsDelivery ? coupon : null}
        selectedDeliveryCoupon={coupon && selectedIsDelivery ? coupon : null}
        onApplyDiscount={setCoupon}
        onApplyDelivery={setCoupon}
      />
      <EssentialsIssuesSheet
        visible={showIssues}
        issues={issues}
        resolving={resolving}
        onResolve={handleResolve}
        onBack={() => {
          setIssuesDismissed(true);
          goBack();
        }}
      />
    </SafeAreaView>
  );
};

export default EssentialsCheckoutScreen;
