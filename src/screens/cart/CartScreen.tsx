import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Icons, Images } from '../../assets';
import { VegIcon } from '../../components/common';
import { AddressSelectionModal } from '../../components/modules/Header/AddressSelectionModal';
import AddButton from '../../components/modules/Product/AddButton';
import ProductCard from '../../components/modules/Product/ProductCard';
import QuantitySelector from '../../components/modules/Product/QuantitySelector';
import { useAuth } from '../../contexts/login/AuthProvider';
import { RootStackParamList } from '../../routes/AppStack';
import useCartStore, { CartProduct } from '../../store/cart/cartStore';
import useCouponStore from '../../store/cart/couponStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';
import { Address } from '../../types/address';
import { Vendor } from '../../types/vendor';

type CartScreenRouteProp = RouteProp<RootStackParamList, 'Cart'>;
type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

interface CartItemProps extends CartProduct {
  tag?: string;
  onInc: () => void;
  onDec: () => void;
}

interface SuggestedItem {
  name: string;
  price: number;
  image: number;
}

// CartItem: single cart item row
const CartItem: React.FC<CartItemProps> = ({
  name,
  price,
  quantity,
  tag,
  onInc,
  onDec,
  image,
  veg,
}) => {
  const { getColor, getTypography, theme } = useTheme();

  const itemStyles = StyleSheet.create({
    cartItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    cartItemImg: {
      width: 64,
      height: 64,
      borderRadius: theme.borderRadius.md,
      backgroundColor: getColor('button').default.background,
      marginRight: 14,
    },
    cartItemName: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginRight: 8,
    },
    vegIcon: {
      width: 16,
      height: 16,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: getColor('primary'),
      backgroundColor: getColor('primary'),
      marginLeft: 2,
    },
    cartItemMRP: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      textDecorationLine: 'line-through',
      marginRight: 6,
      fontWeight: 'bold',
    },
    cartItemPrice: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
    qtyCol: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 45,
      justifyContent: 'center',
      minWidth: 70,
    },
    qtyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: getColor('button').default.background,
      backgroundColor: getColor('card'),
      paddingHorizontal: 10,
      paddingVertical: 2,
      minWidth: 70,
      justifyContent: 'center',
    },
    qtyBtn: { paddingHorizontal: 8, paddingVertical: 2 },
    qtyBtnText: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
    qtyNum: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginHorizontal: 8,
    },
    cartItemTag: {
      backgroundColor: getColor('card'),
      borderColor: getColor('button').default.background,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 6,
      alignSelf: 'flex-end',
    },
    cartItemTagText: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
  });

  return (
    <View style={itemStyles.cartItemRow}>
      <Image
        source={typeof image === 'number' ? image : { uri: image }}
        style={itemStyles.cartItemImg}
      />
      <View style={{ flex: 1, minWidth: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
          <Text style={itemStyles.cartItemName}>{name}</Text>
          <VegIcon veg={veg} size="small" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={itemStyles.cartItemMRP}>₹79</Text>
          <Text style={itemStyles.cartItemPrice}>₹{price}</Text>
        </View>
      </View>
      <View style={itemStyles.qtyCol}>
        {quantity > 0 ? (
          <QuantitySelector
            quantity={quantity}
            onIncrement={onInc}
            onDecrement={onDec}
            size="regular"
          />
        ) : (
          <AddButton onPress={onInc} size="regular" />
        )}

        {tag && (
          <View style={itemStyles.cartItemTag}>
            <Text style={itemStyles.cartItemTagText}>{tag}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// CartItemList: list of cart items
const CartItemList: React.FC<{
  items: CartProduct[];
  onInc: (sku: string) => void;
  onDec: (sku: string) => void;
  vendor?: Vendor;
  navigation: CartScreenNavigationProp;
}> = ({ items, onInc, onDec, vendor, navigation }) => {
  const { getColor, getTypography, theme } = useTheme();

  const listStyles = StyleSheet.create({
    cartItemListBox: {
      borderColor: getColor('primary'),
      borderTopLeftRadius: 0,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomLeftRadius: theme.borderRadius.md,
      borderBottomRightRadius: theme.borderRadius.md,
      margin: 16,
      marginTop: 0,
      padding: 16,
      backgroundColor: getColor('card'),
      overflow: 'visible',
    },
    addMoreInputRow: { marginTop: 8, marginHorizontal: 4 },
    addMoreInput: {
      borderWidth: 1,
      borderColor: getColor('subText'),
      borderRadius: theme.borderRadius.sm,
      padding: 6,
      color: getColor('subText'),
      backgroundColor: getColor('card'),
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
  });

  return (
    <View style={listStyles.cartItemListBox}>
      {items.map(item => (
        <CartItem
          key={item.sku}
          {...item}
          tag={item.sku === 'sku2' ? '250 ML' : undefined}
          onInc={() => onInc(item.sku)}
          onDec={() => onDec(item.sku)}
        />
      ))}
      <TouchableOpacity
        style={listStyles.addMoreInputRow}
        onPress={() => {
          if (vendor) {
            navigation.navigate('VendorProduct', {
              vendor: vendor,
            });
          }
        }}
      >
        <View style={listStyles.addMoreInput}>
          <Text style={[listStyles.addMoreInput, { borderWidth: 0 }]}>+ Add More Items</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// PaymentSummary: collapsible
const PaymentSummary: React.FC<{ expanded: boolean; onToggle: () => void }> = ({
  expanded,
  onToggle,
}) => {
  const { getColor, getTypography, theme } = useTheme();

  const summaryStyles = StyleSheet.create({
    paymentSummaryBox: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      margin: 16,
      padding: 16,
    },
    billDetailsTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    titleLine: {
      flex: 1,
      height: 1,
      backgroundColor: getColor('border'),
    },
    titleText: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('subtitle'),
      marginHorizontal: 12,
      textTransform: 'uppercase',
    },
    billBreakdown: {
      backgroundColor: getColor('background'),
      borderRadius: theme.borderRadius.sm,
      padding: 16,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    billRowLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 0,
    },
    billLabel: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: '500',
    },
    billAmount: {
      color: getColor('text'),
      fontSize: getTypography('body'),
      fontWeight: 'bold',
    },
    dottedLine: {
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: getColor('border'),
      marginVertical: 8,
    },
    paymentSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    paymentSummaryTitle: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
      marginLeft: 8,
    },
    paymentSummaryAmount: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginHorizontal: 8,
    },
    paymentSummaryDetails: { marginTop: 8 },
    paymentSummaryDetailText: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      marginBottom: 2,
    },
  });

  return (
    <View style={summaryStyles.paymentSummaryBox}>
      <TouchableOpacity style={summaryStyles.paymentSummaryHeader} onPress={onToggle}>
        <MaterialCommunityIcons
          name="file-document-outline"
          size={20}
          color={getColor('button').default.background}
        />
        <Text style={summaryStyles.paymentSummaryTitle}>Total Bill (Inc. Taxes and Charges)</Text>
        <View style={{ flex: 1 }} />
        <Text style={summaryStyles.paymentSummaryAmount}>₹186</Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={getColor('button').default.background}
        />
      </TouchableOpacity>
      {expanded && (
        <View style={summaryStyles.paymentSummaryDetails}>
          <View style={summaryStyles.billDetailsTitle}>
            <View style={summaryStyles.titleLine} />
            <Text style={summaryStyles.titleText}>Bill Details</Text>
            <View style={summaryStyles.titleLine} />
          </View>
          <View style={summaryStyles.billBreakdown}>
            <View style={summaryStyles.billRow}>
              <Text style={summaryStyles.billLabel}>Sub Total</Text>
              <Text style={summaryStyles.billAmount}>₹158</Text>
            </View>
            <View style={summaryStyles.dottedLine} />
            <View style={summaryStyles.billRow}>
              <Text style={summaryStyles.billLabel}>Delivery Fee</Text>
              <Text style={summaryStyles.billAmount}>₹28</Text>
            </View>
            <View style={summaryStyles.dottedLine} />
            <View style={summaryStyles.billRowLast}>
              <Text style={summaryStyles.billLabel}>Total Pay</Text>
              <Text style={summaryStyles.billAmount}>₹186</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// SuggestedItems: horizontal scroll
const SuggestedItems: React.FC<{ items: SuggestedItem[]; onAdd: (idx: number) => void }> = ({
  items,
  onAdd,
}) => {
  const { getColor, getTypography, theme } = useTheme();

  const suggestedStyles = StyleSheet.create({
    suggestedBox: {
      margin: 16,
      backgroundColor: getColor('card'),
      padding: 16,
      borderRadius: theme.borderRadius.md,
    },
    suggestedTitle: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginBottom: 8,
    },
  });

  return (
    <View style={suggestedStyles.suggestedBox}>
      <Text style={suggestedStyles.suggestedTitle}>Add a little somethin&apos;</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item, idx) => {
          // Create a mock product object from SuggestedItem
          const mockProduct = {
            sku: `suggested_${idx}`,
            shopId: 'mock_shop',
            name: item.name,
            mrp: item.price + 10,
            sellingPrice: item.price,
            gst: 0,
            category: 'suggested',
            division: 'suggested',
            subDivision: 'suggested',
            brand: 'suggested',
            description: '',
            imageUrl: item.image,
            discount: 0,
            numberOfVariants: 1,
            currentStock: 10,
            inStock: true,
            primarySKU: `suggested_${idx}`,
            tags: [],
            veg: true, // Add missing veg property
          };

          return (
            <ProductCard
              key={idx}
              product={mockProduct}
              quantity={0}
              onAdd={() => onAdd(idx)}
              onIncrement={() => onAdd(idx)}
              onDecrement={() => {}}
              size="xs"
              showVariantsCount={false}
              backgroundColor={getColor('card')}
              rating={4.5}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

// CartFooter: sticky bottom bar
const CartFooter: React.FC<{
  address: string;
  onSelectAddress: () => void;
  onCheckout: () => void;
}> = ({ address, onSelectAddress, onCheckout }) => {
  const { getColor, getTypography, theme, getButtonColor } = useTheme();

  const footerStyles = StyleSheet.create({
    footerBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: getColor('card'),
      padding: 16,
      borderTopLeftRadius: theme.borderRadius.sm,
      borderTopRightRadius: theme.borderRadius.sm,
      flexDirection: 'column',
      alignItems: 'stretch',
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 12,
    },
    addressBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      // paddingVertical: 12,
      marginBottom: 16,
      alignSelf: 'stretch',
    },
    addressText: {
      color: getColor('text'),
      // fontWeight: 'bold',
      marginHorizontal: 6,
      fontSize: getTypography('subtitle'),
      flex: 1,
    },
    addressIcon: {
      width: 22,
      height: 22,
      marginRight: 8,
      resizeMode: 'contain',
    },
    checkoutBtn: {
      backgroundColor: getButtonColor('default', 'background'),
      borderRadius: theme.borderRadius.sm,
      paddingVertical: 18,
      alignItems: 'center',
      alignSelf: 'stretch',
      // borderWidth: 2,
      // borderColor: getColor('borderHighlight'),
      shadowColor: getButtonColor('default', 'background'),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 6,
    },
    checkoutText: {
      color: getButtonColor('default', 'text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
  });

  return (
    <View style={footerStyles.footerBar}>
      <TouchableOpacity style={footerStyles.addressBox} onPress={onSelectAddress}>
        <Image source={Icons.selectedAddress} style={footerStyles.addressIcon} />
        <Text style={footerStyles.addressText} numberOfLines={1} ellipsizeMode="tail">
          {address}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={getColor('button').default.background}
        />
      </TouchableOpacity>
      <TouchableOpacity style={footerStyles.checkoutBtn} onPress={onCheckout}>
        <Text style={footerStyles.checkoutText}>Proceed To Checkout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main CartScreen
const CartScreen: React.FC = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const route = useRoute<CartScreenRouteProp>();
  const { cartId } = route.params || {};
  const { carts, activeCartId, increment, decrement, clearCart } = useCartStore();
  const { vendors } = useVendorStore();
  const {
    getAppliedCoupon,
    removeCoupon,
    getAvailableCoupons,
    checkAndFetchOffers,
    loading: couponLoading,
    error: couponError,
  } = useCouponStore();
  const { selectedAddress, setSelectedAddress, permissionDataInAuth } = useAuth();
  const { authData } = useAuth();
  const [showAddressModal, setShowAddressModal] = React.useState(false);
  const [paymentExpanded, setPaymentExpanded] = React.useState(false);
  const { theme, getColor, getButtonColor, getTypography } = useTheme();

  // Get current cart and vendor
  const cart = cartId ? carts[cartId] : activeCartId ? carts[activeCartId] : undefined;
  const cartItems = cart ? Object.values(cart.products) : [];
  const vendor = vendors.find(v => v.shopId === cart?.cartId.replace('vendor_', ''));
  const appliedCoupon = cart ? getAppliedCoupon(cart.cartId) : undefined;
  console.log('cartItems', cartItems);
  // Example suggested items (mock)
  const suggestedItems: SuggestedItem[] = [
    { name: 'Choco Lava Cake', price: 20, image: Images.bg1 },
    { name: 'Choco Lava Cake', price: 20, image: Images.bg1 },
    { name: 'Choco Lava Cake', price: 20, image: Images.bg1 },
  ];

  const handleClearCart = () => {
    if (cart && authData?.jwt) {
      clearCart(cart.cartId, authData.jwt, authData.phone || '');
      navigation.goBack();
    }
  };
  const handleInc = (sku: string) => {
    if (cart && authData?.jwt) increment(cart.cartId, sku, authData.jwt, authData.phone || '');
  };
  const handleDec = (sku: string) => {
    if (cart && authData?.jwt) decrement(cart.cartId, sku, authData.jwt, authData.phone || '');
  };
  const handleAddSuggested = (_idx: number) => {};
  const handleCheckout = () => {
    // Check if location permission is not granted or selected address is not a saved address
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

  // Fetch offers when vendor is available
  React.useEffect(() => {
    if (vendor?.shopId) {
      checkAndFetchOffers(vendor.shopId);
    }
  }, [vendor?.shopId, checkAndFetchOffers]);

  // Auto-close cart screen when cart becomes empty
  React.useEffect(() => {
    if (cartItems.length === 0) {
      navigation.goBack();
    }
  }, [cartItems.length, navigation]);

  // Get available coupons for current vendor
  const availableCoupons = getAvailableCoupons(vendor?.shopId || '');

  // Format address for display
  const getFormattedAddress = () => {
    if (!selectedAddress) {
      return 'Select delivery address';
    }

    const { addressLine1, city, state } = selectedAddress;
    const parts = [addressLine1, city, state].filter(Boolean);
    return parts.join(', ');
  };

  // Handle coupon navigation with vendor data
  const handleCouponNavigation = () => {
    if (vendor?.shopId) {
      // Navigate to coupons screen - the screen will fetch its own data based on vendor context
      navigation.navigate('Coupons');
    }
  };

  // Dynamic styles using theme
  const themedStyles = StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: 16,
    },
    headerBackBtn: { marginRight: 8 },
    headerTitle: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('h2'),
      marginLeft: 8,
    },
    clearCartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F6285F',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 'auto',
    },
    clearCartText: { color: getColor('text'), marginLeft: 4, fontWeight: 'bold' },
    deliveryBadgeText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
    cartItemListBox: {
      borderColor: getColor('primary'),
      borderTopLeftRadius: 0,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomLeftRadius: theme.borderRadius.md,
      borderBottomRightRadius: theme.borderRadius.md,
      margin: 16,
      marginTop: 0,
      padding: 16,
      backgroundColor: getColor('card'),
      overflow: 'visible',
    },
    cartItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    cartItemImg: {
      width: 64,
      height: 64,
      borderRadius: theme.borderRadius.md,
      backgroundColor: getColor('button').default.background,
      marginRight: 14,
    },
    cartItemName: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginRight: 8,
    },
    vegIcon: {
      width: 16,
      height: 16,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: getColor('primary'),
      backgroundColor: getColor('primary'),
      marginLeft: 2,
    },
    cartItemMRP: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      textDecorationLine: 'line-through',
      marginRight: 6,
      fontWeight: 'bold',
    },
    cartItemPrice: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
    qtyCol: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 70,
    },
    qtyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: getColor('button').default.background,
      backgroundColor: getColor('card'),
      paddingHorizontal: 10,
      paddingVertical: 2,
      minWidth: 70,
      justifyContent: 'center',
    },
    qtyBtn: { paddingHorizontal: 8, paddingVertical: 2 },
    qtyBtnText: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
    qtyNum: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginHorizontal: 8,
    },
    cartItemTag: {
      backgroundColor: getColor('card'),
      borderColor: getColor('button').default.background,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 6,
      alignSelf: 'flex-end',
    },
    cartItemTagText: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
    addMoreInputRow: { marginTop: 8, marginHorizontal: 4 },
    addMoreInput: {
      borderWidth: 1,
      borderColor: getColor('subText'),
      borderRadius: theme.borderRadius.md,
      padding: 14,
      color: getColor('subText'),
      backgroundColor: getColor('card'),
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
    paymentSummaryBox: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      margin: 16,
      padding: 12,
    },
    paymentSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    paymentSummaryTitle: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
      marginLeft: 8,
    },
    paymentSummaryAmount: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('body'),
      marginHorizontal: 8,
    },
    paymentSummaryDetails: { marginTop: 8 },
    paymentSummaryDetailText: {
      color: getColor('text'),
      fontSize: getTypography('caption'),
      marginBottom: 2,
    },
    suggestedBox: { margin: 16 },
    suggestedTitle: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
      marginBottom: 8,
    },
    suggestedCard: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      padding: 12,
      marginRight: 12,
      width: 120,
      alignItems: 'center',
    },
    suggestedImg: {
      width: 60,
      height: 60,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: getColor('button').default.background,
      marginBottom: 8,
    },
    suggestedName: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
    suggestedPrice: {
      color: getColor('button').default.background,
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
    suggestedAddBtn: {
      backgroundColor: getColor('button').default.background,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginTop: 6,
    },
    suggestedAddText: { color: getColor('black'), fontWeight: 'bold' },
    footerBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: getColor('background'),
      padding: 16,
      borderTopLeftRadius: theme.borderRadius.full,
      borderTopRightRadius: theme.borderRadius.full,
      flexDirection: 'column',
      alignItems: 'stretch',
      shadowColor: theme.colors.shadow.color,
      shadowOffset: theme.colors.shadow.offset,
      shadowOpacity: theme.colors.shadow.opacity,
      shadowRadius: theme.colors.shadow.radius,
      elevation: 12,
    },
    addressBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      alignSelf: 'stretch',
    },
    addressText: {
      color: getColor('text'),
      fontWeight: 'bold',
      marginHorizontal: 6,
      fontSize: getTypography('subtitle'),
      flex: 1,
    },
    checkoutBtn: {
      backgroundColor: getButtonColor('default', 'background'),
      borderRadius: theme.borderRadius.full,
      paddingVertical: 18,
      alignItems: 'center',
      alignSelf: 'stretch',
      borderWidth: 2,
      borderColor: getColor('borderHighlight'),
      shadowColor: getButtonColor('default', 'background'),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 6,
    },
    checkoutText: {
      color: getButtonColor('default', 'text'),
      fontWeight: 'bold',
      fontSize: getTypography('h2'),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBox: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.full,
      padding: 24,
      width: 300,
      alignItems: 'center',
    },
    modalTitle: {
      color: getButtonColor('default', 'background'),
      fontWeight: 'bold',
      fontSize: getTypography('h2'),
      marginBottom: 16,
    },
    modalOption: { color: getColor('text'), fontSize: getTypography('body'), padding: 10 },
    modalCloseBtn: { marginTop: 16 },
    modalCloseText: {
      color: getButtonColor('default', 'background'),
      fontWeight: 'bold',
      fontSize: getTypography('body'),
    },
    couponBox: {
      backgroundColor: getColor('card'),
      borderRadius: theme.borderRadius.md,
      margin: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow.color,
          shadowOffset: theme.colors.shadow.offset,
          shadowOpacity: theme.colors.shadow.opacity,
          shadowRadius: theme.colors.shadow.radius,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    couponLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      marginRight: 12,
    },
    appliedCouponContainer: {
      marginLeft: 12,
      flex: 1,
    },
    couponText: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('subtitle'),
      marginBottom: 4,
      fontFamily: theme.typography.fontFamily,
    },
    appliedDiscount: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
      fontFamily: theme.typography.fontFamily,
      flexDirection: 'row',
      alignItems: 'center',
    },
    couponDivider: {
      height: 1,
      backgroundColor: getColor('border'),
      marginVertical: 8,
    },
    minOrderText: {
      color: getColor('subText'),
      fontSize: getTypography('small'),
      fontFamily: theme.typography.fontFamily,
    },
    couponRight: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    couponAvailable: {
      color: getColor('primary'),
      fontSize: getTypography('caption'),
      marginRight: 8,
      fontWeight: '500',
      fontFamily: theme.typography.fontFamily,
    },
    removeCoupon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: getColor('error'),
      marginLeft: 'auto',
    },
    removeCouponText: {
      color: getColor('error'),
      fontSize: getTypography('small'),
      marginLeft: 4,
      fontWeight: '600',
      fontFamily: theme.typography.fontFamily,
      textTransform: 'uppercase',
    },
    vendorPillContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: 0,
      marginLeft: 16,
      marginTop: 0,
    },
    vendorPillTab: {
      backgroundColor: getColor('card'),
      borderTopLeftRadius: theme.borderRadius.md,
      borderTopRightRadius: theme.borderRadius.md,
      borderBottomRightRadius: 0,
      borderBottomLeftRadius: 0,
      paddingHorizontal: 24,
      paddingVertical: 12,
      minWidth: 0,
      alignItems: 'flex-start',
    },
    vendorPillTabText: {
      color: getColor('text'),
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
    deliveryBadgeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: getColor('primary'),
      borderWidth: 1.5,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: 'transparent',
      position: 'absolute',
      right: 32,
      top: 2,
      zIndex: 2,
    },
    deliveryBadgeBoxText: {
      color: getColor('primary'),
      fontWeight: 'bold',
      fontSize: getTypography('caption'),
    },
    deliveryBadgeBoxIcon: {
      width: 16,
      height: 16,
      marginRight: 4,
    },
    couponLoadingText: {
      color: getColor('subText'),
      fontSize: getTypography('caption'),
      marginLeft: 8,
    },
    couponErrorText: {
      color: getColor('error'),
      fontSize: getTypography('caption'),
      marginLeft: 8,
    },
  });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: getColor('background') }}
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <View style={themedStyles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={themedStyles.headerBackBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={getColor('text')} />
        </TouchableOpacity>
        <Text style={themedStyles.headerTitle}>Cart</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={themedStyles.clearCartBtn} onPress={handleClearCart}>
          <MaterialCommunityIcons name="close-circle" size={22} color={getColor('white')} />
          <Text style={themedStyles.clearCartText}>Remove</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Vendor pill and delivery badge */}
        {vendor && (
          <View style={themedStyles.vendorPillContainer}>
            <View style={themedStyles.vendorPillTab}>
              <Text style={themedStyles.vendorPillTabText}>{vendor.name}</Text>
            </View>
            <View style={themedStyles.deliveryBadgeBox}>
              <Image source={Icons.lightning} style={themedStyles.deliveryBadgeBoxIcon} />
              <Text style={themedStyles.deliveryBadgeBoxText}>
                {vendor.preparationTime || '30 mins'}
              </Text>
            </View>
          </View>
        )}
        {/* Cart items */}
        <CartItemList
          items={cartItems}
          onInc={handleInc}
          onDec={handleDec}
          vendor={vendor}
          navigation={navigation}
        />
        {/* Coupon Section */}
        <TouchableOpacity
          style={themedStyles.couponBox}
          onPress={handleCouponNavigation}
          disabled={couponLoading}
        >
          <View style={themedStyles.couponLeft}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={24}
              color={getColor('primary')}
            />
            {appliedCoupon ? (
              <View style={themedStyles.appliedCouponContainer}>
                <View>
                  <Text style={themedStyles.couponText}>{appliedCoupon.code}</Text>
                  <Text style={themedStyles.appliedDiscount}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={12}
                      color={getColor('primary')}
                    />{' '}
                    {appliedCoupon.discount} discount applied
                  </Text>
                </View>
                <View style={themedStyles.couponDivider} />
                <Text style={themedStyles.minOrderText}>Min order: ₹{appliedCoupon.minOrder}</Text>
              </View>
            ) : (
              <View style={themedStyles.couponLeft}>
                <Text style={themedStyles.couponText}>Apply Coupon</Text>
                {couponLoading && (
                  <Text style={themedStyles.couponLoadingText}>Loading offers...</Text>
                )}
                {couponError && (
                  <Text style={themedStyles.couponErrorText}>Failed to load offers</Text>
                )}
              </View>
            )}
          </View>
          <View style={themedStyles.couponRight}>
            {appliedCoupon ? (
              <TouchableOpacity
                onPress={() => removeCoupon(cart?.cartId || '')}
                style={themedStyles.removeCoupon}
              >
                <MaterialCommunityIcons name="close" size={20} color={getColor('error')} />
                <Text style={themedStyles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <>
                {!couponLoading && !couponError && (
                  <Text style={themedStyles.couponAvailable}>
                    {availableCoupons.length} Coupons Available
                  </Text>
                )}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={getColor('primary')}
                />
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Payment summary */}
        <PaymentSummary expanded={paymentExpanded} onToggle={() => setPaymentExpanded(e => !e)} />
        {/* Suggested items */}
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

// Remove hardcoded styles - using themed styles only

export default CartScreen;
