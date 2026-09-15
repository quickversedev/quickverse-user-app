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
 * Unlike the tag store this needs no scope key: the endpoint takes no parameters and
 * returns the same groups for everyone, so one slot answers for every caller.
 */

interface GroceryGroupsState {
  groups: GroceryGroup[];
  fetchedAt: number;
  loading: boolean;
  fetchGroups: () => Promise<void>;
  invalidateCache: () => void;
}

const initialState = {
  groups: [] as GroceryGroup[],
  fetchedAt: 0,
  loading: false,
};

const useGroceryGroupsStore = create<GroceryGroupsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /** Force the next fetch to hit the network — for pull-to-refresh. */
      invalidateCache: () => set({ fetchedAt: 0 }),

      fetchGroups: async () => {
        const { groups, fetchedAt } = get();

        if (isCacheFresh(fetchedAt, CACHE_TTL.GROCERY_GROUPS) && groups.length > 0) {
          return;
        }

        try {
          set({ loading: true });
          const fetched = await groceryGroupsService.fetchProductGroups();
          set({ groups: fetched, fetchedAt: Date.now(), loading: false });
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
    }))
  )
);

export default useGroceryGroupsStore;
