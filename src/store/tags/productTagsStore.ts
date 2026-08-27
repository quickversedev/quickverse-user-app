import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import productsService from '../../services/productsService';
import { ProductTagOption } from '../../types/product';
import { CACHE_TTL, createPersistedConfig, isCacheFresh } from '../../utils/cache';

/**
 * The tag strip's vocabulary.
 *
 * This replaces a module-level `let cachedTags` inside TagStrip, which was populated
 * once per process and never invalidated — a tag renamed or re-imaged in the dashboard
 * only appeared after the app was force-quit. Being a store instead means it persists
 * across launches (so the strip renders instantly from MMKV), expires on a TTL, and can
 * be dropped explicitly by pull-to-refresh like pages and vendors already are.
 *
 * Entries are keyed by scope because the server counts products within the shops the
 * caller passes: the Food screen and the Grocery screen legitimately see different
 * tags, and one cache slot would let whichever screen mounted first answer for both.
 */

interface ScopedTags {
  tags: ProductTagOption[];
  fetchedAt: number;
  /** Which shop list produced these tags — see fetchTags. */
  shopKey: string;
}

interface TagsState {
  byScope: Record<string, ScopedTags>;
  loading: boolean;

  fetchTags: (scope: string, shopIds: string[]) => Promise<void>;
  getTags: (scope: string) => ProductTagOption[];
  invalidateCache: () => void;
}

/**
 * Order-insensitive fingerprint of the shops a vocabulary was counted against.
 *
 * The counts are scoped to these shops, so the cached list is only valid while they are.
 * Keying on the scope name alone meant a customer who moved far enough to change which
 * vendors are in range kept the previous location's tags for the rest of the TTL —
 * possibly showing a chip that now opens an empty screen. The vendor list is re-sorted
 * before hashing because the server returns it by distance, which changes as you move
 * without the set itself changing.
 */
const shopFingerprint = (shopIds: string[]): string =>
  `${shopIds.length}:${[...shopIds].sort().join(',')}`;

const initialState = {
  byScope: {} as Record<string, ScopedTags>,
  loading: false,
};

const useProductTagsStore = create<TagsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      getTags: (scope: string) => get().byScope[scope]?.tags ?? [],

      /** Force the next fetch for every scope to hit the network. */
      invalidateCache: () =>
        set(state => ({
          byScope: Object.fromEntries(
            Object.entries(state.byScope).map(([scope, entry]) => [
              scope,
              { ...entry, fetchedAt: 0 },
            ])
          ),
        })),

      fetchTags: async (scope: string, shopIds: string[]) => {
        const shopKey = shopFingerprint(shopIds);
        const cached = get().byScope[scope];

        if (
          cached &&
          cached.shopKey === shopKey &&
          isCacheFresh(cached.fetchedAt, CACHE_TTL.TAGS) &&
          cached.tags.length > 0
        ) {
          return;
        }

        try {
          set({ loading: true });
          const tags = await productsService.fetchProductTags({ shopIds, nonEmpty: true });

          set(state => ({
            byScope: { ...state.byScope, [scope]: { tags, fetchedAt: Date.now(), shopKey } },
            loading: false,
          }));
        } catch (error) {
          // A failed vocabulary fetch must not blank a strip that is already on screen,
          // so the previous list is left in place and the timestamp is not advanced.
          console.warn('[ProductTags] Failed to fetch tag vocabulary:', error);
          set({ loading: false });
        }
      },
    }),
    createPersistedConfig<TagsState>('product-tags-store', state => ({
      byScope: state.byScope,
    }))
  )
);

export default useProductTagsStore;
