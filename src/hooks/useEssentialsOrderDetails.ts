import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/login/AuthProvider';
import essentialsOrderService, { EssentialsOrder } from '../services/essentialsOrderService';
import { Order } from '../types/order';
import { essentialsAsOrder } from './useEssentialsOrders';

const PLACING_POLL_MS = 2000;
const DECIDING_POLL_MS = 5000;
const SETTLED_POLL_MS = 30000;

/**
 * One Daily Essentials order for the order screens (success, details), which draw every order
 * the same way: `order` is it in the shared Order shape, `essentials` the order itself for what
 * only it has (unavailable items, refunds, whether it can still be cancelled).
 *
 * Polls while the kiranas' parts are being placed and decided, then settles to the same 30 s the
 * order-details screen uses for any active order. `essentialsOrderId` undefined disables it all.
 */
export const useEssentialsOrderDetails = (essentialsOrderId?: string) => {
  const { authData } = useAuth();
  const [essentials, setEssentials] = useState<EssentialsOrder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (live = false) => {
      if (!essentialsOrderId || !authData?.jwt || !authData?.phone) return null;
      try {
        const next = await essentialsOrderService.getOrder(
          essentialsOrderId,
          authData.jwt,
          authData.phone,
          live
        );
        setEssentials(next);
        return next;
      } catch (error) {
        console.warn('[EssentialsOrder] could not load:', error);
        return null;
      }
    },
    [essentialsOrderId, authData?.jwt, authData?.phone]
  );

  useEffect(() => {
    if (!essentialsOrderId) return undefined;
    let cancelled = false;
    const tick = async () => {
      const current = await load();
      if (cancelled || !current) return;
      const settled =
        ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(current.acceptanceStatus ?? '') ||
        current.status === 'FAILED' ||
        current.status === 'PAYMENT_EXPIRED';
      if (settled) return;
      const wait =
        current.status === 'PLACING'
          ? PLACING_POLL_MS
          : current.acceptanceStatus === 'AWAITING_STORES'
            ? DECIDING_POLL_MS
            : SETTLED_POLL_MS;
      timer.current = setTimeout(tick, wait);
    };
    tick();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [essentialsOrderId, load]);

  const order: Order | null = useMemo(
    () => (essentials ? essentialsAsOrder(essentials) : null),
    [essentials]
  );

  return { essentials, order, reload: load, setEssentials };
};
