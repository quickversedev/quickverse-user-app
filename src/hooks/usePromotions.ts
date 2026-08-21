import { useMemo } from 'react';
import { filterByTimeSlot } from '../utils/timeSlot';
import { usePages } from './usePages';

export const usePromotions = (pageId: string) => {
  const { getPromotionsByPageId } = usePages();

  const promotions = useMemo(() => {
    const all = getPromotionsByPageId(pageId) || [];
    return filterByTimeSlot(all);
  }, [getPromotionsByPageId, pageId]);

  const hasPromotions = useMemo(() => promotions.length > 0, [promotions.length]);

  return {
    promotions,
    hasPromotions,
    promotionCount: promotions.length,
  };
};
