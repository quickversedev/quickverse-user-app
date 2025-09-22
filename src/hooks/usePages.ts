import useConfigStore from '../store/configStore';
import usePagesStore from '../store/pages/pagesStore';

export const usePages = () => {
  const { pages, loading, error, fetchPages, setLoading, setError, clearError, getPageById } =
    usePagesStore();

  const handleFetchPages = async () => {
    const regionId = useConfigStore.getState().getRegionId();
    if (regionId) {
      await fetchPages(regionId);
    }
  };

  const retryFetch = () => {
    clearError();
    const regionId = useConfigStore.getState().getRegionId();
    if (regionId) {
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
