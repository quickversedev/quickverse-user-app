import { create } from 'zustand';
import axiosInstance, { apiCall, getAuthHeader } from '../../config/api/axios.config';
import { Page, PagesStore } from '../../types/pages';

const usePagesStore = create<PagesStore>((set, get) => ({
  // Initial state
  pages: [],
  loading: false,
  error: null,

  // Actions
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  fetchPages: async (regionId: string) => {
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
      const totalBanners = pagesArr.reduce(
        (sum, p) => sum + (Array.isArray(p.promotion) ? p.promotion.length : 0),
        0
      );
      console.warn(
        `[pagesStore] /v3/pages?regionId=${regionId} → ${pagesArr.length} pages, ${totalBanners} banners`
      );
      pagesArr.forEach(p => {
        const banners = Array.isArray(p.promotion) ? p.promotion : [];
        console.warn(
          `[pagesStore] page "${p.pageName}" → ${banners.length} banner(s):`,
          JSON.stringify(banners, null, 2)
        );
      });

      set({
        pages: pagesArr,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching pages:', err);
      set({
        error: 'Failed to fetch pages configuration. Please try again.',
        loading: false,
      });
    }
  },

  // Get page by pageId
  getPageById: (pageId: string): Page | undefined => {
    const { pages } = get();
    return pages.find(p => p.pageName === pageId);
  },
}));

export default usePagesStore;
