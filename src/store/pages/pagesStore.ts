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
};

const usePagesStore = create<PagesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      fetchPages: async (regionId: string) => {
        if (isCacheFresh(get()._lastFetchedAt, CACHE_TTL.PAGES) && get().pages.length > 0) {
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
    }))
  )
);

export default usePagesStore;
