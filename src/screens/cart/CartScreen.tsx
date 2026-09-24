import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedCard from '../../components/common/AnimatedCard';
import LoginPromptModal from '../../components/common/LoginPromptModal';
import EssentialsOrderCard from '../../components/common/order/EssentialsOrderCard';
import {
  CartFooter,
  CartHeader,
  CartItemList,
  CouponSection,
  CouponSheet,
  DeliveryInstructions,
  DeliveryInstructionId,
  EssentialsCartCard,
  FreeDeliveryProgress,
  PaymentOptions,
  PaymentSummary,
  TipSelector,
  tipContribution,
  TotalSavingsCard,
} from '../../components/modules/Cart';
import {
  AddressSelectionModal,
  SmartBizAddressSelectionModal,
} from '../../components/modules/Header';
import { useAuth } from '../../contexts/login/AuthProvider';
import { foldOrders, useEssentialsOrders } from '../../hooks/useEssentialsOrders';
import { useOrders } from '../../hooks/useOrders';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { ApiError } from '../../config/api/axios.types';
import { RootStackParamList } from '../../routes/AppStack';
import couponService from '../../services/api/couponSevice';
import cartApiService from '../../services/cartApiService';
import orderService, { CreateOrderRequest } from '../../services/createOrderService';
import hyperlocalOrderService, { HyperlocalShopOrder } from '../../services/hyperlocalOrderService';
import { getCODCharges } from '../../services/paymentService';
import { smartBizAddressService } from '../../store/address/smartBizAddressStore';
import useCartStore, { Cart } from '../../store/cart/cartStore';
import useEssentialsCartStore, {
  ESSENTIALS_CART_ID,
  useEssentialsLines,
  useEssentialsSummary,
} from '../../store/cart/essentialsCartStore';
import { useEssentialsShopIds } from '../../store/grocery/groceryGroupsStore';
import useConfigStore from '../../store/configStore';
import usePricingStore from '../../store/pricingStore';
import useFeaturedProductsStore from '../../store/products/featuredProductsStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Address } from '../../types/address';
import { Order } from '../../types/order';
import { Product } from '../../types/product';
import { Vendor } from '../../types/vendor';
import { formatDistanceKm, getDistanceInKm } from '../../utils/distance';
import { formatTimeToAMPM, isStoreOpen } from '../../utils/storeUtils';
import EssentialsCartView from './EssentialsCartView';

type CartScreenRouteProp = RouteProp<RootStackParamList, 'Cart'>;
type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

/**
 * Carts are keyed `vendor_<shopId>`; this is the one place that knowledge is turned back
 * into a shop id for the grouped flow.
 */
const shopIdOf = (c: Cart): string => c.cartId.replace('vendor_', '');

/**
 * One place to flip between live and test, because both the single-shop and the grouped
 * checkout open Razorpay. Swap for 'rzp_test_T2Z6i6Go29OJwg' when testing — and switch
 * `razorpay.key.id` on the server to match, or the order it creates will not be one this
 * key can pay.
 */
const RAZORPAY_KEY_ID = 'rzp_live_TAGtNIHlg9alA6';

/** A store's own cart: one SmartBiz cart, one shop. */
const StoreCartScreen: React.FC = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const route = useRoute<CartScreenRouteProp>();
  const { cartId } = route.params || {};
  const { getRegionId } = useConfigStore(state => state);

  const {
    carts,
    activeCartId,
    increment,
    decrement,
    clearCart,
    refreshCart,
    addToCart,
    setActiveCart,
  } = useCartStore();
  const { vendors } = useVendorStore();

  const { selectedAddress, setSelectedAddress, permissionDataInAuth, authData } = useAuth();

  const [showAddressModal, setShowAddressModal] = React.useState(false);
  const [showSmartBizAddressModal, setShowSmartBizAddressModal] = React.useState(false);
  const [selectedSmartBizAddress, setSelectedSmartBizAddress] = React.useState<Address | null>(
    selectedAddress || null
  );
  // The design shows the bill open rather than behind a disclosure.
  const [paymentExpanded, setPaymentExpanded] = React.useState(true);

  /**
   * Tip and delivery instructions are presentational. Neither has anywhere to go:
   * `CreateOrderRequest` carries no field for either, so they are held here, rendered,
   * and dropped when the order is placed. See QV-17 / QV-18.
   */
  const [tipAmount, setTipAmount] = React.useState(0);
  /**
   * Measured height of the floating footer. The scroll pads by this rather than a
   * constant: the bar grows with the address line, the savings line and the tab bar,
   * and the old fixed 240 left the bill card's last rows stuck behind it.
   */
  const [footerHeight, setFooterHeight] = React.useState(240);
  const [showCouponSheet, setShowCouponSheet] = React.useState(false);
  /**
   * Lets "View Bill" in the footer jump to the bill card. Without it that control
   * only set `paymentExpanded`, which is already true — it looked live and did
   * nothing on a page long enough that the bill is usually off-screen.
   */
  const scrollRef = React.useRef<ScrollView>(null);
  const [billOffsetY, setBillOffsetY] = React.useState(0);

  const handleViewBill = useCallback(() => {
    setPaymentExpanded(true);
    scrollRef.current?.scrollTo({ y: Math.max(0, billOffsetY - 12), animated: true });
  }, [billOffsetY]);
  const [deliveryInstructions, setDeliveryInstructions] = React.useState<DeliveryInstructionId[]>(
    []
  );

  const handleToggleInstruction = useCallback((id: DeliveryInstructionId) => {
    setDeliveryInstructions(current =>
      current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    );
  }, []);
  const [selectedPaymentOption, setSelectedPaymentOption] = React.useState<string | undefined>(
    'PREPAID'
  );
  const [isOrderLoading, setIsOrderLoading] = React.useState(false);
  const [showDistanceModal, setShowDistanceModal] = React.useState(false);
  const [storeClosedModal, setStoreClosedModal] = React.useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: '' });
  const [showLoginPromptModal, setShowLoginPromptModal] = React.useState(false);
  const [availableCoupons, setAvailableCoupons] = React.useState<any[]>([]);
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [selectedDiscountCoupon, setSelectedDiscountCoupon] = React.useState<any | null>(null);
  const [selectedDeliveryCoupon, setSelectedDeliveryCoupon] = React.useState<any | null>(null);
  const discountCouponCallbackRef = React.useRef<((coupon: any) => void) | null>(null);
  const deliveryCouponCallbackRef = React.useRef<((coupon: any) => void) | null>(null);

  const [checkoutSummary, setCheckoutSummary] = React.useState<any>(null);
  const [checkoutSummaryLoading, setCheckoutSummaryLoading] = React.useState(false);
  const [couponErrorVisible, setCouponErrorVisible] = React.useState(false);
  const [deliveryCouponErrorVisible, setDeliveryCouponErrorVisible] = React.useState(false);

  const { getColor } = useTheme();
  const { orders, loading: ordersLoading, loadMoreOrders, hasMoreOrders } = useOrders();
  const getVendorById = useVendorStore(state => state.getVendorById);
  const pricingConfigs = usePricingStore(state => state.configs);

  const computePreviousOrderTotal = useCallback(
    (order: Order): number => {
      const subTotal = (order.items || []).reduce(
        (sum, it) => sum + Number(it.totalPrice ?? it.price ?? 0),
        0
      );
      if (subTotal <= 0) return Number(order.totalAmount || 0);

      const vendor = getVendorById(order.shopId);
      const isGrocery = vendor?.category?.toLowerCase().includes('grocery');
      const serviceType = isGrocery ? 'GROCERY' : 'FOOD';
      const pricing = usePricingStore.getState().getPricingValues(serviceType);

      const taxableAmount = pricing.deliveryFee + pricing.platformFee;
      const taxes = Math.round(pricing.gstRate * taxableAmount);
      return (
        subTotal + pricing.deliveryFee + pricing.platformFee + pricing.packagingCharges + taxes
      );
    },
    [getVendorById, pricingConfigs]
  );

  const { getFeaturedProducts } = useFeaturedProductsStore();
  const [featuredProducts, setFeaturedProducts] = React.useState<Product[]>([]);

  const deliveryRadiusKmRaw = useConfigStore(state => state.getDeliveryDistance());
  const deliveryRadiusKm = useMemo(() => {
    if (deliveryRadiusKmRaw == null) return null;
    return deliveryRadiusKmRaw > 100 ? deliveryRadiusKmRaw / 1000 : deliveryRadiusKmRaw;
  }, [deliveryRadiusKmRaw]);

  const cart = useMemo(() => {
    if (cartId && carts[cartId]) return carts[cartId];
    if (activeCartId && carts[activeCartId]) return carts[activeCartId];
    const allCartIds = Object.keys(carts);
    if (allCartIds.length > 0) return carts[allCartIds[0]];
    return undefined;
  }, [cartId, activeCartId, carts]);

  /**
   * Daily Essentials checkout: several kiranas, one payment.
   *
   * A cart is a daily-needs cart when its shop supplies the curated groups — see
   * `useEssentialsShopIds`. That is answered by the shop rather than by which screen
   * filled the cart, because carts are keyed `vendor_<shopId>` everywhere and shop 94728
   * is reachable both through Daily Essentials and by browsing the store directly.
   */
  const essentialsShopIds = useEssentialsShopIds();

  /**
   * With the server's Essentials cart on, Daily Essentials items no longer land in these
   * per-shop carts at all — they have their own cart and checkout. A kirana cart here then
   * holds only what was added from that store's own page, and must check out on its own,
   * so the shop-based grouping below is switched off.
   */
  const essentialsCartEnabled = useEssentialsCartStore(s => s.enabled === true);
  const { essentialsOrders, kiranaOrderIds } = useEssentialsOrders();
  const previousOrders = useMemo(
    () => foldOrders(orders, essentialsOrders, kiranaOrderIds, hasMoreOrders),
    [orders, essentialsOrders, kiranaOrderIds, hasMoreOrders]
  );
  const essentialsSummary = useEssentialsSummary();

  const openCarts = useMemo(() => Object.values(carts), [carts]);

  const groupableCarts = useMemo(
    () => openCarts.filter(c => essentialsShopIds.has(shopIdOf(c))),
    [openCarts, essentialsShopIds]
  );

  /**
   * Grouped only when *every* open cart is a daily-needs shop.
   *
   * A mixed basket — a restaurant order plus two kiranas — stays on the existing
   * one-cart-at-a-time flow rather than quietly checking out a subset of what the
   * customer can see. Food is not part of this feature, and combining a restaurant with
   * a kirana is not a delivery we can make. Also false when the groups have not loaded,
   * so a cold cache degrades to today's behaviour instead of failing.
   */
  const isGroupedCheckout = useMemo(
    () =>
      !essentialsCartEnabled &&
      groupableCarts.length > 0 &&
      groupableCarts.length === openCarts.length,
    [essentialsCartEnabled, groupableCarts.length, openCarts.length]
  );

  /**
   * Threshold the free-delivery bar counts toward.
   *
   * `freeDeliveryAboveAmount` comes back on the cart and is preferred, but it is a
   * SmartBiz field our own backend never populates — on live Beed carts it is absent,
   * which would have left the bar permanently invisible. The threshold customers
   * actually face is the minimum order on the shop's free-delivery coupon, which is
   * already loaded here and is what CouponsScreen counts against too. Cheapest one
   * wins, since that is the first free delivery reachable.
   *
   * Undefined once a delivery coupon is applied: the bar exists to chase a free
   * delivery, not to nag about one already won.
   */
  const freeDeliveryThreshold = useMemo(() => {
    if (selectedDeliveryCoupon) return undefined;
    if (cart?.freeDeliveryAboveAmount && cart.freeDeliveryAboveAmount > 0) {
      return cart.freeDeliveryAboveAmount;
    }
    const movs = availableCoupons
      .filter(c => c?.type === 'FREE_DELIVERY' && typeof c?.mov === 'number' && c.mov > 0)
      .map(c => c.mov as number);
    return movs.length > 0 ? Math.min(...movs) : undefined;
  }, [selectedDeliveryCoupon, cart?.freeDeliveryAboveAmount, availableCoupons]);

  const cartItems = useMemo(() => {
    // A grouped checkout pays for every daily-needs cart, so the list has to show every
    // one of them. Showing only the cart in focus would charge for items the customer
    // never saw on this screen.
    if (isGroupedCheckout) {
      return groupableCarts.flatMap(c => Object.values(c.products));
    }
    return cart ? Object.values(cart.products) : [];
  }, [cart, isGroupedCheckout, groupableCarts]);

  const cartItemsKey = useMemo(() => {
    return cartItems.map((item: any) => `${item.sku}:${item.quantity}`).join('|');
  }, [cartItems]);

  const vendor = useMemo(() => {
    if (!cart?.cartId) return undefined;
    const shopId = cart.cartId.replace('vendor_', '');
    const found = vendors.find(v => v.shopId === shopId);
    if (found) return found;
    if (Object.keys(cart.products).length === 0) return undefined;
    const firstProduct = Object.values(cart.products)[0];
    return {
      shopId,
      name: firstProduct?.name ? 'Collections' : 'Store',
      logo: '',
      banner: '',
      owner: '',
      phone: '',
      openingTime: '00:00',
      closingTime: '23:59',
      preparationTime: '30',
      description: '',
      category: 'Grocery',
      storeEnabled: true,
      storeActive: true,
    } as Vendor;
  }, [vendors, cart?.cartId, cart?.products]);

  const currentPricing = useMemo(() => {
    const isGrocery = vendor?.category?.toLowerCase().includes('grocery');
    const serviceType = isGrocery ? 'GROCERY' : 'FOOD';
    return usePricingStore.getState().getPricingValues(serviceType);
  }, [vendor, pricingConfigs]);

  const {
    paymentMethods,
    availableOptions,
    loading: paymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethods({
    cartId: cart?.smartBizCartId,
    shopId: vendor?.shopId,
    sessionKey: authData?.jwt,
    phone: authData?.phone,
  });

  const codCharges = useMemo(() => {
    return getCODCharges(paymentMethods);
  }, [paymentMethods]);

  const vendorLatLon = useMemo(() => {
    if (!vendor) return null;
    if (vendor.location?.coordinates && vendor.location.coordinates.length === 2) {
      const [lon, lat] = vendor.location.coordinates;
      if (typeof lat === 'number' && typeof lon === 'number') return { lat, lon };
    }
    if (
      vendor.coordinates &&
      typeof vendor.coordinates.latitude === 'number' &&
      typeof vendor.coordinates.longitude === 'number'
    ) {
      return { lat: vendor.coordinates.latitude, lon: vendor.coordinates.longitude };
    }
    return null;
  }, [vendor]);

  const customerLatLon = useMemo(() => {
    if (!selectedSmartBizAddress) return null;
    const lat = selectedSmartBizAddress.coordinates.latitude;
    const lon = selectedSmartBizAddress.coordinates.longitude;
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
    return null;
  }, [selectedSmartBizAddress]);

  const distanceKm = useMemo(() => {
    if (!vendorLatLon || !customerLatLon) return null;
    const km = getDistanceInKm(
      vendorLatLon.lat,
      vendorLatLon.lon,
      customerLatLon.lat,
      customerLatLon.lon
    );
    return Number.isFinite(km) ? km : null;
  }, [vendorLatLon, customerLatLon]);

  const distanceText = useMemo(() => {
    if (distanceKm == null) return '';
    return `${formatDistanceKm(distanceKm)} away`;
  }, [distanceKm]);

  const handleClearCart = useCallback(() => {
    if (cart) {
      clearCart(cart.cartId, authData?.jwt || '', authData?.phone || '');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainApp');
      }
    }
  }, [cart, authData?.jwt, authData?.phone, clearCart, navigation]);

  /**
   * Which cart holds this sku. In a grouped basket the list spans several kiranas, so
   * the displayed cart is not necessarily the one a given row belongs to — stepping a
   * row from another shop would otherwise edit the wrong cart, or silently do nothing.
   */
  const cartIdForSku = useCallback(
    (sku: string) => groupableCarts.find(c => c.products[sku])?.cartId ?? cart?.cartId,
    [groupableCarts, cart?.cartId]
  );

  const handleInc = useCallback(
    (sku: string) => {
      const targetCartId = isGroupedCheckout ? cartIdForSku(sku) : cart?.cartId;
      if (targetCartId) {
        increment(targetCartId, sku, authData?.jwt || '', authData?.phone || '');
      }
    },
    [cart?.cartId, isGroupedCheckout, cartIdForSku, authData?.jwt, authData?.phone, increment]
  );

  const handleDec = useCallback(
    (sku: string) => {
      const targetCartId = isGroupedCheckout ? cartIdForSku(sku) : cart?.cartId;
      if (targetCartId) {
        decrement(targetCartId, sku, authData?.jwt || '', authData?.phone || '');
      }
    },
    [cart?.cartId, isGroupedCheckout, cartIdForSku, authData?.jwt, authData?.phone, decrement]
  );

  const convertToProduct = useCallback(
    (item: { id: string; name: string; price: number; image: number }, index: number): Product => {
      if (index === -1) throw new Error('Invalid suggested item');
      const shopId = cart?.cartId ? cart.cartId.replace('vendor_', '') : '';
      return {
        sku: item.id,
        shopId,
        name: item.name,
        mrp: item.price + 10,
        sellingPrice: item.price,
        imageUrl: item.image.toString(),
        veg: true,
        rating: 4.5,
        discount: 0,
        category: 'suggested',
        division: 'suggested',
        subDivision: 'suggested',
        brand: 'suggested',
        numberOfVariants: 1,
        currentStock: 10,
        inStock: true,
        primarySKU: item.id,
        tags: [],
      };
    },
    [cart]
  );

  /**
   * Opens the coupon picker in place. This used to push CouponsScreen, which took the
   * customer away from the bill the coupon changes; the sheet keeps both on screen.
   */
  const handleCouponNavigation = useCallback(() => {
    setShowCouponSheet(true);
  }, []);

  /** Cart subtotal a coupon's minimum order is tested against. */
  const couponCartTotal = useMemo(() => {
    const apiSubtotal = cart?.totalCartAmount ?? 0;
    if (apiSubtotal > 0) return apiSubtotal;
    return cartItems.reduce(
      (sum: number, product: any) => sum + product.price * product.quantity,
      0
    );
  }, [cart?.totalCartAmount, cartItems]);

  const handleCalculateCheckoutSummary = useCallback(async () => {
    if (!cartItems || cartItems.length === 0) {
      setCheckoutSummary(null);
      return;
    }
    setCheckoutSummaryLoading(true);
    try {
      const payload = {
        shopId: cartItems?.[0]?.shopId ?? null,
        customerAddressId: selectedSmartBizAddress?.addressID ?? null,
        couponId: selectedDiscountCoupon?.id ?? null,
        couponCode: selectedDiscountCoupon?.code ?? null,
        deliveryCouponId: selectedDeliveryCoupon?.id ?? null,
        paymentMethod: selectedPaymentOption?.toUpperCase() ?? 'PREPAID',
        customerCoordinates: {
          latitude: selectedSmartBizAddress?.coordinates?.latitude ?? null,
          longitude: selectedSmartBizAddress?.coordinates?.longitude ?? null,
        },
        cartItems:
          cartItems?.map((item: any) => ({
            sku: item?.sku ?? null,
            quantity: item?.quantity ?? null,
          })) ?? [],
      };
      const result: any = await cartApiService.calculateCheckoutSummary(payload);
      const summaryData = result?.response?.data;
      setCheckoutSummary(summaryData);
      if (summaryData?.couponError) {
        setCouponErrorVisible(true);
      }
      if (summaryData?.deliveryCouponError) {
        setDeliveryCouponErrorVisible(true);
      }
    } catch (_error) {
      setCheckoutSummary(null);
    } finally {
      setCheckoutSummaryLoading(false);
    }
  }, [
    cartItemsKey,
    selectedSmartBizAddress?.addressID,
    selectedDiscountCoupon?.id,
    selectedDiscountCoupon?.code,
    selectedDeliveryCoupon?.id,
    selectedPaymentOption,
  ]);

  useEffect(() => {
    handleCalculateCheckoutSummary();
  }, [handleCalculateCheckoutSummary]);

  const totalSavingsAmount = useMemo(() => {
    if (checkoutSummary?.totalSavings !== undefined && checkoutSummary?.totalSavings !== null) {
      return Number(checkoutSummary.totalSavings);
    }
    const couponDiscount = Number(checkoutSummary?.couponDiscount ?? 0);
    const actualFee = Number(checkoutSummary?.actualDeliveryFee ?? 0);
    const fee = Number(checkoutSummary?.deliveryFee ?? 0);
    const freeDeliverySavings = checkoutSummary?.isFreeDelivery
      ? actualFee
      : Math.max(0, actualFee - fee);

    let itemSavings = 0;
    if (cartItems && Array.isArray(cartItems)) {
      cartItems.forEach((item: any) => {
        const mrp = Number(item?.mrp || item?.originalPrice || item?.skuDetails?.mrp || 0);
        const price = Number(item?.price || item?.skuDetails?.price || 0);
        if (mrp > price) {
          itemSavings += (mrp - price) * Number(item.quantity || 1);
        }
      });
    }

    return couponDiscount + freeDeliverySavings + itemSavings;
  }, [checkoutSummary, cartItems]);

  interface OrderResponse {
    payment_session_id: string;
    id: string;
    order_id: string;
    orderId: string;
    totalOrderAmount: number;
  }

  interface VendorRef {
    shopId: any;
  }

  const handleRazorpayPayment = async (
    orderResponse: OrderResponse,
    calculatedTotal: number,
    vendor: VendorRef
  ) => {
    try {
      const options = {
        description: 'QuickVerse Order Payment',
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        amount: calculatedTotal * 100,
        name: 'QuickVerse',
        order_id: orderResponse?.id,
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
          emi: false,
          paylater: false,
        },
        prefill: {
          email: '',
          contact: authData?.phone,
          name: authData?.username,
        },
      };

      const response = await RazorpayCheckout.open(options);
      console.log('Razorpay Payment Success : ', response);

      setIsOrderLoading(true);

      try {
        const orderStatusResponse: any = await orderService.getOrderStatus(
          orderResponse.id,
          authData?.jwt || ''
        );

        if (orderStatusResponse.orderId && orderStatusResponse.paymentStatus === 'PAID') {
          if (cart && authData?.jwt && authData?.phone) {
            await clearCart(cart.cartId, authData.jwt, authData.phone);
          }
          navigation.navigate('OrderSuccess', {
            orderId: orderStatusResponse.orderId,
            amount: calculatedTotal,
            date: new Date().toLocaleDateString(),
            shopId: vendor.shopId,
          });
        }
      } catch (err) {
        console.log('Error verifying Razorpay payment:', err);
      } finally {
        setIsOrderLoading(false);
      }
    } catch (error) {
      console.log('Razorpay Payment Failed : ', error);
    }
  };

  /**
   * Places the order for an explicitly chosen payment method.
   *
   * The method is a parameter rather than read from state because the payment step
   * calls this immediately after selecting it, and a state update would not have
   * landed in this closure yet. It also reaches the server on the request, which
   * recomputes the summary, so the charged amount never depends on the client copy.
   */
  /**
   * Daily Essentials checkout — every open kirana cart, one payment.
   *
   * Runs instead of `placeOrder` when `isGroupedCheckout`. The shape differs from the
   * single-shop flow in three ways worth knowing: the server prices each shop itself and
   * rejects a stale cart with PRICE_MISMATCH; a PREPAID order has no sub-order ids until
   * the payment webhook has run, so we poll for them; and a group can come back partly
   * placed, which is a success for some shops and a failure for others.
   */
  const placeGroupedOrder = useCallback(
    async (paymentMethod: string) => {
      if (!selectedAddress || !authData?.jwt || !authData?.phone || groupableCarts.length === 0) {
        navigation.navigate('OrderFailure', {
          errorMessage: 'Missing required information. Please try again.',
        });
        return;
      }

      setIsOrderLoading(true);
      const method = paymentMethod.toUpperCase() === 'COD' ? 'COD' : 'PREPAID';

      try {
        const shopOrders: HyperlocalShopOrder[] = groupableCarts.map(c => {
          const shopId = shopIdOf(c);
          // Coupons are selected against the cart on screen, so they belong to that
          // shop alone. The others go without rather than having someone else's offer
          // applied to them.
          const isDisplayedCart = cart?.cartId === c.cartId;
          return {
            shopId,
            cartId: c.smartBizCartId,
            shopOrderAmount: c.totalCartAmount ?? 0,
            cartItems: Object.values(c.products).map(p => ({
              sku: p.sku,
              quantity: p.quantity,
            })),
            couponId: isDisplayedCart ? (selectedDiscountCoupon?.id ?? null) : null,
            couponCode: isDisplayedCart ? (selectedDiscountCoupon?.code ?? null) : null,
            deliveryCouponId: isDisplayedCart ? (selectedDeliveryCoupon?.id ?? null) : null,
          };
        });

        const response = await hyperlocalOrderService.placeOrder(
          {
            customerAddressId: selectedSmartBizAddress?.addressID || '',
            paymentMethod: method,
            notificationMobileNumber: authData.phone || selectedAddress.phone,
            notificationEmail: null,
            customerName: selectedAddress.name || 'Customer',
            orderSource: 'CONSTELLATION',
            fulfillmentOption: 'DELIVERY',
            customerCoordinates: {
              latitude: selectedSmartBizAddress?.coordinates?.latitude ?? null,
              longitude: selectedSmartBizAddress?.coordinates?.longitude ?? null,
            },
            shopOrders,
          },
          authData.jwt,
          authData.phone
        );

        let group = response;
        if (method === 'PREPAID') {
          const razorpayOrderId = response.paymentGatewayResponse?.id;
          if (!razorpayOrderId) throw new Error('No payment could be started for this order.');

          const options = {
            description: 'QuickVerse Daily Essentials',
            currency: 'INR',
            key: RAZORPAY_KEY_ID,
            amount: Math.round(response.grandTotal * 100),
            name: 'QuickVerse',
            order_id: razorpayOrderId,
            method: {
              upi: true,
              card: false,
              netbanking: false,
              wallet: false,
              emi: false,
              paylater: false,
            },
            prefill: { email: '', contact: authData.phone, name: authData.username },
          };
          await RazorpayCheckout.open(options);

          // Razorpay notifies the server, not us, so the sub-orders do not exist the
          // moment the sheet closes. Poll until they do; a slow webhook is not a failed
          // order, so a timeout still lands on the success screen with what we have.
          const settled = await hyperlocalOrderService.waitForPlacement(
            response.orderGroupMasterId,
            authData.jwt
          );
          if (settled) {
            group = {
              ...response,
              groupStatus: settled.groupStatus,
              subOrders: settled.subOrders,
            };
          }
        }

        if (group.groupStatus === 'FAILED') {
          navigation.navigate('OrderFailure', {
            errorMessage:
              method === 'COD'
                ? 'We could not place your order with any of the stores. Please try again.'
                : 'Your payment went through but the stores could not be reached. Our team will follow up.',
          });
          return;
        }

        // Only clear what actually reached a shop. A cart whose sub-order failed is left
        // intact so the customer can retry it rather than losing the basket silently.
        const placedShopIds = new Set(group.subOrders.filter(s => s.orderId).map(s => s.shopId));
        await Promise.all(
          groupableCarts
            .filter(c => placedShopIds.has(shopIdOf(c)))
            .map(c => clearCart(c.cartId, authData.jwt, authData.phone))
        );

        const firstPlaced = group.subOrders.find(s => s.orderId);
        navigation.navigate('OrderSuccess', {
          orderId: firstPlaced?.orderId || '',
          amount: group.grandTotal,
          date: new Date().toLocaleDateString(),
          shopId: firstPlaced?.shopId,
          orderGroupMasterId: group.orderGroupMasterId,
          shopCount: group.subOrders.length,
        });
      } catch (error) {
        // PRICE_MISMATCH means the server priced a shop differently from what we showed.
        // Surfaced plainly rather than as a generic failure, because the fix is for the
        // customer to look at the cart again.
        const apiError = error as Partial<ApiError>;
        const message =
          apiError?.code === 'PRICE_MISMATCH'
            ? 'Prices in your basket have changed. Please review your cart and try again.'
            : apiError?.message || 'We could not place your order. Please try again.';
        navigation.navigate('OrderFailure', { errorMessage: message });
      } finally {
        setIsOrderLoading(false);
      }
    },
    [
      groupableCarts,
      cart?.cartId,
      selectedAddress,
      selectedSmartBizAddress,
      authData,
      selectedDiscountCoupon,
      selectedDeliveryCoupon,
      clearCart,
      navigation,
    ]
  );

  const placeOrder = useCallback(
    async (paymentMethod: string) => {
      // Daily Essentials baskets check out as one group. Everything else — food, and any
      // basket that mixes a restaurant with a kirana — stays on the single-shop flow.
      if (isGroupedCheckout) {
        await placeGroupedOrder(paymentMethod);
        return;
      }

      // Kept here rather than in handleCheckout so the payload below is built on
      // narrowed, non-null values.
      if (!cart || !vendor || !selectedAddress || !authData?.jwt || !authData?.phone) {
        navigation.navigate('OrderFailure', {
          errorMessage: 'Missing required information. Please try again.',
        });
        return;
      }

      setIsOrderLoading(true);

      try {
        const calculatedTotal = cart?.totalCartAmount ?? 0;

        const orderRequest: CreateOrderRequest = {
          shopId: parseInt(vendor.shopId, 10),
          cartId: cart.smartBizCartId,
          orderSource: 'CONSTELLATION',
          customerAddressId: selectedSmartBizAddress?.addressID || '',
          fulfillmentOption: 'DELIVERY',
          notificationMobileNumber: authData?.phone || selectedAddress.phone,
          notificationEmail: null,
          customerName: selectedAddress.name || 'Customer',
          paymentMethod: paymentMethod.toUpperCase(),
          orderAmount: calculatedTotal,
        };

        const orderPayload = {
          createOrderRequest: orderRequest,
          checkoutSummaryRequest: {
            shopId: cartItems?.[0]?.shopId ?? null,
            customerAddressId: selectedSmartBizAddress?.addressID ?? null,
            couponId: selectedDiscountCoupon?.id ?? null,
            couponCode: selectedDiscountCoupon?.code ?? null,
            deliveryCouponId: selectedDeliveryCoupon?.id ?? null,
            paymentMethod: paymentMethod.toUpperCase(),
            customerCoordinates: {
              latitude: selectedSmartBizAddress?.coordinates?.latitude ?? null,
              longitude: selectedSmartBizAddress?.coordinates?.longitude ?? null,
            },
            cartItems:
              cartItems?.map((item: any) => ({
                sku: item?.sku ?? null,
                quantity: item?.quantity ?? null,
              })) ?? [],
          },
        };

        const orderResponse = await orderService.createOrder(
          orderPayload,
          authData.jwt,
          authData.phone
        );

        // The method passed in, not selectedPaymentOption: that state still holds the previous
        // choice here, which once opened Razorpay for an order just placed as COD.
        if (paymentMethod.toUpperCase() === 'PREPAID') {
          await handleRazorpayPayment(orderResponse, calculatedTotal, vendor);
        } else {
          if (cart && authData?.jwt && authData?.phone) {
            await clearCart(cart.cartId, authData.jwt, authData.phone);
          }
          navigation.navigate('OrderSuccess', {
            orderId: orderResponse.orderId,
            amount: calculatedTotal,
            date: new Date().toLocaleDateString(),
            shopId: vendor.shopId,
          });
        }
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === 'STORE_NOT_ACTIVE_UNSUPPORTED_OPERATION'
        ) {
          const status = vendor
            ? isStoreOpen({
                openingTime: vendor.openingTime,
                closingTime: vendor.closingTime,
                storeActive: vendor.storeActive,
              })
            : null;

          const nextOpenTime = status?.nextOpeningTime;
          const isTimeBased = vendor?.storeActive !== false && nextOpenTime;
          const opensAtText = isTimeBased ? ` Opens at ${formatTimeToAMPM(nextOpenTime)}.` : '';

          setStoreClosedModal({
            visible: true,
            message: `The store is closed at the moment.${opensAtText} Please try again later.`,
          });
          return;
        }

        const errorMessage =
          (error as any)?.message ||
          (error instanceof Error ? error.message : 'Order creation failed. Please try again.');

        const errorCode = (error as any)?.code;

        if (
          errorCode === 'COUPON_NOT_FOUND' ||
          errorCode === 'COUPON_INACTIVE' ||
          errorCode === 'COUPON_MOV_NOT_MET'
        ) {
          setSelectedDiscountCoupon(null);
          setSelectedDeliveryCoupon(null);
        }
        navigation.navigate('OrderFailure', { errorMessage });
      } finally {
        setIsOrderLoading(false);
      }
    },
    [
      isGroupedCheckout,
      placeGroupedOrder,
      selectedAddress,
      cart,
      vendor,
      authData?.jwt,
      authData?.phone,
      selectedSmartBizAddress,
      navigation,
      clearCart,
      checkoutSummary,
    ]
  );

  const handleCheckout = useCallback(async () => {
    if (!authData?.jwt) {
      setShowLoginPromptModal(true);
      return;
    }

    const isValidUUID = (value?: string | null) =>
      !!value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const isAddressSelected = isValidUUID(selectedSmartBizAddress?.addressID);

    if (!isAddressSelected) {
      setShowSmartBizAddressModal(true);
      return;
    }

    const maxKm = deliveryRadiusKm ?? 5;
    if (distanceKm != null && distanceKm > maxKm) {
      setShowDistanceModal(true);
      return;
    }

    if (vendor) {
      const storeStatus = isStoreOpen({
        openingTime: vendor.openingTime,
        closingTime: vendor.closingTime,
        storeActive: vendor.storeActive,
      });

      if (!storeStatus.isOpen) {
        const isTimeBased = vendor.storeActive !== false && storeStatus.nextOpeningTime;
        const opensAtText = isTimeBased
          ? ` Opens at ${formatTimeToAMPM(storeStatus.nextOpeningTime!)}.`
          : '';
        setStoreClosedModal({
          visible: true,
          message: `The store is closed at the moment.${opensAtText} Please try again later.`,
        });
        return;
      }
    }

    // Everything above is a precondition for ordering at all. The method was chosen on the
    // cart, and the bill on screen was priced for it.
    placeOrder(selectedPaymentOption?.toUpperCase() === 'COD' ? 'COD' : 'PREPAID');
  }, [
    placeOrder,
    selectedPaymentOption,
    permissionDataInAuth?.permission,
    selectedAddress,
    cart,
    vendor,
    authData?.jwt,
    authData?.phone,
    selectedSmartBizAddress,
    navigation,
    distanceKm,
    deliveryRadiusKm,
  ]);

  const handleAddressSelect = useCallback(
    (address: Address) => {
      setSelectedAddress(address);
      setShowAddressModal(false);
    },
    [setSelectedAddress]
  );

  const handleSmartBizAddressSelect = useCallback((address: Address) => {
    setSelectedSmartBizAddress(address);
    setShowSmartBizAddressModal(false);
  }, []);

  const getFormattedAddress = useCallback(() => {
    if (!selectedSmartBizAddress) return 'Select delivery address';
    const { name, addressLine1, city, state } = selectedSmartBizAddress;
    const parts = [name, addressLine1, city, state].filter(Boolean).join(', ');
    return distanceText ? `${parts} • ${distanceText}` : parts;
  }, [selectedSmartBizAddress, distanceText]);

  const isCheckoutDisabled = useMemo(() => {
    // Not while the bill is being re-priced (say, for a change of payment method): the
    // order must go out on the bill the customer is looking at.
    return Boolean(paymentMethodsError) || isOrderLoading || checkoutSummaryLoading;
  }, [paymentMethodsError, isOrderLoading, checkoutSummaryLoading]);

  /** Whether this store takes cash on delivery, from its eligible payment methods. */
  const codAvailable = useMemo(
    () => availableOptions.some(option => option.key === 'COD' && option.available),
    [availableOptions]
  );

  // A COD choice made for another store does not carry over to one without COD.
  React.useEffect(() => {
    if (!paymentMethodsLoading && selectedPaymentOption === 'COD' && !codAvailable) {
      setSelectedPaymentOption('PREPAID');
    }
  }, [paymentMethodsLoading, selectedPaymentOption, codAvailable]);

  React.useEffect(() => {
    const initializeCart = async () => {
      if (vendor?.shopId && authData?.jwt && authData?.phone) {
        await smartBizAddressService.fetchAddresses(vendor.shopId, authData.jwt, authData.phone);
      }
    };
    initializeCart();
  }, [vendor?.shopId, authData?.jwt, authData?.phone, selectedSmartBizAddress]);

  React.useEffect(() => {
    const refreshCartData = async () => {
      if (!cart?.cartId || !authData?.jwt || !authData?.phone) return;
      await refreshCart(cart.cartId, authData.jwt, authData.phone);
    };
    refreshCartData();
  }, [cart?.cartId, authData?.jwt, authData?.phone, refreshCart, vendor?.shopId, authData]);

  React.useEffect(() => {
    if (cart && !activeCartId) {
      setActiveCart(cart.cartId);
    }
  }, [cart?.cartId, activeCartId, setActiveCart]);

  React.useEffect(() => {
    if (availableOptions.length > 0 && !selectedPaymentOption) {
      const codOption = availableOptions.find(option => option.key === 'COD' && option.available);
      if (codOption) setSelectedPaymentOption('COD');
    }
  }, [availableOptions, selectedPaymentOption]);

  React.useEffect(() => {
    const fetchFeatured = async () => {
      try {
        if (vendor?.shopId) {
          const products = await getFeaturedProducts(vendor.shopId);
          setFeaturedProducts(products || []);
        } else {
          setFeaturedProducts([]);
        }
      } catch (_err) {
        setFeaturedProducts([]);
      }
    };
    fetchFeatured();
  }, [vendor?.shopId, getFeaturedProducts]);

  const fetchCoupons = useCallback(async () => {
    if (!vendor?.shopId) return;
    setCouponLoading(true);
    try {
      const data = await couponService.getAvailableCoupons(
        getRegionId() as string,
        vendor.shopId,
        vendor?.category?.toUpperCase()
      );
      setAvailableCoupons(data);
    } catch (_err) {
      setAvailableCoupons([]);
    } finally {
      setCouponLoading(false);
    }
  }, [vendor?.shopId, vendor?.category, getRegionId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchCoupons();
    }, [fetchCoupons])
  );

  if (isOrderLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: getColor('background'),
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={getColor('primary')} />
        <Text style={{ marginTop: 16, color: getColor('text'), fontSize: 16, fontWeight: '500' }}>
          Placing your order, hold on...
        </Text>
      </View>
    );
  }

  if (!cart || !vendor || cartItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background') }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 100 }}>
          {essentialsCartEnabled ? (
            <EssentialsCartCard
              itemCount={essentialsSummary.itemCount}
              itemTotal={essentialsSummary.itemTotal}
              onPress={() => navigation.navigate('Cart', { cartId: ESSENTIALS_CART_ID })}
              style={{ marginHorizontal: 0, marginTop: 0 }}
            />
          ) : null}
          <View style={styles.emptyCartSection}>
            <MaterialCommunityIcons name="cart-off" size={80} color={getColor('subText')} />
            <Text
              style={{ fontSize: 20, fontWeight: '700', color: getColor('text'), marginTop: 20 }}
            >
              Your cart is empty
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: getColor('subText'),
                textAlign: 'center',
                marginTop: 10,
              }}
            >
              Looks like you haven&apos;t added anything to your cart yet.
            </Text>
            <TouchableOpacity
              style={[styles.startShoppingBtn, { backgroundColor: getColor('primary') }]}
              onPress={() => navigation.navigate('MainApp', { screen: 'Home' } as any)}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Start Shopping</Text>
            </TouchableOpacity>
          </View>

          {ordersLoading && previousOrders.length === 0 ? (
            <ActivityIndicator size="small" color={getColor('primary')} style={{ marginTop: 32 }} />
          ) : previousOrders.length > 0 ? (
            <View style={[styles.prevOrdersSection, { backgroundColor: '#FFF8F0' }]}>
              <Text style={[styles.prevOrdersTitle, { color: getColor('text') }]}>
                Previous Orders
              </Text>
              {previousOrders.map(entry =>
                entry.kind === 'order' ? (
                  <PreviousOrderCard
                    key={entry.key}
                    order={entry.order}
                    getColor={getColor}
                    total={computePreviousOrderTotal(entry.order)}
                    onPress={() =>
                      navigation.navigate('OrderDetails', {
                        orderId: entry.order.orderId,
                        order: entry.order,
                      })
                    }
                  />
                ) : (
                  <EssentialsOrderCard
                    key={entry.key}
                    order={entry.order}
                    onPress={() =>
                      navigation.navigate('EssentialsOrder', { orderId: entry.order.orderId })
                    }
                  />
                )
              )}
              {hasMoreOrders && (
                <TouchableOpacity
                  style={[styles.loadMoreBtn, { borderColor: getColor('primary') }]}
                  onPress={() => loadMoreOrders()}
                  activeOpacity={0.7}
                  disabled={ordersLoading}
                >
                  {ordersLoading ? (
                    <ActivityIndicator size="small" color={getColor('primary')} />
                  ) : (
                    <Text style={[styles.loadMoreBtnText, { color: getColor('primary') }]}>
                      Load more
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const couponTitle =
    checkoutSummary?.couponError === 'COUPON_NOT_FOUND'
      ? 'Invalid Coupon Code'
      : checkoutSummary?.couponError === 'COUPON_INACTIVE'
        ? 'Coupon Expired'
        : checkoutSummary?.couponError === 'COUPON_MOV_NOT_MET'
          ? 'Minimum Order Value Not Met'
          : 'Coupon Error';

  const deliveryCouponTitle =
    checkoutSummary?.deliveryCouponError === 'COUPON_NOT_FOUND'
      ? 'Invalid Delivery Coupon'
      : checkoutSummary?.deliveryCouponError === 'COUPON_INACTIVE'
        ? 'Delivery Coupon Expired'
        : checkoutSummary?.deliveryCouponError === 'COUPON_MOV_NOT_MET'
          ? 'Minimum Order Value Not Met'
          : checkoutSummary?.deliveryCouponError === 'COUPON_WRONG_SLOT'
            ? 'Invalid Coupon Type'
            : 'Delivery Coupon Error';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: getColor('background') }}
      edges={['top', 'bottom']}
    >
      <CartHeader
        onBack={() => {
          const parent = navigation.getParent();
          if (parent?.canGoBack()) {
            parent.goBack();
          } else if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('MainApp');
          }
        }}
        onClearCart={handleClearCart}
        itemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: footerHeight + 24 }}>
        {essentialsCartEnabled ? (
          <EssentialsCartCard
            itemCount={essentialsSummary.itemCount}
            itemTotal={essentialsSummary.itemTotal}
            onPress={() => navigation.navigate('Cart', { cartId: ESSENTIALS_CART_ID })}
          />
        ) : null}
        <AnimatedCard delay={0}>
          <FreeDeliveryProgress
            cartAmount={checkoutSummary?.itemTotalAmount ?? 0}
            threshold={freeDeliveryThreshold}
          />
        </AnimatedCard>

        <AnimatedCard delay={50}>
          <CartItemList
            items={cartItems}
            onInc={handleInc}
            onDec={handleDec}
            vendor={vendor}
            distanceText={distanceText}
            navigation={navigation}
          />
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <CouponSection
            couponLoading={couponLoading}
            availableCoupons={availableCoupons}
            appliedDiscount={checkoutSummary?.couponDiscount ?? 0}
            appliedDeliverySaving={
              checkoutSummary?.isFreeDelivery ? (checkoutSummary?.actualDeliveryFee ?? 0) : 0
            }
            onCouponNavigation={handleCouponNavigation}
            selectedDiscountCoupon={selectedDiscountCoupon}
            selectedDeliveryCoupon={selectedDeliveryCoupon}
            onRemoveDiscountCoupon={() => setSelectedDiscountCoupon(null)}
            onRemoveDeliveryCoupon={() => setSelectedDeliveryCoupon(null)}
          />
        </AnimatedCard>

        {totalSavingsAmount > 0 && (
          <AnimatedCard delay={150}>
            <TotalSavingsCard savings={totalSavingsAmount} />
          </AnimatedCard>
        )}

        {/* Chosen on the cart so the bill below is priced for it, COD charge included. */}
        <AnimatedCard delay={175}>
          <PaymentOptions
            selectedOption={selectedPaymentOption as 'COD' | 'PREPAID'}
            onSelect={setSelectedPaymentOption}
            codAvailable={codAvailable}
            codCharges={codCharges}
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

        {/* Plain wrapper purely to measure: AnimatedCard does not forward onLayout,
            and this sits directly in the scroll content so its y is the offset the
            footer's "View Bill" scrolls to. */}
        <View onLayout={e => setBillOffsetY(e.nativeEvent.layout.y)}>
          <AnimatedCard delay={300}>
            <PaymentSummary
              tipAmount={tipAmount}
              savings={totalSavingsAmount}
              expanded={paymentExpanded}
              onToggle={() => setPaymentExpanded(e => !e)}
              summary={checkoutSummary}
              summaryLoading={checkoutSummaryLoading}
              selectedPaymentOption={selectedPaymentOption}
              selectedCoupon={selectedDiscountCoupon}
              selectedDeliveryCoupon={selectedDeliveryCoupon}
              platformFeeOriginal={currentPricing.platformFeeOriginal}
              packagingChargesOriginal={currentPricing.packagingChargesOriginal}
            />
          </AnimatedCard>
        </View>
      </ScrollView>

      <CartFooter
        total={(checkoutSummary?.payableAmount ?? 0) + tipContribution(tipAmount)}
        savings={totalSavingsAmount}
        onViewBill={handleViewBill}
        onHeightChange={setFooterHeight}
        addressId={selectedSmartBizAddress?.addressID || ''}
        address={getFormattedAddress()}
        addressTag={selectedSmartBizAddress?.tag || selectedSmartBizAddress?.name || ''}
        onSelectAddress={() => setShowSmartBizAddressModal(true)}
        onCheckout={handleCheckout}
        disabled={isCheckoutDisabled}
        loading={isOrderLoading}
        isGuest={!authData?.jwt}
        paymentMethod={selectedPaymentOption}
      />

      <AddressSelectionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
        needCompulsoryAddress={true}
      />
      <SmartBizAddressSelectionModal
        visible={showSmartBizAddressModal}
        onClose={() => setShowSmartBizAddressModal(false)}
        onAddressSelect={handleSmartBizAddressSelect}
        selectedAddress={selectedSmartBizAddress}
        vendorId={vendor?.shopId || ''}
      />

      <CouponSheet
        visible={showCouponSheet}
        onClose={() => setShowCouponSheet(false)}
        coupons={availableCoupons}
        loading={couponLoading}
        cartTotal={couponCartTotal}
        selectedDiscountCoupon={selectedDiscountCoupon}
        selectedDeliveryCoupon={selectedDeliveryCoupon}
        onApplyDiscount={setSelectedDiscountCoupon}
        onApplyDelivery={setSelectedDeliveryCoupon}
      />

      <Modal
        visible={showDistanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDistanceModal(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View style={[styles.distanceCard, { backgroundColor: getColor('card') }]}>
            <View
              style={[styles.iconBadge, { backgroundColor: getColor('primary'), opacity: 0.12 }]}
            >
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={28}
                color={getColor('primary')}
              />
            </View>
            <Text style={[styles.title, { color: getColor('text') }]}>Outside delivery radius</Text>
            <Text style={[styles.subtitle, { color: getColor('subText') }]}>
              We currently deliver within {formatDistanceKm(deliveryRadiusKm ?? 5)} of the store.
            </Text>
            {Number.isFinite(distanceKm ?? NaN) ? (
              <Text style={[styles.note, { color: getColor('subText') }]}>
                Your address is {formatDistanceKm(distanceKm as number)} away.
              </Text>
            ) : null}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  setShowDistanceModal(false);
                  setShowSmartBizAddressModal(true);
                }}
                style={[styles.primaryBtn, { backgroundColor: getColor('primary') }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryBtnText, { color: getColor('white') }]}>
                  Change address
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDistanceModal(false)}
                style={styles.secondaryBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryBtnText, { color: getColor('primary') }]}>
                  Maybe later
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <LoginPromptModal
        visible={showLoginPromptModal}
        onClose={() => setShowLoginPromptModal(false)}
        title="Login to Place Order"
        message="Please login to continue with payment and place your order."
      />

      <Modal
        visible={storeClosedModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setStoreClosedModal({ visible: false, message: '' });
          navigation.navigate('MainApp');
        }}
      >
        <View style={styles.storeClosedOverlay}>
          <View style={[styles.storeClosedCard, { backgroundColor: getColor('card') }]}>
            <View
              style={[styles.storeClosedIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
            >
              <MaterialCommunityIcons name="store-off" size={32} color="#EF4444" />
            </View>
            <Text style={[styles.storeClosedTitle, { color: getColor('text') }]}>Store Closed</Text>
            <Text style={[styles.storeClosedMessage, { color: getColor('subText') }]}>
              {storeClosedModal.message}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setStoreClosedModal({ visible: false, message: '' });
                navigation.navigate('MainApp');
              }}
              style={[styles.storeClosedBtn, { backgroundColor: getColor('primary') }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.storeClosedBtnText, { color: getColor('background') }]}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={couponErrorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCouponErrorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: getColor('card') }]}>
            <View style={[styles.modalIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <MaterialCommunityIcons name="ticket-percent-outline" size={32} color="#EF4444" />
            </View>
            <Text
              style={[
                styles.modalTitle,
                { color: getColor('text'), fontFamily: 'BricolageGrotesque-Bold' },
              ]}
            >
              {couponTitle}
            </Text>
            <Text
              style={[
                styles.modalMessage,
                { color: getColor('subText'), fontFamily: 'BricolageGrotesque-Regular' },
              ]}
            >
              {checkoutSummary?.couponErrorMessage || 'Something went wrong with this coupon code.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCouponErrorVisible(false);
                setSelectedDiscountCoupon(null);
              }}
              style={[styles.modalBtn, { backgroundColor: getColor('primary') }]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modalBtnText,
                  { color: getColor('background'), fontFamily: 'BricolageGrotesque-Bold' },
                ]}
              >
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deliveryCouponErrorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeliveryCouponErrorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: getColor('card') }]}>
            <View style={[styles.modalIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <MaterialCommunityIcons name="truck-outline" size={32} color="#EF4444" />
            </View>
            <Text
              style={[
                styles.modalTitle,
                { color: getColor('text'), fontFamily: 'BricolageGrotesque-Bold' },
              ]}
            >
              {deliveryCouponTitle}
            </Text>
            <Text
              style={[
                styles.modalMessage,
                { color: getColor('subText'), fontFamily: 'BricolageGrotesque-Regular' },
              ]}
            >
              {checkoutSummary?.deliveryCouponErrorMessage ||
                'Something went wrong with this delivery coupon.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setDeliveryCouponErrorVisible(false);
                setSelectedDeliveryCoupon(null);
              }}
              style={[styles.modalBtn, { backgroundColor: getColor('primary') }]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modalBtnText,
                  { color: getColor('background'), fontFamily: 'BricolageGrotesque-Bold' },
                ]}
              >
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ORDER_STATUS_COLORS: Record<string, { background: string; text: string }> = {
  payment_pending: { background: '#FFA726', text: '#FFFFFF' },
  processing: { background: '#42A5F5', text: '#FFFFFF' },
  confirmed: { background: '#2196F3', text: '#FFFFFF' },
  shipped: { background: '#7E57C2', text: '#FFFFFF' },
  shipping: { background: '#7E57C2', text: '#FFFFFF' },
  ready: { background: '#26A69A', text: '#FFFFFF' },
  delivered: { background: '#66BB6A', text: '#FFFFFF' },
  cancelled: { background: '#EF5350', text: '#FFFFFF' },
};

interface PreviousOrderCardProps {
  order: Order;
  getColor: ReturnType<typeof useTheme>['getColor'];
  onPress: () => void;
  total: number;
}

const PreviousOrderCardBase: React.FC<PreviousOrderCardProps> = ({
  order,
  getColor,
  onPress,
  total,
}) => {
  const statusColors = ORDER_STATUS_COLORS[order.status] || {
    background: '#78909C',
    text: '#FFFFFF',
  };
  const statusText = order.status === 'delivered' ? 'SUCCESSFUL' : order.status.toUpperCase();
  const items = order.items || [];
  const displayItems = items.slice(0, 4);
  const remainingCount = items.length - 4;

  return (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: getColor('card') }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.orderImageGrid}>
        {displayItems.length === 1 ? (
          <View style={styles.orderGridFull}>
            {displayItems[0].image ? (
              <Image source={{ uri: displayItems[0].image }} style={styles.orderGridImg} />
            ) : (
              <View
                style={[styles.orderGridPlaceholder, { backgroundColor: getColor('border') }]}
              />
            )}
          </View>
        ) : displayItems.length === 2 ? (
          <View style={styles.orderGridRow}>
            {displayItems.map((di, i) => (
              <View key={i} style={styles.orderGridHalf}>
                {di.image ? (
                  <Image source={{ uri: di.image }} style={styles.orderGridImg} />
                ) : (
                  <View
                    style={[styles.orderGridPlaceholder, { backgroundColor: getColor('border') }]}
                  />
                )}
              </View>
            ))}
          </View>
        ) : (
          <>
            <View style={styles.orderGridRow}>
              {displayItems.slice(0, 2).map((di, i) => (
                <View key={i} style={styles.orderGridQuarter}>
                  {di.image ? (
                    <Image source={{ uri: di.image }} style={styles.orderGridImg} />
                  ) : (
                    <View
                      style={[styles.orderGridPlaceholder, { backgroundColor: getColor('border') }]}
                    />
                  )}
                </View>
              ))}
            </View>
            <View style={styles.orderGridRow}>
              {displayItems.slice(2, 4).map((di, i) => (
                <View key={i} style={styles.orderGridQuarter}>
                  {di.image ? (
                    <Image source={{ uri: di.image }} style={styles.orderGridImg} />
                  ) : (
                    <View
                      style={[styles.orderGridPlaceholder, { backgroundColor: getColor('border') }]}
                    />
                  )}
                </View>
              ))}
              {remainingCount > 0 && (
                <View style={[styles.orderGridQuarter, { backgroundColor: getColor('border') }]}>
                  <Text style={[styles.orderGridPlusText, { color: getColor('text') }]}>
                    +{remainingCount}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.orderCardInfo}>
        <Text style={[styles.orderCardId, { color: getColor('text') }]} numberOfLines={1}>
          Order: #{order.orderId}
        </Text>
        <Text style={[styles.orderCardDate, { color: getColor('subText') }]}>
          {new Date(order.orderDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
          {' \u2022 '}
          {new Date(order.orderDate).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
        <View style={[styles.orderStatusTag, { backgroundColor: statusColors.background }]}>
          <Text style={[styles.orderStatusText, { color: statusColors.text }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.orderCardRight}>
        <Text style={[styles.orderCardAmount, { color: getColor('text') }]}>
          {'\u20B9'} {total.toFixed(0)}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={getColor('primary')} />
      </View>
    </TouchableOpacity>
  );
};

const PreviousOrderCard = React.memo(PreviousOrderCardBase);

/**
 * The Cart screen, for a store cart or the Daily Essentials cart — the same screen either way.
 *
 * The Essentials cart is shown when asked for by id, or when it is the only cart there is (the
 * Cart tab opened with nothing in any store cart). Otherwise the store cart is shown, with a card
 * leading to the Essentials cart when that has items too.
 */
const CartScreen: React.FC = () => {
  const route = useRoute<CartScreenRouteProp>();
  const requested = route.params?.cartId;
  const essentialsEnabled = useEssentialsCartStore(s => s.enabled === true);
  const hasEssentials = useEssentialsLines().length > 0;
  const hasStoreCarts = useCartStore(s => Object.keys(s.carts).length > 0);
  const { authData } = useAuth();
  const fetchEssentialsCart = useEssentialsCartStore(s => s.fetchCart);

  // The Essentials cart lives on the server; without this the tab shows only what this device
  // last saw, and a cart filled elsewhere (or restored at login) stays invisible here.
  useFocusEffect(
    useCallback(() => {
      fetchEssentialsCart(authData?.jwt || undefined, authData?.phone || undefined);
    }, [fetchEssentialsCart, authData?.jwt, authData?.phone])
  );

  // Asked for by id, it still gives way to a store cart once it is empty (say, after its order
  // was placed) — just as a store cart id that no longer exists falls back to another cart.
  const showEssentials =
    essentialsEnabled &&
    (requested === ESSENTIALS_CART_ID
      ? hasEssentials || !hasStoreCarts
      : !requested && !hasStoreCarts && hasEssentials);

  return showEssentials ? <EssentialsCartView /> : <StoreCartScreen />;
};

export default React.memo(CartScreen);

const styles = StyleSheet.create({
  distanceCard: {
    borderRadius: 14,
    padding: 20,
    width: '100%',
  },
  iconBadge: {
    alignSelf: 'center',
    borderRadius: 28,
    padding: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  note: {
    marginTop: 4,
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryBtnText: {},
  storeClosedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  storeClosedCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  storeClosedIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeClosedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  storeClosedMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  storeClosedBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  storeClosedBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 10,
  },
  startShoppingBtn: {
    marginTop: 30,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  prevOrdersSection: {
    marginTop: 32,
    borderRadius: 16,
    padding: 16,
  },
  prevOrdersTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  loadMoreBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  loadMoreBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderImageGrid: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  orderGridFull: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  orderGridRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 2,
  },
  orderGridHalf: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  orderGridQuarter: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderGridImg: {
    width: '100%',
    height: '100%',
  },
  orderGridPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  orderGridPlusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderCardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderCardId: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderCardDate: {
    fontSize: 12,
    marginBottom: 8,
  },
  orderStatusTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  orderCardAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
