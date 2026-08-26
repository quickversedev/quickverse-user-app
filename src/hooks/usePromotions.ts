import { useMemo } from 'react';
import { filterByTimeSlot } from '../utils/timeSlot';
import { usePages } from './usePages';

export const usePromotions = (pageId: string) => {
  const { getPromotionsByPageId } = usePages();

  const promotions = useMemo(() => {
    const all = getPromotionsByPageId(pageId) || [];
    // /v3/pages returns promotions in JPA collection order, not sequence order, and
    // nothing downstream sorts them — so the `sequence` set in the admin dashboard had
    // no effect on what the carousel actually showed. Sort here: it is the single
    // choke point every promotion consumer goes through.
    // filterByTimeSlot returns a fresh array, so this never mutates store state.
    return filterByTimeSlot(all).sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  }, [getPromotionsByPageId, pageId]);

  const hasPromotions = useMemo(() => promotions.length > 0, [promotions.length]);

  return {
    promotions,
    hasPromotions,
    promotionCount: promotions.length,
  };
};
