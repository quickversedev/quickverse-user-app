import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CartFooter,
  CartHeader,
  CartItemList,
  CouponSection,
  PaymentSummary,
  SuggestedItems,
  VendorPill,
} from '../../components/modules/Cart';
import { AddressSelectionModal } from '../../components/modules/Header/AddressSelectionModal';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import useCartStore from '../../store/cart/cartStore';
import useCouponStore from '../../store/cart/couponStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Address } from '../../types/address';

type CartScreenRouteProp = RouteProp<RootStackParamList, 'Cart'>;
type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

interface SuggestedItem {
  name: string;
  price: number;
  image: number;
}

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

  // Theme
  const { getColor } = useTheme();

  // Derived state
  const cart = cartId ? carts[cartId] : activeCartId ? carts[activeCartId] : undefined;
  const cartItems = cart ? Object.values(cart.products) : [];
  const vendor = vendors.find(v => v.shopId === cart?.cartId.replace('vendor_', ''));
  const appliedCoupon = cart ? getAppliedCoupon(cart.cartId) : undefined;
  const availableCoupons = getAvailableCoupons(vendor?.shopId || '');

  // Mock data
  const suggestedItems: SuggestedItem[] = [
    { name: 'Choco Lava Cake', price: 20, image: require('../../assets/images/bg_1.png') },
    { name: 'Choco Lava Cake', price: 20, image: require('../../assets/images/bg_1.png') },
    { name: 'Choco Lava Cake', price: 20, image: require('../../assets/images/bg_1.png') },
  ];

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

  const handleAddSuggested = (_idx: number) => {
    // TODO: Implement suggested item addition
  };

  const handleCheckout = () => {
    const shouldShowCompulsoryModal =
      !permissionDataInAuth?.permission ||
      permissionDataInAuth?.permission !== 'granted' ||
      (selectedAddress && selectedAddress.isSavedAddress === false);

    if (shouldShowCompulsoryModal) {
      setShowAddressModal(true);
      return;
    }

    navigation.navigate('Payment');
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

        <PaymentSummary
          expanded={paymentExpanded}
          onToggle={() => setPaymentExpanded(e => !e)}
          cart={cart}
        />

        <SuggestedItems items={suggestedItems} onAdd={handleAddSuggested} />
      </ScrollView>

      <CartFooter
        address={getFormattedAddress()}
        onSelectAddress={() => setShowAddressModal(true)}
        onCheckout={handleCheckout}
      />

      <AddressSelectionModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
        selectedAddress={selectedAddress}
        needCompulsoryAddress={true}
      />
    </SafeAreaView>
  );
};

export default CartScreen;
