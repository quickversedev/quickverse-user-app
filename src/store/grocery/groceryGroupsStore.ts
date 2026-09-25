import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import groceryGroupsService, { GroceryGroup } from '../../services/groceryGroupsService';
import { CACHE_TTL, createPersistedConfig, isCacheFresh } from '../../utils/cache';

/**
 * Curated grocery groups for the Daily Essentials section.
 *
 * Persisted so the section renders from MMKV on launch instead of flashing a skeleton,
 * and expired on a TTL so a group edited in the dashboard appears without a force-quit.
 *
 * Scoped to where the customer is: the server returns only products from kiranas within
 * delivery range of that point, so a move to another town refetches instead of using the cache.
 */

interface GroceryGroupsState {
  groups: GroceryGroup[];
  fetchedAt: number;
  /** The point the cached groups were fetched for, rounded ("lat,lng"); '' when none. */
  fetchedFor: string;
  loading: boolean;
  fetchGroups: (near?: { latitude: number; longitude: number }) => Promise<void>;
  invalidateCache: () => void;
}

const initialState = {
  groups: [] as GroceryGroup[],
  fetchedAt: 0,
  fetchedFor: '',
  loading: false,
};

/** ~1 km of precision: close enough that a short move does not refetch, a new town does. */
const placeKey = (near?: { latitude: number; longitude: number }) =>
  near ? `${near.latitude.toFixed(2)},${near.longitude.toFixed(2)}` : '';

const useGroceryGroupsStore = create<GroceryGroupsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /** Force the next fetch to hit the network — for pull-to-refresh. */
      invalidateCache: () => set({ fetchedAt: 0 }),

      fetchGroups: async near => {
        const { groups, fetchedAt, fetchedFor } = get();
        const key = placeKey(near);

        if (
          key === fetchedFor &&
          isCacheFresh(fetchedAt, CACHE_TTL.GROCERY_GROUPS) &&
          groups.length > 0
        ) {
          return;
        }

        try {
          set({ loading: true });
          const fetched = await groceryGroupsService.fetchProductGroups(near);
          set({ groups: fetched, fetchedAt: Date.now(), fetchedFor: key, loading: false });
        } catch (error) {
          // A failed refresh must not empty a section already on screen, so the
          // previous groups stay and the timestamp is not advanced — the next attempt
          // will therefore still treat the cache as stale and retry.
          console.warn('[GroceryGroups] Failed to fetch product groups:', error);
          set({ loading: false });
        }
      },
    }),
    createPersistedConfig<GroceryGroupsState>('grocery-groups-store', state => ({
      groups: state.groups,
      fetchedAt: state.fetchedAt,
      fetchedFor: state.fetchedFor,
    }))
  )
);

/**
 * The shops Daily Essentials draws from, which is what makes a cart groupable.
 *
 * Carts are keyed `vendor_<shopId>` everywhere in the app and carry no notion of which
 * screen filled them, so "is this a daily-needs cart" has to be answered by the shop
 * rather than by the cart. The groups endpoint already tells us exactly which shops
 * QuickVerse has curated for daily needs, so that set is the answer — no new field, no
 * second cart namespace, and no risk of one kirana ending up with two carts.
 *
 * It matters that this is by shop and not by origin: shop 94728 supplies the
 * "Atta, Dal & Rice" group *and* is the grocery vendor customers browse directly. Either
 * route fills the same cart, and either way it groups.
 *
 * Empty when the groups have not loaded. Callers must treat that as "nothing is
 * groupable" and fall back to single-shop checkout, which is the existing behaviour.
 */
export const useEssentialsShopIds = (): Set<string> => {
  const groups = useGroceryGroupsStore(s => s.groups);
  return useMemo(
    () => new Set(groups.flatMap(g => g.products.map(p => p.shopId)).filter(Boolean)),
    [groups]
  );
};

export default useGroceryGroupsStore;
