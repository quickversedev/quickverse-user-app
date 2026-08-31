import { useEffect, useMemo, useState } from 'react';
import fastPicksService from '../services/fastPicksService';
import useVendorStore from '../store/vendorStore';
import { isStoreOpen } from '../utils/storeUtils';
import { FastPick } from '../types/fastPick';

const useFastPicks = () => {
  const vendors = useVendorStore(s => s.vendors);
  const [fastPicks, setFastPicks] = useState<FastPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only stores that are open right now — a pick from a closed store cannot be
  // ordered, so it should not be offered.
  const nearbyShopIds = useMemo(() => {
    return new Set(
      vendors
        .filter(
          v =>
            // NB: the /v3/shops response omits storeEnabled entirely (undefined for
            // every shop), so only exclude it when the server explicitly says false.
            // storeActive is real and is handled inside isStoreOpen().
            v.storeEnabled !== false &&
            isStoreOpen({
              openingTime: v.openingTime,
              closingTime: v.closingTime,
              storeActive: v.storeActive,
            }).isOpen
        )
        .map(v => v.shopId)
    );
  }, [vendors]);

  const vendorKey = useMemo(() => Array.from(nearbyShopIds).sort().join(','), [nearbyShopIds]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetch = async () => {
      try {
        const picks = await fastPicksService.fetchFastPicks();
        if (!cancelled) {
          setFastPicks(picks.filter(p => nearbyShopIds.has(p.shopId)));
          setLoading(false);
        }
      } catch (e) {
        console.warn('[FastPicks] error:', e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to fetch fast picks');
          setLoading(false);
        }
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorKey]);

  return { fastPicks, loading, error };
};

export default useFastPicks;
