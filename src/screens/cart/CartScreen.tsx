import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo } from 'react';
import { Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import SuggestedItems from '../../components/modules/Product/SuggestedItems';
import { useAuth } from '../../contexts/login/AuthProvider';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { RootStackParamList } from '../../routes/AppStack';
import orderService, { CreateOrderRequest } from '../../services/createOrderService';
import createPaymentService, { CreatePaymentRequest } from '../../services/createPaymentService';
import { getCODCharges } from '../../services/paymentService';
import { SmartBizAddress, smartBizAddressService } from '../../store/address/smartBizAddressStore';
import useCartStore from '../../store/cart/cartStore';
import useCouponStore from '../../store/cart/couponStore';
import useFeaturedProductsStore from '../../store/products/featuredProductsStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Address } from '../../types/address';
import { Product } from '../../types/product';
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

  // Theme
  const { getColor } = useTheme();
  const { getFeaturedProducts } = useFeaturedProductsStore();
  const [featuredProducts, setFeaturedProducts] = React.useState<Product[]>([]);
  // const [smartBizAddressId, setSmartBizAddressId] = React.useState<string | null>(null);

  // Memoized derived state
  const cart = useMemo(() => {
    const selectedCart = cartId ? carts[cartId] : activeCartId ? carts[activeCartId] : undefined;
    // Ensure cart has required properties
    if (selectedCart && !selectedCart.cartId) {
      console.warn('Cart missing cartId property:', selectedCart);
      return undefined;
    }
    return selectedCart;
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

  // Memoized event handlers
  const handleClearCart = useCallback(() => {
    if (cart && authData?.jwt) {
      clearCart(cart.cartId, authData.jwt, authData.phone || '');
      navigation.goBack();
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
  console.log('selectedSmartBizAddress', selectedSmartBizAddress);
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
        Alert.alert('Store Closed', 'The store is closed at the moment. Please try again later.', [
          {
            text: 'OK',
            onPress: async () => {
              navigation.navigate('MainApp');
            },
          },
        ]);
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
    return parts.join(', ');
  }, [selectedSmartBizAddress]);

  const isCheckoutDisabled = useMemo(() => {
    return !selectedPaymentOption || Boolean(paymentMethodsError) || isOrderLoading;
  }, [selectedPaymentOption, paymentMethodsError, isOrderLoading]);

  // Effects
  React.useEffect(() => {
    const initializeCart = async () => {
      if (vendor?.shopId && authData?.jwt && authData?.phone) {
        // Fetch addresses first
        await smartBizAddressService.fetchAddresses(vendor.shopId, authData.jwt, authData.phone);
        // console.log('smartBizAddressService.fetchAddresses', smartBizAddressService.getAddresses());
        // Then fetch coupons after addresses are loaded
        await checkAndFetchOffers(vendor.shopId, authData);
      }
    };

    initializeCart();
  }, [vendor?.shopId, authData?.jwt, authData?.phone, checkAndFetchOffers]);

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
      if (cart && authData?.jwt && authData?.phone) {
        // Refresh cart data to ensure we have the latest state from server
        await refreshCart(cart.cartId, authData.jwt, authData.phone);

        // After cart refresh, revalidate coupons
        if (vendor?.shopId) {
          await checkAndFetchOffers(vendor.shopId, authData);
        }
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

  React.useEffect(() => {
    if (!cart || cartItems.length === 0) {
      navigation.goBack();
    }
  }, [cart, cartItems.length, navigation]);

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

  // Early return if cart or vendor is not available
  if (!cart || !vendor) {
    return null;
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: getColor('background') }}
      edges={['top', 'bottom']}
    >
      <CartHeader onBack={() => navigation.goBack()} onClearCart={handleClearCart} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {vendor && <VendorPill vendor={vendor} />}

        <CartItemList
          items={cartItems}
          onInc={handleInc}
          onDec={handleDec}
          vendor={vendor}
          navigation={navigation}
        />

        <CouponSection
          appliedCoupon={appliedCoupon}
          couponLoading={vendorOffersLoading || customerOffersLoading}
          couponError={Boolean(vendorOffersError || customerOffersError)}
          availableCoupons={availableCoupons}
          onCouponNavigation={handleCouponNavigation}
          onEditCoupon={handleEditCoupon}
        />

        <PaymentOptions
          onPress={handlePaymentOptionsPress}
          selectedOption={selectedPaymentOption}
          loading={paymentMethodsLoading}
          error={paymentMethodsError}
          onRetry={refetchPaymentMethods}
        />

        <PaymentSummary
          expanded={paymentExpanded}
          onToggle={() => setPaymentExpanded(e => !e)}
          cart={cart}
          codCharges={codCharges}
          selectedPaymentOption={selectedPaymentOption}
        />

        <SuggestedItems
          products={featuredProducts}
          onItemPress={handleAddSuggested}
          onAdd={handleAddSuggested}
          onIncrement={handleIncrementSuggested}
          onDecrement={handleDecrementSuggested}
        />
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
    </SafeAreaView>
  );
};

export default React.memo(CartScreen);
