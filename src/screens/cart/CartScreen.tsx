import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Images } from '../../assets';
import { RootStackParamList } from '../../routes/AppStack';
import useCartStore, { CartProduct } from '../../store/cartStore';
import useVendorStore from '../../store/vendorStore';
import { useTheme } from '../../theme/ThemeContext';

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
const CartItem: React.FC<CartItemProps> = ({ name, price, quantity, tag, onInc, onDec, image }) => (
  <View style={styles.cartItemRow}>
    <Image source={typeof image === 'number' ? image : { uri: image }} style={styles.cartItemImg} />
    <View style={{ flex: 1, minWidth: 120 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
        <Text style={styles.cartItemName}>{name}</Text>
        <View style={styles.vegIcon} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.cartItemMRP}>₹79</Text>
        <Text style={styles.cartItemPrice}>₹{price}</Text>
      </View>
    </View>
    <View style={styles.qtyCol}>
      <View style={styles.qtyBox}>
        <TouchableOpacity onPress={onDec} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyNum}>{quantity}</Text>
        <TouchableOpacity onPress={onInc} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      {tag && (
        <View style={styles.cartItemTag}>
          <Text style={styles.cartItemTagText}>{tag}</Text>
        </View>
      )}
    </View>
  </View>
);

// CartItemList: list of cart items
const CartItemList: React.FC<{
  items: CartProduct[];
  onInc: (sku: string) => void;
  onDec: (sku: string) => void;
}> = ({ items, onInc, onDec }) => (
  <View style={styles.cartItemListBox}>
    {items.map(item => (
      <CartItem
        key={item.sku}
        {...item}
        tag={item.sku === 'sku2' ? '250 ML' : undefined}
        onInc={() => onInc(item.sku)}
        onDec={() => onDec(item.sku)}
      />
    ))}
    <View style={styles.addMoreInputRow}>
      <TextInput
        style={styles.addMoreInput}
        value="+ Add More Items"
        editable={false}
        pointerEvents="none"
      />
    </View>
  </View>
);

// PaymentSummary: collapsible
const PaymentSummary: React.FC<{ expanded: boolean; onToggle: () => void }> = ({
  expanded,
  onToggle,
}) => (
  <View style={styles.paymentSummaryBox}>
    <TouchableOpacity style={styles.paymentSummaryHeader} onPress={onToggle}>
      <MaterialCommunityIcons name="file-document-outline" size={20} color="#FFD600" />
      <Text style={styles.paymentSummaryTitle}>Total Bill (Inc. Taxes and Charges)</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.paymentSummaryAmount}>INR 232</Text>
      <MaterialCommunityIcons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={22}
        color="#FFD600"
      />
    </TouchableOpacity>
    {expanded && (
      <View style={styles.paymentSummaryDetails}>
        <Text style={styles.paymentSummaryDetailText}>Subtotal: ₹200</Text>
        <Text style={styles.paymentSummaryDetailText}>Tax: ₹32</Text>
      </View>
    )}
  </View>
);

// SuggestedItems: horizontal scroll
const SuggestedItems: React.FC<{ items: SuggestedItem[]; onAdd: (idx: number) => void }> = ({
  items,
  onAdd,
}) => (
  <View style={styles.suggestedBox}>
    <Text style={styles.suggestedTitle}>Add a little somethin&apos;</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {items.map((item, idx) => (
        <View key={idx} style={styles.suggestedCard}>
          <Image source={item.image} style={styles.suggestedImg} />
          <Text style={styles.suggestedName}>{item.name}</Text>
          <Text style={styles.suggestedPrice}>₹{item.price}</Text>
          <TouchableOpacity style={styles.suggestedAddBtn} onPress={() => onAdd(idx)}>
            <Text style={styles.suggestedAddText}>ADD +</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  </View>
);

// CartFooter: sticky bottom bar
const CartFooter: React.FC<{
  address: string;
  onSelectAddress: () => void;
  onCheckout: () => void;
}> = ({ address, onSelectAddress, onCheckout }) => (
  <View style={styles.footerBar}>
    <TouchableOpacity style={styles.addressBox} onPress={onSelectAddress}>
      <MaterialCommunityIcons
        name="map-marker"
        size={22}
        color="#FFD600"
        style={{ marginRight: 8 }}
      />
      <Text style={styles.addressText}>{address}</Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color="#FFD600"
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
    <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout}>
      <Text style={styles.checkoutText}>Proceed To Checkout</Text>
    </TouchableOpacity>
  </View>
);

// Main CartScreen
const CartScreen: React.FC = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const route = useRoute<CartScreenRouteProp>();
  const { cartId } = route.params || {};
  const { carts, activeCartId, increment, decrement, clearCart } = useCartStore();
  const { vendors } = useVendorStore();
  const [showAddressModal, setShowAddressModal] = React.useState(false);
  const [paymentExpanded, setPaymentExpanded] = React.useState(false);
  const [address, setAddress] = React.useState('Baner - Balewadi Road, Pune');
  const { theme, getColor, getButtonColor, getTypography } = useTheme();

  // Get current cart and vendor
  const cart = cartId ? carts[cartId] : activeCartId ? carts[activeCartId] : undefined;
  const cartItems = cart ? Object.values(cart.products) : [];
  const vendor = vendors.find(v => v.shopId === cart?.cartId.replace('vendor_', ''));

  // Example suggested items (mock)
  const suggestedItems: SuggestedItem[] = [
    { name: 'Choco Lava Cake', price: 20, image: Images.bg1 },
    { name: 'Choco Lava Cake', price: 20, image: Images.bg1 },
    { name: 'Choco Lava Cake', price: 20, image: Images.bg1 },
  ];

  const handleClearCart = () => {
    if (cart) clearCart(cart.cartId);
  };
  const handleInc = (sku: string) => {
    if (cart) increment(cart.cartId, sku);
  };
  const handleDec = (sku: string) => {
    if (cart) decrement(cart.cartId, sku);
  };
  const handleAddSuggested = (_idx: number) => {};
  const handleCheckout = () => {};
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
      backgroundColor: getColor('card'),
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
      color: getButtonColor('default', 'background'),
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
          <MaterialCommunityIcons name="close-circle" size={22} color={getColor('error')} />
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
              <MaterialCommunityIcons
                name="flash"
                size={16}
                color={getColor('primary')}
                style={{ marginRight: 4 }}
              />
              <Text style={themedStyles.deliveryBadgeBoxText}>
                {vendor.preparationTime || '30 mins'}
              </Text>
            </View>
          </View>
        )}
        {/* Cart items */}
        <CartItemList items={cartItems} onInc={handleInc} onDec={handleDec} />
        {/* Payment summary */}
        <PaymentSummary expanded={paymentExpanded} onToggle={() => setPaymentExpanded(e => !e)} />
        {/* Suggested items */}
        <SuggestedItems items={suggestedItems} onAdd={handleAddSuggested} />
      </ScrollView>
      <CartFooter
        address={address}
        onSelectAddress={() => setShowAddressModal(true)}
        onCheckout={handleCheckout}
      />
      <Modal visible={showAddressModal} transparent animationType="slide">
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalBox}>
            <Text style={themedStyles.modalTitle}>Select Address</Text>
            <TouchableOpacity
              onPress={() => {
                setAddress('Baner - Balewadi Road, Pune');
                setShowAddressModal(false);
              }}
            >
              <Text style={themedStyles.modalOption}>Baner - Balewadi Road, Pune</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setAddress('Kothrud, Pune');
                setShowAddressModal(false);
              }}
            >
              <Text style={themedStyles.modalOption}>Kothrud, Pune</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAddressModal(false)}
              style={themedStyles.modalCloseBtn}
            >
              <Text style={themedStyles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 16,
  },
  headerBackBtn: { marginRight: 8 },
  headerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 22, marginLeft: 8 },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2236',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 'auto',
  },
  clearCartText: { color: '#fff', marginLeft: 4, fontWeight: 'bold' },

  deliveryBadgeText: { color: '#3AC47D', fontWeight: 'bold', fontSize: 13 },
  cartItemListBox: {
    // borderWidth: 2,
    borderColor: '#3A7BFF',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#23263A',
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
    borderRadius: 12,
    backgroundColor: '#FFD600',
    marginRight: 14,
  },
  cartItemName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  vegIcon: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#3AC47D',
    backgroundColor: '#3AC47D',
    marginLeft: 2,
  },
  cartItemMRP: {
    color: '#888',
    fontSize: 15,
    textDecorationLine: 'line-through',
    marginRight: 6,
    fontWeight: 'bold',
  },
  cartItemPrice: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: 18,
  },
  qtyCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD600',
    backgroundColor: '#23263A',
    paddingHorizontal: 10,
    paddingVertical: 2,
    minWidth: 70,
    justifyContent: 'center',
  },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  qtyBtnText: { color: '#FFD600', fontWeight: 'bold', fontSize: 18 },
  qtyNum: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginHorizontal: 8 },
  cartItemTag: {
    backgroundColor: '#23263A',
    borderColor: '#FFD600',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  cartItemTagText: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addMoreInputRow: { marginTop: 8, marginHorizontal: 4 },
  addMoreInput: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 12,
    padding: 14,
    color: '#888',
    backgroundColor: '#23263A',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  paymentSummaryBox: { backgroundColor: '#23263A', borderRadius: 12, margin: 16, padding: 12 },
  paymentSummaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  paymentSummaryTitle: { color: '#FFD600', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  paymentSummaryAmount: { color: '#FFD600', fontWeight: 'bold', fontSize: 16, marginHorizontal: 8 },
  paymentSummaryDetails: { marginTop: 8 },
  paymentSummaryDetailText: { color: '#fff', fontSize: 14, marginBottom: 2 },
  suggestedBox: { margin: 16 },
  suggestedTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  suggestedCard: {
    backgroundColor: '#23263A',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
  },
  suggestedImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFD600',
    marginBottom: 8,
  },
  suggestedName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  suggestedPrice: { color: '#FFD600', fontWeight: 'bold', fontSize: 14 },
  suggestedAddBtn: {
    backgroundColor: '#FFD600',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 6,
  },
  suggestedAddText: { color: '#222', fontWeight: 'bold' },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#181C2C',
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    // Stack vertically
    flexDirection: 'column',
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23263A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  addressText: { color: '#fff', fontWeight: 'bold', marginHorizontal: 6, fontSize: 17, flex: 1 },
  checkoutBtn: {
    backgroundColor: '#FFD600',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    alignSelf: 'stretch',
    borderWidth: 2,
    borderColor: '#F5C400',
    shadowColor: '#FFD600',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutText: { color: '#222', fontWeight: 'bold', fontSize: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#23263A',
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: { color: '#FFD600', fontWeight: 'bold', fontSize: 18, marginBottom: 16 },
  modalOption: { color: '#fff', fontSize: 16, padding: 10 },
  modalCloseBtn: { marginTop: 16 },
  modalCloseText: { color: '#FFD600', fontWeight: 'bold', fontSize: 16 },
  vendorPillContainer: {
    // position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
    marginLeft: 16,
    marginTop: 0,
  },
  vendorPillTab: {
    backgroundColor: '#23263A',
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    paddingHorizontal: 24,
    paddingVertical: 12,
    // flex: 1,

    minWidth: 0,
    alignItems: 'flex-start',
  },
  vendorPillTabText: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deliveryBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#3AC47D',
    borderWidth: 1.5,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'transparent',
    position: 'absolute',

    right: 32,
    top: 2,
    zIndex: 2,
  },
  deliveryBadgeBoxText: {
    color: '#3AC47D',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default CartScreen;
