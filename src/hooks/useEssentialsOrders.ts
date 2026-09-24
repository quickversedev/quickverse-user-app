import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../contexts/login/AuthProvider';
import essentialsOrderService, { EssentialsOrder } from '../services/essentialsOrderService';
import { Order } from '../types/order';

/**
 * The customer's Daily Essentials orders, for folding into order history.
 *
 * Order history comes from SmartBiz, which knows one order per kirana — so a Daily Essentials
 * order would otherwise show up as two or three unrelated orders. `fold` replaces those with the
 * one order the customer placed.
 */
export const useEssentialsOrders = () => {
  const { authData } = useAuth();
  const [orders, setOrders] = useState<EssentialsOrder[]>([]);

  const refresh = useCallback(async () => {
    if (!authData?.jwt || !authData?.phone) return;
    try {
      setOrders(await essentialsOrderService.listOrders(authData.jwt, authData.phone));
    } catch (error) {
      // History still works without the fold; it just shows the kiranas' orders separately.
      console.warn('[EssentialsOrders] could not load:', error);
    }
  }, [authData?.jwt, authData?.phone]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  /** SmartBiz order ids that belong to a Daily Essentials order. */
  const kiranaOrderIds = useMemo(
    () =>
      new Set(
        orders.flatMap(o => o.shops.map(s => s.smartbizOrderId)).filter((id): id is string => !!id)
      ),
    [orders]
  );

  return { essentialsOrders: orders, kiranaOrderIds, refresh };
};

export type HistoryEntry =
  | { kind: 'order'; key: string; time: number; order: Order }
  | { kind: 'essentials'; key: string; time: number; order: EssentialsOrder };

const timeOf = (value: string | number | undefined) => {
  if (value == null) return 0;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && asNumber > 0) return asNumber;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * One history, newest first: ordinary orders plus one entry per Daily Essentials order, with
 * the kiranas' own orders behind it left out. Essentials orders older than the oldest loaded
 * order are held back until more history is loaded, so pagination does not reorder the list.
 */
export const foldOrders = (
  orders: Order[],
  essentialsOrders: EssentialsOrder[],
  kiranaOrderIds: Set<string>,
  hasMore: boolean
): HistoryEntry[] => {
  const plain: HistoryEntry[] = orders
    .filter(o => !kiranaOrderIds.has(o.orderId))
    .map(o => ({ kind: 'order', key: o.orderId, time: timeOf(o.orderDate), order: o }));
  // The window the loaded page covers, kiranas' own orders included: they are hidden, but they
  // are still loaded history. Measuring over `plain` alone held back every Essentials order older
  // than the newest ordinary order — with one store order on the first page, all of them.
  const loadedTimes = orders.map(o => timeOf(o.orderDate)).filter(t => t > 0);
  const oldestLoaded = loadedTimes.length > 0 ? Math.min(...loadedTimes) : 0;
  const grouped: HistoryEntry[] = essentialsOrders
    .filter(o => !hasMore || timeOf(o.createdAt) >= oldestLoaded)
    .map(o => ({ kind: 'essentials', key: o.orderId, time: timeOf(o.createdAt), order: o }));
  return [...plain, ...grouped].sort((a, b) => b.time - a.time);
};
