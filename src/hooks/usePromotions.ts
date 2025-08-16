import { useMemo } from 'react';
import { usePages } from './usePages';

export const usePromotions = (pageId: string) => {
  const { getPromotionsByPageId } = usePages();

  const promotions = useMemo(() => {
    const pagePromotions = getPromotionsByPageId(pageId);
    return pagePromotions || [];
  }, [getPromotionsByPageId, pageId]);

  const hasPromotions = useMemo(() => promotions.length > 0, [promotions.length]);

  return {
    promotions,
    hasPromotions,
    promotionCount: promotions.length,
  };
};
