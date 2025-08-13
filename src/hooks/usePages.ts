import { useAuth } from '../contexts/login/AuthProvider';
import { AuthSession } from '../services/localStorage/storage.service';
import useConfigStore from '../store/configStore';
import usePagesStore from '../store/pages/pagesStore';

export const usePages = () => {
  const { authData } = useAuth();
  const { pages, loading, error, fetchPages, setLoading, setError, clearError, getPageById } =
    usePagesStore();
  const regionId = useConfigStore.getState().config?.regionId;
  const handleFetchPages = async () => {
    if (authData && regionId) {
      await fetchPages(regionId, authData as AuthSession);
    }
  };

  const retryFetch = () => {
    clearError();
    if (authData && regionId) {
      handleFetchPages();
    }
  };

  // Filter promotions by page name
  const getPromotionsByPageId = (pageName: string) => {
    const page = pages.find(p => p.pageName === pageName);

    return page?.promotion || [];
  };

  return {
    // State
    pages,
    loading,
    error,

    // Actions
    fetchPages: handleFetchPages,
    retryFetch,
    clearError,
    setError,
    setLoading,

    // Computed values
    hasPages: pages.length > 0,
    getPageByName: (pageName: string) => pages.find(page => page.pageName === pageName),
    getPromotionsByPageId,
    getPageById,
  };
};
