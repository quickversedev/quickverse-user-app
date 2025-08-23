import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useCallback, useMemo } from 'react';
import { Modal, ScrollView } from 'react-native';
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
import { SuggestedItem } from '../../components/modules/Cart/SuggestedItems';
import { AddressSelectionModal } from '../../components/modules/Header/AddressSelectionModal';
import SuggestedItems from '../../components/modules/Product/SuggestedItems';
import { useAuth } from '../../contexts/login/AuthProvider';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { RootStackParamList } from '../../routes/AppStack';
import orderService, { CreateOrderRequest } from '../../services/createOrderService';
import createPaymentService, { CreatePaymentRequest } from '../../services/createPaymentService';
import { getCODCharges } from '../../services/paymentService';
import smartBizAddressService from '../../services/smartBizAddressService';
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
  const [smartBizAddressId, setSmartBizAddressId] = React.useState<string | null>(null);

  // Memoized derived state
  const cart = useMemo(() => {
    return cartId ? carts[cartId] : activeCartId ? carts[activeCartId] : undefined;
  }, [cartId, activeCartId, carts]);

  const cartItems = useMemo(() => {
    return cart ? Object.values(cart.products) : [];
  }, [cart]);

  const vendor = useMemo(() => {
    return vendors.find(v => v.shopId === cart?.cartId.replace('vendor_', ''));
  }, [vendors, cart?.cartId]);

  const appliedCoupon = useMemo(() => {
    return cart ? getAppliedCoupon(cart.cartId) : undefined;
  }, [cart, getAppliedCoupon]);

  const availableCoupons = useMemo(() => {
    return getAvailableCoupons(vendor?.shopId || '');
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
    (item: Product | SuggestedItem, index: number): Product => {
      const isSuggestedItem = (i: any): i is SuggestedItem => !('rating' in i);
      if (!isSuggestedItem(item)) return item as Product;
      if (index === -1) throw new Error('Invalid suggested item');
      const shopId = cart?.cartId.replace('vendor_', '') || '';
      return {
        sku: item.sku,
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
        primarySKU: item.sku,
        id: item.sku,
        tags: [],
      };
    },
    [cart]
  );

  const handleAddSuggested = useCallback(
    (item: Product | SuggestedItem) => {
      const isSuggestedItem = (i: Product | SuggestedItem): i is SuggestedItem => !('sku' in i);
      const index = isSuggestedItem(item)
        ? featuredProducts.findIndex(p => p.sku === item.sku)
        : -1;
      const product = convertToProduct(item, index);

      if (!cart || !authData?.jwt || !authData?.phone) return;

      const cartProduct = {
        sku: product.id,
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
    (item: Product | SuggestedItem) => {
      const isSuggestedItem = (i: Product | SuggestedItem): i is SuggestedItem => !('sku' in i);
      const index = isSuggestedItem(item)
        ? featuredProducts.findIndex(p => p.name === item.name)
        : -1;
      const product = convertToProduct(item, index);

      if (!cart || !authData?.jwt || !authData?.phone) return;
      increment(cart.cartId, product.sku, authData.jwt, authData.phone);
    },
    [cart, authData, increment, featuredProducts, convertToProduct]
  );

  const handleDecrementSuggested = useCallback(
    (item: Product | SuggestedItem) => {
      const isSuggestedItem = (i: Product | SuggestedItem): i is SuggestedItem => !('sku' in i);
      const index = isSuggestedItem(item)
        ? featuredProducts.findIndex(p => p.name === item.name)
        : -1;
      const product = convertToProduct(item, index);

      if (!cart || !authData?.jwt || !authData?.phone) return;
      decrement(cart.cartId, product.sku, authData.jwt, authData.phone);
    },
    [cart, authData, decrement, featuredProducts, convertToProduct]
  );

  const handleCheckout = useCallback(async () => {
    const shouldShowCompulsoryModal =
      !permissionDataInAuth?.permission ||
      (selectedAddress && selectedAddress.isSavedAddress === false);

    if (shouldShowCompulsoryModal) {
      setShowAddressModal(true);
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
        customerAddressId: smartBizAddressId || selectedAddress.addressID,
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
        customerId: orderResponse.customerId,
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
    smartBizAddressId,
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
    if (!selectedAddress) {
      return 'Select delivery address';
    }

    const { addressLine1, city, state } = selectedAddress;
    const parts = [addressLine1, city, state].filter(Boolean);
    return parts.join(', ');
  }, [selectedAddress]);

  const isCheckoutDisabled = useMemo(() => {
    return !selectedPaymentOption || Boolean(paymentMethodsError) || isOrderLoading;
  }, [selectedPaymentOption, paymentMethodsError, isOrderLoading]);

  // Effects
  React.useEffect(() => {
    if (vendor?.shopId) {
      checkAndFetchOffers(vendor.shopId, authData);
    }
  }, [vendor?.shopId, checkAndFetchOffers, authData]);

  // Revalidate coupons when cart contents change
  React.useEffect(() => {
    if (vendor?.shopId && cart) {
      // Revalidate coupons when cart items or total amount changes
      checkAndFetchOffers(vendor.shopId, authData);
    }
  }, [cartItems.length, cart?.totalCartAmount, vendor?.shopId, checkAndFetchOffers, authData]);

  // Refresh cart data when screen loads
  React.useEffect(() => {
    if (cart && authData?.jwt && authData?.phone) {
      // Refresh cart data to ensure we have the latest state from server
      refreshCart(cart.cartId, authData.jwt, authData.phone);
    }
  }, [cart?.cartId, authData?.jwt, authData?.phone, refreshCart]);

  React.useEffect(() => {
    if (cartItems.length === 0) {
      navigation.goBack();
    }
  }, [cartItems.length, navigation]);

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
  React.useEffect(() => {
    const resolveSmartBizAddress = async () => {
      try {
        if (!vendor?.shopId || !authData?.jwt || !authData?.phone || !selectedAddress?.tag) {
          setSmartBizAddressId(null);
          return;
        }
        const map = await smartBizAddressService.fetchSmartBizAddressIds(
          vendor.shopId,
          authData.jwt,
          authData.phone
        );
        const tag = selectedAddress.tag;
        const matched = map[tag];
        setSmartBizAddressId(matched || null);
      } catch (_e) {
        setSmartBizAddressId(null);
      }
    };
    resolveSmartBizAddress();
  }, [vendor?.shopId, authData?.jwt, authData?.phone, selectedAddress?.tag]);

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
        onSelectAddress={() => setShowAddressModal(true)}
        onCheckout={handleCheckout}
        disabled={isCheckoutDisabled}
        loading={isOrderLoading}
      />

      <AddressSelectionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
        needCompulsoryAddress={true}
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
