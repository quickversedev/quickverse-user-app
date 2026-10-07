import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import catalogGroupsService, { CatalogGroup, Near } from '../../services/catalogGroupsService';
import { CACHE_TTL, createPersistedConfig, isCacheFresh } from '../../utils/cache';

/**
 * The Daily Essentials catalogue tree (groups and their subgroup tiles) for the Daily Needs
 * screen.
 *
 * Persisted so the section draws from MMKV on launch, expired on the same TTL as the groups it
 * replaces so an admin change shows without a force-quit, and scoped to where the customer is:
 * the tiles count only products from kiranas in range of that point, in that region.
 */

interface CatalogGroupsState {
  groups: CatalogGroup[];
  fetchedAt: number;
  /** What the cached tree was fetched for ("lat,lng|region"); '' when nothing yet. */
  fetchedFor: string;
  loading: boolean;
  fetchCatalog: (near?: Near, regionId?: string | null) => Promise<void>;
  /** Force the next fetch to hit the network. */
  invalidateCache: () => void;
  /** Pull-to-refresh: refetch for the place and region last asked for. */
  refresh: () => Promise<void>;
}

/** The last fetch's arguments, for refresh(). Not persisted: the screen asks again on launch. */
let lastAsked: { near?: Near; regionId?: string | null } = {};

/** ~1 km of precision: a short move does not refetch, a new town does. */
const placeKey = (near?: Near, regionId?: string | null) =>
  `${near ? `${near.latitude.toFixed(2)},${near.longitude.toFixed(2)}` : ''}|${regionId ?? ''}`;

const useCatalogGroupsStore = create<CatalogGroupsState>()(
  persist(
    (set, get) => ({
      groups: [],
      fetchedAt: 0,
      fetchedFor: '',
      loading: false,

      invalidateCache: () => set({ fetchedAt: 0 }),

      refresh: async () => {
        set({ fetchedAt: 0 });
        await get().fetchCatalog(lastAsked.near, lastAsked.regionId);
      },

      fetchCatalog: async (near, regionId) => {
        lastAsked = { near, regionId };
        const key = placeKey(near, regionId);
        const { fetchedAt, fetchedFor } = get();
        if (key === fetchedFor && isCacheFresh(fetchedAt, CACHE_TTL.GROCERY_GROUPS)) {
          return;
        }
        try {
          set({ loading: true });
          const groups = await catalogGroupsService.fetchCatalog(near, regionId);
          set({ groups, fetchedAt: Date.now(), fetchedFor: key, loading: false });
        } catch (error) {
          // A failed refresh keeps what is on screen; the stale timestamp makes the next
          // attempt retry. A different place, though, must not show the last town's tiles.
          console.warn('[CatalogGroups] Failed to fetch the catalogue:', error);
          set(state => ({ loading: false, groups: key === state.fetchedFor ? state.groups : [] }));
        }
      },
    }),
    createPersistedConfig<CatalogGroupsState>('catalog-groups-store', state => ({
      groups: state.groups,
      fetchedAt: state.fetchedAt,
      fetchedFor: state.fetchedFor,
    }))
  )
);

export default useCatalogGroupsStore;
