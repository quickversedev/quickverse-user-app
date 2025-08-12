import { useAuth } from '../contexts/login/AuthProvider';
import { AuthSession } from '../services/localStorage/storage.service';
import usePagesStore from '../store/pages/pagesStore';

export const usePages = () => {
  const { authData } = useAuth();
  const { pages, loading, error, fetchPages, setLoading, setError, clearError, getPageById } =
    usePagesStore();

  const handleFetchPages = async (regionId: string) => {
    if (authData) {
      await fetchPages(regionId, authData as AuthSession);
    }
  };

  const retryFetch = (regionId: string) => {
    clearError();
    if (authData) {
      handleFetchPages(regionId);
    }
  };

  // Filter promotions by page name
  const getPromotionsByPageId = (pageName: string) => {
    const page = pages.find(p => p.pageName === pageName);
    console.log('page', page);
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
