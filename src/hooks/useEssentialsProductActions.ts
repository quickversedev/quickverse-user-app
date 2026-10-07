import { useCallback, useEffect } from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { useAuth } from '../contexts/login/AuthProvider';
import { GroceryGroupProduct } from '../services/groceryGroupsService';
import useCartStore from '../store/cart/cartStore';
import useEssentialsCartStore, {
  EssentialsProductMeta,
  EssentialsSetResult,
} from '../store/cart/essentialsCartStore';

const showMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Daily Essentials', message);
  }
};

const metaFor = (product: GroceryGroupProduct): EssentialsProductMeta => ({
  sku: product.sku,
  shopId: product.shopId,
  shopName: product.shopName,
  name: product.name,
  price: product.sellingPrice || product.mrp,
  mrp: product.mrp,
  imageUrl: product.imageUrl,
});

/** Legacy path only: the cart is chosen by the *product's* shop. */
const cartIdFor = (product: GroceryGroupProduct) => `vendor_${product.shopId}`;

/**
 * ADD / + / − for a Daily Essentials product, wherever it is shown.
 *
 * With the server's Essentials cart on, every product lands in one QuickVerse cart whatever its
 * kirana, and checks out as one order. With it off — or before the server has said — it falls
 * back to the per-shop SmartBiz carts, which is how Daily Essentials worked before that cart
 * existed (adding from two shops then opens two carts).
 */
export const useEssentialsProductActions = () => {
  const { authData } = useAuth();

  const carts = useCartStore(s => s.carts);
  const addToCart = useCartStore(s => s.addToCart);
  const increment = useCartStore(s => s.increment);
  const decrement = useCartStore(s => s.decrement);

  const essentialsEnabled = useEssentialsCartStore(s => s.enabled === true);
  const essentialsView = useEssentialsCartStore(s => s.view);
  const essentialsPending = useEssentialsCartStore(s => s.pending);
  const fetchEssentialsCart = useEssentialsCartStore(s => s.fetchCart);
  const setEssentialsQuantity = useEssentialsCartStore(s => s.setQuantity);

  useEffect(() => {
    fetchEssentialsCart(authData?.jwt, authData?.phone);
  }, [fetchEssentialsCart, authData?.jwt, authData?.phone]);

  const quantityFor = useCallback(
    (product: GroceryGroupProduct) => {
      if (essentialsEnabled) {
        if (essentialsPending[product.sku] !== undefined) return essentialsPending[product.sku];
        return essentialsView?.items.find(l => l.sku === product.sku)?.quantity ?? 0;
      }
      return carts[cartIdFor(product)]?.products[product.sku]?.quantity || 0;
    },
    [carts, essentialsEnabled, essentialsPending, essentialsView]
  );

  const setEssentials = useCallback(
    async (product: GroceryGroupProduct, quantity: number) => {
      const result: EssentialsSetResult = await setEssentialsQuantity(
        metaFor(product),
        quantity,
        authData?.jwt,
        authData?.phone
      );
      if (!result.ok && result.message) showMessage(result.message);
    },
    [setEssentialsQuantity, authData]
  );

  const add = useCallback(
    (product: GroceryGroupProduct) => {
      if (essentialsEnabled) {
        setEssentials(product, quantityFor(product) + 1);
        return;
      }
      addToCart(
        cartIdFor(product),
        {
          sku: product.sku,
          shopId: product.shopId,
          name: product.name,
          price: product.sellingPrice || product.mrp,
          mrp: product.mrp,
          image: product.imageUrl || '',
          // No diet flag on this endpoint. Inert either way: every server sync
          // overwrites it, and the cart row deliberately renders no veg marker from it.
          veg: true,
        },
        authData?.jwt || '',
        authData?.phone || ''
      );
    },
    [addToCart, authData, essentialsEnabled, setEssentials, quantityFor]
  );

  const inc = useCallback(
    (product: GroceryGroupProduct) => {
      if (essentialsEnabled) {
        setEssentials(product, quantityFor(product) + 1);
        return;
      }
      increment(cartIdFor(product), product.sku, authData?.jwt || '', authData?.phone || '');
    },
    [increment, authData, essentialsEnabled, setEssentials, quantityFor]
  );

  const dec = useCallback(
    (product: GroceryGroupProduct) => {
      if (essentialsEnabled) {
        setEssentials(product, quantityFor(product) - 1);
        return;
      }
      decrement(cartIdFor(product), product.sku, authData?.jwt || '', authData?.phone || '');
    },
    [decrement, authData, essentialsEnabled, setEssentials, quantityFor]
  );

  return { quantityFor, add, increment: inc, decrement: dec };
};
