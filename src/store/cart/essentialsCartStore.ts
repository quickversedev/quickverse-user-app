import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import essentialsCartService, {
  EssentialsCartLine,
  EssentialsCartView,
} from '../../services/essentialsCartService';
import { createPersistedConfig } from '../../utils/cache';

/**
 * The Daily Essentials cart — one cart across kiranas, held by QuickVerse.
 *
 * Separate from `cartStore` on purpose. That store models SmartBiz's carts, one per shop,
 * keyed `vendor_<shopId>`; this one is a single QuickVerse cart that happens to span shops.
 * Items added from a kirana's own store page stay in `cartStore`; only the Daily Essentials
 * section writes here. The same kirana can therefore appear in both.
 *
 * What the customer sees is the last server view with their unconfirmed changes laid over
 * it (`pending`). Writes are absolute quantities, so a tap sends "set to 3" rather than
 * "add one", and a response is applied only when it is not older than the view already
 * held (by `version`) — a slow earlier response can never roll the cart back.
 *
 * Signed out, the cart lives only here: quantities sit in `pending` with display data in
 * `meta`, and the first signed-in fetch pushes them to the server.
 */

/**
 * The Cart screen's id for the Daily Essentials cart (`navigate('Cart', { cartId })`). Store carts
 * are `vendor_<shopId>`, so this can never collide with one.
 */
export const ESSENTIALS_CART_ID = 'essentials';

/** What the Daily Essentials section knows about a product, used to render it before the server does. */
export interface EssentialsProductMeta {
  sku: string;
  shopId: string;
  shopName?: string | null;
  name: string;
  price: number;
  mrp?: number | null;
  imageUrl?: string | null;
}

export interface EssentialsSetResult {
  ok: boolean;
  message?: string;
}

interface EssentialsCartState {
  /** Whether the server has the feature on. Null until the first answer. */
  enabled: boolean | null;
  view: EssentialsCartView | null;
  /** Quantities not yet confirmed by the server (and every quantity while signed out). */
  pending: Record<string, number>;
  meta: Record<string, EssentialsProductMeta>;
  /** Per-SKU request counter: only the latest response for a SKU clears its pending value. */
  requestSeq: Record<string, number>;
  loading: boolean;
  error: string | null;

  fetchCart: (jwtToken?: string, phone?: string) => Promise<void>;
  setQuantity: (
    product: EssentialsProductMeta,
    quantity: number,
    jwtToken?: string,
    phone?: string
  ) => Promise<EssentialsSetResult>;
  clear: (jwtToken?: string, phone?: string) => Promise<EssentialsSetResult>;
  /** Applies the checkout's "update cart & continue" for an address. */
  resolveIssues: (
    customerAddressId: string,
    jwtToken: string,
    phone: string
  ) => Promise<EssentialsSetResult>;
  reset: () => void;
}

const initialState = {
  enabled: null as boolean | null,
  view: null as EssentialsCartView | null,
  pending: {} as Record<string, number>,
  meta: {} as Record<string, EssentialsProductMeta>,
  requestSeq: {} as Record<string, number>,
  loading: false,
  error: null as string | null,
};

const without = <T>(record: Record<string, T>, key: string): Record<string, T> => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};

const errorMessage = (error: unknown, fallback: string) =>
  (error as { message?: string })?.message || fallback;

const useEssentialsCartStore = create<EssentialsCartState>()(
  persist(
    (set, get) => {
      /** Keeps whichever view is newer. The server bumps `version` on every change. */
      const applyView = (view: EssentialsCartView) =>
        set(s => ({
          enabled: view.enabled,
          view: !s.view || !view.cartId || view.version >= s.view.version ? view : s.view,
        }));

      const pushQuantity = async (
        sku: string,
        quantity: number,
        jwtToken: string,
        phone: string
      ): Promise<EssentialsSetResult> => {
        const seq = (get().requestSeq[sku] || 0) + 1;
        set(s => ({ requestSeq: { ...s.requestSeq, [sku]: seq } }));
        try {
          const view = await essentialsCartService.setQuantity(sku, quantity, jwtToken, phone);
          applyView(view);
          if (get().requestSeq[sku] === seq) {
            set(s => ({ pending: without(s.pending, sku), error: null }));
          }
          return { ok: true };
        } catch (error) {
          const message = errorMessage(error, 'Could not update your Daily Essentials cart');
          if (get().requestSeq[sku] === seq) {
            // Drop the optimistic value: the customer sees the last confirmed quantity again.
            set(s => ({ pending: without(s.pending, sku), error: message }));
          }
          return { ok: false, message };
        }
      };

      return {
        ...initialState,

        fetchCart: async (jwtToken, phone) => {
          set({ loading: true });
          try {
            const view = await essentialsCartService.getCart(jwtToken, phone);
            applyView(view);
            set({ loading: false, error: null });

            // Signed in with quantities still unconfirmed: either set while signed out, or
            // left by a request that never returned. Absolute writes make resending safe.
            if (jwtToken && view.enabled) {
              const unsent = Object.entries(get().pending);
              for (const [sku, quantity] of unsent) {
                await pushQuantity(sku, quantity, jwtToken, phone || '');
              }
            }
          } catch (error) {
            // Keep whatever was on screen; a failed refresh must not empty the cart.
            set({ loading: false, error: errorMessage(error, 'Could not load your cart') });
          }
        },

        setQuantity: async (product, quantity, jwtToken, phone) => {
          const next = Math.max(0, quantity);
          set(s => ({
            pending: { ...s.pending, [product.sku]: next },
            meta: { ...s.meta, [product.sku]: product },
            error: null,
          }));
          if (!jwtToken) {
            // Signed out: the line stays local until the first signed-in fetch sends it.
            if (next === 0) {
              set(s => ({ pending: without(s.pending, product.sku) }));
            }
            return { ok: true };
          }
          return pushQuantity(product.sku, next, jwtToken, phone || '');
        },

        clear: async (jwtToken, phone) => {
          const previous = { view: get().view, pending: get().pending };
          set(s => ({
            pending: {},
            view: s.view ? { ...s.view, items: [], shops: [], itemCount: 0, itemTotal: 0 } : s.view,
          }));
          if (!jwtToken) return { ok: true };
          try {
            applyView(await essentialsCartService.clear(jwtToken, phone || ''));
            return { ok: true };
          } catch (error) {
            const message = errorMessage(error, 'Could not clear your Daily Essentials cart');
            set({ ...previous, error: message });
            return { ok: false, message };
          }
        },

        resolveIssues: async (customerAddressId, jwtToken, phone) => {
          try {
            applyView(
              await essentialsCartService.resolveIssues(customerAddressId, jwtToken, phone)
            );
            set({ pending: {}, error: null });
            return { ok: true };
          } catch (error) {
            const message = errorMessage(error, 'Could not update your Daily Essentials cart');
            set({ error: message });
            return { ok: false, message };
          }
        },

        reset: () => set({ ...initialState }),
      };
    },
    createPersistedConfig<EssentialsCartState>('essentials-cart-store', state => ({
      enabled: state.enabled,
      view: state.view,
      pending: state.pending,
      meta: state.meta,
    }))
  )
);

/** A line as the UI renders it: the server's line with any unconfirmed quantity applied. */
export type EssentialsDisplayLine = EssentialsCartLine & { pending: boolean };

const lineFromMeta = (meta: EssentialsProductMeta, quantity: number): EssentialsDisplayLine => ({
  sku: meta.sku,
  shopId: meta.shopId,
  shopName: meta.shopName ?? null,
  name: meta.name,
  imageUrl: meta.imageUrl ?? null,
  quantity,
  maxQuantity: 0,
  unitPrice: meta.price,
  mrp: meta.mrp ?? null,
  lineTotal: Math.round(meta.price * quantity * 100) / 100,
  priceAtAdd: meta.price,
  priceChanged: false,
  available: true,
  unavailableReason: null,
  pending: true,
});

/**
 * Every line to show, in the order first added: the server's lines, then lines the server
 * has not confirmed yet. A line whose pending quantity is 0 is hidden immediately.
 */
export const useEssentialsLines = (): EssentialsDisplayLine[] => {
  const view = useEssentialsCartStore(s => s.view);
  const pending = useEssentialsCartStore(s => s.pending);
  const meta = useEssentialsCartStore(s => s.meta);

  return useMemo(() => {
    const serverLines = view?.items ?? [];
    const seen = new Set(serverLines.map(l => l.sku));
    const lines: EssentialsDisplayLine[] = serverLines.map(line => {
      const quantity = pending[line.sku];
      if (quantity === undefined) return { ...line, pending: false };
      return {
        ...line,
        quantity,
        lineTotal: Math.round(line.unitPrice * quantity * 100) / 100,
        pending: true,
      };
    });
    Object.entries(pending).forEach(([sku, quantity]) => {
      if (!seen.has(sku) && meta[sku]) lines.push(lineFromMeta(meta[sku], quantity));
    });
    return lines.filter(l => l.quantity > 0);
  }, [view, pending, meta]);
};

/** Quantity of one SKU in the Essentials cart, including an unconfirmed change. */
export const useEssentialsQuantity = (sku: string): number =>
  useEssentialsCartStore(s => {
    if (s.pending[sku] !== undefined) return s.pending[sku];
    return s.view?.items.find(l => l.sku === sku)?.quantity ?? 0;
  });

/** Units and item total across lines that can be ordered, for bars and badges. */
export const useEssentialsSummary = () => {
  const lines = useEssentialsLines();
  return useMemo(() => {
    const orderable = lines.filter(l => l.available);
    return {
      itemCount: orderable.reduce((sum, l) => sum + l.quantity, 0),
      itemTotal: Math.round(orderable.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100,
      hasUnavailable: lines.some(l => !l.available),
    };
  }, [lines]);
};

export default useEssentialsCartStore;
