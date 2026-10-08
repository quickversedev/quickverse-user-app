import { Alert, Platform, ToastAndroid } from 'react-native';
import useEssentialsCartStore, { EssentialsProductMeta } from './essentialsCartStore';
import useVendorStore from '../vendorStore';

/**
 * Which cart a product goes into.
 *
 * Every grocery shop's products go into the one Daily Essentials cart and check out as one order
 * split across kiranas — wherever the customer added them: a Daily Essentials tile, a store page
 * under Browse stores, Home's Featured Vendors or Fast Picks, search, a tag page. Food shops keep
 * one cart per shop. A shop's cart therefore depends on the shop, never on the screen.
 *
 * Applies only while the server has the Essentials cart switched on; off, everything uses the
 * per-shop SmartBiz carts, as before. A shop missing from the vendor list (outside the delivery
 * area) also stays on its own cart: there is nothing to tell its category by.
 */

export const shopIdOf = (cartIdOrShopId: string) => cartIdOrShopId.replace(/^vendor_/, '');

export const isEssentialsShop = (cartIdOrShopId: string): boolean => {
  if (useEssentialsCartStore.getState().enabled !== true) return false;
  const vendor = useVendorStore.getState().getVendorById(shopIdOf(cartIdOrShopId));
  return (vendor?.category ?? '').trim().toLowerCase() === 'grocery';
};

/** The line's quantity in the Essentials cart, counting a change still on its way. */
export const essentialsQuantityOf = (sku: string): number => {
  const { pending, view } = useEssentialsCartStore.getState();
  if (pending[sku] !== undefined) return pending[sku];
  return view?.items.find(line => line.sku === sku)?.quantity ?? 0;
};

const showMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Daily Essentials', message);
  }
};

/** What the Essentials cart needs to show a line before the server has priced it. */
const metaFor = (shopId: string, sku: string): EssentialsProductMeta | null => {
  const { meta, view } = useEssentialsCartStore.getState();
  if (meta[sku]) return meta[sku];
  const line = view?.items.find(l => l.sku === sku);
  if (!line) return null;
  return {
    sku,
    shopId: line.shopId || shopId,
    shopName: line.shopName ?? '',
    name: line.name ?? '',
    price: line.unitPrice,
    mrp: line.mrp ?? line.unitPrice,
    imageUrl: line.imageUrl ?? '',
  };
};

/**
 * Sets a grocery product's quantity in the Essentials cart. `product` is needed only for a line
 * the cart has not seen yet; for one it holds (+/−), the sku is enough. A refusal (a fourth
 * kirana, out of range, out of stock) is shown to the customer, as the cart's own screen does.
 */
export const setEssentialsQuantity = async (
  shopId: string,
  sku: string,
  quantity: number,
  jwtToken: string,
  phone: string,
  product?: Omit<EssentialsProductMeta, 'shopName'> & { shopName?: string }
) => {
  const meta =
    metaFor(shopId, sku) ??
    (product
      ? {
          ...product,
          shopName: product.shopName ?? useVendorStore.getState().getVendorById(shopId)?.name ?? '',
        }
      : null);
  if (!meta) return;
  const result = await useEssentialsCartStore
    .getState()
    .setQuantity(meta, quantity, jwtToken || undefined, phone || undefined);
  if (!result.ok && result.message) showMessage(result.message);
};
