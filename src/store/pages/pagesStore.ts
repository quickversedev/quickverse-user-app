import { AUTHORIZATION_KEY } from '@env';
import { create } from 'zustand';
import axiosInstance, { apiCall } from '../../config/api/axios.config';
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

      const data = await apiCall(
        axiosInstance.get(`/v3/pages?regionId=${regionId}`, {
          headers: {
            Authorization: AUTHORIZATION_KEY,
          },
        })
      );

      set({
        pages: data || [],
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
