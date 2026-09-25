import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/login/AuthProvider';
import essentialsOrderService, {
  displayStatusOf,
  EssentialsOrder,
  neverPaid,
} from '../services/essentialsOrderService';
import { Order } from '../types/order';

/**
 * The customer's Daily Essentials orders, for folding into order history.
 *
 * Order history comes from SmartBiz, which knows one order per kirana — so a Daily Essentials
 * order would otherwise show up as two or three unrelated orders. `fold` replaces those with the
 * one order the customer placed.
 *
 * `history` is the ordinary order history on screen. The list call returns only the most recent
 * Essentials orders; a kirana order further back is tagged by the server with its Essentials
 * order (`essentialsOrderId`), which is then fetched here so it too is folded.
 */
export const useEssentialsOrders = (history: Order[] = []) => {
  const { authData } = useAuth();
  const [orders, setOrders] = useState<EssentialsOrder[]>([]);
  const requested = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    if (!authData?.jwt || !authData?.phone) return;
    try {
      const list = await essentialsOrderService.listOrders(authData.jwt, authData.phone);
      setOrders(list.filter(o => !neverPaid(o)));
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

  // Essentials orders older than the list call reaches, named by kirana orders in `history`.
  const missingKey = useMemo(() => {
    const loaded = new Set(orders.map(o => o.orderId));
    return Array.from(
      new Set(
        history
          .map(o => o.essentialsOrderId)
          .filter((id): id is string => !!id && !loaded.has(id) && !requested.current.has(id))
      )
    )
      .sort()
      .join(',');
  }, [history, orders]);

  useEffect(() => {
    if (!missingKey || !authData?.jwt || !authData?.phone) return;
    const jwt = authData.jwt;
    const phone = authData.phone;
    const ids = missingKey.split(',');
    ids.forEach(id => requested.current.add(id));
    Promise.all(
      ids.map(id => essentialsOrderService.getOrder(id, jwt, phone).catch(() => null))
    ).then(found => {
      const extra = found.filter((o): o is EssentialsOrder => !!o && !neverPaid(o));
      if (extra.length === 0) return;
      setOrders(current => {
        const have = new Set(current.map(o => o.orderId));
        return [...current, ...extra.filter(o => !have.has(o.orderId))];
      });
    });
  }, [missingKey, authData?.jwt, authData?.phone]);

  /** SmartBiz order ids that belong to a Daily Essentials order — hidden from history as such. */
  const kiranaOrderIds = useMemo(
    () =>
      new Set([
        ...orders
          .flatMap(o => o.shops.map(s => s.smartbizOrderId))
          .filter((id): id is string => !!id),
        // Tagged by the server even before their Essentials order has loaded.
        ...history.filter(o => o.essentialsOrderId).map(o => o.orderId),
      ]),
    [orders, history]
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

/** The short reference the order screen shows ("Order DA999FA9"). */
export const essentialsOrderRef = (order: EssentialsOrder) =>
  order.orderId.replace(/^OGM/, '').slice(0, 8).toUpperCase();

/** What the order comes to now: the bill as it stands (the bill as placed once cancelled). */
export const essentialsOrderTotal = (order: EssentialsOrder) =>
  order.bill?.total ?? order.amountToPay ?? order.payableAmount;

const STATUS: Record<string, Order['status']> = {
  AWAITING_PAYMENT: 'payment_pending',
  PAYMENT_EXPIRED: 'cancelled',
  PLACING: 'processing',
  AWAITING_STORES: 'processing',
  CONFIRMED: 'confirmed',
  ACCEPTED: 'confirmed',
  PARTIALLY_ACCEPTED: 'confirmed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  FAILED: 'cancelled',
};

/**
 * A Daily Essentials order in the shape order history draws, so it is drawn by the same card as
 * every other order — only what a tap opens differs. Fields history does not read are left empty.
 */
export const essentialsAsOrder = (order: EssentialsOrder): Order => {
  const items = order.shops.flatMap(part =>
    part.items.map(item => ({
      id: item.sku,
      name: item.name ?? '',
      quantity: item.quantity,
      price: item.unitPrice,
      totalPrice: item.lineTotal,
      image: item.imageUrl ?? undefined,
    }))
  );
  return {
    orderId: essentialsOrderRef(order),
    customerId: '',
    shopId: '',
    shopName: 'Daily Essentials',
    items,
    totalAmount: essentialsOrderTotal(order),
    status: STATUS[displayStatusOf(order)] ?? 'processing',
    orderDate: new Date(Number(order.createdAt)).toISOString(),
    deliveryAddress: { address: '', city: '', state: '', postalCode: '' },
    paymentMethod: order.paymentMethod === 'COD' ? 'cash' : 'upi',
    paymentStatus: order.paymentStatus === 'PAID' ? 'paid' : 'pending',
    customerName: '',
    customerPhone: '',
    finance: null,
    complaint: null,
    review: null,
  };
};
