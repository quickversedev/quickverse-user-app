import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedCard from '../../components/common/AnimatedCard';
import LoginPromptModal from '../../components/common/LoginPromptModal';
import {
  CartFooter,
  CartHeader,
  CartItemList,
  CouponSection,
  CouponSheet,
  DeliveryInstructions,
  DeliveryInstructionId,
  FreeDeliveryProgress,
  PaymentOptions,
  PaymentSummary,
  TipSelector,
  tipContribution,
  TotalSavingsCard,
} from '../../components/modules/Cart';
import { SheetCoupon } from '../../components/modules/Cart/CouponSheet';
import EssentialsIssuesSheet from '../../components/modules/Cart/EssentialsIssuesSheet';
import { AddressSelectionModal } from '../../components/modules/Header';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import couponService from '../../services/api/couponSevice';
import essentialsCartService, {
  EssentialsCheckoutSummary,
  EssentialsPaymentMethod,
} from '../../services/essentialsCartService';
import essentialsOrderService from '../../services/essentialsOrderService';
import useEssentialsCartStore, {
  EssentialsDisplayLine,
  useEssentialsLines,
} from '../../store/cart/essentialsCartStore';
import useConfigStore from '../../store/configStore';
import usePricingStore from '../../store/pricingStore';
import { useTheme } from '../../theme/ThemeContext';
import { Address } from '../../types/address';

/**
 * The Daily Essentials cart, as the Cart screen shows it.
 *
 * Built from the same pieces as a store cart, in the same order — items, coupons, savings,
 * instructions, tip, bill, and the footer that opens the payment sheet — so to the customer it
 * is simply their cart. The payment method is picked on the cart too, so the bill already carries
 * its COD charge. What differs is underneath: the cart lives on our server rather than at
 * SmartBiz, the bill is the server's Essentials summary, and one order is placed however many
 * kiranas supply it. Which kiranas those are is never shown: no store headers, no store counts.
 *
 * Every figure comes from the server's summary; the screen adds nothing up itself, and the order
 * is placed against that summary's hash, so what is charged is what was shown.
 */

type Nav = StackNavigationProp<RootStackParamList, 'Cart'>;

const showMessage = (message: string) => {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.LONG);
  else Alert.alert('Your cart', message);
};

const isSavedAddressId = (value?: string | null) =>
  !!value &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const metaOf = (line: EssentialsDisplayLine) => ({
  sku: line.sku,
  shopId: line.shopId,
  shopName: line.shopName,
  name: line.name ?? '',
  price: line.unitPrice,
  mrp: line.mrp,
  imageUrl: line.imageUrl,
});

const EssentialsCartView: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { getColor } = useTheme();
  const { authData, selectedAddress: appAddress } = useAuth();
  /**
   * The address this order goes to, held by the cart as the store cart holds its own. Setting the
   * app's selected address instead re-initialises the app for the new location, which unmounts the
   * navigator and drops the customer back on Home mid-checkout.
   */
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(appAddress ?? null);
  // The app's address can arrive after this screen mounts (restored from storage); adopt it then.
  useEffect(() => {
    if (appAddress) setSelectedAddress(current => current ?? appAddress);
  }, [appAddress]);
  const regionId = useConfigStore(s => s.getRegionId());
  const pricingConfigs = usePricingStore(s => s.configs);

  const lines = useEssentialsLines();
  const cartVersion = useEssentialsCartStore(s => s.view?.version ?? 0);
  const fetchCart = useEssentialsCartStore(s => s.fetchCart);
  const setQuantity = useEssentialsCartStore(s => s.setQuantity);
  const clear = useEssentialsCartStore(s => s.clear);
  const resolveIssues = useEssentialsCartStore(s => s.resolveIssues);

  const jwt = authData?.jwt ?? '';
  const phone = authData?.phone ?? '';
  // Only a saved address can be delivered to. The current-location entry (QV_Current_Location)
  // carries no UUID, and the server rejects it; with it selected, the bill waits and the footer
  // asks for an address, as on a store cart.
  const addressId = isSavedAddressId(selectedAddress?.addressID)
    ? (selectedAddress?.addressID ?? null)
    : null;

  const [paymentMethod, setPaymentMethod] = useState<EssentialsPaymentMethod>('PREPAID');
  const [coupon, setCoupon] = useState<SheetCoupon | null>(null);
  const [coupons, setCoupons] = useState<SheetCoupon[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [summary, setSummary] = useState<EssentialsCheckoutSummary | null>(null);
  /** The coupon the bill on screen was priced with; a refused coupon comes back with no id. */
  const [pricedCouponId, setPricedCouponId] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Presentational, as on the store cart: neither can be sent with an order yet (QV-17 / QV-18).
  const [tipAmount, setTipAmount] = useState(0);
  const [deliveryInstructions, setDeliveryInstructions] = useState<DeliveryInstructionId[]>([]);

  const [paymentExpanded, setPaymentExpanded] = useState(true);
  const [footerHeight, setFooterHeight] = useState(240);
  const scrollRef = useRef<ScrollView>(null);
  const [billOffsetY, setBillOffsetY] = useState(0);
  const requestSeq = useRef(0);

  useFocusEffect(
    useCallback(() => {
      fetchCart(jwt || undefined, phone || undefined);
    }, [fetchCart, jwt, phone])
  );

  /** Fetches the bill for a payment method. Only the newest request may replace the bill on screen. */
  const loadSummary = useCallback(
    async (method: EssentialsPaymentMethod): Promise<EssentialsCheckoutSummary | null> => {
      if (!jwt || !addressId) return null;
      const seq = ++requestSeq.current;
      setSummaryLoading(true);
      try {
        const next = await essentialsCartService.getSummary(
          { customerAddressId: addressId, paymentMethod: method, couponId: coupon?.id ?? null },
          jwt,
          phone
        );
        if (seq !== requestSeq.current) return next;
        setSummary(next);
        setPricedCouponId(coupon?.id ?? null);
        return next;
      } catch (e) {
        if (seq === requestSeq.current) {
          showMessage((e as { message?: string })?.message || 'Could not load your bill');
        }
        return null;
      } finally {
        if (seq === requestSeq.current) setSummaryLoading(false);
      }
    },
    [jwt, phone, addressId, coupon?.id]
  );

  // Re-price whenever anything on the bill changes, the cart included.
  useEffect(() => {
    loadSummary(paymentMethod);
  }, [loadSummary, paymentMethod, cartVersion]);

  // A coupon the server will not take is dropped, with its reason, as the store cart does.
  const loadCoupons = useCallback(() => {
    if (!regionId) return;
    setCouponsLoading(true);
    // No shopId: platform coupons only — one coupon covers the whole order.
    couponService
      .getAvailableCoupons(regionId, undefined, 'GROCERY')
      .then(data => setCoupons(Array.isArray(data) ? data : []))
      .catch(() => setCoupons([]))
      .finally(() => setCouponsLoading(false));
  }, [regionId]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    // Only for the coupon this bill was priced with; a newer pick is still being priced.
    if (summary?.couponError && coupon && pricedCouponId === coupon.id) {
      showMessage(summary.couponErrorMessage || 'This coupon cannot be applied');
      setCoupon(null);
      // The offer list may be what is out of date (a coupon since withdrawn): refresh it, so the
      // refused coupon is not offered again.
      loadCoupons();
    }
  }, [summary, coupon, pricedCouponId, loadCoupons]);

  const items = useMemo(
    () =>
      lines.map(line => ({
        sku: line.sku,
        shopId: line.shopId,
        name: line.name ?? '',
        price: line.unitPrice,
        mrp: line.mrp ?? line.unitPrice,
        image: line.imageUrl ?? '',
        quantity: line.quantity,
        veg: true,
        tag: !line.available ? 'Unavailable' : line.priceChanged ? 'New price' : undefined,
        tagTone: (!line.available ? 'error' : 'accent') as 'accent' | 'error',
      })),
    [lines]
  );

  const change = useCallback(
    async (sku: string, delta: number) => {
      const line = lines.find(l => l.sku === sku);
      if (!line) return;
      const result = await setQuantity(
        metaOf(line),
        Math.max(0, line.quantity + delta),
        jwt || undefined,
        phone || undefined
      );
      if (!result.ok && result.message) showMessage(result.message);
    },
    [lines, setQuantity, jwt, phone]
  );
  const handleInc = useCallback((sku: string) => change(sku, 1), [change]);
  const handleDec = useCallback((sku: string) => change(sku, -1), [change]);

  // Opened from a store cart's "Daily Essentials cart" card, Back returns to that store cart: both
  // are the one Cart tab, so otherwise Back would leave the tab altogether.
  const returnTo = useRoute<RouteProp<RootStackParamList, 'Cart'>>().params?.returnTo;
  const goBack = useCallback(() => {
    if (returnTo) {
      navigation.navigate('Cart', { cartId: returnTo });
      return;
    }
    const parent = navigation.getParent();
    if (parent?.canGoBack()) parent.goBack();
    else if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainApp');
  }, [navigation, returnTo]);

  // The hardware back button does the same.
  useFocusEffect(
    useCallback(() => {
      if (!returnTo) return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        goBack();
        return true;
      });
      return () => sub.remove();
    }, [returnTo, goBack])
  );

  const handleClearCart = useCallback(async () => {
    const result = await clear(jwt || undefined, phone || undefined);
    if (!result.ok && result.message) showMessage(result.message);
    else goBack();
  }, [clear, jwt, phone, goBack]);

  const handleViewBill = useCallback(() => {
    setPaymentExpanded(true);
    scrollRef.current?.scrollTo({ y: Math.max(0, billOffsetY - 12), animated: true });
  }, [billOffsetY]);

  const handleToggleInstruction = useCallback((id: DeliveryInstructionId) => {
    setDeliveryInstructions(current =>
      current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    );
  }, []);

  const localItemTotal = useMemo(
    () =>
      Math.round(lines.filter(l => l.available).reduce((sum, l) => sum + l.lineTotal, 0) * 100) /
      100,
    [lines]
  );

  const savings = useMemo(() => {
    if (summary) return summary.totalSavings;
    return lines
      .filter(l => l.available && l.mrp != null && l.mrp > l.unitPrice)
      .reduce((sum, l) => sum + ((l.mrp ?? 0) - l.unitPrice) * l.quantity, 0);
  }, [summary, lines]);

  /** Nearest free delivery on offer, as on the store cart; hidden once a coupon is applied. */
  const freeDeliveryThreshold = useMemo(() => {
    if (coupon) return undefined;
    const movs = coupons
      .filter(c => c?.type === 'FREE_DELIVERY' && typeof c?.mov === 'number' && c.mov > 0)
      .map(c => c.mov);
    return movs.length > 0 ? Math.min(...movs) : undefined;
  }, [coupon, coupons]);

  const pricing = useMemo(
    () => usePricingStore.getState().getPricingValues('GROCERY'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pricingConfigs]
  );

  /** The server's bill in the shape the shared bill card reads. */
  const bill = useMemo(
    () =>
      summary
        ? {
            itemTotalAmount: summary.itemTotal,
            couponCode: summary.couponCode,
            couponDiscount: summary.couponDiscount,
            isFreeDelivery: summary.freeDelivery,
            packagingCharges: summary.packagingCharges,
            actualDeliveryFee: summary.actualDeliveryFee,
            deliveryFee: summary.deliveryFee,
            platformFee: summary.platformFee,
            serviceGstRate: summary.gstRate,
            deliveryGst: summary.deliveryGst,
            platformGst: summary.platformGst,
            packagingGst: summary.packagingGst,
            codGst: summary.codGst,
            totalGst: summary.totalGst,
            taxableAmount: summary.taxableAmount,
            codCharges: summary.codCharges,
            payableAmount: summary.payableAmount,
          }
        : null,
    [summary]
  );

  const total = (summary ? summary.payableAmount : localItemTotal) + tipContribution(tipAmount);
  const selectedIsDelivery = coupon?.type === 'FREE_DELIVERY';

  const formattedAddress = useMemo(() => {
    if (!selectedAddress) return 'Select delivery address';
    const { name, addressLine1, city, state } = selectedAddress;
    return [name, addressLine1, city, state].filter(Boolean).join(', ');
  }, [selectedAddress]);

  /**
   * Places the order on the terms of `current`. If the bill has moved since, the server refuses
   * with the new one, which replaces it here to review — nothing is charged that was not shown.
   */
  const placeOrder = useCallback(
    async (current: EssentialsCheckoutSummary, method: EssentialsPaymentMethod) => {
      if (!current.summaryHash || !addressId) return;
      setPlacing(true);
      const result = await essentialsOrderService.placeOrder(
        {
          customerAddressId: addressId,
          paymentMethod: method,
          couponId: coupon?.id ?? null,
          summaryHash: current.summaryHash,
        },
        jwt,
        phone
      );
      if (!result.ok) {
        setPlacing(false);
        if (result.summary) {
          requestSeq.current += 1;
          setSummary(result.summary);
          setPricedCouponId(coupon?.id ?? null);
          if (result.summary.issues.length > 0) setShowIssues(true);
        }
        showMessage(result.message);
        return;
      }
      const { order } = result;
      if (order.payment) {
        // Prepaid: nothing goes to the stores until the payment is confirmed.
        setPlacing(false);
        const options = {
          description: 'QuickVerse Order Payment',
          currency: order.payment.currency,
          // The key the server charges with, not one baked into the app.
          key: order.payment.keyId,
          amount: order.payment.amountPaise,
          name: 'QuickVerse',
          order_id: order.payment.razorpayOrderId,
          prefill: { email: '', contact: phone, name: authData?.username ?? '' },
        };
        let paid: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };
        try {
          paid = await RazorpayCheckout.open(options);
        } catch (e) {
          setPlacing(false);
          // Closed or failed: nothing was charged and the cart is untouched. The unpaid order is
          // withdrawn now rather than left to lapse, so it does not linger beside the one the
          // customer places next. A payment that still lands on it is refunded by the server.
          essentialsOrderService.cancelOrder(order.orderId, jwt, phone).catch(() => {});
          showMessage(
            (e as { description?: string; message?: string })?.description ||
              'Payment was not completed. Your cart is still here.'
          );
          return;
        }
        setPlacing(true);
        try {
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
        } catch {
          // The payment went through; only telling the server failed. Razorpay's webhook
          // confirms it too, so the order is shown rather than the payment reported as failed.
          showMessage('Payment received. Confirming your order…');
        }
      }
      setPlacing(false);
      // The server has emptied the cart (for prepaid, once the payment was confirmed).
      fetchCart(jwt, phone);
      navigation.navigate('EssentialsOrder', { orderId: order.orderId, justPlaced: true });
    },
    [addressId, coupon?.id, jwt, phone, authData?.username, fetchCart, navigation]
  );

  const submittingRef = useRef(false);
  const handleCheckout = useCallback(() => {
    if (!jwt) {
      setShowLoginPrompt(true);
      return;
    }
    if (!addressId) {
      setShowAddressModal(true);
      return;
    }
    if (!summary) {
      loadSummary(paymentMethod);
      return;
    }
    if (summary.issues.length > 0 || !summary.canPlaceOrder) {
      setShowIssues(true);
      return;
    }
    // The bill must be the one priced for the method on screen; a switch is still re-pricing.
    if (summaryLoading || summary.paymentMethod !== paymentMethod) return;
    // One order at a time: a second tap lands before `placing` has re-rendered the screen.
    if (submittingRef.current) return;
    submittingRef.current = true;
    placeOrder(summary, paymentMethod).finally(() => {
      submittingRef.current = false;
    });
  }, [jwt, addressId, summary, summaryLoading, loadSummary, paymentMethod, placeOrder]);

  const handleResolve = useCallback(async () => {
    if (!addressId) return;
    setResolving(true);
    const result = await resolveIssues(addressId, jwt, phone);
    setResolving(false);
    setShowIssues(false);
    if (!result.ok && result.message) showMessage(result.message);
    // The cart's version bump re-prices it through the effect above.
  }, [addressId, jwt, phone, resolveIssues]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: getColor('background') },
        placing: {
          flex: 1,
          backgroundColor: getColor('background'),
          justifyContent: 'center',
          alignItems: 'center',
        },
        placingText: { marginTop: 16, color: getColor('text'), fontSize: 16, fontWeight: '500' },
        empty: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          paddingBottom: 100,
        },
        emptyTitle: { fontSize: 20, fontWeight: '700', color: getColor('text'), marginTop: 20 },
        emptyText: {
          fontSize: 16,
          color: getColor('subText'),
          textAlign: 'center',
          marginTop: 10,
        },
        startShoppingText: { color: '#fff', fontWeight: '700' },
        startShoppingBtn: {
          marginTop: 24,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: getColor('primary'),
        },
      }),
    [getColor]
  );

  if (placing) {
    return (
      <View style={styles.placing}>
        <ActivityIndicator size="large" color={getColor('primary')} />
        <Text style={styles.placingText}>Placing your order, hold on...</Text>
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <MaterialCommunityIcons name="cart-off" size={80} color={getColor('subText')} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Looks like you haven&apos;t added anything to your cart yet.
          </Text>
          <TouchableOpacity
            style={styles.startShoppingBtn}
            onPress={() => navigation.navigate('MainApp', { screen: 'Home' } as never)}
          >
            <Text style={styles.startShoppingText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const showBill = !!jwt && !!addressId;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <CartHeader
        onBack={goBack}
        onClearCart={handleClearCart}
        // Units that can be ordered, as the bill and the tab badge count them.
        itemCount={lines.filter(l => l.available).reduce((sum, l) => sum + l.quantity, 0)}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: footerHeight + 24 }}>
        <AnimatedCard delay={0}>
          <FreeDeliveryProgress
            cartAmount={summary?.itemTotal ?? localItemTotal}
            threshold={freeDeliveryThreshold}
          />
        </AnimatedCard>

        <AnimatedCard delay={50}>
          <CartItemList
            items={items}
            onInc={handleInc}
            onDec={handleDec}
            navigation={navigation}
            storeless
            onAddMore={() =>
              // Category lives in the Home tab's stack; from the Cart tab it is only reachable
              // through that tab, and navigating to it by name alone is not handled.
              navigation.navigate('MainApp', {
                screen: 'Home',
                params: { screen: 'Category', params: { categoryName: 'Grocery' } },
              } as never)
            }
          />
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <CouponSection
            couponLoading={couponsLoading}
            availableCoupons={coupons}
            appliedDiscount={summary?.couponDiscount ?? 0}
            appliedDeliverySaving={summary?.freeDelivery ? summary.actualDeliveryFee : 0}
            onCouponNavigation={() => setShowCouponSheet(true)}
            selectedDiscountCoupon={coupon && !selectedIsDelivery ? coupon : null}
            selectedDeliveryCoupon={coupon && selectedIsDelivery ? coupon : null}
            onRemoveDiscountCoupon={() => setCoupon(null)}
            onRemoveDeliveryCoupon={() => setCoupon(null)}
            // One coupon per order: applying another replaces it.
            onApplyCoupon={setCoupon}
            cartTotal={summary?.itemTotal ?? localItemTotal}
          />
        </AnimatedCard>

        {savings > 0 && (
          <AnimatedCard delay={150}>
            <TotalSavingsCard savings={savings} />
          </AnimatedCard>
        )}

        <AnimatedCard delay={175}>
          <PaymentOptions
            selectedOption={paymentMethod}
            onSelect={setPaymentMethod}
            codCharges={summary?.paymentMethod === 'COD' ? summary.codCharges : undefined}
          />
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <DeliveryInstructions
            selected={deliveryInstructions}
            onToggle={handleToggleInstruction}
          />
        </AnimatedCard>

        <AnimatedCard delay={250}>
          <TipSelector tip={tipAmount} onChange={setTipAmount} />
        </AnimatedCard>

        {showBill ? (
          <View onLayout={e => setBillOffsetY(e.nativeEvent.layout.y)}>
            <AnimatedCard delay={300}>
              <PaymentSummary
                tipAmount={tipAmount}
                savings={savings}
                expanded={paymentExpanded}
                onToggle={() => setPaymentExpanded(e => !e)}
                summary={bill}
                summaryLoading={summaryLoading}
                selectedPaymentOption={summary?.paymentMethod ?? paymentMethod}
                platformFeeOriginal={pricing.platformFeeOriginal}
                packagingChargesOriginal={pricing.packagingChargesOriginal}
              />
            </AnimatedCard>
          </View>
        ) : null}
      </ScrollView>

      <CartFooter
        total={total}
        savings={savings}
        onViewBill={handleViewBill}
        onHeightChange={setFooterHeight}
        addressId={addressId ?? ''}
        address={formattedAddress}
        addressTag={selectedAddress?.tag || selectedAddress?.name || ''}
        onSelectAddress={() => setShowAddressModal(true)}
        onCheckout={handleCheckout}
        disabled={placing || resolving || summaryLoading}
        loading={placing}
        isGuest={!jwt}
        paymentMethod={paymentMethod}
      />

      <AddressSelectionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={(address: Address) => {
          setSelectedAddress(address);
          setShowAddressModal(false);
        }}
        selectedAddress={selectedAddress}
        savedOnly
      />

      <CouponSheet
        visible={showCouponSheet}
        onClose={() => setShowCouponSheet(false)}
        coupons={coupons}
        loading={couponsLoading}
        cartTotal={summary?.itemTotal ?? localItemTotal}
        selectedDiscountCoupon={coupon && !selectedIsDelivery ? coupon : null}
        selectedDeliveryCoupon={coupon && selectedIsDelivery ? coupon : null}
        onApplyDiscount={setCoupon}
        onApplyDelivery={setCoupon}
      />

      <EssentialsIssuesSheet
        visible={showIssues && !summaryLoading}
        issues={summary?.issues ?? []}
        resolving={resolving}
        onResolve={handleResolve}
        onBack={() => setShowIssues(false)}
        onChangeAddress={() => {
          setShowIssues(false);
          setShowAddressModal(true);
        }}
        wouldEmptyCart={(summary?.itemCount ?? 0) === 0}
      />

      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Login to Place Order"
        message="Please login to continue with payment and place your order."
      />
    </SafeAreaView>
  );
};

export default EssentialsCartView;
