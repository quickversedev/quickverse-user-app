import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/login/AuthProvider';
import catalogGroupsService from '../services/catalogGroupsService';
import { GroceryGroupProduct } from '../services/groceryGroupsService';
import useCatalogGroupsStore from '../store/grocery/catalogGroupsStore';
import { Product } from '../types/product';

/** A subgroup as the store screen's category rail reads a category. */
export interface EssentialsCategory {
  id: string;
  name: string;
  imageURLs: string[];
}

/**
 * One Daily Essentials group, shaped for the store screen (`VendorProduct`): the group is the
 * "store", its subgroups the categories on the rail, and their products the grid — each product's
 * `division` is its subgroup, which is how that screen groups products under category headers.
 *
 * Products are fetched per subgroup, near the delivery address, in the admin's subgroup order.
 * `originals` keeps each product as the Essentials cart wants it (with its kirana), since the
 * shared `Product` shape is only for display. `groupId` undefined disables the hook.
 */
export const useEssentialsGroupCatalogue = (groupId?: string) => {
  const { selectedAddress } = useAuth();
  const nearLat = selectedAddress?.coordinates?.latitude;
  const nearLng = selectedAddress?.coordinates?.longitude;
  const group = useCatalogGroupsStore(s => s.groups.find(g => g.groupId === groupId));
  const refreshCatalog = useCatalogGroupsStore(s => s.refresh);
  const catalogLoading = useCatalogGroupsStore(s => s.loading);

  const [bySubgroup, setBySubgroup] = useState<Record<string, GroceryGroupProduct[]>>({});
  const [loading, setLoading] = useState(!!groupId);
  const [error, setError] = useState<string | null>(null);

  const subgroupIds = useMemo(() => group?.subgroups.map(s => s.groupId) ?? [], [group]);
  const subgroupKey = subgroupIds.join('|');

  // Opened before the catalogue loaded (or after it expired): fetch it once.
  useEffect(() => {
    if (groupId && !group) refreshCatalog();
  }, [groupId, group, refreshCatalog]);

  const load = useCallback(async () => {
    if (!groupId) return;
    if (subgroupIds.length === 0) {
      setBySubgroup({});
      setLoading(false);
      return;
    }
    const near =
      Number.isFinite(nearLat) && Number.isFinite(nearLng)
        ? { latitude: nearLat as number, longitude: nearLng as number }
        : undefined;
    try {
      const results = await Promise.all(
        subgroupIds.map(id =>
          catalogGroupsService
            .fetchSubgroup(id, near)
            .then(sub => [id, Array.isArray(sub?.products) ? sub.products : []] as const)
            // One subgroup failing should not blank the whole group.
            .catch(() => [id, [] as GroceryGroupProduct[]] as const)
        )
      );
      setBySubgroup(Object.fromEntries(results));
      setError(null);
    } catch (e) {
      console.warn('[EssentialsGroup] could not load:', e);
      setError('Could not load these items. Please try again.');
    } finally {
      setLoading(false);
    }
    // subgroupKey stands in for subgroupIds, whose identity changes with every store update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, subgroupKey, nearLat, nearLng]);

  useEffect(() => {
    load();
  }, [load]);

  const categories: EssentialsCategory[] = useMemo(
    () =>
      (group?.subgroups ?? []).map(sub => ({
        id: sub.groupId,
        name: sub.name,
        imageURLs: sub.imageUrl ? [sub.imageUrl] : [],
      })),
    [group]
  );

  const { products, originals } = useMemo(() => {
    const list: Product[] = [];
    const bySku = new Map<string, GroceryGroupProduct>();
    subgroupIds.forEach(subgroupId => {
      (bySubgroup[subgroupId] ?? []).forEach(p => {
        bySku.set(p.sku, p);
        const price = p.sellingPrice || p.mrp;
        list.push({
          sku: p.sku,
          primarySKU: p.sku,
          // The kirana is the cart's business, never the customer's: not on the card.
          shopId: p.shopId,
          name: p.name,
          mrp: p.mrp,
          sellingPrice: price,
          discount: p.mrp > price ? Math.round(((p.mrp - price) / p.mrp) * 100) : 0,
          imageUrl: p.imageUrl,
          inStock: p.inStock,
          division: subgroupId,
          numberOfVariants: 1,
        });
      });
    });
    return { products: list, originals: bySku };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bySubgroup, subgroupKey]);

  // Until the catalogue holds the group there is nothing to fetch: loading is the catalogue's.
  const isLoading = !!groupId && (group ? loading : catalogLoading);

  return { group, categories, products, originals, loading: isLoading, error, reload: load };
};
