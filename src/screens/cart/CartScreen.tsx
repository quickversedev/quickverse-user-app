import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AnimatedCard from '../../components/common/AnimatedCard';
import {
  CartFooter,
  CartHeader,
  CartItemList,
  CouponSection,
  PaymentOptions,
  PaymentSummary,
  VendorPill,
} from '../../components/modules/Cart';
import {
  AddressSelectionModal,
  SmartBizAddressSelectionModal,
} from '../../components/modules/Header';
import { useAuth } from '../../contexts/login/AuthProvider';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { RootStackParamList } from '../../routes/AppStack';
import orderService, { CreateOrderRequest } from '../../services/createOrderService';
import createPaymentService, { CreatePaymentRequest } from '../../services/createPaymentService';
import { getCODCharges } from '../../services/paymentService';
import { SmartBizAddress, smartBizAddressService } from '../../store/address/smartBizAddressStore';
import useCartStore from '../../store/cart/cartStore';
import useCouponStore from '../../store/cart/couponStore';
import useConfigStore from '../../store/configStore';
import useFeaturedProductsStore from '../../store/products/featuredProductsStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Address } from '../../types/address';
import { Product } from '../../types/product';
import { formatDistanceKm, getDistanceInKm } from '../../utils/distance';
import { formatTimeToAMPM, isStoreOpen } from '../../utils/storeUtils';
import PaymentScreen from './PaymentScreen';

type CartScreenRouteProp = RouteProp<RootStackParamList, 'Cart'>;
type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

// ============================================================================
// MAIN CART SCREEN COMPONENT
// ============================================================================

const CartScreen: React.FC = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const route = useRoute<CartScreenRouteProp>();
  const { cartId } = route.params || {};

  // Store hooks
  const {
    carts,
    activeCartId,
    increment,
    decrement,
    clearCart,
    getAppliedCoupon,
    refreshCart,
    addToCart,
    setActiveCart,
  } = useCartStore();
  const { vendors } = useVendorStore();
  const {
    getAvailableCoupons,
    checkAndFetchOffers,
    vendorOffersLoading,
    customerOffersLoading,
    vendorOffersError,
    customerOffersError,
  } = useCouponStore();

  // Auth hooks
  const { selectedAddress, setSelectedAddress, permissionDataInAuth, authData } = useAuth();

  // Local state
  const [showAddressModal, setShowAddressModal] = React.useState(false);
  const [showSmartBizAddressModal, setShowSmartBizAddressModal] = React.useState(false);
  const [selectedSmartBizAddress, setSelectedSmartBizAddress] =
    React.useState<SmartBizAddress | null>(null);
  const [paymentExpanded, setPaymentExpanded] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = React.useState<string | undefined>(
    'cod'
  ); // Default to COD
  const [isOrderLoading, setIsOrderLoading] = React.useState(false);
  const [showDistanceModal, setShowDistanceModal] = React.useState(false);
  const [storeClosedModal, setStoreClosedModal] = React.useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: '' });

  // Theme
  const { getColor } = useTheme();
  const { getFeaturedProducts } = useFeaturedProductsStore();
  const [featuredProducts, setFeaturedProducts] = React.useState<Product[]>([]);
  // const [smartBizAddressId, setSmartBizAddressId] = React.useState<string | null>(null);
  // Normalize delivery radius to kilometers if config is in meters
  const deliveryRadiusKmRaw = useConfigStore(state => state.getDeliveryDistance());
  const deliveryRadiusKm = useMemo(() => {
    if (deliveryRadiusKmRaw == null) return null;
    // Heuristic: if value is large (likely meters), convert to km
    return deliveryRadiusKmRaw > 100 ? deliveryRadiusKmRaw / 1000 : deliveryRadiusKmRaw;
  }, [deliveryRadiusKmRaw]);

  // Memoized derived state
  const cart = useMemo(() => {
    if (cartId && carts[cartId]) return carts[cartId];
    if (activeCartId && carts[activeCartId]) return carts[activeCartId];

    // Fallback: pick the first available cart if any
    const allCartIds = Object.keys(carts);
    if (allCartIds.length > 0) {
      return carts[allCartIds[0]];
    }

    return undefined;
  }, [cartId, activeCartId, carts]);

  const cartItems = useMemo(() => {
    return cart ? Object.values(cart.products) : [];
  }, [cart]);

  const vendor = useMemo(() => {
    if (!cart?.cartId) return undefined;
    return vendors.find(v => v.shopId === cart.cartId.replace('vendor_', ''));
  }, [vendors, cart?.cartId]);

  const appliedCoupon = useMemo(() => {
    return cart ? getAppliedCoupon(cart.cartId) : undefined;
  }, [cart, getAppliedCoupon]);

  const availableCoupons = useMemo(() => {
    const coupons = getAvailableCoupons(vendor?.shopId || '');
    return coupons;
  }, [getAvailableCoupons, vendor?.shopId]);

  // Payment methods hook
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

  // Get COD charges from payment methods
  const codCharges = useMemo(() => {
    return getCODCharges(paymentMethods);
  }, [paymentMethods]);

  const vendorLatLon = useMemo(() => {
    if (!vendor) return null;
    // Prefer GeoJSON location if present, fallback to coordinates field
    if (vendor.location?.coordinates && vendor.location.coordinates.length === 2) {
      const [lon, lat] = vendor.location.coordinates;
      if (typeof lat === 'number' && typeof lon === 'number') {
        return { lat, lon };
      }
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
    if (!selectedSmartBizAddress?.address) return null;
    const lat = parseFloat(selectedSmartBizAddress.address.latitude);
    const lon = parseFloat(selectedSmartBizAddress.address.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }
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

  // Memoized event handlers
  const handleClearCart = useCallback(() => {
    if (cart && authData?.jwt) {
      clearCart(cart.cartId, authData.jwt, authData.phone || '');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainApp');
      }
    }
  }, [cart, authData?.jwt, authData?.phone, clearCart, navigation]);

  const handleInc = useCallback(
    (sku: string) => {
      if (cart && authData?.jwt) {
        increment(cart.cartId, sku, authData.jwt, authData.phone || '');
      }
    },
    [cart, authData?.jwt, authData?.phone, increment]
  );

  const handleDec = useCallback(
    (sku: string) => {
      if (cart && authData?.jwt) {
        decrement(cart.cartId, sku, authData.jwt, authData.phone || '');
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

  const handleAddSuggested = useCallback(
    (item: { id: string; name: string; price: number; image: number }) => {
      const index = featuredProducts.findIndex(p => p.sku === item.id);
      const product = convertToProduct(item, index);

      if (!cart || !authData?.jwt || !authData?.phone) return;

      const cartProduct = {
        sku: product.sku,
        shopId: product.shopId,
        name: product.name,
        price: product.sellingPrice,
        mrp: product.mrp,
        image: product.imageUrl || '',
        veg: product.veg,
      };

      addToCart(cart.cartId, cartProduct, authData.jwt, authData.phone);
    },
    [cart, authData, addToCart, featuredProducts, convertToProduct]
  );

  const handleIncrementSuggested = useCallback(
    (item: { id: string; name: string; price: number; image: number }) => {
      const index = featuredProducts.findIndex(p => p.name === item.name);
      const product = convertToProduct(item, index);

      if (!cart || !authData?.jwt || !authData?.phone) return;
      increment(cart.cartId, product.sku, authData.jwt, authData.phone);
    },
    [cart, authData, increment, featuredProducts, convertToProduct]
  );

  const handleDecrementSuggested = useCallback(
    (item: { id: string; name: string; price: number; image: number }) => {
      const index = featuredProducts.findIndex(p => p.name === item.name);
      const product = convertToProduct(item, index);

      if (!cart || !authData?.jwt || !authData?.phone) return;
      decrement(cart.cartId, product.sku, authData.jwt, authData.phone);
    },
    [cart, authData, decrement, featuredProducts, convertToProduct]
  );

  const handleCheckout = useCallback(async () => {
    // const shouldShowCompulsoryModal =
    //   !permissionDataInAuth?.permission ||
    //   (selectedAddress && selectedAddress.isSavedAddress === false);
    const shouldShowCompulsoryModal = !selectedSmartBizAddress;

    if (shouldShowCompulsoryModal) {
      // setShowAddressModal(true);
      setShowSmartBizAddressModal(true);
      return;
    }

    // Prevent checkout if beyond delivery radius
    const maxKm = deliveryRadiusKm ?? 5;
    if (distanceKm != null && distanceKm > maxKm) {
      setShowDistanceModal(true);
      return;
    }

    if (!selectedPaymentOption || selectedPaymentOption.trim() === '') {
      setShowPaymentModal(true);
      return;
    }

    // Validate required data
    if (!cart || !vendor || !selectedAddress || !authData?.jwt || !authData?.phone) {
      navigation.navigate('OrderFailure', {
        errorMessage: 'Missing required information. Please try again.',
      });
      return;
    }

    setIsOrderLoading(true);

    try {
      // Step 1: Create Order
      const orderRequest: CreateOrderRequest = {
        shopId: parseInt(vendor.shopId, 10),
        cartId: cart.smartBizCartId,
        orderSource: 'CONSTELLATION',
        customerAddressId: selectedSmartBizAddress?.id || '',
        fulfillmentOption: 'DELIVERY',
        notificationMobileNumber: selectedAddress.phone,
        notificationEmail: null,
        customerName: selectedAddress.name || 'Customer',
        paymentMethod: selectedPaymentOption.toUpperCase(),
      };

      const orderResponse = await orderService.createOrder(
        orderRequest,
        authData.jwt,
        authData.phone
      );

      // Step 2: Create Payment
      const paymentRequest: CreatePaymentRequest = {
        customerId: parseInt(orderResponse.customerId, 10),
        mobileNumber: authData.phone,
        name: selectedAddress.name,
        orderId: orderResponse.orderId,
        tenders: [
          {
            amount: orderResponse.totalOrderAmount,
            status: 'CREATED',
            type: 'COMPLETION',
            paymentMethod: selectedPaymentOption.toUpperCase(),
            additionalTenderCharges: 10, // This should come from payment configuration
          },
        ],
      };

      await createPaymentService.createPayment(paymentRequest, authData.jwt, authData.phone);

      // Both APIs successful - Clear cart and navigate to success screen
      if (cart && authData?.jwt && authData?.phone) {
        await clearCart(cart.cartId, authData.jwt, authData.phone);
      }

      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}${getOrdinalSuffix(
        currentDate.getDate()
      )} ${currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })} • ${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}`;

      navigation.navigate('OrderSuccess', {
        orderId: orderResponse.orderId,
        amount: orderResponse.totalOrderAmount,
        date: formattedDate,
        shopId: vendor.shopId,
      });
    } catch (error: unknown) {
      // Check for specific store not active error
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

        // Only show opening time if store is closed due to time (not manually closed)
        // If storeActive is false, it's manually closed - don't show opening time
        // If status.isOpen would be true based on time but backend says closed, it's manual
        const nextOpenTime = status?.nextOpeningTime;
        const isTimeBased = vendor?.storeActive !== false && nextOpenTime;
        const opensAtText = isTimeBased
          ? ` Opens at ${formatTimeToAMPM(nextOpenTime)}.`
          : '';

        setStoreClosedModal({
          visible: true,
          message: `The store is closed at the moment.${opensAtText} Please try again later.`,
        });
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Order creation failed. Please try again.';

      // Navigate to failure screen with error message
      navigation.navigate('OrderFailure', {
        errorMessage,
      });
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
  ]);

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = useCallback((day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  }, []);

  const handleAddressSelect = useCallback(
    (address: Address) => {
      setSelectedAddress(address);
      setShowAddressModal(false);
    },
    [setSelectedAddress]
  );

  const handleSmartBizAddressSelect = useCallback((address: SmartBizAddress) => {
    setSelectedSmartBizAddress(address);
    setShowSmartBizAddressModal(false);
  }, []);

  const handleCouponNavigation = useCallback(() => {
    if (vendor?.shopId) {
      navigation.navigate('Coupons');
    }
  }, [vendor?.shopId, navigation]);

  const handleEditCoupon = useCallback(() => {
    navigation.navigate('Coupons');
  }, [navigation]);

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

  // Memoized utility functions
  const getFormattedAddress = useCallback(() => {
    if (!selectedSmartBizAddress) {
      return 'Select delivery address';
    }

    const { addressLine1, city, state } = selectedSmartBizAddress?.address;
    const parts = [addressLine1, city, state].filter(Boolean);
    const base = parts.join(', ');
    return distanceText ? `${base} • ${distanceText}` : base;
  }, [selectedSmartBizAddress, distanceText]);

  const isCheckoutDisabled = useMemo(() => {
    return !selectedPaymentOption || Boolean(paymentMethodsError) || isOrderLoading;
  }, [selectedPaymentOption, paymentMethodsError, isOrderLoading]);

  // Effects
  React.useEffect(() => {
    const initializeCart = async () => {
      if (vendor?.shopId && authData?.jwt && authData?.phone) {
        // Fetch addresses first
        await smartBizAddressService.fetchAddresses(vendor.shopId, authData.jwt, authData.phone);

        // Auto-select default address if none selected
        if (!selectedSmartBizAddress) {
          const defaultAddress = smartBizAddressService.getDefaultAddress(vendor.shopId);
          if (defaultAddress) {
            setSelectedSmartBizAddress(defaultAddress);
          } else {
            // If no default, select first available address
            const addresses = smartBizAddressService.getAddresses(vendor.shopId);
            if (addresses.length > 0) {
              setSelectedSmartBizAddress(addresses[0]);
            }
          }
        }

        // Then fetch coupons after addresses are loaded
        await checkAndFetchOffers(vendor.shopId, authData);
      }
    };

    initializeCart();
  }, [vendor?.shopId, authData?.jwt, authData?.phone, checkAndFetchOffers, selectedSmartBizAddress]);

  // Revalidate coupons when cart contents change
  React.useEffect(() => {
    if (vendor?.shopId && cart && authData?.jwt && authData?.phone) {
      // Revalidate coupons when cart items or total amount changes
      checkAndFetchOffers(vendor.shopId, authData);
    }
  }, [
    cartItems.length,
    cart?.totalCartAmount,
    vendor?.shopId,
    checkAndFetchOffers,
    authData?.jwt,
    authData?.phone,
  ]);

  // Refresh cart data when screen loads
  React.useEffect(() => {
    const refreshCartData = async () => {
      if (!cart?.cartId || !authData?.jwt || !authData?.phone) return;

      // Refresh cart data to ensure we have the latest state from server
      await refreshCart(cart.cartId, authData.jwt, authData.phone);

      // After cart refresh, revalidate coupons
      if (vendor?.shopId) {
        await checkAndFetchOffers(vendor.shopId, authData);
      }
    };

    refreshCartData();
  }, [
    cart?.cartId,
    authData?.jwt,
    authData?.phone,
    refreshCart,
    vendor?.shopId,
    checkAndFetchOffers,
    authData,
  ]);

  // Sync activeCartId if we found a cart via fallback
  React.useEffect(() => {
    if (cart && !activeCartId) {
      setActiveCart(cart.cartId);
    }
  }, [cart?.cartId, activeCartId, setActiveCart]);

  // Set default payment option when payment methods are loaded
  React.useEffect(() => {
    if (availableOptions.length > 0 && !selectedPaymentOption) {
      const codOption = availableOptions.find(option => option.key === 'cod' && option.available);
      if (codOption) {
        setSelectedPaymentOption('cod');
      }
    }
  }, [availableOptions, selectedPaymentOption]);

  // Resolve SmartBiz AddressId for selected address tag when landing on Cart
  // React.useEffect(() => {
  //   const resolveSmartBizAddress = async () => {
  //     try {
  //       if (!vendor?.shopId || !authData?.jwt || !authData?.phone || !selectedAddress?.tag) {
  //         setSmartBizAddressId(null);
  //         return;
  //       }
  //       const map = await smartBizAddressService.fetchSmartBizAddressIds(
  //         vendor.shopId,
  //         authData.jwt,
  //         authData.phone
  //       );
  //       const tag = selectedAddress.tag;
  //       const matched = map[tag];
  //       setSmartBizAddressId(matched || null);
  //     } catch (_e) {
  //       setSmartBizAddressId(null);
  //     }
  //   };
  //   resolveSmartBizAddress();
  // }, [vendor?.shopId, authData?.jwt, authData?.phone, selectedAddress?.tag]);

  // Fetch featured products for vendor as suggested items
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

  // Return empty state if cart or vendor is not available
  if (isOrderLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: getColor('background'), justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={getColor('primary')} />
        <Text style={{ marginTop: 16, color: getColor('text'), fontSize: 16, fontWeight: '500' }}>
          Placing your order, hold on...
        </Text>
      </View>
    );
  }

  if (!cart || !vendor || cartItems.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: getColor('background'), justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <MaterialCommunityIcons name="cart-off" size={80} color={getColor('subText')} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: getColor('text'), marginTop: 20 }}>Your cart is empty</Text>
        <Text style={{ fontSize: 16, color: getColor('subText'), textAlign: 'center', marginTop: 10 }}>Looks like you haven't added anything to your cart yet.</Text>
        <TouchableOpacity
          style={{ marginTop: 30, backgroundColor: getColor('primary'), paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }}
          onPress={() => navigation.navigate('MainApp', { screen: 'Home' } as any)}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Start Shopping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: getColor('background') }}
      edges={['top', 'bottom']}
    >
      <CartHeader
        onBack={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainApp'))}
        onClearCart={handleClearCart}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 240 }}>
        <AnimatedCard delay={0}>
          {vendor && <VendorPill vendor={vendor} />}

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
            appliedCoupon={appliedCoupon}
            couponLoading={vendorOffersLoading || customerOffersLoading}
            couponError={Boolean(vendorOffersError || customerOffersError)}
            availableCoupons={availableCoupons}
            onCouponNavigation={handleCouponNavigation}
            onEditCoupon={handleEditCoupon}
          />
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <PaymentOptions
            onPress={handlePaymentOptionsPress}
            selectedOption={selectedPaymentOption}
            loading={paymentMethodsLoading}
            error={paymentMethodsError}
            onRetry={refetchPaymentMethods}
          />
        </AnimatedCard>

        <AnimatedCard delay={300}>
          <PaymentSummary
            expanded={paymentExpanded}
            onToggle={() => setPaymentExpanded(e => !e)}
            cart={cart}
            codCharges={codCharges}
            selectedPaymentOption={selectedPaymentOption}
          />
        </AnimatedCard>

        {/* <AnimatedCard delay={400}>
          <SuggestedItems
            products={featuredProducts}
            onItemPress={handleAddSuggested}
            onAdd={handleAddSuggested}
            onIncrement={handleIncrementSuggested}
            onDecrement={handleDecrementSuggested}
          />
        </AnimatedCard> */}
      </ScrollView>

      <CartFooter
        address={getFormattedAddress()}
        onSelectAddress={() => setShowSmartBizAddressModal(true)}
        onCheckout={handleCheckout}
        disabled={isCheckoutDisabled}
        loading={isOrderLoading}
      />

      {/* SmartBiz Address Selection Button */}
      {/* {vendor && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 140,
            right: 20,
            backgroundColor: getColor('primary'),
            borderRadius: 28,
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
          onPress={() => setShowSmartBizAddressModal(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="map-marker-multiple" size={24} color={getColor('white')} />
        </TouchableOpacity>
      )} */}

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
          error={paymentMethodsError}
          loading={paymentMethodsLoading}
          onRetry={refetchPaymentMethods}
        />
      </Modal>

      {/* Distance Warning Modal */}
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

      {/* Store Closed Modal */}
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
              style={[
                styles.storeClosedIconBadge,
                { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
              ]}
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
    </SafeAreaView>
  );
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
  // Store Closed Modal Styles
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
});
