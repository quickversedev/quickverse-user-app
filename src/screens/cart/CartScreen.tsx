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
import {
  CartFooter,
  CartHeader,
  CartItemList,
  CouponSection,
  PaymentOptions,
  PaymentSummary,
  TotalSavingsCard,
} from '../../components/modules/Cart';
import {
  AddressSelectionModal,
  SmartBizAddressSelectionModal,
} from '../../components/modules/Header';
import { useAuth } from '../../contexts/login/AuthProvider';
import { useOrders } from '../../hooks/useOrders';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { RootStackParamList } from '../../routes/AppStack';
import couponService from '../../services/api/couponSevice';
import cartApiService from '../../services/cartApiService';
import orderService, { CreateOrderRequest } from '../../services/createOrderService';
import { getCODCharges } from '../../services/paymentService';
import { smartBizAddressService } from '../../store/address/smartBizAddressStore';
import useCartStore from '../../store/cart/cartStore';
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
import PaymentScreen from './PaymentScreen';

type CartScreenRouteProp = RouteProp<RootStackParamList, 'Cart'>;
type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

const CartScreen: React.FC = () => {
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
  const [paymentExpanded, setPaymentExpanded] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
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

      const commission = pricing.commissionRate * subTotal;
      const taxableAmount = commission + pricing.deliveryFee + pricing.platformFee;
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

  const cartItems = useMemo(() => {
    return cart ? Object.values(cart.products) : [];
  }, [cart]);

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

  const {
    paymentMethods,
    availableOptions,
    loading: paymentMethodsLoading,
    error: paymentMethodsError,
    refetch: refetchPaymentMethods,
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

  const handleInc = useCallback(
    (sku: string) => {
      if (cart) {
        increment(cart.cartId, sku, authData?.jwt || '', authData?.phone || '');
      }
    },
    [cart, authData?.jwt, authData?.phone, increment]
  );

  const handleDec = useCallback(
    (sku: string) => {
      if (cart) {
        decrement(cart.cartId, sku, authData?.jwt || '', authData?.phone || '');
      }
    },
    [cart, authData?.jwt, authData?.phone, decrement]
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

  const handleCouponNavigation = useCallback(() => {
    discountCouponCallbackRef.current = (coupon: any) => {
      setSelectedDiscountCoupon(coupon);
    };
    deliveryCouponCallbackRef.current = (coupon: any) => {
      setSelectedDeliveryCoupon(coupon);
    };
    const apiSubtotal = cart?.totalCartAmount ?? 0;
    const localSubtotal = cartItems.reduce(
      (sum: number, product: any) => sum + product.price * product.quantity,
      0
    );
    const calculatedSubtotal = apiSubtotal > 0 ? apiSubtotal : localSubtotal;
    navigation.navigate('Coupons', {
      cartTotal: calculatedSubtotal,
      coupons: availableCoupons,
      loading: couponLoading,
      selectedDiscountCoupon: selectedDiscountCoupon,
      selectedDeliveryCoupon: selectedDeliveryCoupon,
      onApplyDiscount: discountCouponCallbackRef.current,
      onApplyDelivery: deliveryCouponCallbackRef.current,
    } as any);
  }, [
    navigation,
    availableCoupons,
    couponLoading,
    selectedDiscountCoupon,
    selectedDeliveryCoupon,
    cart,
  ]);

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
    const freeDeliverySavings = checkoutSummary?.isFreeDelivery ? actualFee : Math.max(0, actualFee - fee);

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
      // const RAZORPAY_KEY_ID = 'rzp_test_T2Z6i6Go29OJwg';
      const RAZORPAY_KEY_ID = 'rzp_live_TAGtNIHlg9alA6';

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

    if (!selectedPaymentOption || selectedPaymentOption.trim() === '') {
      setShowPaymentModal(true);
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
        paymentMethod: selectedPaymentOption?.toUpperCase() || 'PREPAID',
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
        },
      };

      const orderResponse = await orderService.createOrder(
        orderPayload,
        authData.jwt,
        authData.phone
      );

      if (selectedPaymentOption === 'PREPAID') {
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
  }, [
    permissionDataInAuth?.permission,
    selectedAddress,
    selectedPaymentOption,
    cart,
    vendor,
    authData?.jwt,
    authData?.phone,
    selectedSmartBizAddress,
    navigation,
    clearCart,
    distanceKm,
    deliveryRadiusKm,
    checkoutSummary,
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

  const handlePaymentOptionsPress = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  const handlePaymentModalClose = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  const handlePaymentConfirm = useCallback((selectedOption: string, _upiId?: string) => {
    setSelectedPaymentOption(selectedOption);
    setShowPaymentModal(false);
  }, []);

  const getFormattedAddress = useCallback(() => {
    if (!selectedSmartBizAddress) return 'Select delivery address';
    const { name, addressLine1, city, state } = selectedSmartBizAddress;
    const parts = [name, addressLine1, city, state].filter(Boolean).join(', ');
    return distanceText ? `${parts} • ${distanceText}` : parts;
  }, [selectedSmartBizAddress, distanceText]);

  const isCheckoutDisabled = useMemo(() => {
    return !selectedPaymentOption || Boolean(paymentMethodsError) || isOrderLoading;
  }, [selectedPaymentOption, paymentMethodsError, isOrderLoading]);

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

          {ordersLoading && orders.length === 0 ? (
            <ActivityIndicator size="small" color={getColor('primary')} style={{ marginTop: 32 }} />
          ) : orders.length > 0 ? (
            <View style={[styles.prevOrdersSection, { backgroundColor: '#FFF8F0' }]}>
              <Text style={[styles.prevOrdersTitle, { color: getColor('text') }]}>
                Previous Orders
              </Text>
              {orders.map(order => (
                <PreviousOrderCard
                  key={order.orderId}
                  order={order}
                  getColor={getColor}
                  total={computePreviousOrderTotal(order)}
                  onPress={() =>
                    navigation.navigate('OrderDetails', { orderId: order.orderId, order })
                  }
                />
              ))}
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
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 240 }}>
        <AnimatedCard delay={0}>
          <CartItemList
            items={cartItems}
            onInc={handleInc}
            onDec={handleDec}
            vendor={vendor}
            navigation={navigation}
          />
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <CouponSection
            couponLoading={couponLoading}
            availableCoupons={availableCoupons}
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

        <AnimatedCard delay={200}>
          <PaymentOptions
            selectedOption={selectedPaymentOption as 'COD' | 'PREPAID'}
            onSelect={option => setSelectedPaymentOption(option)}
          />
        </AnimatedCard>

        <AnimatedCard delay={300}>
          <PaymentSummary
            expanded={paymentExpanded}
            onToggle={() => setPaymentExpanded(e => !e)}
            summary={checkoutSummary}
            summaryLoading={checkoutSummaryLoading}
            selectedPaymentOption={selectedPaymentOption}
            selectedCoupon={selectedDiscountCoupon}
            selectedDeliveryCoupon={selectedDeliveryCoupon}
          />
        </AnimatedCard>
      </ScrollView>

      <CartFooter
        addressId={selectedSmartBizAddress?.addressID || ''}
        address={getFormattedAddress()}
        addressTag={selectedSmartBizAddress?.tag || selectedSmartBizAddress?.name || ''}
        onSelectAddress={() => setShowSmartBizAddressModal(true)}
        onCheckout={handleCheckout}
        disabled={isCheckoutDisabled}
        loading={isOrderLoading}
        isGuest={!authData?.jwt}
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

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePaymentModalClose}
      >
        <PaymentScreen
          onClose={handlePaymentModalClose}
          onConfirm={handlePaymentConfirm}
          paymentMethods={paymentMethods}
          selectedOption={selectedPaymentOption as 'COD' | 'PREPAID'}
          error={paymentMethodsError}
          loading={paymentMethodsLoading}
          onRetry={refetchPaymentMethods}
        />
      </Modal>

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
