import { useMemo } from 'react';
import useVendorStore from '../store/vendorStore';
import { isStoreOpen } from '../utils/storeUtils';
import { filterByTimeSlot } from '../utils/timeSlot';
import { usePages } from './usePages';

export const usePromotions = (pageId: string) => {
  const { getPromotionsByPageId } = usePages();
  const vendors = useVendorStore(s => s.vendors);

  /**
   * Shops that are open right now. `vendors` deliberately contains closed shops too —
   * vendorStore only *sorts* open ones first — so membership here is the open test.
   *
   * NB: `storeEnabled !== false`, not a truthy check. /v3/shops omits storeEnabled
   * entirely (undefined for every shop), so a truthy check matches nothing.
   */
  const openShopIds = useMemo(
    () =>
      new Set(
        vendors
          .filter(
            v =>
              v.storeEnabled !== false &&
              isStoreOpen({
                openingTime: v.openingTime,
                closingTime: v.closingTime,
                storeActive: v.storeActive,
              }).isOpen
          )
          .map(v => String(v.shopId))
      ),
    [vendors]
  );

  const promotions = useMemo(() => {
    const all = getPromotionsByPageId(pageId) || [];

    /**
     * Hide posters belonging to shops that are shut — tapping one leads to a store
     * that cannot take the order.
     *
     * Two deliberate carve-outs:
     *  - A promotion with no shopId is a generic house banner (the "Home" page is
     *    entirely these), not tied to any shop, so it always survives.
     *  - While `vendors` is still empty the shop list is unknown, so filtering would
     *    blank every banner and then pop them back in once it loads. Skip until loaded.
     */
    const visible =
      vendors.length === 0
        ? all
        : all.filter(promo => {
            const shopId = promo.shopId ? String(promo.shopId) : '';
            if (!shopId) return true;
            return openShopIds.has(shopId);
          });

    // /v3/pages returns promotions in JPA collection order, not sequence order, and
    // nothing downstream sorts them — so the `sequence` set in the admin dashboard had
    // no effect on what the carousel actually showed. Sort here: it is the single
    // choke point every promotion consumer goes through.
    // filterByTimeSlot returns a fresh array, so this never mutates store state.
    return filterByTimeSlot(visible).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }, [getPromotionsByPageId, pageId, openShopIds, vendors.length]);

  const hasPromotions = useMemo(() => promotions.length > 0, [promotions.length]);

  return {
    promotions,
    hasPromotions,
    promotionCount: promotions.length,
  };
};
