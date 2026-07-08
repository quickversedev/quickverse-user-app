import { useEffect, useMemo, useState } from 'react';
import fastPicksService from '../services/fastPicksService';
import useVendorStore from '../store/vendorStore';
import { FastPick } from '../types/fastPick';

const useFastPicks = () => {
  const vendors = useVendorStore(s => s.vendors);
  const [fastPicks, setFastPicks] = useState<FastPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nearbyShopIds = useMemo(() => {
    return new Set(vendors.map(v => v.shopId));
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
