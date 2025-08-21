import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
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
  const { carts, activeCartId, increment, decrement, clearCart } = useCartStore();
  const { vendors } = useVendorStore();
  const {
    getAppliedCoupon,
    removeCoupon,
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
  // Derived state
  const cart = cartId ? carts[cartId] : activeCartId ? carts[activeCartId] : undefined;
  const cartItems = cart ? Object.values(cart.products) : [];
  const vendor = vendors.find(v => v.shopId === cart?.cartId.replace('vendor_', ''));
  const appliedCoupon = cart ? getAppliedCoupon(cart.cartId) : undefined;
  const availableCoupons = getAvailableCoupons(vendor?.shopId || '');
  console.log('smartBizAddressId', smartBizAddressId);
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
  const codCharges = getCODCharges(paymentMethods);

  // console.log('cart', cart);
  // console.log('vendor', vendor);
  // Event handlers
  const handleClearCart = () => {
    if (cart && authData?.jwt) {
      clearCart(cart.cartId, authData.jwt, authData.phone || '');
      navigation.goBack();
    }
  };

  const handleInc = (sku: string) => {
    if (cart && authData?.jwt) {
      increment(cart.cartId, sku, authData.jwt, authData.phone || '');
    }
  };

  const handleDec = (sku: string) => {
    if (cart && authData?.jwt) {
      decrement(cart.cartId, sku, authData.jwt, authData.phone || '');
    }
  };

  const handleAddSuggested = (_item: any) => {
    // TODO: Implement suggested item addition
    // console.log('Adding suggested item:', item);
  };

  const handleCheckout = async () => {
    const shouldShowCompulsoryModal =
      !permissionDataInAuth?.permission ||
      permissionDataInAuth?.permission !== 'granted' ||
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

      await createPaymentService.createPayment(paymentRequest, authData.jwt);

      // Both APIs successful - Navigate to success screen
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
      });

      // TODO: Clear the cart after successful order placement
      // if (cart && authData?.jwt) {
      //   await clearCart(cart.cartId, authData.jwt, authData.phone);
      // }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Order creation failed. Please try again.';
      console.error('Order/Payment creation failed:', error);

      // Navigate to failure screen with error message
      navigation.navigate('OrderFailure', {
        errorMessage,
      });
    } finally {
      setIsOrderLoading(false);
    }
  };

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (day: number) => {
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
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
  };

  const handleCouponNavigation = () => {
    if (vendor?.shopId) {
      navigation.navigate('Coupons');
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon(cart?.cartId || '');
  };

  const handlePaymentOptionsPress = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
  };

  const handlePaymentConfirm = (selectedOption: string, _upiId?: string) => {
    setSelectedPaymentOption(selectedOption);
    setShowPaymentModal(false);
    // Here you can handle the payment confirmation logic
  };

  // Utility functions
  const getFormattedAddress = () => {
    if (!selectedAddress) {
      return 'Select delivery address';
    }

    const { addressLine1, city, state } = selectedAddress;
    const parts = [addressLine1, city, state].filter(Boolean);
    return parts.join(', ');
  };

  // Effects
  React.useEffect(() => {
    if (vendor?.shopId) {
      checkAndFetchOffers(vendor.shopId, authData);
    }
  }, [vendor?.shopId, checkAndFetchOffers, authData]);

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
          onRemoveCoupon={handleRemoveCoupon}
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
          onIncrement={handleAddSuggested}
          onDecrement={handleAddSuggested}
        />
      </ScrollView>

      <CartFooter
        address={getFormattedAddress()}
        onSelectAddress={() => setShowAddressModal(true)}
        onCheckout={handleCheckout}
        disabled={!selectedPaymentOption || Boolean(paymentMethodsError) || isOrderLoading}
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

export default CartScreen;
