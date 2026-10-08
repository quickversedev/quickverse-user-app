import { useCallback } from 'react';
import useCartStore from '../store/cart/cartStore';
import useEssentialsCartStore from '../store/cart/essentialsCartStore';
import { isEssentialsShop, shopIdOf } from '../store/cart/essentialsRouting';
import useVendorStore from '../store/vendorStore';

/**
 * A product's quantity as the customer should see it: from the Essentials cart for a grocery shop
 * (see `store/cart/essentialsRouting.ts`), from that shop's own cart otherwise. Pass a cart id
 * (`vendor_<shopId>`) or a bare shop id. Re-renders when either cart or the vendor list changes.
 */
export const useCartQuantity = () => {
  const carts = useCartStore(s => s.carts);
  const enabled = useEssentialsCartStore(s => s.enabled);
  const view = useEssentialsCartStore(s => s.view);
  const pending = useEssentialsCartStore(s => s.pending);
  const vendors = useVendorStore(s => s.vendors);
  return useCallback(
    (cartIdOrShopId: string, sku: string): number => {
      const cartId = `vendor_${shopIdOf(cartIdOrShopId)}`;
      const own = carts[cartId]?.products?.[sku]?.quantity ?? 0;
      // An older per-shop grocery line keeps showing until it empties (cartStore keeps it there).
      if (own > 0 || !isEssentialsShop(cartId)) return own;
      if (pending[sku] !== undefined) return pending[sku];
      return view?.items.find(line => line.sku === sku)?.quantity ?? 0;
    },
    // enabled and vendors are read through isEssentialsShop; listed so a change re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carts, enabled, view, pending, vendors]
  );
};
