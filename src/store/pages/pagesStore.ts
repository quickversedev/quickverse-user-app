import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance, { apiCall, getAuthHeader } from '../../config/api/axios.config';
import { Page, PagesStore } from '../../types/pages';
import { CACHE_TTL, createPersistedConfig, isCacheFresh } from '../../utils/cache';

const initialState = {
  pages: [] as Page[],
  loading: false,
  error: null as string | null,
  _lastFetchedAt: 0,
  _cachedRegionId: null as string | null,
};

const usePagesStore = create<PagesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /** Force the next fetchPages to hit the network. Used by the foreground refresh
       *  so a banner edited in the admin dashboard shows up without clearing app data. */
      invalidateCache: () => set({ _lastFetchedAt: 0 }),

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      fetchPages: async (regionId: string) => {
        // Freshness alone is not enough: pages are region-scoped, so a user who
        // crosses a region boundary (or whose GPS resolves elsewhere) would keep
        // being served the previous region's banners for the whole TTL. Only reuse
        // the cache when it was built for this same region.
        const cachedForSameRegion = get()._cachedRegionId === regionId;
        if (
          cachedForSameRegion &&
          isCacheFresh(get()._lastFetchedAt, CACHE_TTL.PAGES) &&
          get().pages.length > 0
        ) {
          return;
        }

        try {
          set({ loading: true, error: null });

          const authHeader = getAuthHeader();

          const data = await apiCall(
            axiosInstance.get(`/v3/pages?regionId=${regionId}`, {
              headers: {
                Authorization: authHeader,
              },
            })
          );

          const pagesArr: Page[] = data || [];

          set({
            pages: pagesArr,
            loading: false,
            error: null,
            _lastFetchedAt: Date.now(),
            _cachedRegionId: regionId,
          });
        } catch (err) {
          console.error('Error fetching pages:', err);
          set({
            error: 'Failed to fetch pages configuration. Please try again.',
            loading: false,
          });
        }
      },

      getPageById: (pageId: string): Page | undefined => {
        const { pages } = get();
        return pages.find(p => p.pageName === pageId);
      },

      reset: () => set(initialState),
    }),
    createPersistedConfig<PagesStore>('pages-storage', state => ({
      pages: state.pages,
      _lastFetchedAt: state._lastFetchedAt,
      _cachedRegionId: state._cachedRegionId,
    }))
  )
);

export default usePagesStore;
